import { useEffect, useMemo, useState } from 'react'
import { fetchTeams } from '../api/teams.js'
import { teams } from '../mock/teams.js'

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

  useEffect(() => {
    let isMounted = true

    async function loadTeams() {
      setIsLoading(true)

      try {
        const data = await fetchTeams()
        if (!isMounted) return

        if (data.length > 0) {
          setItems(data)
        }
      } catch {
        if (!isMounted) return
        setItems(teams)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadTeams()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredTeams = useMemo(() => {
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
            <article key={team.id} className="team-card">
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
                  {team.isOpen ? '연락하기' : '마감'}
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
                    <select className="form-control" defaultValue="ai-summit-2026">
                      <option value="ai-summit-2026">AI Summit 2026</option>
                      <option value="mobile-craft-day">Mobile CraftDay</option>
                      <option value="web3-buildathon">Web3 Buildathon</option>
                      <option value="independent">해커톤 미정</option>
                    </select>
                  </label>

                  <label className="form-field">
                    <span className="form-label">팀명</span>
                    <input className="form-control" placeholder="예: NeuralNinjas" />
                  </label>

                  <label className="form-field form-field--full">
                    <span className="form-label">팀 소개</span>
                    <textarea
                      className="form-control form-control--textarea"
                      placeholder="무엇을 만들 팀인지, 어떤 팀원을 찾는지 적어주세요."
                    />
                  </label>

                  <label className="form-field form-field--full">
                    <span className="form-label">모집 포지션</span>
                    <input className="form-control" placeholder="예: 백엔드, AI/ML" />
                  </label>

                  <label className="form-field">
                    <span className="form-label">모집 상태</span>
                    <select className="form-control" defaultValue="open">
                      <option value="open">모집 중</option>
                      <option value="closed">마감</option>
                    </select>
                  </label>

                  <label className="form-field">
                    <span className="form-label">연락 링크</span>
                    <input className="form-control" placeholder="오픈채팅, 구글폼 등" />
                  </label>
                </div>
              </section>
            </div>

            <div className="team-create-drawer__footer">
              <button
                type="button"
                className="team-secondary-button team-secondary-button--muted"
                onClick={() => setIsCreateDrawerOpen(false)}
              >
                취소
              </button>
              <button type="button" className="team-primary-button">
                팀 생성 완료
              </button>
            </div>
          </aside>
        </div>
      )}
    </section>
  )
}

export default CampPage
