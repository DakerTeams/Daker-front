import { apiRequest, buildApiUrl, extractObject } from './client.js'
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  saveAuthSession,
} from '../lib/auth.js'

function normalizeUser(user) {
  if (!user) return null

  return {
    userId: user.userId,
    nickname: user.nickname,
    email: user.email,
    role: user.role ? String(user.role).toLowerCase() : null,
    accountStatus: user.accountStatus ?? 'ACTIVE',
    createdAt: user.createdAt ?? '',
    tags: Array.isArray(user.tags) ? user.tags.map((t) => t.name ?? t) : [],
    points: user.points ?? 0,
    rank: user.rank ?? null,
    joinedHackathons: user.joinedHackathons ?? 0,
  }
}

export async function login(payload) {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  const data = extractObject(response)
  const sessionUser = normalizeUser(data.user)
  // role, accountStatus, createdAt은 로그인 응답에 없으므로 /auth/me 호출 시 갱신됨

  saveAuthSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: sessionUser,
    expiresIn: data.expiresIn,
  })

  let resolvedUser = sessionUser

  try {
    resolvedUser = await fetchMe()
  } catch {
    // 로그인은 성공했으므로 최소 사용자 정보는 유지하고, 추가 프로필 조회 실패만 무시한다.
  }

  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn,
    user: resolvedUser,
  }
}

export async function signup(payload) {
  const response = await apiRequest('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return extractObject(response)
}

export async function fetchMe() {
  const response = await apiRequest('/auth/me', {
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
  })

  const user = normalizeUser(extractObject(response))
  if (user) {
    saveAuthSession({
      accessToken: getAccessToken(),
      refreshToken: getRefreshToken(),
      user,
    })
  }

  return user
}

export async function fetchAllTags() {
  const response = await apiRequest('/tags')
  const data = response?.data
  return Array.isArray(data) ? data : []
}

export async function fetchUserTags() {
  const response = await apiRequest('/users/me/tags', {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  })
  const data = response?.data
  return Array.isArray(data) ? data : []
}

export async function addUserTag(name) {
  const response = await apiRequest('/users/me/tags', {
    method: 'POST',
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    body: JSON.stringify({ name }),
  })
  const data = response?.data
  return Array.isArray(data) ? data : []
}

export async function removeUserTag(tagId) {
  await apiRequest(`/users/me/tags/${tagId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  })
}

export async function refreshAccessToken() {
  const response = await apiRequest('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: getRefreshToken() }),
    skipRefresh: true,
  })

  const data = extractObject(response)
  if (!data.accessToken) throw new Error('토큰 갱신 실패')

  saveAuthSession({
    accessToken: data.accessToken,
    refreshToken: getRefreshToken(),
    user: null,
    expiresIn: data.expiresIn,
  })

  return data.accessToken
}

export async function logout() {
  try {
    await apiRequest('/auth/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    })
  } finally {
    clearAuthSession()
  }
}

export function getGithubLoginUrl() {
  return buildApiUrl('/auth/github/login')
}
