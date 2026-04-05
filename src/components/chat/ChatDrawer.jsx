import { useCallback, useEffect, useState } from 'react'
import { fetchHackathons } from '../../api/hackathons.js'
import { fetchMyChatRooms, joinChat, leaveChat } from '../../api/chat.js'
import { getStoredUser } from '../../lib/auth.js'
import { CHAT_ROOMS_UPDATED_EVENT, notifyChatRoomsUpdated } from '../../lib/chat-events.js'
import HackathonChat from './HackathonChat.jsx'

const STATUS_FILTERS = [
  { value: 'all', label: '전체' },
  { value: 'open', label: '모집중' },
  { value: 'closed', label: '진행중' },
  { value: 'upcoming', label: '오픈예정' },
]

const PAGE_SIZE = 8

function ChatDrawer({ open, onClose }) {
  const [tab, setTab] = useState('my')
  const [myRooms, setMyRooms] = useState([])
  const [joinPage, setJoinPage] = useState({ items: [], totalPages: 1, page: 0 })
  const [selectedId, setSelectedId] = useState(null)
  const [joinSelectedId, setJoinSelectedId] = useState(null)
  const [joiningId, setJoiningId] = useState(null)
  const [leavingId, setLeavingId] = useState(null)
  const [joinError, setJoinError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(0)
  const currentUser = getStoredUser()

  const refreshMyRooms = useCallback(async (preferredHackathonId = null) => {
    const rooms = await fetchMyChatRooms()
    setMyRooms(rooms)

    if (rooms.length === 0) {
      setSelectedId(null)
      return rooms
    }

    const nextSelectedId =
      preferredHackathonId && rooms.some((room) => room.hackathonId === preferredHackathonId)
        ? preferredHackathonId
        : selectedId && rooms.some((room) => room.hackathonId === selectedId)
          ? selectedId
          : rooms[0].hackathonId

    setSelectedId(nextSelectedId)
    return rooms
  }, [selectedId])

  useEffect(() => {
    if (!open) return
    if (!currentUser) return

    refreshMyRooms()
      .catch(() => {})
  }, [currentUser, open, refreshMyRooms])

  useEffect(() => {
    if (!currentUser) return undefined

    function handleRoomsUpdated(event) {
      refreshMyRooms(event.detail?.hackathonId).catch(() => {})
    }

    window.addEventListener(CHAT_ROOMS_UPDATED_EVENT, handleRoomsUpdated)

    return () => {
      window.removeEventListener(CHAT_ROOMS_UPDATED_EVENT, handleRoomsUpdated)
    }
  }, [currentUser, refreshMyRooms])

  useEffect(() => {
    if (!open || tab !== 'join') return
    const params = { page: currentPage, size: PAGE_SIZE }
    if (statusFilter !== 'all') params.status = statusFilter
    fetchHackathons(params)
      .then((r) => setJoinPage({ items: r.items, totalPages: r.totalPages, page: r.page }))
      .catch(() => {})
  }, [open, tab, currentPage, statusFilter])

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  function handleFilterChange(value) {
    setStatusFilter(value)
    setCurrentPage(0)
    setJoinSelectedId(null)
  }

  async function handleJoin(hackathonId) {
    setJoiningId(hackathonId)
    setJoinError('')
    try {
      await joinChat(hackathonId)
      await refreshMyRooms(hackathonId)
      notifyChatRoomsUpdated(hackathonId)
      setTab('my')
    } catch (err) {
      if (err?.status === 409) {
        await refreshMyRooms(hackathonId)
        notifyChatRoomsUpdated(hackathonId)
        setTab('my')
      } else {
        setJoinError('참가에 실패했습니다.')
      }
    } finally {
      setJoiningId(null)
    }
  }

  async function handleLeave(hackathonId) {
    setLeavingId(hackathonId)
    try {
      await leaveChat(hackathonId)
      await refreshMyRooms()
      notifyChatRoomsUpdated()
    } catch {
      // 실패 시 조용히 무시
    } finally {
      setLeavingId(null)
    }
  }

  const joinedIds = new Set(myRooms.map((r) => r.hackathonId))
  const joinSelected = joinPage.items.find((h) => h.id === joinSelectedId) ?? null

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
                  <div
                    key={room.hackathonId}
                    className={`chat-drawer__hackathon-item${selectedId === room.hackathonId ? ' chat-drawer__hackathon-item--active' : ''}`}
                    onClick={() => setSelectedId(room.hackathonId)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedId(room.hackathonId)}
                  >
                    <span className="chat-drawer__hackathon-name">{room.hackathonTitle}</span>
                    <button
                      type="button"
                      className="chat-drawer__leave-btn"
                      disabled={leavingId === room.hackathonId}
                      onClick={(e) => { e.stopPropagation(); handleLeave(room.hackathonId) }}
                      title="채팅방 나가기"
                    >
                      {leavingId === room.hackathonId ? '...' : '나가기'}
                    </button>
                  </div>
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
                      onClick={() => handleFilterChange(f.value)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                {joinPage.items.length === 0
                  ? <p className="chat-drawer__empty">해당 상태의 해커톤이 없습니다.</p>
                  : joinPage.items.map((h) => (
                    <div
                      key={h.id}
                      className={`chat-drawer__hackathon-item${joinSelectedId === h.id ? ' chat-drawer__hackathon-item--active' : ''}`}
                      onClick={() => setJoinSelectedId(h.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setJoinSelectedId(h.id)}
                    >
                      <span className="chat-drawer__hackathon-name">{h.title}</span>
                      <span className={`chat-drawer__status-chip chat-drawer__status-chip--${h.status}`}>{h.statusLabel}</span>
                    </div>
                  ))
                }
                {joinPage.totalPages > 1 && (
                  <div className="chat-drawer__pagination">
                    <button
                      type="button"
                      className="chat-drawer__page-btn"
                      disabled={currentPage === 0}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      ‹
                    </button>
                    {Array.from({ length: joinPage.totalPages }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`chat-drawer__page-btn${currentPage === i ? ' chat-drawer__page-btn--active' : ''}`}
                        onClick={() => setCurrentPage(i)}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="chat-drawer__page-btn"
                      disabled={currentPage === joinPage.totalPages - 1}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      ›
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="chat-drawer__chat">
          {!currentUser ? (
            <div className="chat-empty">로그인 후 채팅에 참여할 수 있습니다.</div>
          ) : tab === 'my' && selectedId ? (
            <HackathonChat
              hackathonId={selectedId}
              key={selectedId}
              title={myRooms.find((r) => r.hackathonId === selectedId)?.hackathonTitle ?? ''}
            />
          ) : tab === 'join' && joinSelected ? (
            <div className="chat-join-panel">
              <div className="chat-join-panel__info">
                <span className={`status-outline status-outline--${joinSelected.status}`}>
                  {joinSelected.statusLabel}
                </span>
                <h2 className="chat-join-panel__title">{joinSelected.title}</h2>
                {joinSelected.summary && (
                  <p className="chat-join-panel__summary">{joinSelected.summary}</p>
                )}
                <dl className="chat-join-panel__meta">
                  {joinSelected.period && (
                    <div className="chat-join-panel__meta-row">
                      <dt>기간</dt>
                      <dd>{joinSelected.period}</dd>
                    </div>
                  )}
                  {joinSelected.organizer && joinSelected.organizer !== '-' && (
                    <div className="chat-join-panel__meta-row">
                      <dt>주최</dt>
                      <dd>{joinSelected.organizer}</dd>
                    </div>
                  )}
                  {joinSelected.participantCount > 0 && (
                    <div className="chat-join-panel__meta-row">
                      <dt>참가자</dt>
                      <dd>{joinSelected.participantCount.toLocaleString()}명</dd>
                    </div>
                  )}
                </dl>
                {joinSelected.tags.length > 0 && (
                  <div className="chat-join-panel__tags">
                    {joinSelected.tags.map((tag) => (
                      <span key={tag} className="chat-join-panel__tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              {joinError && <p className="chat-join-panel__error">{joinError}</p>}
              {joinedIds.has(joinSelected.id) ? (
                <button
                  type="button"
                  className="chat-join-panel__btn chat-join-panel__btn--entered"
                  onClick={() => { setSelectedId(joinSelected.id); setTab('my') }}
                >
                  채팅방 입장하기
                </button>
              ) : (
                <button
                  type="button"
                  className="chat-join-panel__btn"
                  disabled={joiningId === joinSelected.id}
                  onClick={() => handleJoin(joinSelected.id)}
                >
                  {joiningId === joinSelected.id ? '참가 중...' : '채팅 참가하기'}
                </button>
              )}
            </div>
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
