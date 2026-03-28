import { Link } from 'react-router-dom'

function MainPage() {
  return (
    <section className="page-section">
      <div className="page-header">
        <p className="eyebrow">Hackathon Platform</p>
        <h1>와이어프레임을 프론트 구조로 옮기는 단계입니다.</h1>
        <p className="page-description">
          메인, 해커톤 목록, 상세, 팀원 모집, 랭킹 흐름을 우선 페이지 단위로 정리합니다.
        </p>
      </div>

      <div className="card-grid">
        <Link to="/hackathons" className="surface-card surface-card--link">
          <h2>해커톤 둘러보기</h2>
          <p>해커톤 목록과 상세 페이지 와이어프레임을 먼저 옮깁니다.</p>
        </Link>
        <Link to="/camp" className="surface-card surface-card--link">
          <h2>팀 찾기</h2>
          <p>팀원 모집 목록과 팀 생성 흐름을 분리해서 정리합니다.</p>
        </Link>
        <Link to="/rankings" className="surface-card surface-card--link">
          <h2>랭킹 보기</h2>
          <p>리더보드와 전체 랭킹 화면 구조를 후순위로 연결합니다.</p>
        </Link>
      </div>
    </section>
  )
}

export default MainPage
