import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { hackathons } from '../mock/hackathons.js'

const statusFilters = [
  { key: 'all', label: '전체' },
  { key: 'open', label: '모집중' },
  { key: 'upcoming', label: '오픈예정' },
  { key: 'closed', label: '마감' },
]

function HackathonsPage() {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredHackathons = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return hackathons.filter((hackathon) => {
      const matchesStatus =
        statusFilter === 'all' || hackathon.status === statusFilter

      const matchesQuery =
        normalizedQuery.length === 0 ||
        hackathon.title.toLowerCase().includes(normalizedQuery) ||
        hackathon.summary.toLowerCase().includes(normalizedQuery) ||
        hackathon.tags.some((tag) =>
          tag.toLowerCase().includes(normalizedQuery),
        )

      return matchesStatus && matchesQuery
    })
  }, [query, statusFilter])

  return (
    <section className="page-section">
      <div className="page-header">
        <p className="eyebrow">/hackathons</p>
        <h1>해커톤 목록</h1>
        <p className="page-description">
          검색, 상태 필터, 카드 메타 정보를 포함한 목록 와이어프레임입니다.
        </p>
      </div>

      <section className="surface-card">
        <div className="toolbar">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="search-input"
            placeholder="해커톤명, 요약, 태그로 검색"
          />

          <div className="filter-group" aria-label="해커톤 상태 필터">
            {statusFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                className={`filter-chip${
                  statusFilter === filter.key ? ' filter-chip--active' : ''
                }`}
                onClick={() => setStatusFilter(filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {filteredHackathons.length === 0 ? (
        <section className="surface-card empty-panel">
          <p className="empty-panel__title">조건에 맞는 해커톤이 없습니다.</p>
          <p className="page-description">
            검색어를 바꾸거나 상태 필터를 전체로 되돌려보세요.
          </p>
        </section>
      ) : (
        <div className="stack-list">
          {filteredHackathons.map((hackathon) => (
          <Link
            key={hackathon.slug}
            to={`/hackathons/${hackathon.slug}`}
            className="surface-card surface-card--link hackathon-card"
          >
            <div className="row-between row-between--start">
              <div className="stack-list stack-list--compact">
                <div className="row-between row-between--wrap">
                  <h2>{hackathon.title}</h2>
                  <span
                    className={`status-pill status-pill--${hackathon.status}`}
                  >
                    {hackathon.statusLabel}
                  </span>
                </div>
                <p>{hackathon.summary}</p>
              </div>

              <div className="hackathon-card__meta">
                <span>{hackathon.startDate}</span>
                <span>{hackathon.endDate}</span>
              </div>
            </div>

            <div className="hackathon-card__footer">
              <div className="tag-list" aria-label="해커톤 태그">
                {hackathon.tags.map((tag) => (
                  <span key={tag} className="tag-chip">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="meta-cluster">
                <small className="meta-text">{hackathon.period}</small>
                <small className="meta-text">
                  참가자 {hackathon.participantCount}명
                </small>
              </div>
            </div>
          </Link>
          ))}
        </div>
      )}
    </section>
  )
}

export default HackathonsPage
