import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchHackathons } from '../api/hackathons.js'
import { hackathons } from '../mock/hackathons.js'

const statusFilters = [
  { key: 'all', label: '전체' },
  { key: 'open', label: '모집중' },
  { key: 'upcoming', label: '진행중' },
  { key: 'closed', label: '종료' },
]

function HackathonsPage() {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [items, setItems] = useState(hackathons)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadHackathons() {
      setIsLoading(true)

      try {
        const data = await fetchHackathons({
          status: statusFilter === 'all' ? undefined : statusFilter === 'upcoming' ? 'open' : statusFilter,
          q: query.trim() || undefined,
        })
        if (!isMounted) return

        if (data.length > 0) {
          setItems(data)
        } else {
          setItems([])
        }
      } catch {
        if (!isMounted) return
        setItems(hackathons)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadHackathons()

    return () => {
      isMounted = false
    }
  }, [query, statusFilter])

  const filteredHackathons = useMemo(() => {
    if (items !== hackathons) {
      return items
    }

    const normalizedQuery = query.trim().toLowerCase()

    return items.filter((hackathon) => {
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
  }, [items, query, statusFilter])

  return (
    <section className="page-section">
      <div className="page-header">
        <p className="eyebrow">/hackathons</p>
        <h1>해커톤</h1>
        <p className="page-description">
          참가 가능한 모든 해커톤을 확인하세요.
        </p>
      </div>

      <section className="surface-card">
        <div className="toolbar">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="search-input"
            placeholder="제목, 태그 검색... (예: AI/ML, Web)"
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

      {isLoading ? (
        <section className="surface-card empty-panel">
          <p className="empty-panel__title">해커톤 목록을 불러오는 중입니다.</p>
        </section>
      ) : null}

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
            key={hackathon.id ?? hackathon.slug}
            to={`/hackathons/${hackathon.id ?? hackathon.slug}`}
            className="surface-card surface-card--link hackathon-card hackathon-card--list"
          >
            <div className="row-between row-between--start">
              <div className="stack-list stack-list--compact hackathon-card__left">
                <div className="hackathon-card__topline">
                  <span
                    className={`status-outline status-outline--${hackathon.status}`}
                  >
                    {hackathon.status === 'upcoming' ? '진행 중' : hackathon.statusLabel}
                  </span>
                  <h2>{hackathon.title}</h2>
                </div>
                <div className="tag-list" aria-label="해커톤 태그">
                  {hackathon.tags.map((tag) => (
                    <span key={tag} className="tag-chip tag-chip--blue">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="hackathon-card__meta hackathon-card__meta--right">
                <span className="button-action">상세 보기</span>
              </div>
            </div>

            <div className="hackathon-card__footer">
              <div className="meta-cluster">
                <small className="meta-text">{hackathon.startDate} ~ {hackathon.endDate}</small>
                <small className="meta-text">참가자 {hackathon.participantCount}명</small>
                <small className="meta-text">{hackathon.organizer}</small>
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
