import { Link } from 'react-router-dom'

function TeamCreatePage() {
  return (
    <section className="page-section">
      <div>
        <Link to="/hackathons" className="button-back">
          ← 돌아가기
        </Link>
      </div>

      <div className="team-create-wrap">
        <div className="page-header">
          <p className="eyebrow">/team-create</p>
          <h1>팀 생성</h1>
          <p className="page-description">
            해커톤에 함께할 팀을 만들어보세요. 1인 팀도 가능합니다.
          </p>
        </div>

        <div className="team-create-step">
          <div className="step-item">
            <div className="step-num step-num--active">1</div>
            <div className="step-label step-label--active">기본 정보</div>
          </div>
          <div className="step-divider" />
          <div className="step-item">
            <div className="step-num step-num--done">2</div>
            <div className="step-label">모집 설정</div>
          </div>
          <div className="step-divider" />
          <div className="step-item">
            <div className="step-num step-num--upcoming">3</div>
            <div className="step-label">확인</div>
          </div>
        </div>

        <div className="create-layout">
          <div className="stack-list">
            <section className="surface-card surface-card--soft">
              <p className="meta-text">팀 구성 유의사항</p>
              <ul className="bullet-list">
                <li>같은 해커톤에서는 한 팀에만 소속될 수 있습니다.</li>
                <li>팀 생성 후 팀장은 팀 정보와 신청자 상태를 관리합니다.</li>
                <li>연락 링크는 공개 범위를 고려해 입력해야 합니다.</li>
                <li>해커톤과 연결된 팀은 제출 전에 반드시 팀 구성이 완료되어야 합니다.</li>
              </ul>
            </section>

            <section className="surface-card">
              <div className="form-grid">
                <label className="form-field">
                  <span className="form-label">연결할 해커톤</span>
                  <select className="form-control" defaultValue="ai-summit-2026">
                    <option value="ai-summit-2026">AI Summit 2026</option>
                    <option value="mobile-craft-day">Mobile Craft Day</option>
                    <option value="independent">해커톤 없이 팀만 만들기</option>
                  </select>
                </label>

                <label className="form-field">
                  <span className="form-label">팀명</span>
                  <input className="form-control" placeholder="예: Neural Ninjas" />
                </label>

                <label className="form-field form-field--full">
                  <span className="form-label">팀 소개</span>
                  <textarea
                    className="form-control form-control--textarea"
                    placeholder="팀 목표, 만들고 싶은 결과물, 원하는 협업 분위기를 적어주세요."
                  />
                </label>

                <label className="form-field">
                  <span className="form-label">최대 팀원 수</span>
                  <select className="form-control" defaultValue="5">
                    <option value="2">2명</option>
                    <option value="3">3명</option>
                    <option value="4">4명</option>
                    <option value="5">5명</option>
                  </select>
                </label>

                <label className="form-field">
                  <span className="form-label">팀원 모집 여부</span>
                  <select className="form-control" defaultValue="open">
                    <option value="open">모집중</option>
                    <option value="closed">모집 안 함</option>
                  </select>
                </label>

                <label className="form-field form-field--full">
                  <span className="form-label">모집 포지션</span>
                  <input
                    className="form-control"
                    placeholder="예: 백엔드, AI/ML, 디자이너"
                  />
                </label>

                <label className="form-field form-field--full">
                  <span className="form-label">연락 링크</span>
                  <input
                    className="form-control"
                    placeholder="오픈채팅, 구글 폼 등 외부 연락 링크"
                  />
                </label>
              </div>
            </section>
          </div>

          <aside className="stack-list">
            <section className="surface-card">
              <p className="meta-text">입력 확인</p>
              <h2>NeuralNinjas</h2>
              <div className="stack-list stack-list--compact">
                <div className="info-row">
                  <span>연결 해커톤</span>
                  <span>AI Summit 2026</span>
                </div>
                <div className="info-row">
                  <span>최대 인원</span>
                  <span>5명</span>
                </div>
                <div className="info-row">
                  <span>모집 포지션</span>
                  <span>백엔드, AI/ML</span>
                </div>
                <div className="info-row">
                  <span>모집 상태</span>
                  <span className="status-pill status-pill--open">모집중</span>
                </div>
              </div>
            </section>

            <section className="surface-card surface-card--soft">
              <p className="meta-text">생성 후 흐름</p>
              <ul className="bullet-list">
                <li>팀 생성 완료</li>
                <li>해커톤 상세 팀 탭으로 복귀</li>
                <li>필요하면 팀 신청 관리 페이지로 이동</li>
              </ul>
            </section>

            <div className="create-actions">
              <Link to="/camp" className="button-link button-link--ghost">
                모집글 목록으로
              </Link>
              <span className="button-link button-link--soft">팀 생성 완료</span>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}

export default TeamCreatePage
