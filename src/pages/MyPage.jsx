import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchMe, fetchAllTags, fetchUserTags, addUserTag, removeUserTag } from '../api/auth.js'
import { fetchHackathons, fetchHackathonLeaderboard } from '../api/hackathons.js'
import {
  fetchMyTeams,
  fetchTeamDetail,
  fetchTeamApplications,
  decideTeamApplication,
  updateTeam,
} from '../api/teams.js'
import { getStoredUser, SESSION_EXPIRED_EVENT } from '../lib/auth.js'

function ApplicationsModal({ team, onClose, onUpdate }) {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(null)

  useEffect(() => {
    fetchTeamApplications(team.id)
      .then(setApplications)
      .finally(() => setLoading(false))
  }, [team.id])

  async function handleDecide(appId, status) {
    setProcessing(appId)
    try {
      await decideTeamApplication(team.id, appId, status)
      setApplications((prev) =>
        prev.map((a) => (a.applicationId === appId ? { ...a, status } : a)),
      )
      onUpdate()
    } finally {
      setProcessing(null)
    }
  }

  const pending = applications.filter((a) => a.status === 'PENDING')
  const others = applications.filter((a) => a.status !== 'PENDING')

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="mypage-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mypage-modal__header">
          <div>
            <h2>신청 관리</h2>
            <p className="mypage-modal__subtitle">{team.name}</p>
          </div>
          <button type="button" className="mypage-modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="mypage-modal__body">
          {loading ? (
            <p className="mypage-modal__empty">불러오는 중...</p>
          ) : pending.length === 0 && others.length === 0 ? (
            <p className="mypage-modal__empty">신청 내역이 없습니다.</p>
          ) : (
            <div className="mypage-modal__list">
              {pending.length > 0 && (
                <div className="mypage-modal__section-group">
                  <p className="mypage-modal__section-label">대기 중 · {pending.length}</p>
                  {pending.map((app) => (
                    <div key={app.applicationId} className="mypage-app-item">
                      <span className="mypage-app-item__name">{app.nickname}</span>
                      <div className="mypage-app-item__actions">
                        <button
                          type="button"
                          className="team-primary-button team-primary-button--small"
                          disabled={processing === app.applicationId}
                          onClick={() => handleDecide(app.applicationId, 'ACCEPTED')}
                        >
                          수락
                        </button>
                        <button
                          type="button"
                          className="team-secondary-button team-secondary-button--muted"
                          disabled={processing === app.applicationId}
                          onClick={() => handleDecide(app.applicationId, 'REJECTED')}
                        >
                          거절
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {others.length > 0 && (
                <div className="mypage-modal__section-group">
                  <p className="mypage-modal__section-label">처리 완료 · {others.length}</p>
                  {others.map((app) => (
                    <div key={app.applicationId} className="mypage-app-item mypage-app-item--done">
                      <span className="mypage-app-item__name">{app.nickname}</span>
                      <span className={`mypage-app-item__status mypage-app-item__status--${app.status.toLowerCase()}`}>
                        {app.status === 'ACCEPTED' ? '수락됨' : '거절됨'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
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

const CONTACT_TYPES = [
  { value: 'KAKAO', label: '카카오 오픈채팅' },
  { value: 'DISCORD', label: '디스코드' },
  { value: 'SLACK', label: '슬랙' },
  { value: 'EMAIL', label: '이메일' },
]

function EditTeamModal({ team, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: team.name,
    description: team.description ?? '',
    isOpen: team.isOpen ?? false,
    maxMemberCount: String(team.maxMembers ?? 4),
    positions: team.positionDetails?.length > 0
      ? team.positionDetails.map((p) => ({ positionName: p.positionName, requiredCount: String(p.requiredCount) }))
      : [{ positionName: '', requiredCount: '1' }],
    contactType: team.contact?.type ?? '',
    contactValue: team.contact?.value ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function addPosition() {
    setForm((f) => ({ ...f, positions: [...f.positions, { positionName: '', requiredCount: '1' }] }))
  }

  function removePosition(index) {
    setForm((f) => ({
      ...f,
      positions: f.positions.length === 1
        ? [{ positionName: '', requiredCount: '1' }]
        : f.positions.filter((_, i) => i !== index),
    }))
  }

  function updatePosition(index, field, value) {
    setForm((f) => ({
      ...f,
      positions: f.positions.map((p, i) => i === index ? { ...p, [field]: value } : p),
    }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await updateTeam(team.id, {
        name: form.name,
        description: form.description,
        isOpen: form.isOpen,
        maxMemberCount: Number(form.maxMemberCount) || null,
        positions: form.positions
          .map((p) => ({ positionName: p.positionName.trim(), requiredCount: Number(p.requiredCount) || 1 }))
          .filter((p) => p.positionName),
        contactType: form.contactType || null,
        contactValue: form.contactValue || null,
      })
      onSaved()
      onClose()
    } catch {
      setError('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="mypage-modal mypage-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="mypage-modal__header">
          <div>
            <p className="eyebrow">edit team</p>
            <h2>{team.name}</h2>
          </div>
          <button type="button" className="mypage-modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="mypage-modal__body mypage-modal__body--sections">
          <div className="surface-card">
            <p className="eyebrow">기본 정보</p>
            <div className="mypage-modal__form">
              <label className="mypage-modal__label">
                팀 이름
                <input
                  className="mypage-modal__input"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </label>
              <label className="mypage-modal__label">
                팀 소개
                <textarea
                  className="mypage-modal__input mypage-modal__textarea"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </label>
            </div>
          </div>

          <div className="surface-card">
            <p className="eyebrow">모집 설정</p>
            <div className="mypage-modal__form">
              <label className="mypage-modal__toggle">
                <input
                  type="checkbox"
                  checked={form.isOpen}
                  onChange={(e) => setForm((f) => ({ ...f, isOpen: e.target.checked }))}
                />
                팀원 모집 중
              </label>
              <label className="mypage-modal__label">
                최대 팀원 수
                <input
                  type="number"
                  min="1"
                  max="20"
                  className="mypage-modal__input"
                  value={form.maxMemberCount}
                  onChange={(e) => setForm((f) => ({ ...f, maxMemberCount: e.target.value }))}
                />
              </label>
            </div>
          </div>

          <div className="surface-card">
            <div className="mypage-modal__section-row">
              <p className="eyebrow">모집 역할</p>
              <button type="button" className="button-link button-link--ghost" onClick={addPosition}>
                + 추가
              </button>
            </div>
            <div className="mypage-modal__form">
              {form.positions.map((pos, index) => (
                <div key={index} className="mypage-modal__position-row">
                  <input
                    className="mypage-modal__input"
                    placeholder="역할명 (예: 프론트엔드)"
                    value={pos.positionName}
                    onChange={(e) => updatePosition(index, 'positionName', e.target.value)}
                  />
                  <input
                    type="number"
                    min="1"
                    className="mypage-modal__input mypage-modal__input--count"
                    value={pos.requiredCount}
                    onChange={(e) => updatePosition(index, 'requiredCount', e.target.value)}
                  />
                  <button
                    type="button"
                    className="button-link button-link--ghost"
                    onClick={() => removePosition(index)}
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card">
            <p className="eyebrow">연락 수단</p>
            <div className="mypage-modal__form">
              <label className="mypage-modal__label">
                수단
                <select
                  className="mypage-modal__input"
                  value={form.contactType}
                  onChange={(e) => setForm((f) => ({ ...f, contactType: e.target.value }))}
                >
                  <option value="">선택 안 함</option>
                  {CONTACT_TYPES.map((ct) => (
                    <option key={ct.value} value={ct.value}>{ct.label}</option>
                  ))}
                </select>
              </label>
              {form.contactType && (
                <label className="mypage-modal__label">
                  연락처
                  <input
                    className="mypage-modal__input"
                    placeholder={form.contactType === 'EMAIL' ? '이메일 주소' : '링크 또는 채널명'}
                    value={form.contactValue}
                    onChange={(e) => setForm((f) => ({ ...f, contactValue: e.target.value }))}
                  />
                </label>
              )}
            </div>
          </div>

          {error && <p className="mypage-modal__error">{error}</p>}
        </div>

        <div className="mypage-modal__footer">
          <button type="button" className="team-secondary-button" onClick={onClose}>취소</button>
          <button
            type="button"
            className="team-primary-button"
            disabled={saving || !form.name.trim()}
            onClick={handleSave}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}

const TAG_CATEGORY_MAP = {
  '프론트엔드': ['React', 'Vue', 'Angular', 'Next.js', 'TypeScript', 'JavaScript', 'HTML/CSS'],
  '백엔드': ['Node.js', 'Python', 'FastAPI', 'Django', 'Spring', 'Java', 'Go', 'Rust', 'C++', 'PHP', 'Ruby'],
  '모바일': ['Flutter', 'Swift', 'Kotlin', 'React Native', '모바일'],
  'AI / 데이터': ['AI/ML', 'AI', 'ML', '머신러닝', '딥러닝', 'Data', '데이터', 'PyTorch', 'TensorFlow'],
  '핀테크 / 블록체인': ['핀테크', 'Blockchain', 'Web3', '블록체인'],
  '기획 / 디자인': ['UI/UX', 'PM', '기획', '디자인', 'Figma'],
  'DevOps': ['DevOps', 'Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Linux'],
}

function groupTagsByCategory(tags) {
  const groups = {}
  const usedIds = new Set()

  Object.entries(TAG_CATEGORY_MAP).forEach(([category, names]) => {
    const matched = tags.filter((t) => names.includes(t.name))
    if (matched.length > 0) {
      groups[category] = matched
      matched.forEach((t) => usedIds.add(t.tagId))
    }
  })

  const others = tags.filter((t) => !usedIds.has(t.tagId))
  if (others.length > 0) groups['기타'] = others

  return groups
}

function ProfileEditModal({ initialTagObjects, onClose, onSave }) {
  const [allTags, setAllTags] = useState([])
  const currentTags = initialTagObjects
  const [selectedNames, setSelectedNames] = useState(initialTagObjects.map((t) => t.name))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAllTags().then((all) => {
      setAllTags(all)
      setLoading(false)
    })
  }, [])

  function toggleTag(name) {
    setSelectedNames((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name],
    )
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const currentNames = currentTags.map((t) => t.name)
      const toAdd = selectedNames.filter((n) => !currentNames.includes(n))
      const toRemove = currentTags.filter((t) => !selectedNames.includes(t.name))

      await Promise.all([
        ...toAdd.map((name) => addUserTag(name)),
        ...toRemove.map((t) => removeUserTag(t.tagId)),
      ])

      const newTagObjects = [
        ...currentTags.filter((t) => selectedNames.includes(t.name)),
        ...toAdd.map((name) => ({ tagId: null, name })),
      ]
      onSave(selectedNames, newTagObjects)
    } catch {
      setError('저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="mypage-modal profile-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mypage-modal__header">
          <div>
            <h2>관심 태그 편집</h2>
            <p className="mypage-modal__subtitle">선택한 태그를 기반으로 해커톤을 추천해드립니다.</p>
          </div>
          <button type="button" className="mypage-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="mypage-modal__body">
          {loading ? (
            <p className="mypage-modal__empty">불러오는 중...</p>
          ) : (
            <div className="profile-tag-groups">
              {Object.entries(groupTagsByCategory(allTags)).map(([category, tags]) => (
                <div key={category} className="profile-tag-group">
                  <p className="profile-tag-group__label">{category}</p>
                  <div className="profile-tag-grid">
                    {tags.map((tag) => (
                      <button
                        key={tag.tagId}
                        type="button"
                        className={`profile-tag-chip${selectedNames.includes(tag.name) ? ' profile-tag-chip--active' : ''}`}
                        onClick={() => toggleTag(tag.name)}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {error && <p className="profile-edit-error">{error}</p>}
        </div>
        <div className="mypage-modal__footer">
          <button type="button" className="team-secondary-button" onClick={onClose}>취소</button>
          <button
            type="button"
            className="team-primary-button"
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TeamInfoModal({ team, hackathonName, onClose }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeamDetail(team.id)
      .then(setDetail)
      .finally(() => setLoading(false))
  }, [team.id])

  const contactTypeLabel = CONTACT_TYPES.find((ct) => ct.value === detail?.contact?.type)?.label ?? detail?.contact?.type

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="mypage-modal mypage-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="mypage-modal__header">
          <div>
            <p className="eyebrow">team info</p>
            <h2>{team.name}</h2>
            <p className="mypage-modal__subtitle">{hackathonName}</p>
          </div>
          <button type="button" className="mypage-modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="mypage-modal__body mypage-modal__body--sections">
          {loading ? (
            <p className="mypage-modal__empty">불러오는 중...</p>
          ) : (
            <>
              {detail?.description && (
                <div className="surface-card">
                  <p className="eyebrow">팀 소개</p>
                  <p>{detail.description}</p>
                </div>
              )}

              <div className="surface-card">
                <p className="eyebrow">팀 정보</p>
                <div className="stack-list stack-list--compact">
                  <div className="info-row">
                    <span>모집 상태</span>
                    <strong className={detail?.isOpen ? 'mypage-team-info__open' : 'mypage-team-info__closed'}>
                      {detail?.isOpen ? '모집 중' : '모집 마감'}
                    </strong>
                  </div>
                  <div className="info-row">
                    <span>팀원</span>
                    <strong>{detail?.currentMembers} / {detail?.maxMembers}명</strong>
                  </div>
                </div>
              </div>

              {detail?.positionDetails?.length > 0 && (
                <div className="surface-card">
                  <p className="eyebrow">모집 포지션</p>
                  <div className="mypage-team-info__positions">
                    {detail.positionDetails.map((pos) => (
                      <span key={pos.positionName} className="tag-chip">
                        {pos.positionName} · {pos.requiredCount}명
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {detail?.contact?.value && (
                <div className="surface-card">
                  <p className="eyebrow">연락처</p>
                  <div className="info-row">
                    <span>{contactTypeLabel}</span>
                    <a
                      href={detail.contact.value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mypage-team-info__contact-link"
                    >
                      {detail.contact.value}
                    </a>
                  </div>
                </div>
              )}

              {detail?.members?.length > 0 && (
                <div className="surface-card">
                  <p className="eyebrow">팀원</p>
                  <div className="mypage-modal__list">
                    {detail.members.map((m) => (
                      <div key={m.userId} className="mypage-app-item">
                        <span className="mypage-app-item__name">{m.nickname}</span>
                        {m.position && (
                          <span className="tag-chip">{m.position}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mypage-modal__footer">
          <button type="button" className="team-secondary-button" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  )
}

function MyPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(getStoredUser() ?? null)
  const [myTeams, setMyTeams] = useState([])
  const [activeTab, setActiveTab] = useState('teams')
  const [applicationCounts, setApplicationCounts] = useState({})
  const [applicationsModal, setApplicationsModal] = useState(null)
  const [infoModal, setInfoModal] = useState(null)
  const [editTeamModal, setEditTeamModal] = useState(null)
  const [profileEditOpen, setProfileEditOpen] = useState(false)
  const [userTagObjects, setUserTagObjects] = useState([]) // { tagId, name }[]

  useEffect(() => {
    function onSessionExpired() {
      navigate('/login', { replace: true, state: { from: '/me' } })
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired)
  }, [navigate])

  async function loadTeams(resolvedUser) {
    const [teamList, hackathonList] = await Promise.all([
      fetchMyTeams(),
      fetchHackathons({ limit: 50 }),
    ])

    const hackathonById = {}
    const hackathonByTitle = {}
    hackathonList.items.forEach((h) => {
      hackathonById[h.id] = h
      if (h.title) hackathonByTitle[h.title] = h
    })

    const baseTeams = teamList.map((t) => {
      const h = hackathonById[t.hackathonId] ?? hackathonByTitle[t.hackathonName] ?? null
      return {
        ...t,
        hackathonId: h?.id ?? t.hackathonId,
        hackathonName: h?.title ?? t.hackathonName,
        hackathonStartDate: h?.startDate ?? null,
        hackathonEndDate: h?.endDate ?? null,
        hackathonStatus: h?.status ?? null,
        hackathonStatusLabel: h?.statusLabel ?? null,
      }
    })

    // 종료된 해커톤만 리더보드 조회
    const endedHackathonIds = [
      ...new Set(
        baseTeams
          .filter((t) => t.hackathonStatus === 'ended')
          .map((t) => t.hackathonId)
          .filter(Boolean),
      ),
    ]

    const leaderboardMap = {}
    if (endedHackathonIds.length > 0) {
      const boards = await Promise.all(
        endedHackathonIds.map((hid) =>
          fetchHackathonLeaderboard(hid)
            .then((board) => ({ hid, board }))
            .catch(() => null),
        ),
      )
      boards.forEach((result) => {
        if (result) leaderboardMap[result.hid] = result.board
      })
    }

    const enrichedTeams = baseTeams.map((t) => {
      const board = leaderboardMap[t.hackathonId]
      const entry = board?.items.find((item) => item.teamName === t.name)
      return {
        ...t,
        teamRank: entry?.rank ?? null,
        teamScore: entry?.score ?? null,
        scoreType: board?.scoreType ?? null,
      }
    })

    setMyTeams(enrichedTeams)

    const currentUser = resolvedUser ?? user
    const leaderTeams = enrichedTeams.filter(
      (t) => Number(t.leaderId) === Number(currentUser?.userId),
    )

    if (leaderTeams.length > 0) {
      const results = await Promise.all(
        leaderTeams.map((t) =>
          fetchTeamApplications(t.id).then((apps) => ({
            teamId: t.id,
            count: apps.filter((a) => a.status === 'PENDING').length,
          })),
        ),
      )
      const counts = {}
      results.forEach(({ teamId, count }) => { counts[teamId] = count })
      setApplicationCounts(counts)
    }

    return enrichedTeams
  }

  useEffect(() => {
    let isMounted = true

    async function loadMyPage() {
      try {
        const [me, tagObjects] = await Promise.all([fetchMe(), fetchUserTags()])
        if (!isMounted) return
        if (me) setUser(me)
        setUserTagObjects(tagObjects)
        await loadTeams(me)
      } catch (err) {
        if (!isMounted) return
        if (err?.status === 401 || err?.message?.includes('401')) {
          navigate('/login', { replace: true, state: { from: '/me' } })
        }
      }
    }

    loadMyPage()

    return () => {
      isMounted = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section className="page-section">
      <section className="mypage-hero">
        <div className="mypage-hero__profile">
          <div className="mypage-hero__avatar">
            {user?.nickname?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="mypage-hero__copy">
            <h1>{user.nickname}</h1>
            <p>{user.email}</p>
            <div className="mypage-hero-tags">
              {(user?.tags ?? []).map((tag) => (
                <span key={tag} className="mypage-hero-tag">{tag}</span>
              ))}
              <button
                type="button"
                className={`mypage-hero-tag ${(user?.tags ?? []).length === 0 ? 'mypage-hero-tag--empty' : 'mypage-hero-tag--edit'}`}
                onClick={() => setProfileEditOpen(true)}
              >
                {(user?.tags ?? []).length === 0 ? '+ 관심 태그 추가' : '+ 편집'}
              </button>
            </div>
          </div>
        </div>

        <div className="mypage-hero__stats">
          <div>
            <span>랭킹 포인트</span>
            <strong>{(user?.points ?? 0).toLocaleString()}</strong>
          </div>
          <div>
            <span>랭킹</span>
            <strong>{(user?.points > 0 && user?.rank != null) ? `#${user.rank}` : '-'}</strong>
          </div>
          <div>
            <span>참가 횟수</span>
            <strong>{user?.joinedHackathons ?? 0}</strong>
          </div>
        </div>

      </section>

      <section className="mypage-card">
        <div className="mypage-tabs">
          <button
            type="button"
            className={`mypage-tab${activeTab === 'teams' ? ' mypage-tab--active' : ''}`}
            onClick={() => setActiveTab('teams')}
          >
            내 팀
          </button>
          <button
            type="button"
            className={`mypage-tab${activeTab === 'history' ? ' mypage-tab--active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            참가 이력
          </button>
        </div>

        {activeTab === 'teams' && (
          <div className="mypage-team-list">
            {myTeams.length === 0 ? (
              <p className="page-description">참가 중인 팀이 없습니다.</p>
            ) : (
              myTeams.map((team) => {
                const isLeader = Number(team.leaderId) === Number(user?.userId)
                return (
                  <article
                    key={team.id}
                    className={`mypage-team-item${isLeader ? ' mypage-team-item--primary' : ''}`}
                  >
                    <div className="mypage-team-item__col mypage-team-item__col--name">
                      <span className={`mypage-role-badge${isLeader ? ' mypage-role-badge--leader' : ''}`}>
                        {isLeader ? '팀장' : '팀원'}
                      </span>
                      <h3>{team.name}</h3>
                    </div>
                    <div className="mypage-team-item__col mypage-team-item__col--hackathon">
                      <p>{team.hackathonName}</p>
                      <span>{team.currentMembers} / {team.maxMembers}명</span>
                    </div>
                    <div className="mypage-team-item__col mypage-team-item__col--actions">
                      {isLeader && (
                        <>
                          <button
                            type="button"
                            className="team-primary-button team-primary-button--small"
                            onClick={() => setApplicationsModal(team)}
                          >
                            신청 관리{applicationCounts[team.id] > 0 ? ` (${applicationCounts[team.id]})` : ''}
                          </button>
                          <button
                            type="button"
                            className="team-secondary-button team-secondary-button--muted"
                            onClick={() => setEditTeamModal(team)}
                          >
                            팀 수정
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        className="team-secondary-button team-secondary-button--muted"
                        onClick={() => setInfoModal(team)}
                      >
                        팀 정보
                      </button>
                    </div>
                  </article>
                )
              })
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="mypage-timeline">
            {myTeams.length === 0 ? (
              <p className="page-description">참가한 해커톤이 없습니다.</p>
            ) : (
              [...myTeams]
                .sort((a, b) => {
                  const order = { ended: 0, closed: 1, open: 2, upcoming: 3 }
                  const oa = order[a.hackathonStatus] ?? 9
                  const ob = order[b.hackathonStatus] ?? 9
                  if (oa !== ob) return oa - ob
                  const da = a.hackathonEndDate ?? a.hackathonStartDate ?? ''
                  const db = b.hackathonEndDate ?? b.hackathonStartDate ?? ''
                  return da.localeCompare(db)
                })
                .map((team) => {
                const status = team.hackathonStatus
                const isDone = status === 'ended'
                const isActive = status === 'closed'

                return (
                  <div key={team.id} className="mypage-timeline-item">
                    <div className="mypage-timeline-item__line">
                      <div className={`mypage-timeline-item__dot${isDone ? ' mypage-timeline-item__dot--done' : isActive ? ' mypage-timeline-item__dot--active' : ''}`} />
                    </div>
                    <div className="mypage-timeline-item__content">
                      <div className="mypage-timeline-item__head">
                        <h3>{team.hackathonName}</h3>
                        <span className={`mypage-timeline-badge mypage-timeline-badge--${status ?? 'closed'}`}>
                          {isDone ? '완료' : isActive ? '심사 중' : status === 'open' ? '모집 중' : team.hackathonStatusLabel ?? '오픈 예정'}
                        </span>
                      </div>
                      <p className="mypage-timeline-item__team">{team.name}</p>
                      <div className="mypage-timeline-item__meta">
                        {(team.hackathonStartDate || team.hackathonEndDate) && (
                          <span className="mypage-timeline-item__date">
                            {team.hackathonStartDate} ~ {team.hackathonEndDate}
                          </span>
                        )}
                        {team.teamRank != null && (
                          <span className="mypage-timeline-item__rank">
                            {team.teamRank}위
                            {team.teamScore != null && ` · ${team.teamScore}점`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </section>

      {applicationsModal && (
        <ApplicationsModal
          team={applicationsModal}
          onClose={() => setApplicationsModal(null)}
          onUpdate={() => loadTeams(user)}
        />
      )}


      {infoModal && (
        <TeamInfoModal
          team={infoModal}
          hackathonName={infoModal.hackathonName}
          onClose={() => setInfoModal(null)}
        />
      )}

      {editTeamModal && (
        <EditTeamModal
          team={editTeamModal}
          onClose={() => setEditTeamModal(null)}
          onSaved={() => loadTeams(user)}
        />
      )}

      {profileEditOpen && (
        <ProfileEditModal
          user={user}
          initialTagObjects={userTagObjects}
          onClose={() => setProfileEditOpen(false)}
          onSave={(newTags, newTagObjects) => {
            setUser((prev) => ({ ...prev, tags: newTags }))
            setUserTagObjects(newTagObjects)
            setProfileEditOpen(false)
          }}
        />
      )}
    </section>
  )
}

export default MyPage
