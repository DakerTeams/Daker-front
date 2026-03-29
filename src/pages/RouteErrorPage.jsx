import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'

function RouteErrorPage() {
  const error = useRouteError()

  let title = '문제가 발생했습니다.'
  let description = '페이지를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.'

  if (isRouteErrorResponse(error)) {
    title = `${error.status} 오류`
    description = error.statusText || description
  } else if (error instanceof Error) {
    description = error.message || description
  }

  return (
    <section className="page-section">
      <div className="surface-card empty-panel">
        <p className="eyebrow">/error</p>
        <h1 className="empty-panel__title">{title}</h1>
        <p className="page-description">{description}</p>
        <div className="team-state-actions">
          <Link to="/" className="team-secondary-button team-secondary-button--muted">
            메인으로
          </Link>
          <button
            type="button"
            className="team-primary-button"
            onClick={() => window.location.reload()}
          >
            다시 시도
          </button>
        </div>
      </div>
    </section>
  )
}

export default RouteErrorPage
