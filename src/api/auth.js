import { apiRequest, extractObject } from './client.js'
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
    role: String(user.role ?? 'USER').toLowerCase(),
    accountStatus: user.accountStatus ?? 'ACTIVE',
    createdAt: user.createdAt ?? '',
  }
}

export async function login(payload) {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  const data = extractObject(response)
  const sessionUser = normalizeUser(data.user)

  saveAuthSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: sessionUser,
  })

  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn,
    user: sessionUser,
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
