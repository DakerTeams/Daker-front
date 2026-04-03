import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { fetchMe, logout, refreshAccessToken } from '../../api/auth.js'
import { getStoredUser, getTokenExpiresAt, subscribeAuthChange } from '../../lib/auth.js'

function useTokenExpiry() {
  const [secondsLeft, setSecondsLeft] = useState(null)

  useEffect(() => {
    function update() {
      const expiresAt = getTokenExpiresAt()
      if (!expiresAt) {
        setSecondsLeft(null)
        return
      }
      const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
      setSecondsLeft(diff)
    }

    update()
    const id = setInterval(update, 1000)
    const unsub = subscribeAuthChange(update)

    return () => {
      clearInterval(id)
      unsub()
    }
  }, [])

  return secondsLeft
}

function formatExpiry(seconds) {
  if (seconds === null) return null
  if (seconds <= 0) return '만료됨'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const navItems = [
  { to: '/hackathons', label: '해커톤' },
  { to: '/camp', label: '팀원 모집' },
  { to: '/rankings', label: '랭킹' },
]

function Navbar() {
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const secondsLeft = useTokenExpiry()

  useEffect(() => {
    const syncUser = async () => {
      const storedUser = getStoredUser()
      setUser(storedUser)

      if (storedUser && !storedUser.role) {
        try {
          const me = await fetchMe()
          setUser(me)
        } catch {
          setUser(storedUser)
        }
      }
    }

    syncUser()
    const unsubscribe = subscribeAuthChange(syncUser)

    return () => {
      unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await logout()
  }

  const handleRefreshToken = async () => {
    setRefreshing(true)
    try {
      await refreshAccessToken()
    } catch {
      // 실패 시 SessionGuard가 처리
    } finally {
      setRefreshing(false)
    }
  }

  const isAdminView = location.pathname.startsWith('/admin')
  const isJudgeView = location.pathname.startsWith('/judge')
  const visibleNavItems =
    [
      ...navItems,
      ...((isJudgeView || user?.role === 'judge') ? [{ to: '/judge', label: '심사' }] : []),
      ...((isAdminView || user?.role === 'admin') ? [{ to: '/admin', label: '관리자' }] : []),
    ]

  const displayRole = isAdminView ? 'admin' : isJudgeView ? 'judge' : user?.role || 'user'

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <NavLink to="/" className="navbar__logo">
          <span className="navbar__logo-prefix">&gt;</span>
          <span className="navbar__logo-text">DAKER</span>
          <span className="navbar__logo-cursor" />
        </NavLink>

        <nav className="navbar__nav" aria-label="주요 메뉴">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `navbar__link${isActive ? ' navbar__link--active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar__auth">
          {user ? (
            <>
              {secondsLeft !== null && (
                <div className={`navbar__token-expiry${secondsLeft <= 300 ? ' navbar__token-expiry--warn' : ''}`}>
                  <span>{formatExpiry(secondsLeft)}</span>
                  <button
                    type="button"
                    className={`navbar__token-refresh${refreshing ? ' navbar__token-refresh--spinning' : ''}`}
                    onClick={handleRefreshToken}
                    disabled={refreshing}
                    title="토큰 갱신"
                  >
                    ↻
                  </button>
                </div>
              )}
              <Link to="/me" className="navbar__profile">
                <span className="navbar__profile-avatar">
                  {user.nickname?.slice(0, 1).toUpperCase()}
                </span>
                <div className="navbar__profile-copy">
                  <strong>{user.nickname}</strong>
                  <span>{user.email}</span>
                </div>
              </Link>
              <button
                type="button"
                className="navbar__auth-button navbar__auth-button--ghost"
                onClick={handleLogout}
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar__auth-button navbar__auth-button--ghost">
                로그인
              </Link>
              <Link to="/signup" className="navbar__auth-button navbar__auth-button--primary">
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
