import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createAdminHackathon, fetchAdminHackathons, updateAdminHackathon } from '../api/admin.js'

const scoreTypeOptions = [
  { value: 'JUDGE', label: 'JUDGE (심사위원)' },
  { value: 'SCORE', label: 'SCORE (점수)' },
  { value: 'VOTE', label: 'VOTE (투표)' },
]

const hackathonStatusOptions = [
  { value: 'UPCOMING', label: '모집예정' },
  { value: 'OPEN', label: '모집중' },
  { value: 'CLOSED', label: '마감' },
  { value: 'ENDED', label: '종료' },
]

const linkTypeOptions = ['WEBSITE', 'GITHUB', 'NOTION', 'DISCORD', 'OTHER']

function formatDateTimeInput(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function createEmptyForm() {
  return {
    title: '',
    summary: '',
    description: '',
    thumbnailUrl: '',
    organizerName: '',
    status: 'UPCOMING',
    scoreType: 'JUDGE',
    registrationStartAt: '',
    registrationEndAt: '',
    startAt: '',
    endAt: '',
    submissionDeadlineAt: '',
    maxTeamSize: '4',
    maxParticipants: '',
    campEnabled: false,
    allowSolo: false,
    tags: '',
    prizes: [],
    criteria: [],
    milestones: [],
    notices: [],
    links: [],
  }
}

function buildFormFromItem(item) {
  if (!item) return createEmptyForm()
  return {
    title: item.title ?? '',
    summary: item.summary ?? '',
    description: item.description ?? '',
    thumbnailUrl: item.thumbnailUrl ?? '',
    organizerName: item.organizerName ?? '',
    status: String(item.status ?? 'UPCOMING').toUpperCase(),
    scoreType: item.scoreType ?? 'JUDGE',
    registrationStartAt: formatDateTimeInput(item.registrationStartAt),
    registrationEndAt: formatDateTimeInput(item.registrationEndAt),
    startAt: formatDateTimeInput(item.startAt),
    endAt: formatDateTimeInput(item.endAt),
    submissionDeadlineAt: formatDateTimeInput(item.submissionDeadlineAt),
    maxTeamSize: String(item.maxTeamSize ?? 4),
    maxParticipants: item.maxParticipants ? String(item.maxParticipants) : '',
    campEnabled: Boolean(item.campEnabled),
    allowSolo: Boolean(item.allowSolo),
    tags: Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags ?? ''),
    prizes: Array.isArray(item.prizes) ? item.prizes : [],
    criteria: Array.isArray(item.criteria) ? item.criteria : [],
    milestones: Array.isArray(item.milestones) ? item.milestones : [],
    notices: Array.isArray(item.notices) ? item.notices : [],
    links: Array.isArray(item.links) ? item.links : [],
  }
}

function buildPayload(form) {
  const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean)
  return {
    title: form.title.trim(),
    summary: form.summary.trim() || null,
    description: form.description.trim() || null,
    thumbnailUrl: form.thumbnailUrl.trim() || null,
    organizerName: form.organizerName.trim(),
    status: form.status,
    scoreType: form.scoreType,
    registrationStartAt: form.registrationStartAt || null,
    registrationEndAt: form.registrationEndAt || null,
    startAt: form.startAt || null,
    endAt: form.endAt || null,
    submissionDeadlineAt: form.submissionDeadlineAt || null,
    maxTeamSize: Number(form.maxTeamSize),
    maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : null,
    campEnabled: form.campEnabled,
    allowSolo: form.allowSolo,
    tags: tags.length > 0 ? tags : undefined,
    prizes: form.prizes.length > 0 ? form.prizes : undefined,
    criteria: form.criteria.length > 0 ? form.criteria : undefined,
    milestones: form.milestones.length > 0 ? form.milestones : undefined,
    notices: form.notices.length > 0 ? form.notices : undefined,
    links: form.links.length > 0 ? form.links : undefined,
  }
}

function ListField({ label, items, onAdd, onRemove, onUpdate, renderRow }) {
  return (
    <div className="admin-form-section">
      <div className="admin-form-section__head">
        <span>{label}</span>
        <button type="button" className="admin-form-add-btn" onClick={onAdd}>+ 추가</button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="admin-form-row">
          {renderRow(item, i, (patch) => onUpdate(i, patch))}
          <button type="button" className="admin-form-remove-btn" onClick={() => onRemove(i)}>✕</button>
        </div>
      ))}
    </div>
  )
}

function AdminHackathonFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(createEmptyForm)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    fetchAdminHackathons()
      .then((list) => {
        const found = list.find((h) => String(h.id) === String(id))
        if (found) setForm(buildFormFromItem(found))
      })
      .catch(() => setError('해커톤 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  function set(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function updateList(field, i, patch) {
    setForm((prev) => {
      const next = [...prev[field]]
      next[i] = { ...next[i], ...patch }
      return { ...prev, [field]: next }
    })
  }

  function addToList(field, empty) {
    setForm((prev) => ({ ...prev, [field]: [...prev[field], empty] }))
  }

  function removeFromList(field, i) {
    setForm((prev) => ({ ...prev, [field]: prev[field].filter((_, j) => j !== i) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.organizerName.trim() || !form.startAt || !form.endAt || !form.registrationStartAt || !form.registrationEndAt) {
      setError('제목, 주최자, 모집 기간, 진행 기간은 필수입니다.')
      return
    }
    if (Number(form.maxTeamSize) <= 0) {
      setError('최대 팀 인원은 1 이상이어야 합니다.')
      return
    }
    setError('')
    setSaving(true)
    try {
      const payload = buildPayload(form)
      if (isEdit) {
        await updateAdminHackathon(id, payload)
      } else {
        await createAdminHackathon(payload)
      }
      navigate('/admin')
    } catch (err) {
      setError(err.message || '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="page-section"><p className="admin-subtitle">불러오는 중...</p></div>

  return (
    <section className="page-section">
      <div className="admin-form-page">
        <div className="admin-form-page__header">
          <button type="button" className="admin-form-back-btn" onClick={() => navigate('/admin')}>← 관리자 페이지</button>
          <h1 className="admin-title">{isEdit ? '해커톤 수정' : '해커톤 등록'}</h1>
        </div>

        <form className="admin-form-page__body" onSubmit={handleSubmit}>

          {/* 기본 정보 */}
          <section className="admin-form-card">
            <h2 className="admin-form-card__title">기본 정보</h2>
            <div className="admin-form-grid">
              <label className="mypage-modal__label admin-form-label--full">
                해커톤명 *
                <input className="mypage-modal__input" value={form.title} onChange={(e) => set('title', e.target.value)} />
              </label>
              <label className="mypage-modal__label admin-form-label--full">
                한 줄 소개
                <input className="mypage-modal__input" value={form.summary} onChange={(e) => set('summary', e.target.value)} />
              </label>
              <label className="mypage-modal__label admin-form-label--full">
                상세 설명
                <textarea className="mypage-modal__input mypage-modal__textarea" rows={5} value={form.description} onChange={(e) => set('description', e.target.value)} />
              </label>
              <label className="mypage-modal__label admin-form-label--full">
                썸네일 URL
                <input className="mypage-modal__input" placeholder="https://..." value={form.thumbnailUrl} onChange={(e) => set('thumbnailUrl', e.target.value)} />
              </label>
              <label className="mypage-modal__label">
                주최자 *
                <input className="mypage-modal__input" value={form.organizerName} onChange={(e) => set('organizerName', e.target.value)} />
              </label>
              <label className="mypage-modal__label">
                태그 (쉼표 구분)
                <input className="mypage-modal__input" placeholder="AI, ML, 웹개발" value={form.tags} onChange={(e) => set('tags', e.target.value)} />
              </label>
            </div>
          </section>

          {/* 설정 */}
          <section className="admin-form-card">
            <h2 className="admin-form-card__title">설정</h2>
            <div className="admin-form-grid">
              <label className="mypage-modal__label">
                모집 상태
                <select className="mypage-modal__input" value={form.status} onChange={(e) => set('status', e.target.value)}>
                  {hackathonStatusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
              <label className="mypage-modal__label">
                심사 방식 *
                <select className="mypage-modal__input" value={form.scoreType} onChange={(e) => set('scoreType', e.target.value)}>
                  {scoreTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
              <label className="mypage-modal__label">
                최대 팀 인원 *
                <input type="number" min="1" className="mypage-modal__input" value={form.maxTeamSize} onChange={(e) => set('maxTeamSize', e.target.value)} />
              </label>
              <label className="mypage-modal__label">
                최대 참가자 수
                <input type="number" min="1" className="mypage-modal__input" value={form.maxParticipants} onChange={(e) => set('maxParticipants', e.target.value)} />
              </label>
              <div className="admin-form-toggles">
                <label className="mypage-modal__toggle">
                  <input type="checkbox" checked={form.campEnabled} onChange={(e) => set('campEnabled', e.target.checked)} />
                  팀원 모집 사용
                </label>
                <label className="mypage-modal__toggle">
                  <input type="checkbox" checked={form.allowSolo} onChange={(e) => set('allowSolo', e.target.checked)} />
                  개인 참가 허용
                </label>
              </div>
            </div>
          </section>

          {/* 일정 */}
          <section className="admin-form-card">
            <h2 className="admin-form-card__title">일정</h2>
            <div className="admin-form-grid">
              <label className="mypage-modal__label">
                모집 시작 *
                <input type="datetime-local" className="mypage-modal__input" value={form.registrationStartAt} onChange={(e) => set('registrationStartAt', e.target.value)} />
              </label>
              <label className="mypage-modal__label">
                모집 종료 *
                <input type="datetime-local" className="mypage-modal__input" value={form.registrationEndAt} onChange={(e) => set('registrationEndAt', e.target.value)} />
              </label>
              <label className="mypage-modal__label">
                해커톤 시작 *
                <input type="datetime-local" className="mypage-modal__input" value={form.startAt} onChange={(e) => set('startAt', e.target.value)} />
              </label>
              <label className="mypage-modal__label">
                해커톤 종료 *
                <input type="datetime-local" className="mypage-modal__input" value={form.endAt} onChange={(e) => set('endAt', e.target.value)} />
              </label>
              <label className="mypage-modal__label">
                제출 마감
                <input type="datetime-local" className="mypage-modal__input" value={form.submissionDeadlineAt} onChange={(e) => set('submissionDeadlineAt', e.target.value)} />
              </label>
            </div>
          </section>

          {/* 상금 */}
          <section className="admin-form-card">
            <h2 className="admin-form-card__title">상금</h2>
            <ListField
              label=""
              items={form.prizes}
              onAdd={() => addToList('prizes', { rank: form.prizes.length + 1, label: '', amount: '' })}
              onRemove={(i) => removeFromList('prizes', i)}
              onUpdate={(i, patch) => updateList('prizes', i, patch)}
              renderRow={(item, i, update) => (
                <>
                  <input className="mypage-modal__input admin-form-row__small" type="number" placeholder="순위" value={item.rank} onChange={(e) => update({ rank: Number(e.target.value) })} />
                  <input className="mypage-modal__input" placeholder="라벨 (대상)" value={item.label} onChange={(e) => update({ label: e.target.value })} />
                  <input className="mypage-modal__input" placeholder="금액 (500만원)" value={item.amount} onChange={(e) => update({ amount: e.target.value })} />
                </>
              )}
            />
          </section>

          {/* 평가 기준 */}
          <section className="admin-form-card">
            <h2 className="admin-form-card__title">평가 기준</h2>
            <ListField
              label=""
              items={form.criteria}
              onAdd={() => addToList('criteria', { label: '', weight: '', maxScore: '' })}
              onRemove={(i) => removeFromList('criteria', i)}
              onUpdate={(i, patch) => updateList('criteria', i, patch)}
              renderRow={(item, i, update) => (
                <>
                  <input className="mypage-modal__input" placeholder="항목명" value={item.label} onChange={(e) => update({ label: e.target.value })} />
                  <input className="mypage-modal__input admin-form-row__small" placeholder="비중 (40%)" value={item.weight} onChange={(e) => update({ weight: e.target.value })} />
                  <input className="mypage-modal__input admin-form-row__small" type="number" placeholder="최고점" value={item.maxScore} onChange={(e) => update({ maxScore: e.target.value ? Number(e.target.value) : '' })} />
                </>
              )}
            />
          </section>

          {/* 마일스톤 */}
          <section className="admin-form-card">
            <h2 className="admin-form-card__title">일정 (Milestones)</h2>
            <ListField
              label=""
              items={form.milestones}
              onAdd={() => addToList('milestones', { label: '', date: '' })}
              onRemove={(i) => removeFromList('milestones', i)}
              onUpdate={(i, patch) => updateList('milestones', i, patch)}
              renderRow={(item, i, update) => (
                <>
                  <input className="mypage-modal__input" placeholder="라벨" value={item.label} onChange={(e) => update({ label: e.target.value })} />
                  <input className="mypage-modal__input" type="datetime-local" value={item.date ? formatDateTimeInput(item.date) : ''} onChange={(e) => update({ date: e.target.value })} />
                </>
              )}
            />
          </section>

          {/* 공지사항 */}
          <section className="admin-form-card">
            <h2 className="admin-form-card__title">공지사항</h2>
            <ListField
              label=""
              items={form.notices}
              onAdd={() => addToList('notices', { content: '' })}
              onRemove={(i) => removeFromList('notices', i)}
              onUpdate={(i, patch) => updateList('notices', i, patch)}
              renderRow={(item, i, update) => (
                <input className="mypage-modal__input" placeholder="공지 내용" value={item.content} onChange={(e) => update({ content: e.target.value })} />
              )}
            />
          </section>

          {/* 링크 */}
          <section className="admin-form-card">
            <h2 className="admin-form-card__title">링크</h2>
            <ListField
              label=""
              items={form.links}
              onAdd={() => addToList('links', { linkType: 'WEBSITE', label: '', url: '' })}
              onRemove={(i) => removeFromList('links', i)}
              onUpdate={(i, patch) => updateList('links', i, patch)}
              renderRow={(item, i, update) => (
                <>
                  <select className="mypage-modal__input admin-form-row__small" value={item.linkType} onChange={(e) => update({ linkType: e.target.value })}>
                    {linkTypeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input className="mypage-modal__input admin-form-row__small" placeholder="라벨" value={item.label} onChange={(e) => update({ label: e.target.value })} />
                  <input className="mypage-modal__input" placeholder="https://..." value={item.url} onChange={(e) => update({ url: e.target.value })} />
                </>
              )}
            />
          </section>

          {error && <p className="mypage-modal__error">{error}</p>}

          <div className="admin-form-page__footer">
            <button type="button" className="team-secondary-button" onClick={() => navigate('/admin')}>취소</button>
            <button type="submit" className="team-primary-button" disabled={saving}>
              {saving ? '저장 중...' : isEdit ? '수정 완료' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

export default AdminHackathonFormPage
