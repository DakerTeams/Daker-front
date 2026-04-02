import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signup } from '../api/auth.js'
import { normalizeAuthErrorMessage, resolveAuthErrorField } from '../lib/auth-error.js'

function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nickname: '',
    email: '',
    password: '',
  })
  const [fieldErrors, setFieldErrors] = useState({
    nickname: '',
    email: '',
    password: '',
    form: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      nickname: '',
      email: '',
      password: '',
      form: '',
    }

    if (!form.nickname.trim()) {
      nextFieldErrors.nickname = '닉네임을 입력해주세요.'
    }

    if (!form.email.trim()) {
      nextFieldErrors.email = '이메일을 입력해주세요.'
    }

    if (!form.password) {
      nextFieldErrors.password = '비밀번호를 입력해주세요.'
    }

    if (nextFieldErrors.nickname || nextFieldErrors.email || nextFieldErrors.password) {
      setFieldErrors(nextFieldErrors)
      setIsSubmitting(false)
      return
    }

    setFieldErrors(nextFieldErrors)

    try {
      await signup(form)
      navigate('/login')
    } catch (error) {
      const message = normalizeAuthErrorMessage(
        error.message ?? '회원가입에 실패했습니다. 입력값을 다시 확인해주세요.'
      )
      const field = resolveAuthErrorField(message)

      if (field === 'email') {
        setFieldErrors((current) => ({
          ...current,
          email: message,
        }))
      } else if (field === 'nickname') {
        setFieldErrors((current) => ({
          ...current,
          nickname: message,
        }))
      } else if (field === 'password') {
        setFieldErrors((current) => ({
          ...current,
          password: message,
        }))
      } else {
        setFieldErrors((current) => ({
          ...current,
          form: message,
        }))
      }
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
          <h1>개발자들의 무대에 오신 걸 환영해요</h1>
          <p>계정을 만들고 첫 해커톤에 참가해보세요.</p>
        </div>

        <button type="button" className="auth-social-button" disabled>
          <span className="auth-social-button__icon">◔</span>
          GitHub으로 가입 (추천)
        </button>
        <p className="auth-helper-copy">
          GitHub으로 가입하면 프로필이 자동으로 채워져요.
        </p>

        <div className="auth-divider">
          <span />
          <em>또는 이메일로</em>
          <span />
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span className="auth-field__label">
              닉네임 <strong>*</strong>
            </span>
            <input
              type="text"
              name="nickname"
              className={`auth-input${fieldErrors.nickname ? ' auth-input--error' : ''}`}
              placeholder="jinwoo_k"
              value={form.nickname}
              onChange={handleChange}
            />
            {fieldErrors.nickname ? (
              <small className="auth-field__error">{fieldErrors.nickname}</small>
            ) : (
              <small className="auth-field__hint">
                영문, 숫자, 언더스코어 사용 가능 (2~20자)
              </small>
            )}
          </label>

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
              placeholder="8자 이상, 특수문자 포함"
              value={form.password}
              onChange={handleChange}
            />
            {fieldErrors.password ? (
              <small className="auth-field__error">{fieldErrors.password}</small>
            ) : null}
          </label>

          {fieldErrors.form ? (
            <p className="auth-form__error">{fieldErrors.form}</p>
          ) : null}

          <button type="submit" className="auth-submit-button">
            {isSubmitting ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className="auth-footer">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </section>
  )
}

export default SignupPage
