import { useMemo, useState } from 'react'
import { judgeHackathons } from '../mock/judge.js'

function JudgePage() {
  const [selectedSlug, setSelectedSlug] = useState(judgeHackathons[0].slug)
  const [scoreMap, setScoreMap] = useState(() =>
    Object.fromEntries(
      judgeHackathons
        .filter((item) => item.mode === 'score')
        .flatMap((item) =>
          item.teams.map((team) => [
            team.name,
            Object.fromEntries(
              item.criteria.map((criterion, index) => [
                criterion.label,
                team.scoreValues[index],
              ]),
            ),
          ]),
        ),
    ),
  )

  const selectedHackathon = useMemo(
    () => judgeHackathons.find((item) => item.slug === selectedSlug) ?? judgeHackathons[0],
    [selectedSlug],
  )

  const updateScore = (teamName, criterionLabel, value) => {
    setScoreMap((current) => ({
      ...current,
      [teamName]: {
        ...current[teamName],
        [criterionLabel]: Number(value),
      },
    }))
  }

  const renderScoreMode = () => (
    <>
      <div className="row-between row-between--wrap">
        <h2 className="judge-section-title">팀별 점수 입력</h2>
        <p className="judge-progress-copy">
          심사 완료: {selectedHackathon.completedCount} / {selectedHackathon.totalCount}팀
        </p>
      </div>

      <div className="judge-card-list">
        {selectedHackathon.teams.map((team, teamIndex) => {
          const values = scoreMap[team.name] ?? {}
          const average =
            selectedHackathon.criteria.reduce(
              (accumulator, criterion) =>
                accumulator +
                ((values[criterion.label] ?? 0) * criterion.weight) / 100,
              0,
            )

          return (
            <article key={team.name} className="judge-score-card">
              <div className="judge-score-card__header">
                <div>
                  <h3>{team.name}</h3>
                  <p>
                    팀장: {team.leader} <span>·</span> 제출: {team.submittedAt}
                  </p>
                </div>
                <div className="admin-inline-actions">
                  <span
                    className={`judge-status judge-status--${
                      team.statusType === 'done' ? 'done' : 'pending'
                    }`}
                  >
                    {team.status}
                  </span>
                  <button type="button" className="team-secondary-button team-secondary-button--muted">
                    파일 보기
                  </button>
                </div>
              </div>

              {teamIndex === 0 ? (
                <>
                  <div className="judge-score-grid">
                    {selectedHackathon.criteria.map((criterion) => (
                      <div key={criterion.label} className="judge-score-row">
                        <div className="judge-score-row__meta">
                          <strong>{criterion.label}</strong>
                          <span>{criterion.weight}%</span>
                        </div>
                        <div className="judge-slider-wrap">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={values[criterion.label] ?? 0}
                            onChange={(event) =>
                              updateScore(team.name, criterion.label, event.target.value)
                            }
                            className="judge-slider"
                          />
                          <strong className="judge-slider-value">
                            {values[criterion.label] ?? 0}
                          </strong>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="judge-score-card__footer">
                    <p>
                      가중 평균: <strong>{average.toFixed(1)}점</strong>
                    </p>
                    <button type="button" className="team-primary-button">
                      채점 저장
                    </button>
                  </div>
                </>
              ) : (
                <div className="judge-empty-state">
                  <p>채점을 시작하려면 파일을 확인하고 슬라이더를 조정하세요.</p>
                  <button type="button" className="team-primary-button judge-empty-state__button">
                    채점 시작
                  </button>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </>
  )

  const renderVoteMode = () => (
    (() => {
      const selections = selectedHackathon.selections ?? {}
      const voteOptions = [
        {
          title: '1순위 선택',
          prefix: '1st',
          selected: selections.first ?? '',
          key: 'first',
        },
        {
          title: '2~3순위 선택',
          prefix: '2nd',
          selected: selections.second ?? '',
          key: 'second',
        },
        {
          title: '3순위 선택',
          prefix: '3rd',
          selected: selections.third ?? '',
          key: 'third',
        },
      ]

      return (
        <>
      <h2 className="judge-section-title">팀 순위 투표</h2>
      <p className="judge-progress-copy judge-progress-copy--left">
        마음에 드는 팀을 1~3순위로 선택해주세요. 각 심사위원의 투표가 합산됩니다.
      </p>

      <div className="judge-card-list">
        {voteOptions.map((block) => (
          <article key={block.key} className="judge-vote-card">
            <h3>{block.title}</h3>
            <div className="judge-vote-options">
              {selectedHackathon.voteTeams.map((teamName) => {
                const isSelected = teamName === block.selected
                return (
                  <button
                    key={`${block.key}-${teamName}`}
                    type="button"
                    className={`judge-vote-option${
                      isSelected ? ' judge-vote-option--selected' : ''
                    }`}
                  >
                    <span className="judge-vote-option__prefix">
                      {isSelected ? block.prefix : '–'}
                    </span>
                    <strong>{teamName}</strong>
                    {isSelected && <span className="judge-vote-option__badge">선택됨</span>}
                  </button>
                )
              })}
            </div>
          </article>
        ))}
      </div>

      <div className="judge-vote-footer">
        <button type="button" className="team-primary-button">
          투표 저장
        </button>
      </div>
        </>
      )
    })()
  )

  return (
    <section className="page-section">
      <div className="page-header">
        <h1>심사 패널</h1>
        <p className="page-description">배정된 해커톤의 제출물을 심사합니다.</p>
      </div>

      <section className="judge-toolbar">
        <label className="judge-select-block">
          <span className="judge-select-block__label">심사할 해커톤</span>
          <div className="judge-select-block__controls">
            <select
              className="form-control judge-select"
              value={selectedSlug}
              onChange={(event) => setSelectedSlug(event.target.value)}
            >
              {judgeHackathons.map((hackathon) => (
                <option key={hackathon.slug} value={hackathon.slug}>
                  {hackathon.title} ({hackathon.modeLabel})
                </option>
              ))}
            </select>
            <span
              className={`admin-pill ${
                selectedHackathon.mode === 'score'
                  ? 'admin-pill--blue'
                  : 'admin-pill--file'
              }`}
            >
              {selectedHackathon.modeLabel}
            </span>
          </div>
        </label>
      </section>

      {selectedHackathon.mode === 'score' ? renderScoreMode() : renderVoteMode()}
    </section>
  )
}

export default JudgePage
