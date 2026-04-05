import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchMe } from '../api/auth.js'
import { clearAuthSession, saveAuthSession } from '../lib/auth.js'
import { normalizeAuthErrorMessage } from '../lib/auth-error.js'

function parseAuthHash(hashValue) {
  const searchParams = new URLSearchParams(hashValue.replace(/^#/, ''))
  const expiresIn = searchParams.get('expiresIn')
  return {
    accessToken: searchParams.get('accessToken') ?? '',
    refreshToken: searchParams.get('refreshToken') ?? '',
    expiresIn: expiresIn ? Number(expiresIn) : null,
  }
}

function GithubAuthCallbackPage() {
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function completeGithubLogin() {
      const query = new URLSearchParams(window.location.search)
      const rawError = query.get('error')

      if (rawError) {
        clearAuthSession()
        setErrorMessage(normalizeAuthErrorMessage(rawError))
        return
      }

      const { accessToken, refreshToken, expiresIn } = parseAuthHash(window.location.hash)
      if (!accessToken || !refreshToken) {
        clearAuthSession()
        setErrorMessage('GitHub 로그인 응답이 올바르지 않습니다. 다시 시도해주세요.')
        return
      }

      try {
        window.history.replaceState({}, document.title, window.location.pathname)
        clearAuthSession()
        saveAuthSession({
          accessToken,
          refreshToken,
          user: null,
          expiresIn,
        })
        await fetchMe()
        navigate('/', { replace: true })
      } catch (error) {
        clearAuthSession()
        setErrorMessage(
          normalizeAuthErrorMessage(
            error?.message ?? 'GitHub 로그인 처리에 실패했습니다. 다시 시도해주세요.'
          )
        )
      }
    }

    completeGithubLogin()
  }, [navigate])

  if (!errorMessage) {
    return (
      <section className="auth-page">
        <div className="auth-card">
          <div className="auth-card__header">
            <h1>GitHub 로그인 처리 중입니다</h1>
            <p>잠시만 기다려주세요.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <h1>GitHub 로그인에 실패했습니다</h1>
          <p>{errorMessage}</p>
        </div>

        <p className="auth-footer">
          <Link to="/login">로그인 페이지로 돌아가기</Link>
        </p>
      </div>
    </section>
  )
}

export default GithubAuthCallbackPage
