import { rankings } from '../mock/rankings.js'

function RankingsPage() {
  return (
    <section className="page-section">
      <div className="page-header">
        <p className="eyebrow">/rankings</p>
        <h1>랭킹</h1>
        <p className="page-description">
          점수 기준과 참여 기준을 분리해서 보여줄 페이지입니다.
        </p>
      </div>

      <div className="surface-card">
        <h2>점수 기준</h2>
        <div className="stack-list stack-list--compact">
          {rankings.map((ranking) => (
            <div key={ranking.userId} className="row-between">
              <strong>
                #{ranking.rank} {ranking.nickname}
              </strong>
              <span>{ranking.score.toLocaleString()} pts</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default RankingsPage
