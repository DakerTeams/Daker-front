import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login } from '../api/auth.js'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({
    email: '',
    password: '',
  })
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      await login(form)
      navigate(location.state?.from || '/', { replace: true })
    } catch {
      setErrorMessage('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <div className="auth-card__brand">
          <span className="auth-card__brand-prefix">&gt;</span>
          <span>HackHub_</span>
        </div>

        <div className="auth-card__header">
          <h1>다시 만나서 반가워요!</h1>
          <p>해커톤 플랫폼에 로그인하세요.</p>
        </div>

        <button type="button" className="auth-social-button" disabled>
          <span className="auth-social-button__icon">◔</span>
          GitHub으로 로그인
        </button>

        <div className="auth-divider">
          <span />
          <em>또는 이메일로</em>
          <span />
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span className="auth-field__label">
              이메일 <strong>*</strong>
            </span>
            <input
              type="email"
              name="email"
              className="auth-input"
              placeholder="jinwoo@example.com"
              value={form.email}
              onChange={handleChange}
            />
          </label>

          <label className="auth-field">
            <span className="auth-field__label">
              비밀번호 <strong>*</strong>
            </span>
            <input
              type="password"
              name="password"
              className="auth-input"
              placeholder="비밀번호를 입력하세요"
              value={form.password}
              onChange={handleChange}
            />
          </label>

          <button type="submit" className="auth-submit-button">
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {errorMessage ? <div className="auth-demo-note">{errorMessage}</div> : null}

        <p className="auth-footer">
          계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </p>
      </div>
    </section>
  )
}

export default LoginPage
