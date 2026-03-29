const ACCESS_TOKEN_KEY = 'hackhub-access-token'
const REFRESH_TOKEN_KEY = 'hackhub-refresh-token'
const USER_STORAGE_KEY = 'hackhub-user'
const AUTH_EVENT_NAME = 'auth-change'

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

export function saveAuthSession({ accessToken, refreshToken, user }) {
  if (accessToken) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  }

  if (refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }

  if (user) {
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
  }

  window.dispatchEvent(new Event(AUTH_EVENT_NAME))
}

export function clearAuthSession() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
  window.localStorage.removeItem(USER_STORAGE_KEY)
  window.dispatchEvent(new Event(AUTH_EVENT_NAME))
}

export function subscribeAuthChange(listener) {
  window.addEventListener(AUTH_EVENT_NAME, listener)
  return () => {
    window.removeEventListener(AUTH_EVENT_NAME, listener)
  }
}

export { AUTH_EVENT_NAME }
