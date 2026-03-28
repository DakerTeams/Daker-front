import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchHackathons } from '../api/hackathons.js'
import { fetchPlatformStats } from '../api/stats.js'
import { hackathons } from '../mock/hackathons.js'

const typewriterWords = ['Build.', 'Compete.', 'Win.']
const cumulativeLengths = typewriterWords.reduce((accumulator, word, index) => {
  const previous = index === 0 ? 0 : accumulator[index - 1]
  accumulator.push(previous + word.length)
  return accumulator
}, [])

function MainPage() {
  const totalLength = cumulativeLengths[cumulativeLengths.length - 1]
  const [displayedLength, setDisplayedLength] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [visibleHackathons, setVisibleHackathons] = useState(
    hackathons.filter((item) => item.status === 'open'),
  )
  const [stats, setStats] = useState({
    participants: 478,
    activeHackathons: 4,
    totalPrize: '₩11,000,000',
  })

  const renderedWords = useMemo(
    () =>
      typewriterWords.map((word, index) => {
        const previousLength = index === 0 ? 0 : cumulativeLengths[index - 1]
        const visibleLength = Math.max(
          0,
          Math.min(word.length, displayedLength - previousLength),
        )

        return word.slice(0, visibleLength)
      }),
    [displayedLength],
  )

  useEffect(() => {
    const timeout = window.setTimeout(
      () => {
        if (!isDeleting && displayedLength < totalLength) {
          setDisplayedLength((value) => value + 1)
          return
        }

        if (!isDeleting && displayedLength === totalLength) {
          setIsDeleting(true)
          return
        }

        if (isDeleting && displayedLength > 0) {
          setDisplayedLength((value) => value - 1)
          return
        }

        setDisplayedLength(0)
        setIsDeleting(false)
      },
      !isDeleting && displayedLength === totalLength
        ? 900
        : isDeleting
          ? 70
          : 110,
    )

    return () => window.clearTimeout(timeout)
  }, [displayedLength, isDeleting, totalLength])

  useEffect(() => {
    let isMounted = true

    async function loadPublicData() {
      try {
        const [hackathonResponse, statsResponse] = await Promise.all([
          fetchHackathons(),
          fetchPlatformStats(),
        ])

        if (!isMounted) return

        if (hackathonResponse.length > 0) {
          setVisibleHackathons(
            hackathonResponse.filter((item) => item.status === 'open'),
          )
        }

        setStats(statsResponse)
      } catch {
        if (!isMounted) return

        setVisibleHackathons(hackathons.filter((item) => item.status === 'open'))
      }
    }

    loadPublicData()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section className="page-section">
      <div className="main-banner">
        <div className="main-banner__content">
          <div className="main-banner__left">
            <p className="banner-label">// HACKATHON PLATFORM v2.0</p>
            <h1 className="banner-title">
              <span>{renderedWords[0]}</span>
              <br />
              <span>{renderedWords[1]}</span>
              <br />
              <span className="banner-title__accent">
                {renderedWords[2]}
                <span className="banner-type-cursor">|</span>
              </span>
            </h1>
            <p className="banner-subtitle">
              팀을 만들고, 해커톤에 참가하고,
              <br />
              실력으로 랭킹을 올려보세요.
            </p>
            <div className="banner-actions">
              <Link to="/hackathons" className="banner-button banner-button--primary">
                해커톤 둘러보기
              </Link>
              <Link to="/camp" className="banner-button banner-button--ghost">
                팀 찾기
              </Link>
            </div>
            <div className="banner-stats">
              <div>
                <strong>{stats.participants}+</strong>
                <span>참가자</span>
              </div>
              <div>
                <strong>{stats.activeHackathons}</strong>
                <span>진행 해커톤</span>
              </div>
              <div>
                <strong>{stats.totalPrize}</strong>
                <span>총 상금</span>
              </div>
            </div>
          </div>

          <div className="code-window">
            <div className="code-window__header">
              <span />
              <span />
              <span />
            </div>
            <code className="code-window__body">
              <span className="code-comment">// hackathon.config.ts</span>
              <span>
                <span className="code-keyword">export const</span>{' '}
                <span className="code-function">config</span> = {'{'}
              </span>
              <span>  name: <span className="code-string">"AI Summit 2026"</span>,</span>
              <span>  status: <span className="code-string">"open"</span>,</span>
              <span>  prize: <span className="code-string">"₩3,000,000"</span>,</span>
              <span>  tags: [<span className="code-string">"AI/ML"</span>, <span className="code-string">"Web"</span>],</span>
              <span>  maxTeamSize: 4,</span>
              <span>{'}'}</span>
              <span />
              <span>
                <span className="code-keyword">await</span>{' '}
                <span className="code-function">hackathon</span>.join(config)
              </span>
            </code>
          </div>
        </div>
      </div>

      <section className="main-hero">
        <div className="page-header page-header--center">
          <h1>
            개발자들의 무대,
            <br />
            <span className="headline-accent">지금 시작하세요</span>
          </h1>
          <p className="page-description">
            해커톤 참가, 팀원 모집, 성과 랭킹까지 한 곳에서.
          </p>
        </div>

        <div className="hero-cards">
          <Link to="/hackathons" className="hero-card">
            <div className="hero-card__icon">🏆</div>
            <h2>해커톤 보러가기</h2>
            <p>진행 중이거나 예정된 해커톤을 확인하고 지금 바로 참가하세요.</p>
            <span className="hero-card__arrow">목록 보기 →</span>
          </Link>
          <Link to="/camp" className="hero-card">
            <div className="hero-card__icon">🤝</div>
            <h2>팀 찾기</h2>
            <p>함께할 팀원을 모집하거나, 마음에 드는 팀에 지원해 보세요.</p>
            <span className="hero-card__arrow">팀 탐색하기 →</span>
          </Link>
          <Link to="/rankings" className="hero-card">
            <div className="hero-card__icon">📊</div>
            <h2>랭킹 보기</h2>
            <p>전체 참가자 중 나의 위치는 어디인지 지금 바로 확인해보세요.</p>
            <span className="hero-card__arrow">랭킹 확인 →</span>
          </Link>
        </div>
      </section>

      <section className="page-section">
        <div className="section-head">
          <h2>지금 모집 중인 해커톤</h2>
        </div>
        <div className="stack-list">
          {visibleHackathons.map((hackathon) => (
              <Link
                key={hackathon.id ?? hackathon.slug}
                to={`/hackathons/${hackathon.id ?? hackathon.slug}`}
                className="surface-card surface-card--link hackathon-card"
              >
                <div className="row-between row-between--start">
                  <div className="stack-list stack-list--compact">
                    <div className="row-between row-between--wrap">
                      <h2>{hackathon.title}</h2>
                      <span className={`status-pill status-pill--${hackathon.status}`}>
                        {hackathon.statusLabel}
                      </span>
                    </div>
                    <p>{hackathon.summary}</p>
                  </div>
                  <div className="hackathon-card__meta">
                    <span>{hackathon.startDate}</span>
                    <span>{hackathon.endDate}</span>
                  </div>
                </div>
              </Link>
          ))}
        </div>
      </section>
    </section>
  )
}

export default MainPage
