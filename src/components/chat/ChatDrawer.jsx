import { useEffect, useState } from 'react'
import { fetchHackathons } from '../../api/hackathons.js'
import { fetchMyChatRooms, joinChat } from '../../api/chat.js'
import { getStoredUser } from '../../lib/auth.js'
import HackathonChat from './HackathonChat.jsx'

const STATUS_FILTERS = [
  { value: 'all', label: '전체' },
  { value: 'open', label: '모집중' },
  { value: 'closed', label: '진행중' },
  { value: 'upcoming', label: '오픈예정' },
  { value: 'ended', label: '종료' },
]

function ChatDrawer({ open, onClose }) {
  const [tab, setTab] = useState('my')
  const [myRooms, setMyRooms] = useState([])
  const [allHackathons, setAllHackathons] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [joiningId, setJoiningId] = useState(null)
  const [joinError, setJoinError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const currentUser = getStoredUser()

  useEffect(() => {
    if (!open) return
    if (!currentUser) return

    fetchMyChatRooms()
      .then((rooms) => {
        setMyRooms(rooms)
        if (rooms.length > 0 && !selectedId) {
          setSelectedId(rooms[0].hackathonId)
        }
      })
      .catch(() => {})
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open || tab !== 'join') return
    fetchHackathons({ size: 50 })
      .then((r) => setAllHackathons(r.items))
      .catch(() => {})
  }, [open, tab])

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  async function handleJoin(hackathonId) {
    setJoiningId(hackathonId)
    setJoinError('')
    try {
      await joinChat(hackathonId)
      const rooms = await fetchMyChatRooms()
      setMyRooms(rooms)
      setSelectedId(hackathonId)
      setTab('my')
    } catch (err) {
      if (err?.status === 409) {
        const rooms = await fetchMyChatRooms()
        setMyRooms(rooms)
        setSelectedId(hackathonId)
        setTab('my')
      } else {
        setJoinError('참가에 실패했습니다.')
      }
    } finally {
      setJoiningId(null)
    }
  }

  const joinedIds = new Set(myRooms.map((r) => r.hackathonId))
  const filteredHackathons = statusFilter === 'all'
    ? allHackathons
    : allHackathons.filter((h) => h.status === statusFilter)

  return (
    <>
      {open && <div className="chat-drawer-backdrop" onClick={onClose} />}
      <aside className={`chat-drawer${open ? ' chat-drawer--open' : ''}`}>
        <div className="chat-drawer__sidebar">
          <div className="chat-drawer__sidebar-header">
            <strong>채팅</strong>
            <button type="button" className="chat-drawer__close" onClick={onClose}>✕</button>
          </div>

          <div className="chat-drawer__tabs">
            <button
              type="button"
              className={`chat-drawer__tab${tab === 'my' ? ' chat-drawer__tab--active' : ''}`}
              onClick={() => setTab('my')}
            >
              내 채팅방
            </button>
            <button
              type="button"
              className={`chat-drawer__tab${tab === 'join' ? ' chat-drawer__tab--active' : ''}`}
              onClick={() => setTab('join')}
            >
              참가하기
            </button>
          </div>

          <div className="chat-drawer__hackathon-list">
            {!currentUser && (
              <p className="chat-drawer__empty">로그인 후 이용할 수 있습니다.</p>
            )}

            {currentUser && tab === 'my' && (
              myRooms.length === 0
                ? <p className="chat-drawer__empty">참가한 채팅방이 없습니다.</p>
                : myRooms.map((room) => (
                  <button
                    key={room.hackathonId}
                    type="button"
                    className={`chat-drawer__hackathon-item${selectedId === room.hackathonId ? ' chat-drawer__hackathon-item--active' : ''}`}
                    onClick={() => setSelectedId(room.hackathonId)}
                  >
                    <span className="chat-drawer__hackathon-name">{room.hackathonTitle}</span>
                  </button>
                ))
            )}

            {currentUser && tab === 'join' && (
              <>
                <div className="chat-drawer__filter-chips">
                  {STATUS_FILTERS.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      className={`chat-drawer__filter-chip${statusFilter === f.value ? ' chat-drawer__filter-chip--active' : ''}`}
                      onClick={() => setStatusFilter(f.value)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                {joinError && <p className="chat-drawer__error">{joinError}</p>}
                {filteredHackathons.length === 0
                  ? <p className="chat-drawer__empty">해당 상태의 해커톤이 없습니다.</p>
                  : filteredHackathons.map((h) => (
                    <div key={h.id} className="chat-drawer__join-item">
                      <div className="chat-drawer__join-info">
                        <span className={`status-outline status-outline--${h.status}`}>{h.statusLabel}</span>
                        <span className="chat-drawer__hackathon-name">{h.title}</span>
                      </div>
                      {joinedIds.has(h.id) ? (
                        <button
                          type="button"
                          className="chat-drawer__join-btn chat-drawer__join-btn--joined"
                          onClick={() => { setSelectedId(h.id); setTab('my') }}
                        >
                          입장
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="chat-drawer__join-btn"
                          disabled={joiningId === h.id}
                          onClick={() => handleJoin(h.id)}
                        >
                          {joiningId === h.id ? '...' : '참가'}
                        </button>
                      )}
                    </div>
                  ))
                }
              </>
            )}
          </div>
        </div>

        <div className="chat-drawer__chat">
          {!currentUser ? (
            <div className="chat-empty">로그인 후 채팅에 참여할 수 있습니다.</div>
          ) : selectedId && tab === 'my' ? (
            <HackathonChat
              hackathonId={selectedId}
              key={selectedId}
              title={myRooms.find((r) => r.hackathonId === selectedId)?.hackathonTitle ?? ''}
            />
          ) : (
            <div className="chat-empty">
              {tab === 'my' ? '채팅방을 선택하세요.' : '참가할 해커톤을 선택하세요.'}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

export default ChatDrawer
