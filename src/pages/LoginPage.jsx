import { Link } from 'react-router-dom'

function LoginPage() {
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

        <button type="button" className="auth-social-button">
          <span className="auth-social-button__icon">◔</span>
          GitHub으로 로그인
        </button>

        <div className="auth-divider">
          <span />
          <em>또는 이메일로</em>
          <span />
        </div>

        <form className="auth-form">
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
              placeholder="비밀번호를 입력하세요"
            />
          </label>

          <button type="submit" className="auth-submit-button">
            로그인
          </button>
        </form>

        <div className="auth-demo-note">
          <p>💡 데모: 아무 값이나 입력하고 로그인하면</p>
          <strong>jinwoo_k로 접속됩니다.</strong>
        </div>

        <p className="auth-footer">
          계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </p>
      </div>
    </section>
  )
}

export default LoginPage
