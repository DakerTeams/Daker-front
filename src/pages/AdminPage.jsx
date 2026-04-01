import { useEffect, useMemo, useState } from 'react'
import {
  changeUserRole,
  deleteAdminHackathon,
  fetchAdminHackathons,
  fetchAdminSubmissions,
  fetchAdminUsers,
} from '../api/admin.js'
import { fetchPlatformStats } from '../api/stats.js'

const adminMenu = [
  { key: 'dashboard', label: '대시보드', icon: '📊' },
  { key: 'hackathons', label: '해커톤 관리', icon: '🏆' },
  { key: 'users', label: '유저 관리', icon: '👥' },
  { key: 'judges', label: '심사위원 관리', icon: '⚖️' },
  { key: 'submissions', label: '제출물 관리', icon: '📂' },
]

const statusLabelMap = {
  draft: { label: '임시저장', type: 'draft' },
  upcoming: { label: '오픈예정', type: 'upcoming' },
  open: { label: '모집중', type: 'open' },
  closed: { label: '마감', type: 'closed' },
  ended: { label: '종료', type: 'ended' },
}

function AdminPage() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [userFilter, setUserFilter] = useState('all')

  const [hackathons, setHackathons] = useState([])
  const [users, setUsers] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [platformStats, setPlatformStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [actionMessage, setActionMessage] = useState('')

  useEffect(() => {
    setError(null)
    setLoading(true)

    const load = async () => {
      if (activeSection === 'dashboard') {
        const [stats, hackathonList] = await Promise.all([
          fetchPlatformStats(),
          fetchAdminHackathons(),
        ])
        setPlatformStats(stats)
        setHackathons(hackathonList)
      } else if (activeSection === 'hackathons') {
        const data = await fetchAdminHackathons()
        setHackathons(data)
      } else if (activeSection === 'users' || activeSection === 'judges') {
        const data = await fetchAdminUsers()
        setUsers(data)
      } else if (activeSection === 'submissions') {
        const data = await fetchAdminSubmissions()
        setSubmissions(data)
      }
    }

    load()
      .catch((err) => setError(`데이터를 불러오지 못했습니다. (${err.message})`))
      .finally(() => setLoading(false))
  }, [activeSection])

  const filteredUsers = useMemo(() => {
    if (userFilter === 'all') return users
    return users.filter((u) => String(u.role ?? '').toLowerCase() === userFilter)
  }, [users, userFilter])

  const judges = useMemo(
    () => users.filter((u) => String(u.role ?? '').toLowerCase() === 'judge'),
    [users],
  )

  async function handleDeleteHackathon(id) {
    if (!window.confirm('해커톤을 삭제하시겠습니까?')) return
    try {
      await deleteAdminHackathon(id)
      setHackathons((prev) => prev.filter((h) => h.id !== id))
      setActionMessage('삭제되었습니다.')
    } catch {
      setActionMessage('삭제에 실패했습니다.')
    }
  }

  async function handleChangeRole(userId, currentRole) {
    const newRole = currentRole === 'JUDGE' ? 'USER' : 'JUDGE'
    const label = newRole === 'JUDGE' ? '심사위원으로 승격' : '일반 유저로 변경'
    if (!window.confirm(`${label}하시겠습니까?`)) return
    try {
      await changeUserRole(userId, newRole)
      setUsers((prev) =>
        prev.map((u) => (u.userId === userId ? { ...u, role: newRole } : u)),
      )
      setActionMessage('역할이 변경되었습니다.')
    } catch {
      setActionMessage('역할 변경에 실패했습니다.')
    }
  }

  const renderDashboard = () => (
    <>
      <h1 className="admin-title">대시보드</h1>
      {loading && <p className="admin-subtitle">불러오는 중...</p>}
      {error && <p className="admin-subtitle" style={{ color: 'red' }}>{error}</p>}
      {platformStats && (
        <div className="admin-stats-grid">
          <article className="admin-stat-card">
            <strong>{platformStats.participants.toLocaleString()}</strong>
            <span>전체 참가자</span>
          </article>
          <article className="admin-stat-card">
            <strong>{platformStats.activeHackathons}</strong>
            <span>활성 해커톤</span>
          </article>
          <article className="admin-stat-card">
            <strong>{platformStats.totalPrize}</strong>
            <span>총 상금</span>
          </article>
        </div>
      )}
      {hackathons.length > 0 && (() => {
        const counts = { upcoming: 0, open: 0, closed: 0, ended: 0 }
        hackathons.forEach((h) => {
          const s = String(h.status ?? '').toLowerCase()
          if (counts[s] !== undefined) counts[s]++
        })
        return (
          <div className="admin-stats-grid">
            {[
              { key: 'upcoming', label: '오픈 예정' },
              { key: 'open', label: '모집 중' },
              { key: 'closed', label: '마감' },
              { key: 'ended', label: '종료' },
            ].map(({ key, label }) => (
              <article key={key} className={`admin-stat-card admin-status--${key}`}>
                <strong>{counts[key]}</strong>
                <span>{label}</span>
              </article>
            ))}
          </div>
        )
      })()}
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
      {actionMessage && <p className="admin-subtitle">{actionMessage}</p>}
      {loading && <p className="admin-subtitle">불러오는 중...</p>}
      {error && <p className="admin-subtitle" style={{ color: 'red' }}>{error}</p>}
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
          {hackathons.map((item) => {
            const statusInfo = statusLabelMap[String(item.status).toLowerCase()] ?? { label: item.status, type: 'muted' }
            return (
              <div key={item.id} className="admin-table__row admin-table__row--hackathons">
                <strong>{item.title}</strong>
                <span className={`admin-status admin-status--${statusInfo.type}`}>
                  {statusInfo.label}
                </span>
                <span>{item.startDate ?? '-'} ~ {item.endDate ?? '-'}</span>
                <span>{item.teamCount ?? '-'}</span>
                <span className="admin-pill admin-pill--blue">{item.scoreType ?? '-'}</span>
                <div className="admin-inline-actions">
                  <button type="button" className="team-secondary-button team-secondary-button--muted">
                    수정
                  </button>
                  <button
                    type="button"
                    className="admin-action-button admin-action-button--danger"
                    onClick={() => handleDeleteHackathon(item.id)}
                  >
                    삭제
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </>
  )

  const renderUsers = () => (
    <>
      <h1 className="admin-title">유저 관리</h1>
      {actionMessage && <p className="admin-subtitle">{actionMessage}</p>}
      {loading && <p className="admin-subtitle">불러오는 중...</p>}
      {error && <p className="admin-subtitle" style={{ color: 'red' }}>{error}</p>}
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
          {filteredUsers.map((user) => {
            const role = String(user.role ?? 'USER').toLowerCase()
            const isJudge = role === 'judge'
            return (
              <div key={user.userId ?? user.email} className="admin-table__row admin-table__row--users">
                <strong>{user.nickname}</strong>
                <span>{user.email}</span>
                <span className={`admin-pill admin-pill--${role}`}>{user.role}</span>
                <span>{user.createdAt?.slice(0, 10) ?? '-'}</span>
                <button
                  type="button"
                  className={`admin-action-button admin-action-button--${isJudge ? 'danger' : 'primary'}`}
                  onClick={() => handleChangeRole(user.userId, user.role)}
                >
                  {isJudge ? '역할 회수' : '심사위원 지정'}
                </button>
              </div>
            )
          })}
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
      {actionMessage && <p className="admin-subtitle">{actionMessage}</p>}
      {loading && <p className="admin-subtitle">불러오는 중...</p>}
      {error && <p className="admin-subtitle" style={{ color: 'red' }}>{error}</p>}
      <section className="admin-card">
        <h2 className="admin-card__title">현재 심사위원 {judges.length}명</h2>
        <div className="admin-judge-list">
          {judges.map((judge) => (
            <article key={judge.userId ?? judge.email} className="admin-judge-item">
              <div className="admin-judge-item__left">
                <span className="admin-judge-item__icon">⚖️</span>
                <div>
                  <h3>{judge.nickname}</h3>
                  <p>{judge.email}</p>
                </div>
              </div>
              <div className="admin-inline-actions">
                <span className="admin-pill admin-pill--judge">심사위원</span>
                <button
                  type="button"
                  className="admin-action-button admin-action-button--danger"
                  onClick={() => handleChangeRole(judge.userId, 'JUDGE')}
                >
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
      {loading && <p className="admin-subtitle">불러오는 중...</p>}
      {error && <p className="admin-subtitle" style={{ color: 'red' }}>{error}</p>}
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
          {submissions.map((item) => (
            <div key={`${item.hackathonId}-${item.teamId}`} className="admin-table__row admin-table__row--submissions">
              <span>{item.hackathonTitle ?? item.hackathonId}</span>
              <strong>{item.teamName ?? item.teamId}</strong>
              <span>{item.submittedAt?.slice(0, 16).replace('T', ' ') ?? '-'}</span>
              <span className="admin-pill admin-pill--file">{item.fileName ?? item.fileType ?? '-'}</span>
              <span className="admin-pill admin-pill--blue">{item.retryCount ?? 0}회</span>
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
