import { Link } from 'react-router-dom'

function SignupPage() {
  return (
    <section className="auth-page">
      <div className="auth-card auth-card--placeholder">
        <div className="auth-card__brand">
          <span className="auth-card__brand-prefix">&gt;</span>
          <span>HackHub_</span>
        </div>
        <div className="auth-card__header">
          <h1>회원가입 준비 중</h1>
          <p>로그인 화면 작업에 맞춰 이후 단계에서 회원가입 폼을 연결합니다.</p>
        </div>
        <Link to="/login" className="auth-submit-button auth-submit-button--link">
          로그인으로 돌아가기
        </Link>
      </div>
    </section>
  )
}

export default SignupPage
