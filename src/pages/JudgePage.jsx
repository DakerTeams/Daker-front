import { useEffect, useState } from 'react'
import {
  fetchJudgeHackathons,
  fetchJudgeSubmission,
  fetchJudgeTeams,
  submitJudgeScore,
} from '../api/scoring.js'

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

function scoreTypeLabel(scoreType) {
  return scoreType === 'VOTE' ? '투표형' : '평가형'
}

function JudgePage() {
  const [hackathons, setHackathons] = useState([])
  const [selectedHackathon, setSelectedHackathon] = useState(null)
  const [judgeData, setJudgeData] = useState(null)
  const [scoreMap, setScoreMap] = useState({}) // { [teamId]: { [index]: score } }
  const [savingTeamId, setSavingTeamId] = useState(null)
  const [savedTeamIds, setSavedTeamIds] = useState(new Set())
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [submission, setSubmission] = useState(null)
  const [loadingSubmission, setLoadingSubmission] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return undefined

    const timer = window.setTimeout(() => {
      setToast(null)
    }, 2600)

    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    setLoading(true)
    fetchJudgeHackathons()
      .then((list) => {
        setHackathons(list)
        if (list.length > 0) setSelectedHackathon(list[0])
      })
      .catch((requestError) => {
        console.error('Failed to fetch judge hackathons', requestError)
        setToast({ type: 'error', message: '배정된 해커톤 목록을 불러오지 못했습니다.' })
      })
      .finally(() => setLoading(false))
  }, [])

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

        const reviewedIds = new Set(
          (data.items ?? [])
            .filter((t) => t.reviewStatus === 'reviewed')
            .map((t) => t.teamId)
        )
        setSavedTeamIds(reviewedIds)
      })
      .catch((requestError) => {
        console.error('Failed to fetch judge teams', requestError)
        setToast({ type: 'error', message: '팀 목록을 불러오지 못했습니다.' })
      })
      .finally(() => setLoadingTeams(false))
  }, [selectedHackathon])

  useEffect(() => {
    if (!selectedTeam || !selectedHackathon || !selectedTeam.submissionId) {
      setSubmission(null)
      return
    }

    setLoadingSubmission(true)
    fetchJudgeSubmission(selectedHackathon.id, selectedTeam.teamId)
      .then(setSubmission)
      .catch((requestError) => {
        console.error('Failed to fetch judge submission', requestError)
        setSubmission(null)
        setToast({ type: 'error', message: '제출물을 불러오지 못했습니다.' })
      })
      .finally(() => setLoadingSubmission(false))
  }, [selectedTeam, selectedHackathon])

  function updateScore(teamId, index, value) {
    setScoreMap((prev) => ({
      ...prev,
      [teamId]: { ...(prev[teamId] ?? {}), [index]: Number(value) },
    }))
  }

  async function handleSaveScore(team) {
    const criteria = judgeData?.criteria ?? []
    const isVoteType = judgeData?.scoreType === 'VOTE'
    const hasCriteria = criteria.length > 0
    const hasSubmission = Boolean(team.submissionId)

    if (isVoteType) {
      console.error('Scoring blocked: vote-based hackathon cannot be scored in JudgePage', {
        hackathonId: selectedHackathon?.id,
        teamId: team.teamId,
      })
      setToast({ type: 'error', message: '투표형 해커톤은 점수 채점을 지원하지 않습니다.' })
      return
    }

    if (!hasCriteria) {
      console.error('Scoring blocked: no criteria configured', {
        hackathonId: selectedHackathon?.id,
        teamId: team.teamId,
      })
      setToast({ type: 'error', message: '채점 기준이 없어 점수를 저장할 수 없습니다.' })
      return
    }

    if (!hasSubmission) {
      console.error('Scoring blocked: team has no submission', {
        hackathonId: selectedHackathon?.id,
        teamId: team.teamId,
      })
      setToast({ type: 'error', message: '제출물이 없는 팀은 채점할 수 없습니다.' })
      return
    }

    const scores = criteria.map((_, i) => ({
      score: scoreMap[team.teamId]?.[i] ?? 0,
    }))

    setSavingTeamId(team.teamId)
    try {
      await submitJudgeScore(selectedHackathon.id, team.teamId, scores)
      setSavedTeamIds((prev) => new Set([...prev, team.teamId]))
      setToast({ type: 'success', message: `${team.teamName} 채점을 저장했습니다.` })
    } catch (requestError) {
      console.error('Failed to save judge score', requestError)
      setToast({ type: 'error', message: '채점 저장에 실패했습니다.' })
    } finally {
      setSavingTeamId(null)
    }
  }

  const criteria = judgeData?.criteria ?? []
  const teams = judgeData?.items ?? []
  const reviewedCount = savedTeamIds.size
  const isVoteType = judgeData?.scoreType === 'VOTE'
  const hasCriteria = criteria.length > 0

  function calcTotalScore(teamId) {
    const values = scoreMap[teamId] ?? {}
    return criteria.reduce((acc, _, i) => acc + (values[i] ?? 0), 0)
  }

  function maxTotalScore() {
    return criteria.reduce((acc, c) => acc + (c.maxScore ?? 0), 0)
  }

  // ── 우측: 채점 패널 ──
  function ScorePanel({ team }) {
    const isReviewed = savedTeamIds.has(team.teamId)
    const isSaving = savingTeamId === team.teamId
    const total = calcTotalScore(team.teamId)
    const hasSubmission = !!team.submissionId
    const canScore = !isVoteType && hasCriteria && hasSubmission
    const panelModeLabel = scoreTypeLabel(judgeData?.scoreType)

    return (
      <div className="judge-score-panel">
        <div className="judge-score-panel__header">
          <button type="button" className="judge-back-btn" onClick={() => setSelectedTeam(null)}>
            ← 팀 목록
          </button>
          <div className="judge-inline-badges">
            <span className="admin-pill admin-pill--blue">{panelModeLabel}</span>
            <span className={`admin-pill ${isReviewed ? 'admin-pill--green' : 'admin-pill--gray'}`}>
              {isReviewed ? '채점 완료' : isVoteType ? '검토 전' : '미채점'}
            </span>
          </div>
        </div>

        <div className="judge-score-panel__team">
          <h2>{team.teamName}</h2>
          {team.submittedAt ? (
            <p className="judge-score-card__meta">
              제출 {new Date(team.submittedAt).toLocaleString('ko-KR')}
            </p>
          ) : (
            <p className="judge-score-card__meta judge-no-submission">미제출</p>
          )}
        </div>

        {/* 제출물 */}
        {hasSubmission && (
          <div className="judge-submission">
            <p className="judge-submission__label">제출물</p>
            {loadingSubmission && <p className="judge-submission__loading">불러오는 중...</p>}
            {!loadingSubmission && submission && (
              <div className="judge-submission__items">
                {(submission.items ?? []).map((item) => (
                  <div key={item.itemId} className="judge-submission__item">
                    {item.fileUrl && (
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="judge-submission__file"
                      >
                        <span className="judge-submission__icon">📄</span>
                        <span className="judge-submission__name">{item.originalFileName}</span>
                        {item.fileSize && (
                          <span className="judge-submission__size">{formatFileSize(item.fileSize)}</span>
                        )}
                      </a>
                    )}
                    {item.valueUrl && (
                      <a
                        href={item.valueUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="judge-submission__file judge-submission__file--link"
                      >
                        <span className="judge-submission__icon">🔗</span>
                        <span className="judge-submission__name">{item.valueUrl}</span>
                      </a>
                    )}
                    {item.valueText && (
                      <p className="judge-submission__text">{item.valueText}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!hasSubmission && (
          <div className="judge-submission judge-submission--empty">
            <p>제출물이 없습니다.</p>
          </div>
        )}

        {isVoteType ? (
          <div className="judge-mode-banner judge-mode-banner--info">
            투표형 해커톤입니다. 심사패널에서는 제출물 검토만 가능하며 점수 채점은 지원하지 않습니다.
          </div>
        ) : !hasCriteria ? (
          <div className="judge-mode-banner judge-mode-banner--warn">
            채점 기준이 등록되지 않아 현재 이 해커톤은 점수 채점이 불가능합니다.
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
                      type="range"
                      min="0"
                      max={c.maxScore ?? 100}
                      step="0.5"
                      value={value}
                      onChange={(e) => updateScore(team.teamId, i, e.target.value)}
                      className="judge-slider"
                    />
                    <input
                      type="number"
                      min="0"
                      max={c.maxScore ?? 100}
                      step="0.5"
                      defaultValue={value}
                      key={`${team.teamId}-${i}-${value}`}
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

        <div className="judge-score-panel__footer">
          <p className="judge-weighted-score">
            {isVoteType ? (
              <>
                제출물 검토 모드
                <span className="judge-max-score"> / 투표형</span>
              </>
            ) : hasCriteria ? (
              <>
                예상 총점 <strong>{total.toFixed(1)}</strong>
                <span className="judge-max-score"> / {maxTotalScore()}점</span>
              </>
            ) : (
              <>
                채점 불가
                <span className="judge-max-score"> / 기준 미설정</span>
              </>
            )}
          </p>
          <button
            type="button"
            className="team-primary-button"
            disabled={isSaving || !canScore}
            onClick={() => handleSaveScore(team)}
          >
            {isVoteType
              ? '투표형'
              : isSaving
                ? '저장 중...'
                : isReviewed
                  ? '재채점 저장'
                  : '채점 저장'}
          </button>
        </div>
      </div>
    )
  }

  // ── 우측: 팀 목록 ──
  function TeamList() {
    if (loadingTeams) return <p className="rankings-empty">팀 목록 불러오는 중...</p>
    if (!judgeData) return null
    if (teams.length === 0) return <p className="rankings-empty">채점할 팀이 없습니다.</p>

    return (
      <div className="judge-team-list">
        <div className="judge-team-list__header">
          <div className="judge-selected-info__left">
            <h2>{selectedHackathon?.title}</h2>
            <div className="judge-inline-badges">
              <span className="admin-pill admin-pill--blue">{scoreTypeLabel(judgeData?.scoreType)}</span>
              {!isVoteType && !hasCriteria && (
                <span className="admin-pill admin-pill--warn">기준 없음</span>
              )}
            </div>
          </div>
          <div className="judge-progress-bar-wrap">
            <div className="judge-progress-bar">
              <div
                className="judge-progress-bar__fill"
                style={{
                  width: isVoteType
                    ? (selectedHackathon?.submissionCount ? '100%' : '0%')
                    : selectedHackathon?.submissionCount
                      ? `${(reviewedCount / selectedHackathon.submissionCount) * 100}%`
                      : '0%',
                }}
              />
            </div>
            <span className="judge-progress-label">
              {isVoteType
                ? `제출 ${selectedHackathon?.submissionCount ?? teams.length}팀`
                : `${reviewedCount} / ${selectedHackathon?.submissionCount ?? teams.length}팀`}
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
                  <span>
                    {hasSubmission
                      ? new Date(team.submittedAt).toLocaleDateString('ko-KR')
                      : '미제출'}
                  </span>
                </div>
                <span className={`admin-pill ${isReviewed ? 'admin-pill--green' : hasSubmission ? 'admin-pill--gray' : 'admin-pill--warn'}`}>
                  {isReviewed ? '완료' : hasSubmission ? '미채점' : '미제출'}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <p className="eyebrow">/judge</p>
        <h1>심사 패널</h1>
        <p className="page-description">배정된 해커톤의 제출물을 채점합니다.</p>
      </div>

      {loading && <p className="rankings-empty">불러오는 중...</p>}

      {!loading && hackathons.length === 0 && (
        <p className="rankings-empty">배정된 해커톤이 없습니다.</p>
      )}

      {!loading && hackathons.length > 0 && (
        <div className="judge-layout">
          <aside className="judge-sidebar">
            <p className="judge-sidebar__label">배정된 해커톤</p>
            {hackathons.map((h) => {
              const isActive = selectedHackathon?.id === h.id
              const pct = h.scoreType === 'VOTE'
                ? (h.submissionCount ? 100 : 0)
                : h.submissionCount
                  ? Math.round((h.reviewedCount / h.submissionCount) * 100)
                : 0
              return (
                <button
                  key={h.id}
                  type="button"
                  className={`judge-sidebar-item${isActive ? ' judge-sidebar-item--active' : ''}`}
                  onClick={() => setSelectedHackathon(h)}
                >
                  <span className="judge-sidebar-item__title">{h.title}</span>
                  <div className="judge-inline-badges">
                    <span className="admin-pill admin-pill--blue">{scoreTypeLabel(h.scoreType)}</span>
                  </div>
                  <div className="judge-sidebar-item__progress">
                    <div className="judge-progress-bar">
                      <div className="judge-progress-bar__fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span>
                      {h.scoreType === 'VOTE'
                        ? `제출 ${h.submissionCount ?? 0}팀`
                        : `${h.reviewedCount ?? 0}/${h.submissionCount ?? 0}`}
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
