import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { fetchHackathons } from '../api/hackathons.js'
import { createTeam } from '../api/teams.js'
import { getStoredUser } from '../lib/auth.js'

function createEmptyPosition() {
  return {
    positionName: '',
    requiredCount: '1',
  }
}

function TeamCreatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const defaultHackathonId = searchParams.get('hackathonId') ?? ''
  const [availableHackathons, setAvailableHackathons] = useState([])
  const [form, setForm] = useState({
    hackathonId: defaultHackathonId,
    name: '',
    description: '',
    isOpen: 'true',
    maxMemberCount: '5',
    positions: [createEmptyPosition()],
  })
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadHackathons() {
      try {
        const { items } = await fetchHackathons()
        if (!isMounted) return

        setAvailableHackathons(items)
        if (defaultHackathonId) {
          const matched = items.some(
            (hackathon) => String(hackathon.id) === String(defaultHackathonId),
          )

          if (!matched) {
            setForm((current) => ({
              ...current,
              hackathonId: '',
            }))
          }
        }
      } catch {
        if (!isMounted) return
      }
    }

    loadHackathons()

    return () => {
      isMounted = false
    }
  }, [defaultHackathonId])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handlePositionChange = (index, key, value) => {
    setForm((current) => ({
      ...current,
      positions: current.positions.map((position, positionIndex) =>
        positionIndex === index ? { ...position, [key]: value } : position,
      ),
    }))
  }

  const handleAddPosition = () => {
    setForm((current) => ({
      ...current,
      positions: [...current.positions, createEmptyPosition()],
    }))
  }

  const handleRemovePosition = (index) => {
    setForm((current) => ({
      ...current,
      positions:
        current.positions.length === 1
          ? [createEmptyPosition()]
          : current.positions.filter((_, positionIndex) => positionIndex !== index),
    }))
  }

  const handleSubmit = async () => {
    if (!getStoredUser()) {
      setMessage('로그인 후 팀을 생성할 수 있습니다.')
      return
    }

    setIsSubmitting(true)
    setMessage('')

    try {
      const positions = form.positions
        .map((position) => ({
          positionName: position.positionName.trim(),
          requiredCount: Number(position.requiredCount) || 1,
        }))
        .filter((position) => position.positionName)

      await createTeam({
        hackathonId: form.hackathonId ? Number(form.hackathonId) : null,
        name: form.name,
        description: form.description,
        isOpen: form.isOpen === 'true',
        maxMemberCount: Number(form.maxMemberCount) || 5,
        positions,
      })

      navigate(form.hackathonId ? `/hackathons/${form.hackathonId}?tab=team` : '/camp')
    } catch {
      setMessage('팀 생성에 실패했습니다. 등록 기간과 입력값을 확인해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

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
              <p className="meta-text">팀 생성 유의사항</p>
              <ul className="bullet-list">
                <li>해커톤을 아직 정하지 않았어도 팀을 먼저 만들 수 있습니다.</li>
                <li>모집 중으로 설정하면 camp에서 다른 사용자가 팀을 보고 지원할 수 있습니다.</li>
                <li>모집 역할과 인원 수를 구체적으로 적으면 원하는 팀원을 더 정확하게 받을 수 있습니다.</li>
                <li>팀 소개에는 작업 방향, 원하는 협업 방식, 필요한 역할을 함께 적는 것을 추천합니다.</li>
                <li>해커톤에 연결된 팀은 같은 해커톤 안에서 한 팀만 참여할 수 있습니다.</li>
              </ul>
            </section>

            <section className="surface-card">
              <div className="form-grid">
                <label className="form-field">
                  <span className="form-label">연결할 해커톤</span>
                  <select
                    className="form-control"
                    name="hackathonId"
                    value={form.hackathonId}
                    onChange={handleChange}
                  >
                    <option value="">선택 안 함</option>
                    {availableHackathons.map((hackathon) => (
                      <option key={hackathon.id} value={hackathon.id}>
                        {hackathon.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span className="form-label">팀명</span>
                  <input
                    className="form-control"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="예: Neural Ninjas"
                  />
                </label>

                <label className="form-field form-field--full">
                  <span className="form-label">팀 소개</span>
                  <textarea
                    className="form-control form-control--textarea"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="팀 목표, 만들고 싶은 결과물, 원하는 협업 분위기를 적어주세요."
                  />
                </label>

                <label className="form-field">
                  <span className="form-label">팀원 모집 여부</span>
                  <select
                    className="form-control"
                    name="isOpen"
                    value={form.isOpen}
                    onChange={handleChange}
                  >
                    <option value="true">모집중</option>
                    <option value="false">모집 안 함</option>
                  </select>
                </label>

                <label className="form-field">
                  <span className="form-label">최대 팀원 수</span>
                  <input
                    className="form-control"
                    type="number"
                    min="1"
                    name="maxMemberCount"
                    value={form.maxMemberCount}
                    onChange={handleChange}
                  />
                </label>
              </div>
            </section>

            <section className="surface-card">
              <div className="info-row">
                <div>
                  <p className="meta-text">모집 멤버 역할</p>
                  <h2>역할과 인원 수를 설정하세요</h2>
                </div>
                <button type="button" className="button-link button-link--ghost" onClick={handleAddPosition}>
                  역할 추가
                </button>
              </div>

              <div className="stack-list stack-list--compact">
                {form.positions.map((position, index) => (
                  <div key={`position-${index}`} className="form-grid">
                    <label className="form-field">
                      <span className="form-label">역할명</span>
                      <input
                        className="form-control"
                        value={position.positionName}
                        onChange={(event) =>
                          handlePositionChange(index, 'positionName', event.target.value)
                        }
                        placeholder="예: 프론트엔드, 디자이너, 백엔드"
                      />
                    </label>

                    <label className="form-field">
                      <span className="form-label">모집 인원</span>
                      <input
                        className="form-control"
                        type="number"
                        min="1"
                        value={position.requiredCount}
                        onChange={(event) =>
                          handlePositionChange(index, 'requiredCount', event.target.value)
                        }
                      />
                    </label>

                    <div className="form-field">
                      <span className="form-label">관리</span>
                      <button
                        type="button"
                        className="button-link button-link--ghost"
                        onClick={() => handleRemovePosition(index)}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="stack-list">
            <section className="surface-card">
              <p className="meta-text">입력 확인</p>
              <h2>{form.name || '팀 이름을 입력하세요'}</h2>
              <div className="stack-list stack-list--compact">
                <div className="info-row">
                  <span>연결 해커톤</span>
                  <span>
                    {availableHackathons.find((item) => String(item.id) === form.hackathonId)?.title ??
                      '독립 팀'}
                  </span>
                </div>
                <div className="info-row">
                  <span>모집 상태</span>
                  <span className="status-pill status-pill--open">
                    {form.isOpen === 'true' ? '모집중' : '모집 안 함'}
                  </span>
                </div>
                <div className="info-row">
                  <span>최대 팀원 수</span>
                  <span>{form.maxMemberCount}명</span>
                </div>
                <div className="info-row">
                  <span>모집 역할</span>
                  <span>
                    {form.positions.filter((position) => position.positionName.trim()).length}개
                  </span>
                </div>
              </div>
            </section>

            <div className="create-actions">
              <Link to="/camp" className="button-link button-link--ghost">
                모집글 목록으로
              </Link>
              <button type="button" className="button-link button-link--soft" onClick={handleSubmit}>
                {isSubmitting ? '생성 중...' : '팀 생성 완료'}
              </button>
            </div>
            {message ? <p className="meta-text">{message}</p> : null}
          </aside>
        </div>
      </div>
    </section>
  )
}

export default TeamCreatePage
