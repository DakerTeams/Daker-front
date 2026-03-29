import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { fetchMe, logout } from '../../api/auth.js'
import { getStoredUser, subscribeAuthChange } from '../../lib/auth.js'

const navItems = [
  { to: '/hackathons', label: '해커톤' },
  { to: '/camp', label: '팀원 모집' },
  { to: '/rankings', label: '랭킹' },
]

function Navbar() {
  const location = useLocation()
  const [user, setUser] = useState(null)

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
          <span className="navbar__logo-text">HackHub</span>
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
              <div className="navbar__role-chip">role: {displayRole} ↻</div>
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
