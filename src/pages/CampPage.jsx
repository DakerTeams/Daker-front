import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { teams } from '../mock/teams.js'

const hackathonFilters = [
  { key: 'all', label: '전체' },
  { key: 'ai-summit-2026', label: 'AI Summit 2026' },
  { key: 'mobile-craft-day', label: 'Mobile Craft Day' },
  { key: 'independent', label: '해커톤 미정' },
]

const openFilters = [
  { key: 'all', label: '전체 상태' },
  { key: 'open', label: '모집중' },
  { key: 'closed', label: '마감' },
]

function CampPage() {
  const [query, setQuery] = useState('')
  const [hackathonFilter, setHackathonFilter] = useState('all')
  const [openFilter, setOpenFilter] = useState('all')

  const filteredTeams = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return teams.filter((team) => {
      const matchesHackathon =
        hackathonFilter === 'all' || team.hackathonSlug === hackathonFilter

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

      return matchesHackathon && matchesOpen && matchesQuery
    })
  }, [hackathonFilter, openFilter, query])

  return (
    <section className="page-section">
      <div className="page-header">
        <p className="eyebrow">/camp</p>
        <h1>팀원 모집</h1>
        <p className="page-description">
          팀 탐색은 이 페이지에서, 실제 팀 생성은 별도 페이지에서 진행하는 구조입니다.
        </p>
      </div>

      <section className="surface-card">
        <div className="row-between row-between--wrap">
          <div className="stack-list stack-list--compact">
            <h2>팀을 직접 찾거나 새 팀을 만들 수 있습니다.</h2>
            <p className="page-description">
              해커톤별 팀을 필터링해서 탐색하고, 필요하면 팀 생성 페이지로 이동합니다.
            </p>
          </div>
          <Link to="/team-create" className="button-link">
            + 팀 만들기
          </Link>
        </div>
      </section>

      <section className="surface-card">
        <div className="toolbar toolbar--stack">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="search-input"
            placeholder="팀명, 포지션, 해커톤명으로 검색"
          />

          <div className="filter-cluster">
            <div className="filter-group" aria-label="해커톤 필터">
              {hackathonFilters.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  className={`filter-chip${
                    hackathonFilter === filter.key ? ' filter-chip--active' : ''
                  }`}
                  onClick={() => setHackathonFilter(filter.key)}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="filter-group" aria-label="모집 상태 필터">
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
        </div>
      </section>

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
            <article key={team.id} className="surface-card camp-card">
              <div className="row-between row-between--wrap">
                <div>
                  <p className="meta-text">{team.hackathonName}</p>
                  <h2>{team.name}</h2>
                </div>
                <span
                  className={`status-pill ${
                    team.isOpen ? 'status-pill--open' : 'status-pill--closed'
                  }`}
                >
                  {team.isOpen ? '모집중' : '마감'}
                </span>
              </div>

              <p>{team.description}</p>

              <div className="tag-list">
                {team.positions.map((position) => (
                  <span key={position} className="tag-chip">
                    {position}
                  </span>
                ))}
              </div>

              <div className="camp-card__meta">
                <span>팀장 {team.leader}</span>
                <span>
                  팀원 {team.currentMembers}/{team.maxMembers}
                </span>
              </div>

              <div className="camp-card__actions">
                <span className="button-link button-link--ghost">상세 보기</span>
                <span
                  className={`button-link ${
                    team.isOpen ? 'button-link--soft' : 'button-link--disabled'
                  }`}
                >
                  {team.isOpen ? `${team.contactLabel} 연락하기` : '모집 마감'}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default CampPage
