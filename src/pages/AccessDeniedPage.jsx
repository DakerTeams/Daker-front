import { Link } from 'react-router-dom'

function AccessDeniedPage() {
  return (
    <section className="page-section">
      <div className="surface-card empty-panel">
        <p className="eyebrow">/access-denied</p>
        <h1 className="empty-panel__title">접근 권한이 없습니다.</h1>
        <p className="page-description">
          현재 계정으로는 이 페이지에 접근할 수 없습니다. 권한이 필요한 경우 관리자에게
          문의하세요.
        </p>
        <div className="team-state-actions">
          <Link to="/" className="team-secondary-button team-secondary-button--muted">
            메인으로
          </Link>
          <Link to="/hackathons" className="team-primary-button">
            해커톤 보기
          </Link>
        </div>
      </div>
    </section>
  )
}

export default AccessDeniedPage
