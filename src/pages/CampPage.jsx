import { teams } from '../mock/teams.js'

function CampPage() {
  return (
    <section className="page-section">
      <div className="page-header">
        <p className="eyebrow">/camp</p>
        <h1>팀원 모집</h1>
        <p className="page-description">
          팀 탐색과 팀 생성 흐름을 분리해두는 페이지입니다.
        </p>
      </div>

      <div className="stack-list">
        {teams.map((team) => (
          <article key={team.id} className="surface-card">
            <div className="row-between">
              <h2>{team.name}</h2>
              <span className="status-pill">{team.isOpen ? '모집중' : '마감'}</span>
            </div>
            <p>{team.description}</p>
            <small className="meta-text">
              {team.hackathonName} · {team.positions.join(', ')}
            </small>
          </article>
        ))}
      </div>
    </section>
  )
}

export default CampPage
