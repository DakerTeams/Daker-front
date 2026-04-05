import { useEffect, useMemo, useState } from 'react'
import {
  changeUserRole,
  createAdminHackathon,
  deleteAdminHackathon,
  fetchAdminDashboard,
  fetchAdminHackathons,
  fetchAdminSubmissions,
  fetchAdminUsers,
  updateAdminHackathon,
} from '../api/admin.js'

const adminMenu = [
  { key: 'dashboard', label: '대시보드', icon: '📊' },
  { key: 'hackathons', label: '해커톤 관리', icon: '🏆' },
  { key: 'users', label: '유저 관리', icon: '👥' },
  { key: 'judges', label: '심사위원 관리', icon: '⚖️' },
  { key: 'submissions', label: '제출물 관리', icon: '📂' },
]

const statusLabelMap = {
  upcoming: { label: '모집예정', type: 'upcoming' },
  open: { label: '모집중', type: 'open' },
  closed: { label: '마감', type: 'closed' },
  ended: { label: '종료', type: 'ended' },
}

const hackathonStatusOptions = [
  { value: 'UPCOMING', label: '모집예정' },
  { value: 'OPEN', label: '모집중' },
  { value: 'CLOSED', label: '마감' },
  { value: 'ENDED', label: '종료' },
]

const scoreTypeOptions = [
  { value: 'SCORE', label: 'SCORE' },
  { value: 'VOTE', label: 'VOTE' },
]

function createEmptyHackathonForm() {
  return {
    title: '',
    summary: '',
    description: '',
    organizerName: '',
    status: 'UPCOMING',
    scoreType: 'SCORE',
    registrationStartAt: '',
    registrationEndAt: '',
    startAt: '',
    endAt: '',
    submissionDeadlineAt: '',
    maxTeamSize: '4',
    maxParticipants: '',
    campEnabled: false,
    allowSolo: false,
  }
}

