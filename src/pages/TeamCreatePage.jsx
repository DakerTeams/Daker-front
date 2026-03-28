function TeamCreatePage() {
  return (
    <section className="page-section">
      <div className="page-header">
        <p className="eyebrow">/team-create</p>
        <h1>팀 생성</h1>
        <p className="page-description">
          유의사항 확인 후 팀명, 소개, 모집 포지션, 연락 링크를 입력하는 화면입니다.
        </p>
      </div>

      <div className="surface-card">
        <h2>필수 입력 항목</h2>
        <ul className="bullet-list">
          <li>연결할 해커톤</li>
          <li>팀명</li>
          <li>팀 소개</li>
          <li>최대 팀원 수</li>
          <li>모집 포지션</li>
          <li>연락 링크</li>
        </ul>
      </div>
    </section>
  )
}

export default TeamCreatePage
