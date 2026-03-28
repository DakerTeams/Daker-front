import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { hackathons } from '../mock/hackathons.js'

function HackathonDetailPage() {
  const { slug } = useParams()
  const hackathon = useMemo(
    () => hackathons.find((item) => item.slug === slug),
    [slug],
  )

  if (!hackathon) {
    return (
      <section className="page-section">
        <div className="page-header">
          <p className="eyebrow">/hackathons/:slug</p>
          <h1>해커톤을 찾을 수 없습니다.</h1>
          <p className="page-description">
            목록으로 돌아가서 다른 해커톤을 선택해주세요.
          </p>
        </div>
        <Link to="/hackathons" className="button-link">
          해커톤 목록으로
        </Link>
      </section>
    )
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <p className="eyebrow">/hackathons/{hackathon.slug}</p>
        <h1>{hackathon.title}</h1>
        <p className="page-description">{hackathon.summary}</p>
      </div>

      <div className="surface-card">
        <h2>상세 페이지 우선 구성 탭</h2>
        <ul className="bullet-list">
          <li>개요</li>
          <li>안내</li>
          <li>일정</li>
          <li>평가</li>
          <li>상금</li>
          <li>팀</li>
          <li>제출</li>
          <li>리더보드</li>
        </ul>
      </div>

      <div className="card-grid">
        <div className="surface-card">
          <h2>팀 탭 상태</h2>
          <p>미참가 / 참가 완료 + 팀 없음 / 참가 완료 + 팀 있음</p>
        </div>
        <div className="surface-card">
          <h2>제출 탭 상태</h2>
          <p>미참가 / 팀 없음 / 제출 가능 / 제출 마감</p>
        </div>
      </div>
    </section>
  )
}

export default HackathonDetailPage
