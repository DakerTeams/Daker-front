import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { hackathons } from '../mock/hackathons.js'
import { teams } from '../mock/teams.js'

const detailTabs = [
  { key: 'overview', label: '개요' },
  { key: 'schedule', label: '일정' },
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
  const [isTeamNoticeOpen, setIsTeamNoticeOpen] = useState(false)

  const hackathon = useMemo(
    () => hackathons.find((item) => item.slug === slug),
    [slug],
  )

  const participantTeams = useMemo(
    () => teams.filter((team) => team.hackathonSlug === slug),
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
          <section className="detail-block">
            <h2 className="detail-block__title">대회 개요</h2>
            <p className="detail-description">{hackathon.overview}</p>
          </section>

          <section className="detail-block">
            <h2 className="detail-block__title">평가 기준</h2>
            <div className="detail-score-table">
              <div className="detail-score-row detail-score-row--head">
                <span>평가 항목</span>
                <span>비중</span>
              </div>
              {hackathon.evaluations.map((item) => (
                <div key={item.label} className="detail-score-row">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </section>
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
        <div className="stack-list team-tab-layout">
          <div className="team-state-switcher" aria-label="팀 상태 미리보기">
            <span className="team-state-switcher__label">데모 상태 :</span>
            <div className="filter-group">
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

          {teamState === 'notRegistered' && (
            <div className="team-state-card team-state-card--locked">
              <div className="team-state-card__icon">🔒</div>
              <h2 className="team-state-card__title">
                해커톤에 먼저 신청해야 합니다
              </h2>
              <p className="team-state-card__description">
                팀을 구성하려면 먼저 이 해커톤에 참가 신청을 해야 해요.
              </p>
              <p className="team-state-card__description">
                신청 후 팀을 생성하거나 기존 팀에 합류할 수 있어요.
              </p>
              <button
                type="button"
                className="team-primary-button"
                onClick={() => setTeamState('noTeam')}
              >
                지금 참가 신청하기
              </button>
            </div>
          )}

          {teamState === 'noTeam' && (
            <div className="team-state-card team-state-card--ready">
              <div className="team-state-card__icon">🤝</div>
              <h2 className="team-state-card__title">
                참가 신청 완료! 이제 팀을 만들어보세요
              </h2>
              <p className="team-state-card__description">
                팀 없이는 제출할 수 없어요. 1인 팀도 가능하니 먼저 팀을 생성해
                주세요.
              </p>
              <p className="team-state-card__description">
                팀원 모집 페이지에서 다른 팀에 합류할 수도 있어요.
              </p>
              <div className="team-state-actions">
                <button
                  type="button"
                  className="team-primary-button"
                  onClick={() => setIsTeamNoticeOpen(true)}
                >
                  + 팀 생성하기
                </button>
                <Link to="/camp" className="team-secondary-button">
                  기존 팀 찾기 →
                </Link>
              </div>
            </div>
          )}

          {teamState === 'hasTeam' && (
            <>
              <section className="my-team-panel">
                <div className="my-team-panel__header">
                  <div>
                    <h2 className="my-team-panel__title">NeuralNinjas</h2>
                    <p className="my-team-panel__meta">내 팀 · 팀장</p>
                  </div>
                  <div className="my-team-panel__badges">
                    <span className="status-outline status-outline--open">
                      모집 중
                    </span>
                    <button type="button" className="team-primary-button team-primary-button--small">
                      신청 관리 (3)
                    </button>
                  </div>
                </div>

                <div className="my-team-panel__section">
                  <p className="my-team-panel__label">팀원 4명</p>
                  <ul className="my-team-members">
                    <li className="my-team-member">
                      <span className="my-team-member__dot my-team-member__dot--active" />
                      <strong>jinwoo_k</strong>
                      <span className="team-role-badge">팀장</span>
                    </li>
                    <li className="my-team-member">
                      <span className="my-team-member__dot" />
                      <strong>minhyun99</strong>
                      <span className="my-team-member__role">디자이너</span>
                    </li>
                    <li className="my-team-member">
                      <span className="my-team-member__dot" />
                      <strong>dart_joon</strong>
                      <span className="my-team-member__role">프론트엔드</span>
                    </li>
                    <li className="my-team-member">
                      <span className="my-team-member__dot" />
                      <strong>ethereal_dev</strong>
                      <span className="my-team-member__role">백엔드</span>
                    </li>
                  </ul>
                </div>

                <div className="my-team-panel__actions">
                  <button type="button" className="team-secondary-button team-secondary-button--muted">
                    팀 정보 수정
                  </button>
                  <button type="button" className="team-danger-button">
                    모집 마감
                  </button>
                </div>
              </section>

              <section className="detail-block">
                <h2 className="detail-block__title">참가 팀 현황</h2>
                <div className="participant-team-table">
                  <div className="participant-team-table__head">
                    <span>팀명</span>
                    <span>팀장</span>
                    <span>팀원 수</span>
                    <span>상태</span>
                  </div>
                  {participantTeams.map((team) => (
                    <div key={team.id} className="participant-team-table__row">
                      <div className="participant-team-table__team">
                        <strong>{team.name}</strong>
                        {team.name === 'Neural Ninjas' && (
                          <span className="team-role-badge">내 팀</span>
                        )}
                      </div>
                      <span>{team.leader}</span>
                      <span>{team.currentMembers}명</span>
                      <span
                        className={`status-outline ${
                          team.isOpen
                            ? 'status-outline--open'
                            : 'status-outline--closed'
                        }`}
                      >
                        {team.isOpen ? '모집 중' : '마감'}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
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
        <div className="tag-list">
          <span className={`status-outline status-outline--${hackathon.status}`}>
            {hackathon.status === 'upcoming' ? '진행 중' : hackathon.statusLabel}
          </span>
          {hackathon.tags.map((tag) => (
            <span key={tag} className="tag-chip tag-chip--blue">
              {tag}
            </span>
          ))}
        </div>
        <h1>{hackathon.title}</h1>
        <div className="detail-meta">
          <span>{hackathon.organizer}</span>
          <span>{hackathon.startDate} ~ {hackathon.endDate}</span>
          <span>참가자 {hackathon.participantCount}명</span>
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
            <h3>대회 정보</h3>
            <div className="info-row">
              <span>주최</span>
              <span>{hackathon.organizer}</span>
            </div>
            <div className="info-row">
              <span>시작일</span>
              <span>{hackathon.startDate}</span>
            </div>
            <div className="info-row">
              <span>종료일</span>
              <span>{hackathon.endDate}</span>
            </div>
            <div className="info-row">
              <span>참가자</span>
              <span>{hackathon.participantCount}명</span>
            </div>
            <div className="info-row">
              <span>상태</span>
              <span>{hackathon.status === 'upcoming' ? '진행 중' : hackathon.statusLabel}</span>
            </div>
            <button type="button" className="detail-apply-button">
              지금 참가 신청
            </button>
          </div>

          <div className="sidebar-card">
            <h3>최고 상금</h3>
            <div className="detail-prize-card">
              <strong>{hackathon.prizes[0]?.value}</strong>
              <span>대상</span>
            </div>
          </div>
        </aside>
      </div>

      {isTeamNoticeOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setIsTeamNoticeOpen(false)}
        >
          <div
            className="team-notice-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-notice-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="team-notice-title">팀 구성 유의사항</h2>
            <ul className="team-notice-list">
              <li>한 해커톤에 1개 팀만 참여할 수 있습니다.</li>
              <li>팀 생성 후 24시간 이내에 최소 2명 이상의 팀원이 필요합니다.</li>
              <li>팀 구성이 완료되면 팀원 변경이 제한될 수 있습니다.</li>
              <li>팀장만 제출 권한을 가집니다.</li>
            </ul>
            <p className="team-notice-copy">
              위 사항을 확인하셨으면 팀 생성 페이지로 이동합니다.
            </p>
            <div className="team-notice-actions">
              <button
                type="button"
                className="team-secondary-button team-secondary-button--muted"
                onClick={() => setIsTeamNoticeOpen(false)}
              >
                취소
              </button>
              <Link
                to="/team-create"
                className="team-primary-button"
                onClick={() => setIsTeamNoticeOpen(false)}
              >
                확인, 팀 생성 페이지로
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default HackathonDetailPage
