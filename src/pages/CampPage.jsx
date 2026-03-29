import { useEffect, useMemo, useState } from 'react'
import { fetchHackathons } from '../api/hackathons.js'
import {
  applyToTeam,
  createTeam,
  deleteTeam,
  fetchMyTeams,
  fetchTeamDetail,
  fetchTeams,
  updateTeam,
} from '../api/teams.js'
import { getStoredUser } from '../lib/auth.js'
import { teams } from '../mock/teams.js'
import { hackathons } from '../mock/hackathons.js'

const openFilters = [
  { key: 'all', label: '전체' },
  { key: 'open', label: '모집중' },
  { key: 'closed', label: '마감' },
]

function CampPage() {
  const [query, setQuery] = useState('')
  const [openFilter, setOpenFilter] = useState('all')
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false)
  const [items, setItems] = useState(teams)
  const [isLoading, setIsLoading] = useState(false)
  const [availableHackathons, setAvailableHackathons] = useState(hackathons)
  const [createForm, setCreateForm] = useState({
    hackathonId: '1',
    name: '',
    description: '',
    isOpen: 'true',
  })
  const [createMessage, setCreateMessage] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [myTeams, setMyTeams] = useState([])
  const [appliedTeamIds, setAppliedTeamIds] = useState([])
  const [teamDetailMessage, setTeamDetailMessage] = useState('')
  const [isApplying, setIsApplying] = useState(false)
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    isOpen: 'true',
  })
  const [editMessage, setEditMessage] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadTeamsAndHackathons() {
      setIsLoading(true)

      try {
        const [teamData, hackathonData, myTeamData] = await Promise.all([
          fetchTeams({
            isOpen:
              openFilter === 'all'
                ? undefined
                : openFilter === 'open',
            q: query.trim() || undefined,
          }),
          fetchHackathons(),
          getStoredUser() ? fetchMyTeams().catch(() => []) : Promise.resolve([]),
        ])
        if (!isMounted) return

        if (teamData.length > 0) {
          setItems(teamData)
        }

        if (hackathonData.length > 0) {
          setAvailableHackathons(hackathonData)
          setCreateForm((current) => ({
            ...current,
            hackathonId: String(hackathonData[0].id),
          }))
        }

        setMyTeams(myTeamData)
      } catch {
        if (!isMounted) return
        setItems(teams)
        setAvailableHackathons(hackathons)
        setMyTeams([])
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadTeamsAndHackathons()

    return () => {
      isMounted = false
    }
  }, [openFilter, query])

  const handleCreateChange = (event) => {
    const { name, value } = event.target
    setCreateForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleCreateSubmit = async () => {
    if (!getStoredUser()) {
      setCreateMessage('로그인 후 팀을 생성할 수 있습니다.')
      return
    }

    setIsCreating(true)
    setCreateMessage('')

    try {
      const created = await createTeam({
        hackathonId: Number(createForm.hackathonId),
        name: createForm.name,
        description: createForm.description,
        isOpen: createForm.isOpen === 'true',
      })

      setItems((current) => [created, ...current])
      setMyTeams((current) => [created, ...current])
      setSelectedTeam(created)
      setCreateMessage('팀이 생성되었습니다. 해커톤 참가도 함께 처리되었습니다.')
      setCreateForm((current) => ({
        ...current,
        name: '',
        description: '',
        isOpen: 'true',
      }))
      setIsCreateDrawerOpen(false)
    } catch {
      setCreateMessage('팀 생성에 실패했습니다. 등록 기간과 입력값을 확인해주세요.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleOpenTeam = async (teamId) => {
    setTeamDetailMessage('')

    try {
      const detail = await fetchTeamDetail(teamId)
      setSelectedTeam(detail)
    } catch {
      const fallbackTeam = items.find((item) => item.id === teamId) ?? null
      setSelectedTeam({
        ...fallbackTeam,
        members: [],
      })
      setTeamDetailMessage('팀 상세 정보를 불러오지 못해 기본 정보만 표시합니다.')
    }
  }

  const handleApply = async () => {
    if (!selectedTeam) return

    if (!getStoredUser()) {
      setTeamDetailMessage('로그인 후 팀 합류 신청을 할 수 있습니다.')
      return
    }

    setIsApplying(true)
    setTeamDetailMessage('')

    try {
      await applyToTeam(selectedTeam.id)
      setAppliedTeamIds((current) =>
        current.includes(selectedTeam.id) ? current : [...current, selectedTeam.id],
      )
      setTeamDetailMessage('합류 신청이 완료되었습니다.')
    } catch {
      setTeamDetailMessage('합류 신청에 실패했습니다. 이미 신청했거나 팀 정원이 찼을 수 있습니다.')
    } finally {
      setIsApplying(false)
    }
  }

  const currentUser = getStoredUser()
  const isMySelectedTeam = selectedTeam
    ? myTeams.some((team) => String(team.id) === String(selectedTeam.id))
    : false
  const selectedLeaderName = selectedTeam?.leader ?? ''
  const isSelectedTeamLeader =
    isMySelectedTeam &&
    Boolean(currentUser) &&
    ((selectedTeam?.leaderId && selectedTeam.leaderId === currentUser.userId) ||
      (currentUser?.nickname && selectedLeaderName === currentUser.nickname))
  const hasAppliedToSelectedTeam = selectedTeam
    ? appliedTeamIds.includes(selectedTeam.id)
    : false

  const filteredTeams = useMemo(() => {
    if (items !== teams) {
      return items
    }

    const normalizedQuery = query.trim().toLowerCase()

    return items.filter((team) => {
      const matchesOpen =
        openFilter === 'all' ||
        (openFilter === 'open' && team.isOpen) ||
        (openFilter === 'closed' && !team.isOpen)

      const matchesQuery =
        normalizedQuery.length === 0 ||
        team.name.toLowerCase().includes(normalizedQuery) ||
        team.hackathonName.toLowerCase().includes(normalizedQuery) ||
        team.positions.some((position) =>
          position.toLowerCase().includes(normalizedQuery),
        )

      return matchesOpen && matchesQuery
    })
  }, [items, openFilter, query])

  return (
    <section className="page-section">
      <div className="page-header">
        <p className="eyebrow">/camp</p>
        <h1>팀원 모집</h1>
        <p className="page-description">
          해커톤별 팀 모집글을 확인하고, 바로 팀을 만들거나 기존 팀에 지원해보세요.
        </p>
      </div>

      <section className="surface-card">
        <div className="row-between row-between--wrap">
          <div className="stack-list stack-list--compact">
            <h2>함께 해커톤을 완주할 팀원을 찾아보세요.</h2>
            <p className="page-description">
              모집 상태와 해커톤별로 필터링해서 원하는 팀을 빠르게 찾을 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            className="button-link"
            onClick={() => setIsCreateDrawerOpen(true)}
          >
            + 팀 생성하기
          </button>
        </div>
      </section>

      <section className="surface-card">
        <div className="toolbar camp-toolbar">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="search-input camp-search-input"
            placeholder="팀명, 포지션, 해커톤명으로 검색"
          />

          <div className="filter-group camp-status-filter" aria-label="모집 상태 필터">
            {openFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                className={`filter-chip${
                  openFilter === filter.key ? ' filter-chip--active' : ''
                }`}
                onClick={() => setOpenFilter(filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {isLoading ? (
        <section className="surface-card empty-panel">
          <p className="empty-panel__title">팀 모집글을 불러오는 중입니다.</p>
        </section>
      ) : null}

      {filteredTeams.length === 0 ? (
        <section className="surface-card empty-panel">
          <p className="empty-panel__title">조건에 맞는 팀 모집글이 없습니다.</p>
          <p className="page-description">
            필터를 조정하거나 새 팀을 직접 만들어보세요.
          </p>
        </section>
      ) : (
        <div className="camp-grid">
          {filteredTeams.map((team) => (
            <article
              key={team.id}
              className="team-card"
              role="button"
              tabIndex={0}
              onClick={() => handleOpenTeam(team.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  handleOpenTeam(team.id)
                }
              }}
            >
              <div className="team-card-head">
                <div>
                  <h2>{team.name}</h2>
                  <p className="team-card__hackathon">🏆 {team.hackathonName}</p>
                </div>
                <span
                  className={`status-outline ${
                    team.isOpen ? 'status-outline--open' : 'status-outline--closed'
                  }`}
                >
                  {team.isOpen ? '모집 중' : '마감'}
                </span>
              </div>

              <p className="team-desc">{team.description}</p>

              <div className="team-positions">
                {team.positions.map((position) => (
                  <span key={position} className="tag-chip">
                    {position}
                  </span>
                ))}
              </div>

              <div className="team-footer">
                <span>팀장: {team.leader}</span>
                <span
                  className={`camp-contact-button ${
                    team.isOpen ? 'camp-contact-button--open' : 'camp-contact-button--closed'
                  }`}
                >
                  {team.isOpen ? '팀 보기' : '마감'}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      {isCreateDrawerOpen && (
        <div
          className="drawer-backdrop"
          role="presentation"
          onClick={() => setIsCreateDrawerOpen(false)}
        >
          <aside
            className="team-create-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-create-drawer-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="team-create-drawer__header">
              <div>
                <p className="eyebrow">new team</p>
                <h2 id="team-create-drawer-title">팀 모집글 작성</h2>
              </div>
              <button
                type="button"
                className="drawer-close-button"
                onClick={() => setIsCreateDrawerOpen(false)}
              >
                닫기
              </button>
            </div>

            <div className="team-create-drawer__body">
              <section className="surface-card surface-card--soft">
                <p className="meta-text">작성 전 체크</p>
                <ul className="bullet-list">
                  <li>한 해커톤에는 1개 팀만 참여할 수 있습니다.</li>
                  <li>개인 참가도 1인 팀 생성으로 처리됩니다.</li>
                  <li>연락 링크는 공개 범위를 고려해 입력해야 합니다.</li>
                </ul>
              </section>

              <section className="surface-card">
                <div className="form-grid">
                  <label className="form-field">
                    <span className="form-label">연결할 해커톤</span>
                    <select
                      className="form-control"
                      name="hackathonId"
                      value={createForm.hackathonId}
                      onChange={handleCreateChange}
                    >
                      {availableHackathons.map((hackathon) => (
                        <option key={hackathon.id} value={hackathon.id}>
                          {hackathon.title}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="form-field">
                    <span className="form-label">팀명</span>
                    <input
                      className="form-control"
                      name="name"
                      value={createForm.name}
                      onChange={handleCreateChange}
                      placeholder="예: NeuralNinjas"
                    />
                  </label>

                  <label className="form-field form-field--full">
                    <span className="form-label">팀 소개</span>
                    <textarea
                      className="form-control form-control--textarea"
                      name="description"
                      value={createForm.description}
                      onChange={handleCreateChange}
                      placeholder="무엇을 만들 팀인지, 어떤 팀원을 찾는지 적어주세요."
                    />
                  </label>

                  <label className="form-field">
                    <span className="form-label">모집 상태</span>
                    <select
                      className="form-control"
                      name="isOpen"
                      value={createForm.isOpen}
                      onChange={handleCreateChange}
                    >
                      <option value="true">모집 중</option>
                      <option value="false">마감</option>
                    </select>
                  </label>
                </div>
              </section>
            </div>

            <div className="team-create-drawer__footer">
              {createMessage ? <p className="meta-text">{createMessage}</p> : null}
              <button
                type="button"
                className="team-secondary-button team-secondary-button--muted"
                onClick={() => setIsCreateDrawerOpen(false)}
              >
                취소
              </button>
              <button type="button" className="team-primary-button" onClick={handleCreateSubmit}>
                {isCreating ? '생성 중...' : '팀 생성 완료'}
              </button>
            </div>
          </aside>
        </div>
      )}

      {selectedTeam && (
        <div
          className="drawer-backdrop"
          role="presentation"
          onClick={() => setSelectedTeam(null)}
        >
          <aside
            className="team-create-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-detail-drawer-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="team-create-drawer__header">
              <div>
                <p className="eyebrow">team detail</p>
                <h2 id="team-detail-drawer-title">{selectedTeam.name}</h2>
              </div>
              <button
                type="button"
                className="drawer-close-button"
                onClick={() => setSelectedTeam(null)}
              >
                닫기
              </button>
            </div>

            <div className="team-create-drawer__body">
              <section className="surface-card">
                <div className="stack-list stack-list--compact">
                  <p className="meta-text">🏆 {selectedTeam.hackathonName}</p>
                  <p>{selectedTeam.description || '팀 소개가 아직 없습니다.'}</p>
                </div>
              </section>

              <section className="surface-card">
                <div className="stack-list stack-list--compact">
                  <div className="info-row">
                    <span>팀장</span>
                    <span>{selectedTeam.leader}</span>
                  </div>
                  <div className="info-row">
                    <span>모집 상태</span>
                    <span>{selectedTeam.isOpen ? '모집 중' : '마감'}</span>
                  </div>
                  <div className="info-row">
                    <span>현재 인원</span>
                    <span>
                      {selectedTeam.currentMembers}/{selectedTeam.maxMembers}
                    </span>
                  </div>
                </div>
              </section>

              <section className="surface-card">
                <p className="meta-text">모집 포지션</p>
                <div className="team-positions">
                  {selectedTeam.positions.length > 0 ? (
                    selectedTeam.positions.map((position) => (
                      <span key={position} className="tag-chip">
                        {position}
                      </span>
                    ))
                  ) : (
                    <span className="meta-text">현재 별도 포지션 정보가 없습니다.</span>
                  )}
                </div>
              </section>

              <section className="surface-card">
                <p className="meta-text">팀원</p>
                <div className="stack-list stack-list--compact">
                  {selectedTeam.members?.length > 0 ? (
                    selectedTeam.members.map((member) => (
                      <div key={member.userId} className="info-row">
                        <span>{member.nickname}</span>
                      </div>
                    ))
                  ) : (
                    <p className="meta-text">팀원 상세 정보는 아직 없습니다.</p>
                  )}
                </div>
              </section>
            </div>

            <div className="team-create-drawer__footer">
              {teamDetailMessage ? <p className="meta-text">{teamDetailMessage}</p> : null}
              <button
                type="button"
                className="team-secondary-button team-secondary-button--muted"
                onClick={() => setSelectedTeam(null)}
              >
                닫기
              </button>
              {isSelectedTeamLeader ? (
                <>
                  <button
                    type="button"
                    className="team-secondary-button team-secondary-button--muted"
                    onClick={() => {
                      setEditForm({
                        name: selectedTeam.name ?? '',
                        description: selectedTeam.description ?? '',
                        isOpen: String(selectedTeam.isOpen ?? true),
                      })
                      setEditMessage('')
                      setIsEditDrawerOpen(true)
                    }}
                  >
                    팀 수정
                  </button>
                  <button
                    type="button"
                    className="team-danger-button"
                    onClick={async () => {
                      try {
                        setIsDeleting(true)
                        await deleteTeam(selectedTeam.id)
                        setItems((current) =>
                          current.filter((team) => String(team.id) !== String(selectedTeam.id)),
                        )
                        setMyTeams((current) =>
                          current.filter((team) => String(team.id) !== String(selectedTeam.id)),
                        )
                        setSelectedTeam(null)
                      } catch {
                        setTeamDetailMessage('팀 삭제에 실패했습니다.')
                      } finally {
                        setIsDeleting(false)
                      }
                    }}
                  >
                    {isDeleting ? '삭제 중...' : '팀 삭제'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="team-primary-button"
                  onClick={handleApply}
                  disabled={!selectedTeam.isOpen || isApplying || hasAppliedToSelectedTeam}
                >
                  {hasAppliedToSelectedTeam
                    ? '신청 완료'
                    : selectedTeam.isOpen
                  ? isApplying
                    ? '신청 중...'
                    : '합류 신청'
                  : '모집 마감'}
                </button>
              )}
            </div>
          </aside>
        </div>
      )}

      {isEditDrawerOpen && selectedTeam ? (
        <div
          className="drawer-backdrop"
          role="presentation"
          onClick={() => setIsEditDrawerOpen(false)}
        >
          <aside
            className="team-create-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-edit-drawer-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="team-create-drawer__header">
              <div>
                <p className="eyebrow">edit team</p>
                <h2 id="team-edit-drawer-title">팀 정보 수정</h2>
              </div>
              <button
                type="button"
                className="drawer-close-button"
                onClick={() => setIsEditDrawerOpen(false)}
              >
                닫기
              </button>
            </div>

            <div className="team-create-drawer__body">
              <section className="surface-card">
                <div className="form-grid">
                  <label className="form-field">
                    <span className="form-label">팀명</span>
                    <input
                      className="form-control"
                      value={editForm.name}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="form-field form-field--full">
                    <span className="form-label">팀 소개</span>
                    <textarea
                      className="form-control form-control--textarea"
                      value={editForm.description}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="form-field">
                    <span className="form-label">모집 상태</span>
                    <select
                      className="form-control"
                      value={editForm.isOpen}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          isOpen: event.target.value,
                        }))
                      }
                    >
                      <option value="true">모집 중</option>
                      <option value="false">마감</option>
                    </select>
                  </label>
                </div>
              </section>
            </div>

            <div className="team-create-drawer__footer">
              {editMessage ? <p className="meta-text">{editMessage}</p> : null}
              <button
                type="button"
                className="team-secondary-button team-secondary-button--muted"
                onClick={() => setIsEditDrawerOpen(false)}
              >
                취소
              </button>
              <button
                type="button"
                className="team-primary-button"
                onClick={async () => {
                  try {
                    setIsSavingEdit(true)
                    setEditMessage('')
                    const updated = await updateTeam(selectedTeam.id, {
                      name: editForm.name,
                      description: editForm.description,
                      isOpen: editForm.isOpen === 'true',
                    })

                    const nextSelectedTeam = {
                      ...selectedTeam,
                      ...updated,
                      description: editForm.description,
                      isOpen: editForm.isOpen === 'true',
                    }

                    setSelectedTeam(nextSelectedTeam)
                    setItems((current) =>
                      current.map((team) =>
                        String(team.id) === String(selectedTeam.id) ? nextSelectedTeam : team,
                      ),
                    )
                    setMyTeams((current) =>
                      current.map((team) =>
                        String(team.id) === String(selectedTeam.id) ? nextSelectedTeam : team,
                      ),
                    )
                    setIsEditDrawerOpen(false)
                  } catch {
                    setEditMessage('팀 수정에 실패했습니다.')
                  } finally {
                    setIsSavingEdit(false)
                  }
                }}
              >
                {isSavingEdit ? '저장 중...' : '저장'}
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  )
}

export default CampPage
