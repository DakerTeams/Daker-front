import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getGithubLoginUrl, login } from '../api/auth.js'
import { normalizeAuthErrorMessage, resolveAuthErrorField } from '../lib/auth-error.js'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({
    email: '',
    password: '',
  })
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: '',
    form: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleGithubLogin = () => {
    window.location.assign(getGithubLoginUrl())
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: value,
    }))
    setFieldErrors((current) => ({
      ...current,
      [name]: '',
      form: '',
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    const nextFieldErrors = {
      email: '',
      password: '',
      form: '',
    }

    if (!form.email.trim()) {
      nextFieldErrors.email = '이메일을 입력해주세요.'
    }

    if (!form.password) {
      nextFieldErrors.password = '비밀번호를 입력해주세요.'
    }

    if (nextFieldErrors.email || nextFieldErrors.password) {
      setFieldErrors(nextFieldErrors)
      setIsSubmitting(false)
      return
    }

    setFieldErrors(nextFieldErrors)

    try {
      await login(form)
      navigate(location.state?.from || '/', { replace: true })
    } catch (error) {
      const message = normalizeAuthErrorMessage(
        error.message || '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.'
      )
      const field = resolveAuthErrorField(message)

      if (field === 'email') {
        setFieldErrors({
          email: message,
          password: '',
          form: '',
        })
        return
      }

      if (field === 'password') {
        setFieldErrors({
          email: '',
          password: message,
          form: '',
        })
        return
      }

      setFieldErrors({
        email: '',
        password: '',
        form: message,
      })
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

        <button type="button" className="auth-social-button" onClick={handleGithubLogin}>
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
              className={`auth-input${fieldErrors.email ? ' auth-input--error' : ''}`}
              placeholder="jinwoo@example.com"
              value={form.email}
              onChange={handleChange}
            />
            {fieldErrors.email ? (
              <small className="auth-field__error">{fieldErrors.email}</small>
            ) : null}
          </label>

          <label className="auth-field">
            <span className="auth-field__label">
              비밀번호 <strong>*</strong>
            </span>
            <input
              type="password"
              name="password"
              className={`auth-input${fieldErrors.password ? ' auth-input--error' : ''}`}
              placeholder="비밀번호를 입력하세요"
              value={form.password}
              onChange={handleChange}
            />
            {fieldErrors.password ? (
              <small className="auth-field__error">{fieldErrors.password}</small>
            ) : null}
          </label>

          {fieldErrors.form ? <p className="auth-form__error">{fieldErrors.form}</p> : null}

          <button type="submit" className="auth-submit-button">
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="auth-footer">
          계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </p>
      </div>
    </section>
  )
}

export default LoginPage
