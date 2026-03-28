import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/hackathons', label: '해커톤' },
  { to: '/camp', label: '팀원 모집' },
  { to: '/rankings', label: '랭킹' },
]

function Navbar() {
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
          <button type="button" className="navbar__auth-button navbar__auth-button--ghost">
            로그인
          </button>
          <button type="button" className="navbar__auth-button navbar__auth-button--primary">
            회원가입
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
