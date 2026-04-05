const ACCESS_TOKEN_KEY = 'hackhub-access-token'
const REFRESH_TOKEN_KEY = 'hackhub-refresh-token'
const USER_STORAGE_KEY = 'hackhub-user'
const EXPIRES_AT_KEY = 'hackhub-expires-at'
const AUTH_EVENT_NAME = 'auth-change'
const SESSION_EXPIRED_EVENT = 'session-expired'
const SESSION_EXPIRING_EVENT = 'session-expiring'

export function getAccessToken() {
  return window.localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken() {
  return window.localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function getStoredUser() {
  const value = window.localStorage.getItem(USER_STORAGE_KEY)
  return value ? JSON.parse(value) : null
}

export function saveAuthSession({ accessToken, refreshToken, user, expiresIn }) {
  if (accessToken) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  }

  if (refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }

  if (user) {
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
  }

  if (expiresIn) {
    const expiresAt = Date.now() + expiresIn * 1000
    window.localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt))
  }

  window.dispatchEvent(new Event(AUTH_EVENT_NAME))
}

export function getTokenExpiresAt() {
  const val = window.localStorage.getItem(EXPIRES_AT_KEY)
  return val ? Number(val) : null
}

export function clearAuthSession({ expired = false } = {}) {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
  window.localStorage.removeItem(USER_STORAGE_KEY)
  window.localStorage.removeItem(EXPIRES_AT_KEY)
  window.dispatchEvent(new Event(AUTH_EVENT_NAME))
  if (expired) {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
  }
}

export function subscribeAuthChange(listener) {
  window.addEventListener(AUTH_EVENT_NAME, listener)
  return () => {
    window.removeEventListener(AUTH_EVENT_NAME, listener)
  }
}

export { AUTH_EVENT_NAME, SESSION_EXPIRED_EVENT, SESSION_EXPIRING_EVENT }
