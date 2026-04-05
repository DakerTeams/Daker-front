import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Navbar from '../components/common/Navbar.jsx'
import {
  SESSION_EXPIRED_EVENT,
  clearAuthSession,
  getAccessToken,
  getTokenExpiresAt,
  subscribeAuthChange,
} from '../lib/auth.js'

function MainLayout() {
  const navigate = useNavigate()

  useEffect(() => {
    let timerId = null

    function handleExpired() {
      navigate('/login?expired=1', { replace: true })
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired)

    function scheduleExpiry() {
      clearTimeout(timerId)
      const expiresAt = getTokenExpiresAt()
      if (!expiresAt || !getAccessToken()) return

      const delay = expiresAt - Date.now()
      if (delay <= 0) {
        clearAuthSession({ expired: true })
        return
      }

      timerId = setTimeout(() => {
        clearAuthSession({ expired: true })
      }, delay)
    }

    scheduleExpiry()
    const unsubAuth = subscribeAuthChange(scheduleExpiry)

    return () => {
      clearTimeout(timerId)
      unsubAuth()
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired)
    }
  }, [navigate])

  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-shell">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
