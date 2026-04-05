import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Navbar from '../components/common/Navbar.jsx'
import ChatDrawer from '../components/chat/ChatDrawer.jsx'
import {
  SESSION_EXPIRED_EVENT,
  clearAuthSession,
  getAccessToken,
  getTokenExpiresAt,
  subscribeAuthChange,
} from '../lib/auth.js'
import { CHAT_DRAWER_OPEN_EVENT } from '../lib/chat-events.js'

function MainLayout() {
  const navigate = useNavigate()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [preferredChatHackathonId, setPreferredChatHackathonId] = useState(null)
  const [chatRoomsRefreshKey, setChatRoomsRefreshKey] = useState(0)

  useEffect(() => {
    let timerId = null

    function handleExpired() {
      navigate('/', { replace: true })
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

  useEffect(() => {
    function handleOpenChat(event) {
      const nextHackathonId = event.detail?.hackathonId ?? null
      if (nextHackathonId) {
        setPreferredChatHackathonId(nextHackathonId)
      }
      if (event.detail?.refreshRooms) {
        setChatRoomsRefreshKey((prev) => prev + 1)
      }
      setIsChatOpen(true)
    }

    window.addEventListener(CHAT_DRAWER_OPEN_EVENT, handleOpenChat)

    return () => {
      window.removeEventListener(CHAT_DRAWER_OPEN_EVENT, handleOpenChat)
    }
  }, [])

  return (
    <div className="app-shell">
      <Navbar onChatOpen={() => setIsChatOpen(true)} />
      <main className="page-shell">
        <Outlet />
      </main>
      <ChatDrawer
        open={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        preferredHackathonId={preferredChatHackathonId}
        roomsRefreshKey={chatRoomsRefreshKey}
      />
    </div>
  )
}

export default MainLayout
