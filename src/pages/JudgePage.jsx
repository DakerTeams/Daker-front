import { useEffect, useState } from 'react'
import {
  fetchJudgeHackathons,
  fetchJudgeSubmission,
  fetchJudgeTeams,
  submitJudgeScore,
  submitJudgeVote,
} from '../api/scoring.js'

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

// ── 평가형 / 투표형 공통 섹션 컴포넌트 ──
function JudgeSection({ type, hackathons, onToast }) {
  const isVoteType = type === 'VOTE'

  const [selectedHackathon, setSelectedHackathon] = useState(() => hackathons[0] ?? null)
  const [judgeData, setJudgeData] = useState(null)
  const [scoreMap, setScoreMap] = useState({})
  const [savedTeamIds, setSavedTeamIds] = useState(new Set())
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [submission, setSubmission] = useState(null)
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [loadingSubmission, setLoadingSubmission] = useState(false)
  const [savingTeamId, setSavingTeamId] = useState(null)

  // 해커톤 변경 시 팀 목록 로드
  useEffect(() => {
    if (!selectedHackathon) return

    setLoadingTeams(true)
    setJudgeData(null)
    setScoreMap({})
    setSavedTeamIds(new Set())
    setSelectedTeam(null)
    setSubmission(null)

    fetchJudgeTeams(selectedHackathon.id)
      .then((data) => {
        setJudgeData(data)
        const criteria = Array.isArray(data.criteria) ? data.criteria : []
        const initialMap = {}
        for (const team of (data.items ?? [])) {
          if (team.reviewStatus === 'reviewed' && Array.isArray(team.scores)) {
            initialMap[team.teamId] = {}
            criteria.forEach((_, i) => {
              initialMap[team.teamId][i] = team.scores[i] ?? 0
            })
          }
        }
        setScoreMap(initialMap)
        setSavedTeamIds(new Set(
          (data.items ?? [])
            .filter((t) => t.reviewStatus === 'reviewed')
            .map((t) => t.teamId)
        ))
      })
      .catch(() => onToast({ type: 'error', message: '팀 목록을 불러오지 못했습니다.' }))
      .finally(() => setLoadingTeams(false))
  }, [selectedHackathon])

  // 팀 선택 시 제출물 로드
  useEffect(() => {
    if (!selectedTeam || !selectedHackathon || !selectedTeam.submissionId) {
      setSubmission(null)
      return
    }
    setLoadingSubmission(true)
    fetchJudgeSubmission(selectedHackathon.id, selectedTeam.teamId)
      .then(setSubmission)
      .catch(() => {
        setSubmission(null)
        onToast({ type: 'error', message: '제출물을 불러오지 못했습니다.' })
      })
      .finally(() => setLoadingSubmission(false))
  }, [selectedTeam, selectedHackathon])

  const criteria = judgeData?.criteria ?? []
  const teams = judgeData?.items ?? []
  const reviewedCount = savedTeamIds.size
  const hasCriteria = criteria.length > 0

  function updateScore(teamId, index, value) {
    setScoreMap((prev) => ({
      ...prev,
      [teamId]: { ...(prev[teamId] ?? {}), [index]: Number(value) },
    }))
  }

  function calcTotalScore(teamId) {
    const values = scoreMap[teamId] ?? {}
    return criteria.reduce((acc, _, i) => acc + (values[i] ?? 0), 0)
  }

  function maxTotalScore() {
    return criteria.reduce((acc, c) => acc + (c.maxScore ?? 0), 0)
  }

  async function handleSaveScore(team) {
    if (!hasCriteria || !team.submissionId) return
    const scores = criteria.map((_, i) => ({ score: scoreMap[team.teamId]?.[i] ?? 0 }))
    setSavingTeamId(team.teamId)
    try {
      await submitJudgeScore(selectedHackathon.id, team.teamId, scores)
      setSavedTeamIds((prev) => new Set([...prev, team.teamId]))
      onToast({ type: 'success', message: `${team.teamName} 채점을 저장했습니다.` })
    } catch (err) {
      onToast({ type: 'error', message: err.message || '채점 저장에 실패했습니다.' })
    } finally {
      setSavingTeamId(null)
    }
  }

  async function handleVote(team) {
    if (savedTeamIds.size > 0) {
      onToast({ type: 'error', message: '이미 투표하셨습니다. 투표는 1회만 가능합니다.' })
      return
    }
    setSavingTeamId(team.teamId)
    try {
      await submitJudgeVote(selectedHackathon.id, team.teamId)
      setSavedTeamIds(new Set([team.teamId]))
      onToast({ type: 'success', message: `${team.teamName}에 투표했습니다.` })
    } catch (err) {
      onToast({ type: 'error', message: err.message || '투표에 실패했습니다.' })
    } finally {
      setSavingTeamId(null)
    }
  }

  // ── 채점 / 투표 패널 ──
  function ScorePanel({ team }) {
    const isReviewed = savedTeamIds.has(team.teamId)
    const isSaving = savingTeamId === team.teamId
    const total = calcTotalScore(team.teamId)
    const hasSubmission = !!team.submissionId
    const canScore = hasCriteria && hasSubmission
    const hasVotedElsewhere = !isReviewed && savedTeamIds.size > 0

    return (
      <div className={`judge-score-panel judge-score-panel--${isVoteType ? 'vote' : 'score'}`}>

        {/* 헤더 */}
        <div className="judge-panel-section judge-panel-section--header">
          <button type="button" className="judge-back-btn" onClick={() => setSelectedTeam(null)}>
            ← 팀 목록
          </button>
          <div className="judge-panel-team">
            <div className="judge-panel-team__info">
              <h2>{team.teamName}</h2>
              {team.submittedAt
                ? <span className="judge-score-card__meta">제출 {new Date(team.submittedAt).toLocaleString('ko-KR')}</span>
                : <span className="judge-score-card__meta judge-no-submission">미제출</span>}
            </div>
            <span className={`admin-pill ${isReviewed ? 'admin-pill--green' : 'admin-pill--gray'}`}>
              {isReviewed ? (isVoteType ? '투표 완료' : '채점 완료') : isVoteType ? '미투표' : '미채점'}
            </span>
          </div>
        </div>

        {/* 제출물 */}
        <div className="judge-panel-section judge-panel-section--submission">
          <p className="judge-panel-section__title">제출물</p>
          {!hasSubmission && <p className="judge-submission__loading">제출물이 없습니다.</p>}
          {hasSubmission && loadingSubmission && <p className="judge-submission__loading">불러오는 중...</p>}
          {hasSubmission && !loadingSubmission && submission && (
            <div className="judge-submission__items">
              {(submission.items ?? []).map((item) => (
                <div key={item.itemId} className="judge-submission__item">
                  {item.fileUrl && (
                    <a href={item.fileUrl} target="_blank" rel="noreferrer" className="judge-submission__file">
                      <span className="judge-submission__icon">📄</span>
                      <span className="judge-submission__name">{item.originalFileName}</span>
                      {item.fileSize && <span className="judge-submission__size">{formatFileSize(item.fileSize)}</span>}
                    </a>
                  )}
                  {item.valueUrl && (
                    <a href={item.valueUrl} target="_blank" rel="noreferrer" className="judge-submission__file judge-submission__file--link">
                      <span className="judge-submission__icon">🔗</span>
                      <span className="judge-submission__name">{item.valueUrl}</span>
                    </a>
                  )}
                  {item.valueText && <p className="judge-submission__text">{item.valueText}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 투표 영역 (VOTE형) */}
        {isVoteType && (
          <div className={`judge-panel-section judge-panel-section--vote-action${isReviewed ? ' judge-panel-section--voted' : ''}`}>
            <p className="judge-panel-section__title">투표</p>
            <p className="judge-panel-section__desc">
              {isReviewed ? '이 팀에 투표했습니다. 투표는 변경할 수 없습니다.'
                : hasVotedElsewhere ? '다른 팀에 이미 투표하셨습니다.'
                : !hasSubmission ? '제출물이 없는 팀에는 투표할 수 없습니다.'
                : '제출물을 검토한 후 투표해주세요. 1인 1회만 가능합니다.'}
            </p>
            <button
              type="button"
              className={`judge-vote-btn${isReviewed ? ' judge-vote-btn--done' : ''}`}
              disabled={isSaving || isReviewed || hasVotedElsewhere || !hasSubmission}
              onClick={() => handleVote(team)}
            >
              {isSaving ? '투표 중...' : isReviewed ? '투표 완료' : '이 팀에 투표'}
            </button>
          </div>
        )}

        {/* 평가기준 (SCORE형) */}
        {!isVoteType && (
          <div className="judge-panel-section judge-panel-section--criteria">
            <p className="judge-panel-section__title">평가기준</p>
            {!hasCriteria ? (
              <div className="judge-mode-banner judge-mode-banner--warn">
                채점 기준이 등록되지 않아 채점이 불가능합니다.
              </div>
            ) : (
              <div className="judge-score-grid">
                {criteria.map((c, i) => {
                  const value = scoreMap[team.teamId]?.[i] ?? 0
                  return (
                    <div key={c.label} className="judge-score-row">
                      <div className="judge-score-row__meta">
                        <strong>{c.label}</strong>
                        <span>최대 {c.maxScore}점</span>
                      </div>
                      <div className="judge-slider-wrap">
                        <input
                          type="range" min="0" max={c.maxScore ?? 100} step="0.5" value={value}
                          onChange={(e) => updateScore(team.teamId, i, e.target.value)}
                          className="judge-slider"
                        />
                        <input
                          type="number" min="0" max={c.maxScore ?? 100} step="0.5"
                          defaultValue={value} key={`${team.teamId}-${i}-${value}`}
                          onBlur={(e) => {
                            const v = Math.min(c.maxScore ?? 100, Math.max(0, Number(e.target.value) || 0))
                            updateScore(team.teamId, i, v)
                          }}
                          className="judge-score-input"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* 채점 푸터 (SCORE형) */}
        {!isVoteType && (
          <div className="judge-panel-section judge-panel-section--footer">
            <p className="judge-weighted-score">
              {hasCriteria ? (
                <>예상 총점 <strong>{total.toFixed(1)}</strong><span className="judge-max-score"> / {maxTotalScore()}점</span></>
              ) : (
                <span className="judge-max-score">채점 불가 / 기준 미설정</span>
              )}
            </p>
            <button
              type="button"
              className="team-primary-button team-primary-button--small"
              disabled={isSaving || !canScore}
              onClick={() => handleSaveScore(team)}
            >
              {isSaving ? '저장 중...' : isReviewed ? '재채점 저장' : '채점 저장'}
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── 팀 목록 ──
  function TeamList() {
    if (loadingTeams) return <p className="rankings-empty">팀 목록 불러오는 중...</p>
    if (!judgeData) return null
    if (teams.length === 0) return <p className="rankings-empty">채점할 팀이 없습니다.</p>

    const total = selectedHackathon?.submissionCount ?? teams.length
    const pct = isVoteType
      ? (reviewedCount > 0 ? 100 : 0)
      : total > 0 ? Math.round((reviewedCount / total) * 100) : 0

    return (
      <div className="judge-team-list">
        <div className={`judge-team-list__header judge-team-list__header--${isVoteType ? 'vote' : 'score'}`}>
          <div className="judge-selected-info__left">
            <h2>{selectedHackathon?.title}</h2>
            <div className="judge-inline-badges">
              {!isVoteType && !hasCriteria && (
                <span className="admin-pill admin-pill--warn">기준 없음</span>
              )}
            </div>
          </div>
          <div className="judge-progress-bar-wrap">
            <div className="judge-progress-bar">
              <div className="judge-progress-bar__fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="judge-progress-label">
              {isVoteType
                ? (reviewedCount > 0 ? '투표 완료' : `${total}팀 중 미투표`)
                : `${reviewedCount} / ${total}팀 채점`}
            </span>
          </div>
        </div>

        <div className="judge-team-items">
          {teams.map((team) => {
            const isReviewed = savedTeamIds.has(team.teamId)
            const hasSubmission = !!team.submissionId
            return (
              <button
                key={team.teamId}
                type="button"
                className={`judge-team-item${isReviewed ? ' judge-team-item--reviewed' : ''}${!hasSubmission ? ' judge-team-item--no-submission' : ''}`}
                onClick={() => setSelectedTeam(team)}
              >
                <div className="judge-team-item__info">
                  <strong>{team.teamName}</strong>
                  <span>{hasSubmission ? new Date(team.submittedAt).toLocaleDateString('ko-KR') : '미제출'}</span>
                </div>
                <span className={`admin-pill ${isReviewed ? 'admin-pill--green' : hasSubmission ? 'admin-pill--gray' : 'admin-pill--warn'}`}>
                  {isReviewed ? (isVoteType ? '내 투표' : '완료') : hasSubmission ? (isVoteType ? '미투표' : '미채점') : '미제출'}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (hackathons.length === 0) return null

  return (
    <div className={`judge-section judge-section--${isVoteType ? 'vote' : 'score'}`}>
      <div className="judge-section__header">
        <span className={`judge-mode-badge judge-mode-badge--${isVoteType ? 'vote' : 'score'}`}>
          {isVoteType ? '투표형' : '평가형'}
        </span>
        <h2 className="judge-section__title">{isVoteType ? '투표 심사' : '점수 심사'}</h2>
      </div>

      <div className="judge-layout">
        <aside className="judge-sidebar">
          <p className="judge-sidebar__label">배정된 해커톤</p>
          {hackathons.map((h) => {
            const isActive = selectedHackathon?.id === h.id
            const total = h.submissionCount ?? 0
            const pct = isVoteType
              ? 0
              : total > 0 ? Math.round(((h.reviewedCount ?? 0) / total) * 100) : 0
            return (
              <button
                key={h.id}
                type="button"
                className={`judge-sidebar-item${isActive ? ' judge-sidebar-item--active' : ''}`}
                onClick={() => { setSelectedHackathon(h); setSelectedTeam(null) }}
              >
                <span className="judge-sidebar-item__title">{h.title}</span>
                <div className="judge-sidebar-item__progress">
                  <div className="judge-progress-bar">
                    <div className="judge-progress-bar__fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span>
                    {isVoteType
                      ? `제출 ${total}팀`
                      : `${h.reviewedCount ?? 0}/${total}`}
                  </span>
                </div>
              </button>
            )
          })}
        </aside>

        <main className="judge-main">
          {selectedTeam ? <ScorePanel team={selectedTeam} /> : <TeamList />}
        </main>
      </div>
    </div>
  )
}

// ── 메인 페이지 ──
function JudgePage() {
  const [hackathons, setHackathons] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    setLoading(true)
    fetchJudgeHackathons()
      .then(setHackathons)
      .catch(() => setToast({ type: 'error', message: '배정된 해커톤 목록을 불러오지 못했습니다.' }))
      .finally(() => setLoading(false))
  }, [])

  const scoreHackathons = hackathons.filter((h) => h.scoreType !== 'VOTE')
  const voteHackathons = hackathons.filter((h) => h.scoreType === 'VOTE')

  return (
    <section className="page-section">
      <div className="page-header">
        <p className="eyebrow">/judge</p>
        <h1>심사 패널</h1>
      </div>

      {loading && <p className="rankings-empty">불러오는 중...</p>}

      {!loading && hackathons.length === 0 && (
        <p className="rankings-empty">배정된 해커톤이 없습니다.</p>
      )}

      {!loading && hackathons.length > 0 && (
        <div className="judge-sections">
          <JudgeSection type="SCORE" hackathons={scoreHackathons} onToast={setToast} />
          <JudgeSection type="VOTE" hackathons={voteHackathons} onToast={setToast} />
        </div>
      )}

      {toast && (
        <div className={`admin-toast admin-toast--${toast.type}`}>
          {toast.message}
        </div>
      )}
    </section>
  )
}

export default JudgePage
