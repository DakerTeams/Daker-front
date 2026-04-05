import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchMyRanking,
  fetchParticipationRankings,
  fetchScoreRankings,
} from '../api/rankings.js'
import { getStoredUser } from '../lib/auth.js'

const periodFilters = [
  { key: 'all', label: '전체 기간' },
  { key: 'month', label: '최근 30일' },
  { key: 'week', label: '최근 7일' },
]

function RankingsPage() {
  const [activeTab, setActiveTab] = useState('score')
  const [period, setPeriod] = useState('all')
  const [scoreRows, setScoreRows] = useState([])
  const [participationRows, setParticipationRows] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [myRankingData, setMyRankingData] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function loadRankings() {
      setIsLoading(true)

      try {
        const [scoreData, participationData] = await Promise.all([
          fetchScoreRankings(period),
          fetchParticipationRankings(period),
        ])

        if (!isMounted) return

        setScoreRows(scoreData)
        setParticipationRows(participationData)
      } catch {
        if (!isMounted) return
        setScoreRows([])
        setParticipationRows([])
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadRankings()

    return () => {
      isMounted = false
    }
  }, [period])

  const currentUser = getStoredUser()

  useEffect(() => {
    if (!getStoredUser()) return
    fetchMyRanking(period)
      .then(setMyRankingData)
      .catch(() => setMyRankingData(null))
  }, [period])

  const myScoreRanking = useMemo(() => scoreRows.find((r) => r.isMe) ?? null, [scoreRows])
  const myParticipationRanking = useMemo(() => participationRows.find((r) => r.isMe) ?? null, [participationRows])

  const myCardScoreRank = myRankingData?.scoreRank?.rank ?? myScoreRanking?.rank ?? null
  const myCardPoints = myRankingData?.scoreRank?.points ?? myScoreRanking?.visibleScore ?? null
  const myCardParticipationRank = myRankingData?.participationRank?.rank ?? myParticipationRanking?.rank ?? null
  const myCardParticipationCount =
    myRankingData?.participationRank?.hackathonCount ??
    myScoreRanking?.participationCount ??
    null

  const scoredRows = useMemo(
    () =>
      scoreRows.map((ranking) => ({
        ...ranking,
        visibleScore: ranking.period?.[period] ?? ranking.score,
      })),
    [period, scoreRows],
  )

  const votingRows = useMemo(() => participationRows, [participationRows])

  const rankIcon = (rank) => `#${rank}`

  function RankingCard({ ranking, stats }) {
    return (
      <div className={`ranking-card${ranking.isMe ? ' ranking-card--me' : ''}`}>
        <div className="ranking-card__rank">#{ranking.rank}</div>
        <div className="ranking-card__avatar">
          {ranking.nickname?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="ranking-card__info">
          <strong className="ranking-card__nickname">{ranking.nickname}</strong>
          {ranking.isMe && <span className="ranking-card__me-badge">나</span>}
        </div>
        <div className="ranking-card__stats">
          {stats.map(({ label, value }) => (
            <div key={label} className="ranking-card__stat">
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function PodiumCard({ ranking, stats }) {
    return (
      <div className={`podium-card podium-card--rank${ranking.rank}${ranking.isMe ? ' podium-card--me' : ''}`}>
        <div className="podium-card__crown">{rankIcon(ranking.rank)}</div>
        <div className="podium-card__avatar">
          {ranking.nickname?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="podium-card__info">
          <strong className="podium-card__nickname">{ranking.nickname}</strong>
          {ranking.isMe && <span className="ranking-card__me-badge">나</span>}
        </div>
        <div className="podium-card__stats">
          {stats.map(({ label, value, highlight }) => (
            <div key={label} className="ranking-card__stat">
              <span>{label}</span>
              <strong className={highlight ? 'ranking-points' : ''}>{value}</strong>
            </div>
          ))}
        </div>
        <div className="podium-card__stand" />
      </div>
    )
  }

  function renderBoard(rows, getStats) {
    if (rows.length === 0) return <p className="rankings-empty">표시할 랭킹이 없습니다.</p>

    const top3 = rows.filter((r) => r.rank <= 3)
    const rest = rows.filter((r) => r.rank > 3)
    // 포디움 순서: 2위 - 1위 - 3위
    const podiumOrder = [
      top3.find((r) => r.rank === 2),
      top3.find((r) => r.rank === 1),
      top3.find((r) => r.rank === 3),
    ].filter(Boolean)

    return (
      <>
        {top3.length > 0 && (
          <div className="podium">
            {podiumOrder.map((r) => (
              <PodiumCard key={r.userId} ranking={r} stats={getStats(r)} />
            ))}
          </div>
        )}
        {rest.length > 0 && (
          <div className="ranking-card-grid">
            {rest.map((r) => (
              <RankingCard key={r.userId} ranking={r} stats={getStats(r)} />
            ))}
          </div>
        )}
      </>
    )
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <p className="eyebrow">/rankings</p>
        <h1>랭킹</h1>
        <p className="page-description">
          점수 기준과 참여 기준을 분리해서 보여줄 페이지입니다.
        </p>
      </div>

      <section className="rank-hero">
        <div>
          <p className="eyebrow">global_rankings.exe</p>
          <h2>글로벌 랭킹</h2>
          <p>전체 해커톤 참가 성과를 기반으로 산정된 랭킹입니다.</p>
        </div>
        <div className="rank-hero__accent">#1</div>
      </section>

      {currentUser ? (
        <section className="my-rank-card">
          <div className="my-rank-card__avatar">
            {currentUser.nickname?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="my-rank-card__profile">
            <strong>{currentUser.nickname}</strong>
            <span>내 랭킹</span>
          </div>
          <div className="my-rank-card__stats">
            <div className="my-rank-card__stat">
              <span>점수 순위</span>
              <strong>{myCardScoreRank != null ? `#${myCardScoreRank}` : '-'}</strong>
            </div>
            <div className="my-rank-card__stat">
              <span>랭킹 포인트</span>
              <strong className="ranking-points">
                {myCardPoints != null ? myCardPoints.toLocaleString() : '-'}
              </strong>
            </div>
            <div className="my-rank-card__stat">
              <span>참여 순위</span>
              <strong>{myCardParticipationRank != null ? `#${myCardParticipationRank}` : '-'}</strong>
            </div>
            <div className="my-rank-card__stat">
              <span>참여 횟수</span>
              <strong>{myCardParticipationCount != null ? `${myCardParticipationCount}회` : '-'}</strong>
            </div>
          </div>
        </section>
      ) : (
        <section className="my-rank-card my-rank-card--guest">
          <p>로그인하면 나의 랭킹을 확인할 수 있습니다.</p>
          <Link to="/login" className="team-primary-button">로그인</Link>
        </section>
      )}

      <div className="filter-group rankings-period-filter" aria-label="랭킹 기간 필터">
        {periodFilters.map((filter) => (
          <button
            key={filter.key}
            type="button"
            className={`filter-chip${
              period === filter.key ? ' filter-chip--active' : ''
            }`}
            onClick={() => setPeriod(filter.key)}
          >
            {period === filter.key ? '◉ ' : '• '}
            {filter.label}
          </button>
        ))}
      </div>

      <section className="rankings-board">
        <div className="rankings-board__tabs" role="tablist" aria-label="랭킹 기준 탭">
          <button
            type="button"
            className={`rankings-board__tab${activeTab === 'score' ? ' rankings-board__tab--active' : ''}`}
            onClick={() => setActiveTab('score')}
          >
            점수 기준
          </button>
          <button
            type="button"
            className={`rankings-board__tab${activeTab === 'participation' ? ' rankings-board__tab--active' : ''}`}
            onClick={() => setActiveTab('participation')}
          >
            참여 기준
          </button>
        </div>

        <div className="rankings-board__body">
          {isLoading ? (
            <p className="rankings-empty">불러오는 중...</p>
          ) : activeTab === 'score' ? (
            renderBoard(scoredRows, (r) => [
              { label: '포인트', value: r.visibleScore.toLocaleString(), highlight: true },
              { label: '참여', value: `${r.participationCount}회` },
              { label: '최고 순위', value: r.bestRank ?? '-' },
            ])
          ) : (
            renderBoard(votingRows, (r) => [
              { label: '참여', value: `${r.participationCount}회` },
              { label: '완료', value: `${r.completedCount}회` },
              { label: '제출률', value: r.submitRate },
            ])
          )}
        </div>
      </section>
    </section>
  )
}

export default RankingsPage
