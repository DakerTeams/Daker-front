import { useEffect, useMemo, useState } from 'react'
import { fetchHackathons, fetchHackathonTeams } from '../api/hackathons.js'
import { fetchMyScores, submitScores, submitVotes } from '../api/scoring.js'

function JudgePage() {
  const [hackathons, setHackathons] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [teams, setTeams] = useState([])
  const [existingScores, setExistingScores] = useState([])
  const [scoreMap, setScoreMap] = useState({})
  const [voteMap, setVoteMap] = useState({ 1: '', 2: '', 3: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // 해커톤 목록 로드
  useEffect(() => {
    fetchHackathons()
      .then((list) => {
        setHackathons(list)
        if (list.length > 0) setSelectedId(list[0].id)
      })
      .catch(() => setMessage('해커톤 목록을 불러오지 못했습니다.'))
  }, [])

  const selectedHackathon = useMemo(
    () => hackathons.find((h) => h.id === selectedId) ?? null,
    [hackathons, selectedId],
  )

  // 해커톤 변경 시 팀 목록 + 기존 채점 로드
  useEffect(() => {
    if (!selectedId) return

    async function loadData() {
      setLoading(true)
      setMessage('')
      setScoreMap({})
      setVoteMap({ 1: '', 2: '', 3: '' })
      try {
        const [teamList, scores] = await Promise.all([
          fetchHackathonTeams(selectedId),
          fetchMyScores(selectedId),
        ])
        setTeams(teamList)
        setExistingScores(scores)

        // 기존 채점 데이터로 scoreMap 초기화
        const initialScoreMap = {}
        scores.forEach((s) => {
          if (!initialScoreMap[s.teamId]) initialScoreMap[s.teamId] = {}
          if (s.criteriaId !== undefined) {
            initialScoreMap[s.teamId][s.criteriaId] = s.score ?? 0
          }
        })
        setScoreMap(initialScoreMap)
      } catch {
        setMessage('데이터를 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [selectedId])

  const isScoreMode = selectedHackathon?.raw?.scoreType === 'SCORE'

  function updateScore(teamId, criteriaId, value) {
    setScoreMap((prev) => ({
      ...prev,
      [teamId]: {
        ...(prev[teamId] ?? {}),
        [criteriaId]: Number(value),
      },
    }))
  }

  async function handleSaveScore(team) {
    const criteriaScores = selectedHackathon?.raw?.criteria ?? []
    const scores = criteriaScores.map((c) => ({
      criteriaId: c.id,
      score: scoreMap[team.id]?.[c.id] ?? 0,
    }))

    try {
      await submitScores(selectedId, { teamId: team.id, scores })
      setMessage(`${team.name} 채점이 저장되었습니다.`)
    } catch {
      setMessage('채점 저장에 실패했습니다.')
    }
  }

  async function handleSaveVotes() {
    const votes = [
      { teamId: voteMap[1], voteRank: 1 },
      { teamId: voteMap[2], voteRank: 2 },
      { teamId: voteMap[3], voteRank: 3 },
    ].filter((v) => v.teamId)

    if (votes.length < 3) {
      setMessage('1~3순위를 모두 선택해주세요.')
      return
    }

    try {
      await submitVotes(selectedId, { votes })
      setMessage('투표가 제출되었습니다.')
    } catch {
      setMessage('투표 제출에 실패했습니다.')
    }
  }

  const renderScoreMode = () => {
    const criteria = selectedHackathon?.raw?.criteria ?? []

    return (
      <>
        <div className="row-between row-between--wrap">
          <h2 className="judge-section-title">팀별 점수 입력</h2>
          <p className="judge-progress-copy">
            채점 완료: {existingScores.length > 0 ? `${new Set(existingScores.map((s) => s.teamId)).size}` : 0} / {teams.length}팀
          </p>
        </div>

        <div className="judge-card-list">
          {teams.map((team) => {
            const values = scoreMap[team.id] ?? {}
            const average = criteria.reduce(
              (acc, c) => acc + ((values[c.id] ?? 0) * (c.weight ?? 0)) / 100,
              0,
            )

            return (
              <article key={team.id} className="judge-score-card">
                <div className="judge-score-card__header">
                  <div>
                    <h3>{team.name}</h3>
                    <p>팀장: {team.leader}</p>
                  </div>
                </div>

                <div className="judge-score-grid">
                  {criteria.map((c) => (
                    <div key={c.id} className="judge-score-row">
                      <div className="judge-score-row__meta">
                        <strong>{c.label ?? c.name}</strong>
                        <span>{c.weight}%</span>
                      </div>
                      <div className="judge-slider-wrap">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={values[c.id] ?? 0}
                          onChange={(e) => updateScore(team.id, c.id, e.target.value)}
                          className="judge-slider"
                        />
                        <strong className="judge-slider-value">{values[c.id] ?? 0}</strong>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="judge-score-card__footer">
                  <p>
                    가중 평균: <strong>{average.toFixed(1)}점</strong>
                  </p>
                  <button
                    type="button"
                    className="team-primary-button"
                    onClick={() => handleSaveScore(team)}
                  >
                    채점 저장
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </>
    )
  }

  const renderVoteMode = () => (
    <>
      <h2 className="judge-section-title">팀 순위 투표</h2>
      <p className="judge-progress-copy judge-progress-copy--left">
        마음에 드는 팀을 1~3순위로 선택해주세요.
      </p>

      <div className="judge-card-list">
        {[1, 2, 3].map((rank) => (
          <article key={rank} className="judge-vote-card">
            <h3>{rank}순위 선택</h3>
            <div className="judge-vote-options">
              {teams.map((team) => {
                const isSelected = voteMap[rank] === team.id
                return (
                  <button
                    key={team.id}
                    type="button"
                    className={`judge-vote-option${isSelected ? ' judge-vote-option--selected' : ''}`}
                    onClick={() => setVoteMap((prev) => ({ ...prev, [rank]: team.id }))}
                  >
                    <span className="judge-vote-option__prefix">{isSelected ? `${rank}st` : '–'}</span>
                    <strong>{team.name}</strong>
                    {isSelected && <span className="judge-vote-option__badge">선택됨</span>}
                  </button>
                )
              })}
            </div>
          </article>
        ))}
      </div>

      <div className="judge-vote-footer">
        <button type="button" className="team-primary-button" onClick={handleSaveVotes}>
          투표 저장
        </button>
      </div>
    </>
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
              value={selectedId ?? ''}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {hackathons.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.title} ({h.raw?.scoreType === 'SCORE' ? '점수형' : '투표형'})
                </option>
              ))}
            </select>
            {selectedHackathon && (
              <span className={`admin-pill ${isScoreMode ? 'admin-pill--blue' : 'admin-pill--file'}`}>
                {isScoreMode ? '점수형' : '투표형'}
              </span>
            )}
          </div>
        </label>
      </section>

      {message && <p className="admin-subtitle">{message}</p>}
      {loading && <p className="admin-subtitle">불러오는 중...</p>}

      {!loading && selectedHackathon && (
        isScoreMode ? renderScoreMode() : renderVoteMode()
      )}
    </section>
  )
}

export default JudgePage
