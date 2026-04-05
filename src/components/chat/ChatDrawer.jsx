import { useEffect, useState } from 'react'
import { fetchHackathons } from '../../api/hackathons.js'
import HackathonChat from './HackathonChat.jsx'

function ChatDrawer({ open, onClose }) {
  const [hackathons, setHackathons] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    if (!open) return
    fetchHackathons({ size: 50 })
      .then((r) => {
        setHackathons(r.items)
        setSelectedId((prev) => prev ?? (r.items[0]?.id ?? null))
      })
      .catch(() => {})
  }, [open])

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  return (
    <>
      {open && (
        <div className="chat-drawer-backdrop" onClick={onClose} />
      )}
      <aside className={`chat-drawer${open ? ' chat-drawer--open' : ''}`}>
        <div className="chat-drawer__sidebar">
          <div className="chat-drawer__sidebar-header">
            <strong>해커톤 채팅</strong>
            <button type="button" className="chat-drawer__close" onClick={onClose}>✕</button>
          </div>
          <div className="chat-drawer__hackathon-list">
            {hackathons.length === 0 && (
              <p className="chat-drawer__empty">참여 가능한 해커톤이 없습니다.</p>
            )}
            {hackathons.map((h) => (
              <button
                key={h.id}
                type="button"
                className={`chat-drawer__hackathon-item${selectedId === h.id ? ' chat-drawer__hackathon-item--active' : ''}`}
                onClick={() => setSelectedId(h.id)}
              >
                <span className={`status-outline status-outline--${h.status}`}>{h.statusLabel}</span>
                <span className="chat-drawer__hackathon-name">{h.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="chat-drawer__chat">
          {selectedId ? (
            <HackathonChat hackathonId={selectedId} key={selectedId} />
          ) : (
            <div className="chat-empty">해커톤을 선택하세요.</div>
          )}
        </div>
      </aside>
    </>
  )
}

export default ChatDrawer
