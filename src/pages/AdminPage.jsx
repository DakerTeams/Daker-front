import { useMemo, useState } from 'react'
import {
  adminHackathons,
  adminJudges,
  adminOverviewStats,
  adminSubmissions,
  adminUsers,
} from '../mock/admin.js'

const adminMenu = [
  { key: 'dashboard', label: '대시보드', icon: '📊' },
  { key: 'hackathons', label: '해커톤 관리', icon: '🏆' },
  { key: 'users', label: '유저 관리', icon: '👥' },
  { key: 'judges', label: '심사위원 관리', icon: '⚖️' },
  { key: 'submissions', label: '제출물 관리', icon: '📂' },
]

function AdminPage() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [userFilter, setUserFilter] = useState('all')

  const filteredUsers = useMemo(() => {
    if (userFilter === 'all') return adminUsers
    if (userFilter === 'user') return adminUsers.filter((user) => user.roleType === 'user')
    if (userFilter === 'judge') return adminUsers.filter((user) => user.roleType === 'judge')
    return adminUsers.filter((user) => user.roleType === 'admin')
  }, [userFilter])

  const renderDashboard = () => (
    <>
      <h1 className="admin-title">대시보드</h1>
      <div className="admin-stats-grid">
        {adminOverviewStats.map((stat) => (
          <article key={stat.label} className="admin-stat-card">
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
            <p>
              ↑ {stat.delta} <em>{stat.suffix}</em>
            </p>
          </article>
        ))}
      </div>

      <section className="admin-card">
        <h2 className="admin-card__title">해커톤 현황</h2>
        <div className="admin-table">
          <div className="admin-table__head admin-table__head--dashboard">
            <span>해커톤명</span>
            <span>상태</span>
            <span>참가팀</span>
            <span>제출</span>
            <span>마감일</span>
          </div>
          {adminHackathons.map((item) => (
            <div key={item.title} className="admin-table__row admin-table__row--dashboard">
              <strong>{item.title}</strong>
              <span className={`admin-status admin-status--${item.statusType}`}>
                {item.status}
              </span>
              <span>{item.teams}</span>
              <span>{item.submissions}</span>
              <span>{item.deadline}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  )

  const renderHackathons = () => (
    <>
      <div className="row-between row-between--wrap">
        <h1 className="admin-title">해커톤 관리</h1>
        <button type="button" className="team-primary-button">
          + 새 해커톤 등록
        </button>
      </div>
      <section className="admin-card">
        <div className="admin-table">
          <div className="admin-table__head admin-table__head--hackathons">
            <span>해커톤명</span>
            <span>상태</span>
            <span>기간</span>
            <span>참가팀</span>
            <span>심사방식</span>
            <span>액션</span>
          </div>
          {adminHackathons.map((item) => (
            <div key={item.title} className="admin-table__row admin-table__row--hackathons">
              <strong>{item.title}</strong>
              <span className={`admin-status admin-status--${item.statusType}`}>
                {item.status}
              </span>
              <span>{item.period}</span>
              <span>{item.teams}</span>
              <span className="admin-pill admin-pill--blue">{item.judgeType}</span>
              <div className="admin-inline-actions">
                <button type="button" className="team-secondary-button team-secondary-button--muted">
                  수정
                </button>
                <button
                  type="button"
                  className={`admin-action-button admin-action-button--${item.actionType}`}
                >
                  {item.action}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )

  const renderUsers = () => (
    <>
      <h1 className="admin-title">유저 관리</h1>
      <div className="admin-toolbar">
        <input className="search-input admin-search-input" placeholder="닉네임, 이메일 검색..." />
        <div className="filter-group">
          {[
            ['all', '전체'],
            ['user', '일반'],
            ['judge', '심사위원'],
            ['admin', '관리자'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`filter-chip${userFilter === key ? ' filter-chip--active' : ''}`}
              onClick={() => setUserFilter(key)}
            >
              {userFilter === key ? '◉ ' : '• '}
              {label}
            </button>
          ))}
        </div>
      </div>
      <section className="admin-card">
        <div className="admin-table">
          <div className="admin-table__head admin-table__head--users">
            <span>닉네임</span>
            <span>이메일</span>
            <span>역할</span>
            <span>가입일</span>
            <span>액션</span>
          </div>
          {filteredUsers.map((user) => (
            <div key={user.email} className="admin-table__row admin-table__row--users">
              <strong>{user.nickname}</strong>
              <span>{user.email}</span>
              <span className={`admin-pill admin-pill--${user.roleType}`}>{user.role}</span>
              <span>{user.joinedAt}</span>
              <button
                type="button"
                className={`admin-action-button admin-action-button--${user.actionType || 'muted'}`}
              >
                {user.action}
              </button>
            </div>
          ))}
        </div>
      </section>
    </>
  )

  const renderJudges = () => (
    <>
      <h1 className="admin-title">심사위원 관리</h1>
      <p className="admin-subtitle">
        심사위원은 모든 해커톤을 심사할 수 있습니다. 역할 부여/회수만 관리하세요.
      </p>
      <div className="admin-toolbar admin-toolbar--compact">
        <select className="form-control admin-select">
          <option>유저 선택...</option>
          <option>minhyun99</option>
          <option>block_kim</option>
        </select>
        <button type="button" className="team-primary-button">
          심사위원 추가
        </button>
      </div>
      <section className="admin-card">
        <h2 className="admin-card__title">현재 심사위원 {adminJudges.length}명</h2>
        <div className="admin-judge-list">
          {adminJudges.map((judge) => (
            <article key={judge.email} className="admin-judge-item">
              <div className="admin-judge-item__left">
                <span className="admin-judge-item__icon">⚖️</span>
                <div>
                  <h3>{judge.nickname}</h3>
                  <p>{judge.email}</p>
                </div>
              </div>
              <div className="admin-inline-actions">
                <span className="admin-pill admin-pill--judge">심사위원</span>
                <button type="button" className="admin-action-button admin-action-button--danger">
                  역할 회수
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )

  const renderSubmissions = () => (
    <>
      <h1 className="admin-title">제출물 관리</h1>
      <section className="admin-card">
        <div className="admin-table">
          <div className="admin-table__head admin-table__head--submissions">
            <span>해커톤</span>
            <span>팀명</span>
            <span>제출 시각</span>
            <span>파일</span>
            <span>재제출</span>
            <span>액션</span>
          </div>
          {adminSubmissions.map((item) => (
            <div key={`${item.hackathon}-${item.teamName}`} className="admin-table__row admin-table__row--submissions">
              <span>{item.hackathon}</span>
              <strong>{item.teamName}</strong>
              <span>{item.submittedAt}</span>
              <span className="admin-pill admin-pill--file">{item.file}</span>
              <span className="admin-pill admin-pill--blue">{item.retry}</span>
              <button type="button" className="team-secondary-button team-secondary-button--muted">
                다운로드
              </button>
            </div>
          ))}
        </div>
      </section>
    </>
  )

  return (
    <section className="admin-layout">
      <aside className="admin-sidebar">
        <p className="admin-sidebar__label">관리자 패널</p>
        <nav className="admin-sidebar__nav">
          {adminMenu.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`admin-sidebar__item${
                activeSection === item.key ? ' admin-sidebar__item--active' : ''
              }`}
              onClick={() => setActiveSection(item.key)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="admin-content">
        {activeSection === 'dashboard' && renderDashboard()}
        {activeSection === 'hackathons' && renderHackathons()}
        {activeSection === 'users' && renderUsers()}
        {activeSection === 'judges' && renderJudges()}
        {activeSection === 'submissions' && renderSubmissions()}
      </div>
    </section>
  )
}

export default AdminPage
