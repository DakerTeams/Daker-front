import {
  clearAuthSession,
  getRefreshToken,
  getStoredUser,
  saveAuthSession,
} from '../lib/auth.js'

const DEFAULT_API_BASE_URL = '/api'

let refreshPromise = null

async function buildApiError(response) {
  const contentType = response.headers.get('content-type') ?? ''
  let message = `API request failed: ${response.status}`

  if (contentType.includes('application/json')) {
    try {
      const payload = await response.json()
      const detailMessage =
        payload?.data?.message ??
        payload?.message ??
        payload?.error?.message

      if (detailMessage) {
        message = detailMessage
      }
    } catch {
      // Ignore body parsing failures and keep the fallback message.
    }
  }

  const error = new Error(message)
  error.status = response.status
  return error
}

function buildUrl(path) {
  const configuredBaseUrl =
    import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (!configuredBaseUrl) {
    return normalizedPath
  }

  const normalizedBaseUrl = configuredBaseUrl.endsWith('/')
    ? configuredBaseUrl.slice(0, -1)
    : configuredBaseUrl

  return `${normalizedBaseUrl}${normalizedPath}`
}

export function buildApiUrl(path) {
  return buildUrl(path)
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
  const { headers: optionHeaders, ...restOptions } = options
  const isFormData = restOptions.body instanceof FormData
  const response = await fetch(buildUrl(path), {
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(optionHeaders ?? {}),
    },
    ...restOptions,
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
        throw await buildApiError(retriedResponse)
      }

      const retriedContentType = retriedResponse.headers.get('content-type') ?? ''
      if (!retriedContentType.includes('application/json')) {
        return null
      }

      return retriedResponse.json()
    } catch {
      clearAuthSession({ expired: true })
      throw new Error('API request failed: 401')
    }
  }

  if (!response.ok) {
    throw await buildApiError(response)
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

export function extractPage(payload) {
  const root = payload?.data ?? payload ?? {}
  const content =
    Array.isArray(root.content) ? root.content :
    Array.isArray(root.items) ? root.items :
    Array.isArray(root.data) ? root.data :
    []
  const totalElements = root.totalElements ?? root.totalCount ?? content.length
  const size = root.size ?? root.limit ?? root.pageSize ?? content.length
  // 백엔드 page는 1-based일 수 있으므로 0-based로 정규화
  const rawPage = root.number ?? root.page ?? 1
  const page = rawPage > 0 ? rawPage - 1 : 0
  const totalPages =
    root.totalPages ??
    (size > 0 ? Math.ceil(totalElements / size) : (content.length > 0 ? 1 : 0))
  return { content, totalPages, totalElements, page, size }
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
