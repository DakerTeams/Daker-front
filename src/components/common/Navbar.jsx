import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

const navItems = [
  { to: '/hackathons', label: '해커톤' },
  { to: '/camp', label: '팀원 모집' },
  { to: '/rankings', label: '랭킹' },
]

const AUTH_STORAGE_KEY = 'hackhub-demo-user'

function Navbar() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const syncUser = () => {
      const storedUser = window.localStorage.getItem(AUTH_STORAGE_KEY)
      setUser(storedUser ? JSON.parse(storedUser) : null)
    }

    syncUser()
    window.addEventListener('mock-auth-change', syncUser)

    return () => {
      window.removeEventListener('mock-auth-change', syncUser)
    }
  }, [])

  const handleLogout = () => {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    window.dispatchEvent(new Event('mock-auth-change'))
  }

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <NavLink to="/" className="navbar__logo">
          <span className="navbar__logo-prefix">&gt;</span>
          <span className="navbar__logo-text">HackHub</span>
          <span className="navbar__logo-cursor" />
        </NavLink>

        <nav className="navbar__nav" aria-label="주요 메뉴">
          {navItems.map((item) => (
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
              <div className="navbar__profile">
                <span className="navbar__profile-avatar">
                  {user.nickname?.slice(0, 1).toUpperCase()}
                </span>
                <div className="navbar__profile-copy">
                  <strong>{user.nickname}</strong>
                  <span>{user.email}</span>
                </div>
              </div>
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
