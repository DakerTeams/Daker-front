import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchHackathons } from '../api/hackathons.js'
import { createTeam } from '../api/teams.js'
import { getStoredUser } from '../lib/auth.js'

function TeamCreatePage() {
  const navigate = useNavigate()
  const [availableHackathons, setAvailableHackathons] = useState([])
  const [form, setForm] = useState({
    hackathonId: '1',
    name: '',
    description: '',
    isOpen: 'true',
  })
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadHackathons() {
      try {
        const items = await fetchHackathons()
        if (!isMounted || items.length === 0) return

        setAvailableHackathons(items)
        setForm((current) => ({
          ...current,
          hackathonId: String(items[0].id),
        }))
      } catch {
        if (!isMounted) return
      }
    }

    loadHackathons()

    return () => {
      isMounted = false
    }
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: value,
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
      await createTeam({
        hackathonId: Number(form.hackathonId),
        name: form.name,
        description: form.description,
        isOpen: form.isOpen === 'true',
      })

      navigate(`/hackathons/${form.hackathonId}`)
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
                  <select
                    className="form-control"
                    name="hackathonId"
                    value={form.hackathonId}
                    onChange={handleChange}
                  >
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
                      '-'}
                  </span>
                </div>
                <div className="info-row">
                  <span>모집 상태</span>
                  <span className="status-pill status-pill--open">
                    {form.isOpen === 'true' ? '모집중' : '모집 안 함'}
                  </span>
                </div>
              </div>
            </section>

            <section className="surface-card surface-card--soft">
              <p className="meta-text">생성 후 흐름</p>
              <ul className="bullet-list">
                <li>팀 생성 완료</li>
                <li>해커톤 참가가 자동으로 처리됨</li>
                <li>해커톤 상세 팀 탭으로 복귀</li>
              </ul>
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
