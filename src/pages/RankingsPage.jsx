import { useMemo, useState } from 'react'
import { rankings } from '../mock/rankings.js'

const periodFilters = [
  { key: 'all', label: '전체 기간' },
  { key: 'month', label: '최근 30일' },
  { key: 'week', label: '최근 7일' },
]

function RankingsPage() {
  const [activeTab, setActiveTab] = useState('score')
  const [period, setPeriod] = useState('all')

  const myRanking = useMemo(
    () => rankings.find((ranking) => ranking.isMe),
    [],
  )

  const rows = useMemo(
    () =>
      rankings.map((ranking) => ({
        ...ranking,
        visibleScore: ranking.period?.[period] ?? ranking.score,
      })),
    [period],
  )

  const rankIcon = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return rank
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
            className={`rankings-board__tab${
              activeTab === 'score' ? ' rankings-board__tab--active' : ''
            }`}
            onClick={() => setActiveTab('score')}
          >
            순위 기준
          </button>
          <button
            type="button"
            className={`rankings-board__tab${
              activeTab === 'participation' ? ' rankings-board__tab--active' : ''
            }`}
            onClick={() => setActiveTab('participation')}
          >
            참여 기준
          </button>
        </div>

        {activeTab === 'score' ? (
          <div className="ranking-table ranking-table--board">
            <div className="ranking-table__head ranking-table__head--board">
              <span>순위</span>
              <span>닉네임</span>
              <span>참여 횟수</span>
              <span>최고 순위</span>
              <span>포인트</span>
            </div>
            <div className="ranking-table__rows">
              {rows.map((ranking) => (
                <div
                  key={ranking.userId}
                  className={`ranking-row ranking-row--board${
                    ranking.isMe ? ' ranking-row--me' : ''
                  }`}
                >
                  <strong>{rankIcon(ranking.rank)}</strong>
                  <strong>{ranking.nickname}</strong>
                  <span>{ranking.participationCount}회</span>
                  <span>{ranking.bestRank}</span>
                  <strong className="ranking-points">
                    {ranking.visibleScore.toLocaleString()}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="ranking-table ranking-table--board">
            <div className="ranking-table__head ranking-table__head--board ranking-table__head--participation">
              <span>순위</span>
              <span>닉네임</span>
              <span>참여 횟수</span>
              <span>완료</span>
              <span>제출률</span>
            </div>
            <div className="ranking-table__rows">
              {rows.map((ranking) => (
                <div
                  key={ranking.userId}
                  className={`ranking-row ranking-row--board ranking-row--participation${
                    ranking.isMe ? ' ranking-row--me' : ''
                  }`}
                >
                  <strong>{rankIcon(ranking.rank)}</strong>
                  <strong>{ranking.nickname}</strong>
                  <span>{ranking.participationCount}회</span>
                  <span>{ranking.completedCount}회</span>
                  <strong>{ranking.submitRate}</strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </section>
  )
}

export default RankingsPage
