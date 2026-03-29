import {
  clearAuthSession,
  getRefreshToken,
  getStoredUser,
  saveAuthSession,
} from '../lib/auth.js'

const DEFAULT_API_BASE_URL = 'http://localhost:8080'

let refreshPromise = null

function buildUrl(path) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL
  return `${baseUrl}${path}`
}

function createQueryString(params = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    searchParams.set(key, String(value))
  })

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(buildUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  })

  if (
    response.status === 401 &&
    !options.skipRefresh &&
    path !== '/auth/refresh' &&
    getRefreshToken()
  ) {
    try {
      if (!refreshPromise) {
        refreshPromise = fetch(buildUrl('/auth/refresh'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refreshToken: getRefreshToken(),
          }),
        })
          .then(async (refreshResponse) => {
            if (!refreshResponse.ok) {
              throw new Error(`Token refresh failed: ${refreshResponse.status}`)
            }

            const contentType = refreshResponse.headers.get('content-type') ?? ''
            if (!contentType.includes('application/json')) {
              throw new Error('Token refresh failed: invalid response')
            }

            const payload = await refreshResponse.json()
            const data = payload?.data ?? {}

            if (!data.accessToken) {
              throw new Error('Token refresh failed: missing access token')
            }

            saveAuthSession({
              accessToken: data.accessToken,
              refreshToken: getRefreshToken(),
              user: getStoredUser(),
            })

            return data.accessToken
          })
          .finally(() => {
            refreshPromise = null
          })
      }

      const newAccessToken = await refreshPromise
      const retriedHeaders = {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      }

      if (retriedHeaders.Authorization) {
        retriedHeaders.Authorization = `Bearer ${newAccessToken}`
      }

      const retriedResponse = await fetch(buildUrl(path), {
        ...options,
        headers: retriedHeaders,
      })

      if (!retriedResponse.ok) {
        throw new Error(`API request failed: ${retriedResponse.status}`)
      }

      const retriedContentType = retriedResponse.headers.get('content-type') ?? ''
      if (!retriedContentType.includes('application/json')) {
        return null
      }

      return retriedResponse.json()
    } catch {
      clearAuthSession()
      throw new Error('API request failed: 401')
    }
  }

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return null
  }

  return response.json()
}

export function extractArray(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.items)) return payload.data.items
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.content)) return payload.content
  return []
}

export function extractObject(payload) {
  if (
    payload?.data &&
    typeof payload.data === 'object' &&
    !Array.isArray(payload.data)
  ) {
    return payload.data
  }

  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return payload
  }

  return {}
}

export { createQueryString }