function formatDateTimeInput(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const pad = (number) => String(number).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
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

function buildHackathonForm(item) {
  if (!item) return createEmptyHackathonForm()

  return {
    title: item.title ?? '',
    summary: item.summary ?? '',
    description: item.description ?? '',
    organizerName: item.organizerName ?? '',
    status: item.status ?? 'UPCOMING',
    scoreType: item.scoreType ?? 'SCORE',
    registrationStartAt: formatDateTimeInput(item.registrationStartAt),
    registrationEndAt: formatDateTimeInput(item.registrationEndAt),
    startAt: formatDateTimeInput(item.startAt),
    endAt: formatDateTimeInput(item.endAt),
    submissionDeadlineAt: formatDateTimeInput(item.submissionDeadlineAt),
    maxTeamSize: String(item.maxTeamSize ?? 4),
    maxParticipants: item.maxParticipants ? String(item.maxParticipants) : '',
    campEnabled: Boolean(item.campEnabled),
    allowSolo: Boolean(item.allowSolo),
  }
}

function buildHackathonPayload(form) {
  return {
    title: form.title.trim(),
    summary: form.summary.trim() || null,
    description: form.description.trim() || null,
    organizerName: form.organizerName.trim(),
    status: form.status,
    scoreType: form.scoreType,
    registrationStartAt: form.registrationStartAt || null,
    registrationEndAt: form.registrationEndAt || null,
    startAt: form.startAt || null,
    endAt: form.endAt || null,
    submissionDeadlineAt: form.submissionDeadlineAt || null,
    maxTeamSize: Number(form.maxTeamSize),
    maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : null,
    campEnabled: form.campEnabled,
    allowSolo: form.allowSolo,
  }
}

function HackathonFormModal({ initialValue, onClose, onSubmit, saving }) {
  const [form, setForm] = useState(() => buildHackathonForm(initialValue))
  const [error, setError] = useState('')
  const isEdit = Boolean(initialValue)

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function handleSubmit() {
    if (
      !form.title.trim() ||
      !form.organizerName.trim() ||
      !form.registrationStartAt ||
      !form.registrationEndAt ||
      !form.startAt ||
      !form.endAt
    ) {
      setError('제목, 주최자, 모집 기간, 진행 기간은 필수입니다.')
      return
    }

    if (Number(form.maxTeamSize) <= 0) {
      setError('최대 팀 인원은 1 이상이어야 합니다.')
      return
    }

    setError('')

    try {
      await onSubmit(buildHackathonPayload(form))
    } catch (submitError) {
      setError(submitError.message || '저장에 실패했습니다.')
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="mypage-modal" onClick={(event) => event.stopPropagation()}>
        <div className="mypage-modal__header">
          <div>
            <h2>{isEdit ? '해커톤 수정' : '해커톤 등록'}</h2>
            <p className="mypage-modal__subtitle">
              {isEdit ? '상태와 기본 정보를 수정할 수 있습니다.' : '새 해커톤을 등록합니다.'}
            </p>
          </div>
          <button type="button" className="mypage-modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="mypage-modal__body">
          <div className="mypage-modal__form">
            <label className="mypage-modal__label">
              해커톤명
              <input
                className="mypage-modal__input"
                value={form.title}
                onChange={(event) => updateField('title', event.target.value)}
              />
            </label>

            <label className="mypage-modal__label">
              한 줄 소개
              <input
                className="mypage-modal__input"
                value={form.summary}
                onChange={(event) => updateField('summary', event.target.value)}
              />
            </label>

            <label className="mypage-modal__label">
              설명
              <textarea
                className="mypage-modal__input mypage-modal__textarea"
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
              />
            </label>

            <label className="mypage-modal__label">
              주최자
              <input
                className="mypage-modal__input"
                value={form.organizerName}
                onChange={(event) => updateField('organizerName', event.target.value)}
              />
            </label>

            <label className="mypage-modal__label">
              모집 상태
              <select
                className="mypage-modal__input"
                value={form.status}
                onChange={(event) => updateField('status', event.target.value)}
              >
                {hackathonStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="mypage-modal__label">
              심사 방식
              <select
                className="mypage-modal__input"
                value={form.scoreType}
                onChange={(event) => updateField('scoreType', event.target.value)}
              >
                {scoreTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="mypage-modal__label">
              모집 시작일
              <input
                type="datetime-local"
                className="mypage-modal__input"
                value={form.registrationStartAt}
                onChange={(event) => updateField('registrationStartAt', event.target.value)}
              />
            </label>

            <label className="mypage-modal__label">
              모집 종료일
              <input
                type="datetime-local"
                className="mypage-modal__input"
                value={form.registrationEndAt}
                onChange={(event) => updateField('registrationEndAt', event.target.value)}
              />
            </label>

            <label className="mypage-modal__label">
              해커톤 시작일
              <input
                type="datetime-local"
                className="mypage-modal__input"
                value={form.startAt}
                onChange={(event) => updateField('startAt', event.target.value)}
              />
            </label>

            <label className="mypage-modal__label">
              해커톤 종료일
              <input
                type="datetime-local"
                className="mypage-modal__input"
                value={form.endAt}
                onChange={(event) => updateField('endAt', event.target.value)}
              />
            </label>

            <label className="mypage-modal__label">
              제출 마감일
              <input
                type="datetime-local"
                className="mypage-modal__input"
                value={form.submissionDeadlineAt}
                onChange={(event) => updateField('submissionDeadlineAt', event.target.value)}
              />
            </label>

            <label className="mypage-modal__label">
              최대 팀 인원
              <input
                type="number"
                min="1"
                className="mypage-modal__input"
                value={form.maxTeamSize}
                onChange={(event) => updateField('maxTeamSize', event.target.value)}
              />
            </label>

            <label className="mypage-modal__label">
              최대 참가자 수
              <input
                type="number"
                min="1"
                className="mypage-modal__input"
                value={form.maxParticipants}
                onChange={(event) => updateField('maxParticipants', event.target.value)}
              />
            </label>

            <label className="mypage-modal__toggle">
              <input
                type="checkbox"
                checked={form.campEnabled}
                onChange={(event) => updateField('campEnabled', event.target.checked)}
              />
              팀원 모집 사용
            </label>

            <label className="mypage-modal__toggle">
              <input
                type="checkbox"
                checked={form.allowSolo}
                onChange={(event) => updateField('allowSolo', event.target.checked)}
              />
              개인 참가 허용
            </label>
          </div>

          {error ? <p className="mypage-modal__error">{error}</p> : null}
        </div>

        <div className="mypage-modal__footer">
          <button type="button" className="team-secondary-button" onClick={onClose}>취소</button>
          <button type="button" className="team-primary-button" onClick={handleSubmit} disabled={saving}>
            {saving ? '저장 중...' : isEdit ? '수정' : '등록'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AdminPage() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [userFilter, setUserFilter] = useState('all')
  const [dashboard, setDashboard] = useState(null)
  const [hackathons, setHackathons] = useState([])
  const [users, setUsers] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [actionMessage, setActionMessage] = useState('')
  const [editingHackathon, setEditingHackathon] = useState(null)
  const [isHackathonModalOpen, setIsHackathonModalOpen] = useState(false)
  const [isSavingHackathon, setIsSavingHackathon] = useState(false)

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
        } else if (activeSection === 'users' || activeSection === 'judges') {
          const data = await fetchAdminUsers()
          setUsers(data)
        } else if (activeSection === 'submissions') {
          const data = await fetchAdminSubmissions()
          setSubmissions(data)
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

  const judges = useMemo(
    () => users.filter((user) => String(user.role ?? '').toLowerCase() === 'judge'),
    [users],
  )

  function openCreateHackathonModal() {
    setEditingHackathon(null)
    setIsHackathonModalOpen(true)
  }

  function openEditHackathonModal(item) {
    setEditingHackathon(item)
    setIsHackathonModalOpen(true)
  }

  function closeHackathonModal() {
    if (isSavingHackathon) return
    setEditingHackathon(null)
    setIsHackathonModalOpen(false)
  }

  async function handleSaveHackathon(payload) {
    setIsSavingHackathon(true)

    try {
      if (editingHackathon) {
        const updated = await updateAdminHackathon(editingHackathon.id, payload)
        setHackathons((current) =>
          current.map((item) =>
            item.id === editingHackathon.id
              ? {
                  ...item,
                  ...payload,
                  id: updated.id ?? item.id,
                }
              : item,
          ),
        )
        setActionMessage('해커톤이 수정되었습니다.')
      } else {
        const created = await createAdminHackathon(payload)
        const nextHackathon = {
          ...payload,
          id: created.id,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
          numOfTeams: 0,
        }
        setHackathons((current) => [nextHackathon, ...current])
        setActionMessage('해커톤이 등록되었습니다.')
      }

      setIsHackathonModalOpen(false)
      setEditingHackathon(null)
    } finally {
      setIsSavingHackathon(false)
    }
  }

  async function handleDeleteHackathon(id) {
    if (!window.confirm('해커톤을 삭제하시겠습니까? 삭제는 소프트 삭제로 처리됩니다.')) return

    try {
      await deleteAdminHackathon(id)
      setHackathons((current) => current.filter((item) => item.id !== id))
      setActionMessage('해커톤이 삭제되었습니다.')
    } catch {
      setActionMessage('해커톤 삭제에 실패했습니다.')
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
        <button type="button" className="team-primary-button" onClick={openCreateHackathonModal}>
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
                    onClick={() => openEditHackathonModal(item)}
                  >
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
          {activeSection === 'judges' && renderJudges()}
          {activeSection === 'submissions' && renderSubmissions()}
        </div>
      </section>

      {isHackathonModalOpen && (
        <HackathonFormModal
          initialValue={editingHackathon}
          onClose={closeHackathonModal}
          onSubmit={handleSaveHackathon}
          saving={isSavingHackathon}
        />
      )}
    </>
  )
}

export default AdminPage
