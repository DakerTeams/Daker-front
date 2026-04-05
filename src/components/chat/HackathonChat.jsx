import { useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client/dist/sockjs.min.js'
import { fetchChatMessages, normalizeMessage } from '../../api/chat.js'
import { clearAuthSession, getAccessToken, getStoredUser } from '../../lib/auth.js'

function formatTime(createdAt) {
  if (!createdAt) return ''
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

function HackathonChat({ hackathonId }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState('')
  const clientRef = useRef(null)
  const bottomRef = useRef(null)
  const currentUser = getStoredUser()

  useEffect(() => {
    fetchChatMessages(hackathonId)
      .then((prev) => setMessages([...prev].reverse()))
      .catch(() => {})
  }, [hackathonId])

  useEffect(() => {
    const token = getAccessToken()
    if (!token) return

    const wsUrl = import.meta.env.VITE_WS_BASE_URL ?? `${window.location.origin}/ws/chat`

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 0,
      onConnect: () => {
        setConnected(true)
        setError('')
        client.subscribe(`/topic/hackathon/${hackathonId}`, (frame) => {
          try {
            const msg = normalizeMessage(JSON.parse(frame.body))
            setMessages((prev) => [...prev, msg])
          } catch {
            // ignore malformed frames
          }
        })
      },
      onDisconnect: () => setConnected(false),
      onStompError: (frame) => {
        const msg = frame?.headers?.message ?? ''
        if (msg.includes('401') || msg.includes('Unauthorized')) {
          client.deactivate()
          clearAuthSession({ expired: true })
        } else {
          setError('채팅 연결에 문제가 발생했습니다.')
        }
      },
      onWebSocketError: () => {
        setConnected(false)
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
    }
  }, [hackathonId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend(event) {
    event.preventDefault()
    const content = input.trim()
    if (!content || !clientRef.current?.connected) return

    clientRef.current.publish({
      destination: `/app/hackathons/${hackathonId}/chat`,
      body: JSON.stringify({ content }),
    })
    setInput('')
  }

  if (!currentUser) {
    return (
      <div className="chat-empty">
        <p>로그인 후 채팅에 참여할 수 있습니다.</p>
      </div>
    )
  }

  return (
    <div className="chat-panel">
      <div className="chat-panel__header">
        <span className={`chat-status${connected ? ' chat-status--on' : ''}`}>
          {connected ? '연결됨' : '연결 중...'}
        </span>
      </div>

      {error && <p className="chat-error">{error}</p>}

      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="chat-empty-msg">아직 메시지가 없습니다. 첫 번째로 말을 걸어보세요!</p>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUser?.userId
          return (
            <div
              key={msg.messageId ?? `${msg.senderId}-${msg.createdAt}`}
              className={`chat-msg${isMine ? ' chat-msg--mine' : ''}`}
            >
              {!isMine && (
                <span className="chat-msg__nick">{msg.senderNickname}</span>
              )}
              <div className="chat-msg__bubble">{msg.content}</div>
              <span className="chat-msg__time">{formatTime(msg.createdAt)}</span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input-row" onSubmit={handleSend}>
        <input
          type="text"
          className="chat-input"
          placeholder="메시지를 입력하세요..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={!connected || !input.trim()}
        >
          전송
        </button>
      </form>
    </div>
  )
}

export default HackathonChat
