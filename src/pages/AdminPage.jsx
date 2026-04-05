import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  changeUserRole,
  closeAdminHackathon,
  deleteAdminHackathon,
  downloadAdminHackathonSubmissions,
  downloadAdminSubmission,
  fetchAdminDashboard,
  fetchAdminHackathons,
  fetchAdminSubmissionHackathonDetails,
  fetchAdminSubmissionHackathons,
  fetchAdminUsers,
} from '../api/admin.js'

const adminMenu = [
  { key: 'dashboard', label: '대시보드', icon: '📊' },
  { key: 'hackathons', label: '해커톤 관리', icon: '🏆' },
  { key: 'users', label: '유저 관리', icon: '👥' },
  { key: 'submissions', label: '제출물 관리', icon: '📂' },
]

const statusLabelMap = {
  upcoming: { label: '모집예정', type: 'upcoming' },
  open: { label: '모집중', type: 'open' },
  closed: { label: '마감', type: 'closed' },
  ended: { label: '종료', type: 'ended' },
}

function formatDateTimeDisplay(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDateRange(startAt, endAt) {
  const start = formatDateTimeDisplay(startAt)
  const end = formatDateTimeDisplay(endAt)

  if (start === '-' && end === '-') return '-'
  return `${start} ~ ${end}`
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  const pad = (number) => String(number).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function SubmissionHackathonModal({
  open,
  hackathon,
  items,
  loading,
  onClose,
  onDownloadSubmission,
  onDownloadAll,
}) {
  if (!open || !hackathon) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="mypage-modal" onClick={(event) => event.stopPropagation()}>
        <div className="mypage-modal__header">
          <div>
            <h2>{hackathon.hackathonName}</h2>
            <p className="mypage-modal__subtitle">
              제출 팀 {hackathon.submittedTeamCount}개, 파일 {hackathon.totalFileCount}개
            </p>
          </div>
          <div className="admin-inline-actions">
            <button type="button" className="team-primary-button" onClick={() => onDownloadAll(hackathon.hackathonId)}>
              전체 다운로드
            </button>
            <button type="button" className="mypage-modal__close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="mypage-modal__body">
          {loading ? (
            <p className="mypage-modal__empty">제출물을 불러오는 중...</p>
          ) : items.length === 0 ? (
            <p className="mypage-modal__empty">제출된 팀이 없습니다.</p>
          ) : (
            <div className="admin-judge-list">
              {items.map((item) => (
                <article key={item.submissionId} className="admin-judge-item admin-submission-item">
                  <div className="admin-judge-item__left admin-submission-item__left">
                    <div>
                      <h3>{item.teamName}</h3>
                      <p>{formatDateTime(item.submittedAt)}</p>
                      <p className="admin-submission-item__meta">
                        파일 {item.submissionItems?.length ?? 0}개 · {item.reviewStatus === 'reviewed' ? '검토 완료' : '검토 대기'}
                      </p>
                      {item.submissionItems?.length > 0 && (
                        <ul className="admin-submission-item__files">
                          {item.submissionItems.map((submissionItem) => (
                            <li key={submissionItem.itemId}>
                              {submissionItem.originalFileName ?? submissionItem.fileName ?? submissionItem.valueUrl ?? '링크 자료'}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="admin-action-button"
                    onClick={() => onDownloadSubmission(item.submissionId)}
                  >
                    자료 다운로드
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="mypage-modal__footer">
          <button type="button" className="team-secondary-button" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  )
}

function AdminPage() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('dashboard')
  const [userFilter, setUserFilter] = useState('all')
  const [dashboard, setDashboard] = useState(null)
  const [hackathons, setHackathons] = useState([])
  const [users, setUsers] = useState([])
  const [submissionHackathons, setSubmissionHackathons] = useState([])
  const [submissionModalHackathon, setSubmissionModalHackathon] = useState(null)
  const [submissionModalItems, setSubmissionModalItems] = useState([])
  const [submissionModalLoading, setSubmissionModalLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return undefined

    const timer = window.setTimeout(() => {
      setToast(null)
    }, 2600)

    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    const load = async () => {
      setError(null)
      setLoading(true)

      try {
        if (activeSection === 'dashboard') {
          const data = await fetchAdminDashboard()
          setDashboard(data)
          setHackathons(data?.hackathons?.hackathonList?.items ?? [])
        } else if (activeSection === 'hackathons') {
          const data = await fetchAdminHackathons()
          setHackathons(data)
        } else if (activeSection === 'users') {
          const data = await fetchAdminUsers()
          setUsers(data)
        } else if (activeSection === 'submissions') {
          const data = await fetchAdminSubmissionHackathons()
          setSubmissionHackathons(data)
        }
      } catch (err) {
        setError(`데이터를 불러오지 못했습니다. (${err.message})`)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [activeSection])

  const filteredUsers = useMemo(() => {
    if (userFilter === 'all') return users
    return users.filter((user) => String(user.role ?? '').toLowerCase() === userFilter)
  }, [users, userFilter])

  async function handleCloseHackathon(id) {
    if (!window.confirm('해커톤을 마감 처리하시겠습니까?')) return
    try {
      await closeAdminHackathon(id)
      setHackathons((current) =>
        current.map((item) => item.id === id ? { ...item, status: 'CLOSED' } : item),
      )
      setToast({ type: 'success', message: '마감 처리되었습니다.' })
    } catch {
      setToast({ type: 'error', message: '마감 처리에 실패했습니다.' })
    }
  }

  async function handleDeleteHackathon(id) {
    if (!window.confirm('해커톤을 삭제하시겠습니까? 삭제는 소프트 삭제로 처리됩니다.')) return

    try {
      await deleteAdminHackathon(id)
      setHackathons((current) => current.filter((item) => item.id !== id))
      setToast({ type: 'success', message: '해커톤이 삭제되었습니다.' })
    } catch {
      setToast({ type: 'error', message: '해커톤 삭제에 실패했습니다.' })
    }
  }

  async function handleChangeRole(userId, currentRole) {
    const newRole = currentRole === 'JUDGE' ? 'USER' : 'JUDGE'
    const label = newRole === 'JUDGE' ? '심사위원으로 승격' : '일반 유저로 변경'
    if (!window.confirm(`${label}하시겠습니까?`)) return

    try {
      await changeUserRole(userId, newRole)
      setUsers((current) =>
        current.map((user) => (user.userId === userId ? { ...user, role: newRole } : user)),
      )
      setToast({
        type: 'success',
        message: newRole === 'JUDGE' ? '심사위원으로 지정했습니다.' : '심사위원 권한을 회수했습니다.',
      })
    } catch (requestError) {
      setToast({
        type: 'error',
        message: requestError?.message || '실패했습니다.',
      })
    }
  }

  async function handleOpenSubmissionModal(hackathon) {
    setSubmissionModalHackathon(hackathon)
    setSubmissionModalLoading(true)

    try {
      const data = await fetchAdminSubmissionHackathonDetails(hackathon.hackathonId)
      setSubmissionModalItems(data)
    } catch (requestError) {
      setToast({
        type: 'error',
        message: requestError?.message || '제출물을 불러오지 못했습니다.',
      })
      setSubmissionModalItems([])
    } finally {
      setSubmissionModalLoading(false)
    }
  }

  function handleCloseSubmissionModal() {
    setSubmissionModalHackathon(null)
    setSubmissionModalItems([])
    setSubmissionModalLoading(false)
  }

  async function handleDownloadSubmission(submissionId) {
    try {
      await downloadAdminSubmission(submissionId)
    } catch (requestError) {
      setToast({
        type: 'error',
        message: requestError?.message || '다운로드에 실패했습니다.',
      })
    }
  }

  async function handleDownloadAllSubmissions(hackathonId) {
    try {
      await downloadAdminHackathonSubmissions(hackathonId)
    } catch (requestError) {
      setToast({
        type: 'error',
        message: requestError?.message || '전체 다운로드에 실패했습니다.',
      })
    }
  }

  const renderDashboard = () => (
    <>
      <h1 className="admin-title">대시보드</h1>
      {loading && <p className="admin-subtitle">불러오는 중...</p>}
      {error && <p className="admin-subtitle" style={{ color: 'red' }}>{error}</p>}
      {dashboard && (
        <div className="admin-stats-grid">
          <article className="admin-stat-card">
            <strong>{dashboard.users?.total ?? 0}</strong>
            <span>전체 참가자</span>
          </article>
          <article className="admin-stat-card">
            <strong>{dashboard.hackathons?.active ?? 0}</strong>
            <span>활성 해커톤</span>
          </article>
          <article className="admin-stat-card">
            <strong>{dashboard.participatedTeams?.total ?? 0}</strong>
            <span>전체 팀</span>
          </article>
          <article className="admin-stat-card">
            <strong>{dashboard.submissions?.total ?? 0}</strong>
            <span>전체 제출물</span>
          </article>
        </div>
      )}
      {dashboard?.hackathons && (
        <div className="admin-stats-grid">
          {[
            { key: 'upcoming', label: '모집예정', value: dashboard.hackathons.upcoming ?? 0 },
            { key: 'open', label: '모집중', value: dashboard.hackathons.active ?? 0 },
            { key: 'closed', label: '마감', value: dashboard.hackathons.closed ?? 0 },
            { key: 'ended', label: '종료', value: dashboard.hackathons.ended ?? 0 },
          ].map(({ key, label, value }) => (
            <article key={key} className={`admin-stat-card admin-status--${key}`}>
              <strong>{value}</strong>
              <span>{label}</span>
            </article>
          ))}
        </div>
      )}
    </>
  )

  const renderHackathons = () => (
    <>
      <div className="row-between row-between--wrap">
      <h1 className="admin-title">해커톤 관리</h1>
        <button type="button" className="team-primary-button" onClick={() => navigate('/admin/hackathons/new')}>
          + 새 해커톤 등록
        </button>
      </div>
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
            const statusInfo =
              statusLabelMap[String(item.status ?? '').toLowerCase()] ??
              { label: item.status, type: 'muted' }

            return (
              <div key={item.id} className="admin-table__row admin-table__row--hackathons">
                <strong>{item.title}</strong>
                <span className={`admin-status admin-status--${statusInfo.type}`}>
                  {statusInfo.label}
                </span>
                <span>{formatDateRange(item.startAt, item.endAt)}</span>
                <span>{item.numOfTeams ?? item.teamCount ?? '-'}</span>
                <span className="admin-pill admin-pill--blue">{item.scoreType ?? '-'}</span>
                <div className="admin-inline-actions">
                  <button
                    type="button"
                    className="team-secondary-button team-secondary-button--muted"
                    onClick={() => navigate(`/admin/hackathons/${item.id}/edit`)}
                  >
                    수정
                  </button>
                  {String(item.status ?? '').toLowerCase() === 'open' && (
                    <button
                      type="button"
                      className="admin-action-button"
                      onClick={() => handleCloseHackathon(item.id)}
                    >
                      마감
                    </button>
                  )}
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
      {loading && <p className="admin-subtitle">불러오는 중...</p>}
      {error && <p className="admin-subtitle" style={{ color: 'red' }}>{error}</p>}
      <p className="admin-subtitle">
        유저 역할 변경은 여기서 통합 관리합니다. 별도 심사위원 탭은 제거했습니다.
      </p>
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
                <strong className="admin-user-cell admin-user-cell--name">{user.nickname}</strong>
                <span className="admin-user-cell admin-user-cell--email">{user.email}</span>
                <span className={`admin-pill admin-pill--${role}`}>{user.role}</span>
                <span className="admin-user-cell admin-user-cell--date">{user.createdAt?.slice(0, 10) ?? '-'}</span>
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

  const renderSubmissions = () => (
    <>
      <h1 className="admin-title">제출물 관리</h1>
      <p className="admin-subtitle">
        해커톤별 제출 현황을 확인하고, 모달에서 팀별 자료 또는 전체 제출물을 다운로드할 수 있습니다.
      </p>
      {loading && <p className="admin-subtitle">불러오는 중...</p>}
      {error && <p className="admin-subtitle" style={{ color: 'red' }}>{error}</p>}
      <section className="admin-card">
        <div className="admin-table">
          <div className="admin-table__head admin-table__head--submission-hackathons">
            <span>해커톤</span>
            <span>제출 팀</span>
            <span>자료 수</span>
            <span>마지막 제출</span>
            <span>액션</span>
          </div>
          {submissionHackathons.map((item) => (
            <div key={item.hackathonId} className="admin-table__row admin-table__row--submission-hackathons">
              <strong>{item.hackathonName}</strong>
              <span>{item.submittedTeamCount}팀</span>
              <span className="admin-pill admin-pill--blue">{item.totalFileCount}개</span>
              <span>{formatDateTime(item.latestSubmittedAt)}</span>
              <button
                type="button"
                className="team-secondary-button team-secondary-button--muted"
                onClick={() => handleOpenSubmissionModal(item)}
              >
                제출물 보기
              </button>
            </div>
          ))}
        </div>
      </section>
    </>
  )

  return (
    <>
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
          {activeSection === 'submissions' && renderSubmissions()}
        </div>
      </section>

      {toast && (
        <div className={`admin-toast admin-toast--${toast.type}`}>
          {toast.message}
        </div>
      )}

      <SubmissionHackathonModal
        open={Boolean(submissionModalHackathon)}
        hackathon={submissionModalHackathon}
        items={submissionModalItems}
        loading={submissionModalLoading}
        onClose={handleCloseSubmissionModal}
        onDownloadSubmission={handleDownloadSubmission}
        onDownloadAll={handleDownloadAllSubmissions}
      />
    </>
  )
}

export default AdminPage
