import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { hackathons } from '../mock/hackathons.js'

const detailTabs = [
  { key: 'overview', label: '개요' },
  { key: 'guide', label: '안내' },
  { key: 'schedule', label: '일정' },
  { key: 'evaluation', label: '평가' },
  { key: 'prize', label: '상금' },
  { key: 'team', label: '팀' },
  { key: 'submit', label: '제출' },
  { key: 'leaderboard', label: '리더보드' },
]

function HackathonDetailPage() {
  const { slug } = useParams()
  const [activeTab, setActiveTab] = useState('overview')
  const [teamState, setTeamState] = useState('notRegistered')
  const [submitState, setSubmitState] = useState('notRegistered')

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

  const activeTeamState = hackathon.teamStates[teamState]

  const renderTabContent = () => {
    if (activeTab === 'overview') {
      return (
        <div className="detail-section__content">
          <p>{hackathon.overview}</p>
          <div className="tag-list">
            {hackathon.tags.map((tag) => (
              <span key={tag} className="tag-chip">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )
    }

    if (activeTab === 'guide') {
      return (
        <div className="stack-list stack-list--compact">
          {hackathon.notices.map((notice) => (
            <div key={notice} className="detail-list-row">
              {notice}
            </div>
          ))}
        </div>
      )
    }

    if (activeTab === 'schedule') {
      return (
        <div className="stack-list stack-list--compact">
          {hackathon.schedules.map((schedule) => (
            <div key={schedule.label} className="detail-list-row row-between">
              <strong>{schedule.label}</strong>
              <span className="meta-text">{schedule.at}</span>
            </div>
          ))}
        </div>
      )
    }

    if (activeTab === 'evaluation') {
      return (
        <div className="card-grid">
          {hackathon.evaluations.map((item) => (
            <div key={item.label} className="surface-card surface-card--soft">
              <p className="meta-text">{item.label}</p>
              <h2>{item.value}</h2>
            </div>
          ))}
        </div>
      )
    }

    if (activeTab === 'prize') {
      return (
        <div className="card-grid">
          {hackathon.prizes.map((prize) => (
            <div key={prize.label} className="surface-card surface-card--soft">
              <p className="meta-text">{prize.label}</p>
              <h2>{prize.value}</h2>
            </div>
          ))}
        </div>
      )
    }

    if (activeTab === 'team') {
      return (
        <div className="stack-list">
          <div className="surface-card surface-card--soft">
            <div className="filter-group" aria-label="팀 상태 미리보기">
              <button
                type="button"
                className={`filter-chip${
                  teamState === 'notRegistered' ? ' filter-chip--active' : ''
                }`}
                onClick={() => setTeamState('notRegistered')}
              >
                미참가
              </button>
              <button
                type="button"
                className={`filter-chip${
                  teamState === 'noTeam' ? ' filter-chip--active' : ''
                }`}
                onClick={() => setTeamState('noTeam')}
              >
                참가 완료 · 팀 없음
              </button>
              <button
                type="button"
                className={`filter-chip${
                  teamState === 'hasTeam' ? ' filter-chip--active' : ''
                }`}
                onClick={() => setTeamState('hasTeam')}
              >
                팀 있음
              </button>
            </div>
          </div>

          <div className="surface-card">
            {'teamName' in activeTeamState ? (
              <>
                <div className="row-between row-between--wrap">
                  <div>
                    <p className="meta-text">내 팀 현황</p>
                    <h2>{activeTeamState.teamName}</h2>
                  </div>
                  <span className="status-pill">{activeTeamState.role}</span>
                </div>
                <div className="card-grid">
                  <div className="surface-card surface-card--soft">
                    <p className="meta-text">현재 팀원</p>
                    <ul className="bullet-list">
                      {activeTeamState.members.map((member) => (
                        <li key={member}>{member}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="surface-card surface-card--soft">
                    <p className="meta-text">모집 포지션</p>
                    {activeTeamState.recruiting.length > 0 ? (
                      <div className="tag-list">
                        {activeTeamState.recruiting.map((position) => (
                          <span key={position} className="tag-chip">
                            {position}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p>현재 추가 모집 중인 포지션이 없습니다.</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="meta-text">팀 탭 상태</p>
                <h2>{activeTeamState.title}</h2>
                <p>{activeTeamState.description}</p>
                <div className="filter-group">
                  <span className="button-link button-link--soft">
                    {activeTeamState.primaryAction}
                  </span>
                  <span className="button-link button-link--ghost">
                    {activeTeamState.secondaryAction}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )
    }

    if (activeTab === 'submit') {
      return (
        <div className="stack-list">
          <div className="surface-card surface-card--soft">
            <div className="filter-group" aria-label="제출 상태 미리보기">
              <button
                type="button"
                className={`filter-chip${
                  submitState === 'notRegistered' ? ' filter-chip--active' : ''
                }`}
                onClick={() => setSubmitState('notRegistered')}
              >
                미참가
              </button>
              <button
                type="button"
                className={`filter-chip${
                  submitState === 'noTeam' ? ' filter-chip--active' : ''
                }`}
                onClick={() => setSubmitState('noTeam')}
              >
                팀 없음
              </button>
              <button
                type="button"
                className={`filter-chip${
                  submitState === 'open' ? ' filter-chip--active' : ''
                }`}
                onClick={() => setSubmitState('open')}
              >
                제출 가능
              </button>
              <button
                type="button"
                className={`filter-chip${
                  submitState === 'closed' ? ' filter-chip--active' : ''
                }`}
                onClick={() => setSubmitState('closed')}
              >
                제출 마감
              </button>
            </div>
          </div>

          <div className="surface-card">
            <p className="meta-text">제출 탭 상태</p>
            <h2>{hackathon.submitStates[submitState]}</h2>
            <div className="surface-card surface-card--soft">
              <p className="meta-text">제출 폼 필드</p>
              <ul className="bullet-list">
                <li>제출 제목</li>
                <li>한 줄 요약</li>
                <li>규칙별 URL / PDF / ZIP 첨부</li>
                <li>팀 소개 및 메모</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }

    if (activeTab === 'leaderboard') {
      return (
        <div className="surface-card">
          {hackathon.leaderboard.length === 0 ? (
            <p>아직 공개된 리더보드가 없습니다.</p>
          ) : (
            <div className="stack-list stack-list--compact">
              {hackathon.leaderboard.map((entry) => (
                <div key={entry.teamName} className="detail-list-row row-between">
                  <strong>
                    #{entry.rank} {entry.teamName}
                  </strong>
                  <span className="meta-text">
                    {entry.submitted
                      ? `${entry.score}점`
                      : '미제출'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <section className="page-section">
      <div>
        <Link to="/hackathons" className="button-back">
          ← 목록으로
        </Link>
      </div>

      <div className="detail-header">
        <p className="eyebrow">/hackathons/{hackathon.slug}</p>
        <h1>{hackathon.title}</h1>
        <p className="page-description">{hackathon.summary}</p>
        <div className="detail-meta">
          <span>{hackathon.period}</span>
          <span>참가자 {hackathon.participantCount}명</span>
          <span>{hackathon.statusLabel}</span>
        </div>
      </div>

      <div className="detail-grid">
        <div className="stack-list">
          <div className="detail-tabs" role="tablist" aria-label="해커톤 상세 탭">
            {detailTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`detail-tab${
                  activeTab === tab.key ? ' detail-tab--active' : ''
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="surface-card detail-panel">{renderTabContent()}</div>
        </div>

        <aside className="stack-list">
          <div className="sidebar-card">
            <h3>진행 정보</h3>
            <div className="info-row">
              <span>상태</span>
              <span>{hackathon.statusLabel}</span>
            </div>
            <div className="info-row">
              <span>기간</span>
              <span>{hackathon.period}</span>
            </div>
            <div className="info-row">
              <span>참가자</span>
              <span>{hackathon.participantCount}명</span>
            </div>
          </div>

          <div className="sidebar-card">
            <h3>빠른 이동</h3>
            <div className="stack-list stack-list--compact">
              <Link to="/camp" className="button-link button-link--ghost sidebar-button">
                팀원 모집 보기
              </Link>
              <Link to="/team-create" className="button-link button-link--soft sidebar-button">
                팀 생성하기
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default HackathonDetailPage
