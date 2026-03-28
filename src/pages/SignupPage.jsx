import { Link } from 'react-router-dom'

function SignupPage() {
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

        <button type="button" className="auth-social-button">
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

        <form className="auth-form">
          <label className="auth-field">
            <span className="auth-field__label">
              닉네임 <strong>*</strong>
            </span>
            <input type="text" className="auth-input" placeholder="jinwoo_k" />
            <small className="auth-field__hint">
              영문, 숫자, 언더스코어 사용 가능 (2~20자)
            </small>
          </label>

          <label className="auth-field">
            <span className="auth-field__label">
              이메일 <strong>*</strong>
            </span>
            <input
              type="email"
              className="auth-input"
              placeholder="jinwoo@example.com"
            />
          </label>

          <label className="auth-field">
            <span className="auth-field__label">
              비밀번호 <strong>*</strong>
            </span>
            <input
              type="password"
              className="auth-input"
              placeholder="8자 이상, 특수문자 포함"
            />
          </label>

          <button type="submit" className="auth-submit-button">
            회원가입
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
