import { useMemo, useState } from 'react'
import { rankings } from '../mock/rankings.js'

const periodFilters = [
  { key: 'all', label: '전체' },
  { key: 'month', label: '이번 달' },
  { key: 'week', label: '이번 주' },
]

function RankingsPage() {
  const [activeTab, setActiveTab] = useState('score')
  const [period, setPeriod] = useState('all')

  const myRanking = useMemo(
    () => rankings.find((ranking) => ranking.isMe),
    [],
  )

  return (
    <section className="page-section">
      <div className="page-header">
        <p className="eyebrow">/rankings</p>
        <h1>랭킹</h1>
        <p className="page-description">
          점수 기준과 참여 기준을 분리해서 보여줄 페이지입니다.
        </p>
      </div>

      <section className="ranking-hero">
        <div className="surface-card">
          <p className="meta-text">내 랭킹</p>
          <div className="ranking-hero__value">
            <strong>#{myRanking?.rank}</strong>
            <span>{myRanking?.nickname}</span>
          </div>
          <p className="page-description">
            점수 {myRanking?.score.toLocaleString()}점 · 참여 {myRanking?.participationCount}회
          </p>
        </div>

        <div className="surface-card surface-card--soft">
          <p className="meta-text">기간 필터</p>
          <div className="filter-group" aria-label="랭킹 기간 필터">
            {periodFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                className={`filter-chip${
                  period === filter.key ? ' filter-chip--active' : ''
                }`}
                onClick={() => setPeriod(filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <p className="page-description">
            현재는 와이어프레임 단계라 실제 데이터 대신 더미 데이터를 사용합니다.
          </p>
        </div>
      </section>

      <section className="surface-card">
        <div className="detail-tabs" role="tablist" aria-label="랭킹 기준 탭">
          <button
            type="button"
            className={`detail-tab${activeTab === 'score' ? ' detail-tab--active' : ''}`}
            onClick={() => setActiveTab('score')}
          >
            점수 기준
          </button>
          <button
            type="button"
            className={`detail-tab${
              activeTab === 'participation' ? ' detail-tab--active' : ''
            }`}
            onClick={() => setActiveTab('participation')}
          >
            참여 기준
          </button>
        </div>

        {activeTab === 'score' ? (
          <div className="ranking-table">
            <div className="ranking-table__head">
              <span>#</span>
              <span>닉네임</span>
              <span>포인트</span>
            </div>
            <div className="stack-list stack-list--compact">
              {rankings.map((ranking) => (
                <div
                  key={ranking.userId}
                  className={`ranking-row${ranking.isMe ? ' ranking-row--me' : ''}`}
                >
                  <strong>#{ranking.rank}</strong>
                  <span>{ranking.nickname}</span>
                  <strong>{ranking.score.toLocaleString()} pts</strong>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="ranking-table">
            <div className="ranking-table__head ranking-table__head--wide">
              <span>#</span>
              <span>닉네임</span>
              <span>참여 횟수</span>
              <span>완료</span>
              <span>제출률</span>
            </div>
            <div className="stack-list stack-list--compact">
              {rankings.map((ranking) => (
                <div
                  key={ranking.userId}
                  className={`ranking-row ranking-row--wide${
                    ranking.isMe ? ' ranking-row--me' : ''
                  }`}
                >
                  <strong>#{ranking.rank}</strong>
                  <span>{ranking.nickname}</span>
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
