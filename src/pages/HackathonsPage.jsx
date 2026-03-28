import { Link } from 'react-router-dom'
import { hackathons } from '../mock/hackathons.js'

function HackathonsPage() {
  return (
    <section className="page-section">
      <div className="page-header">
        <p className="eyebrow">/hackathons</p>
        <h1>해커톤 목록</h1>
        <p className="page-description">
          상태 배지, 기간, 태그, 상세 이동 흐름을 먼저 정리하는 페이지입니다.
        </p>
      </div>

      <div className="stack-list">
        {hackathons.map((hackathon) => (
          <Link
            key={hackathon.slug}
            to={`/hackathons/${hackathon.slug}`}
            className="surface-card surface-card--link"
          >
            <div className="row-between">
              <h2>{hackathon.title}</h2>
              <span className="status-pill">{hackathon.status}</span>
            </div>
            <p>{hackathon.summary}</p>
            <small className="meta-text">
              {hackathon.period} · {hackathon.tags.join(', ')}
            </small>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default HackathonsPage
