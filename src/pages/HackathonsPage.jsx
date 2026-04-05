import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchHackathons } from "../api/hackathons.js";
import Pagination from "../components/common/Pagination.jsx";

const PAGE_SIZE = 5

const statusFilters = [
  { key: "all", label: "전체" },
  { key: "upcoming", label: "오픈예정" },
  { key: "open", label: "모집중" },
  { key: "closed", label: "진행중" },
];

function HackathonsPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadHackathons() {
      setIsLoading(true);

      try {
        const data = await fetchHackathons({
          status: statusFilter === "all" ? undefined : statusFilter.toUpperCase(),
          q: query.trim() || undefined,
          page,
          size: PAGE_SIZE,
        });
        if (!isMounted) return;

        setItems(data.items);
        setTotalPages(data.totalPages);
      } catch {
        if (!isMounted) return;
        setItems([]);
        setTotalPages(0);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadHackathons();

    return () => {
      isMounted = false;
    };
  }, [query, statusFilter, page]);

  function handleFilterChange(key) {
    setStatusFilter(key);
    setPage(0);
  }

  function handleQueryChange(event) {
    setQuery(event.target.value);
    setPage(0);
  }

  const filteredHackathons = items;

  return (
    <section className="page-section">
      <div className="page-header">
        <p className="eyebrow">/hackathons</p>
        <h1>해커톤 목록</h1>
      </div>

      <section className="surface-card">
        <div className="toolbar">
          <input
            type="search"
            value={query}
            onChange={handleQueryChange}
            className="search-input"
            placeholder="제목, 태그 검색... (예: AI/ML, Web)"
          />

          <div className="filter-group" aria-label="해커톤 상태 필터">
            {statusFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                className={`filter-chip${
                  statusFilter === filter.key ? " filter-chip--active" : ""
                }`}
                onClick={() => handleFilterChange(filter.key)}
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

      {!isLoading && filteredHackathons.length === 0 ? (
        <section className="surface-card empty-panel">
          <p className="empty-panel__title">조건에 맞는 해커톤이 없습니다.</p>
          <p className="page-description">
            검색어를 바꾸거나 상태 필터를 전체로 되돌려보세요.
          </p>
        </section>
      ) : (
        <>
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
                        {hackathon.statusLabel}
                      </span>
                      {hackathon.scoreType === "VOTE" && hackathon.votingOpen && (
                        <span className="status-outline status-outline--voting">
                          투표 진행중
                        </span>
                      )}
                      <h2>{hackathon.title}</h2>
                      {hackathon.tags.length > 0 && (
                        <div className="hackathon-card__tags">
                          {hackathon.tags.map((tag) => (
                            <Fragment key={tag}>
                              <span className="tag-chip tag-chip--blue">{tag}</span>
                            </Fragment>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="hackathon-card__meta hackathon-card__meta--right">
                    <span className="button-action">상세 보기</span>
                  </div>
                </div>

                <div className="hackathon-card__footer">
                  <div className="meta-cluster">
                    <small className="meta-text">
                      {hackathon.startDate} ~ {hackathon.endDate}
                    </small>
                    <small className="meta-text">
                      참가자 {hackathon.participantCount}명
                    </small>
                    <small className="meta-text">{hackathon.organizer}</small>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </section>
  );
}

export default HackathonsPage;
