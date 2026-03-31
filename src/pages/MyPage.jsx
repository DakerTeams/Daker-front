import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchMe } from '../api/auth.js'
import {
  fetchParticipationRankings,
  fetchScoreRankings,
} from '../api/rankings.js'
import { fetchMyTeams } from '../api/teams.js'
import { getStoredUser } from '../lib/auth.js'
import { teams } from '../mock/teams.js'

const participationHistory = [
  {
    title: 'AI Summit 2026',
    period: '2026-04-01 ~ 04-03',
    teamName: 'NeuralNinjas',
    status: '모집 중',
    statusType: 'open',
    rank: '-',
  },
  {
    title: 'Web3 Buildathon',
    period: '2026-03-10 ~ 03-20',
    teamName: 'ChainCrafters',
    status: '진행 중',
    statusType: 'upcoming',
    rank: '2위',
  },
  {
    title: 'Data Quest 2025',
    period: '2025-11-15 ~ 11-17',
    teamName: 'InsightHunters',
    status: '종료',
    statusType: 'closed',
    rank: '1위',
  },
]

function MyPage() {
  const defaultScore = {
    userId: null,
    rank: '-',
    nickname: 'guest',
    score: 0,
    participationCount: 0,
    completedCount: 0,
    submitRate: '0%',
    bestRank: '-',
    isMe: false,
  }

  const [user, setUser] = useState(getStoredUser() ?? {
    nickname: 'jinwoo_k',
    email: 'jinwoo@example.com',
    role: 'user',
  })
  const [myTeams, setMyTeams] = useState(teams)
  const [myScore, setMyScore] = useState(defaultScore)
  const [myParticipationRank, setMyParticipationRank] = useState('-')
  const [scoreRankingTotal, setScoreRankingTotal] = useState(0)

  useEffect(() => {
    let isMounted = true

    async function loadMyPage() {
      try {
        const [me, teamList, scoreRankings, participationRankings] = await Promise.all([
          fetchMe(),
          fetchMyTeams(),
          fetchScoreRankings(),
          fetchParticipationRankings(),
        ])

        if (!isMounted) return

        const resolvedUser = me ?? getStoredUser() ?? user

        if (me) setUser(me)

        if (teamList.length > 0) {
          setMyTeams(teamList)
        }

        const resolvedScore =
          scoreRankings.find((item) => item.isMe) ??
          scoreRankings.find((item) => item.nickname === resolvedUser.nickname) ??
          defaultScore

        const resolvedParticipation =
          participationRankings.find((item) => item.isMe) ??
          participationRankings.find((item) => item.nickname === resolvedUser.nickname) ??
          null

        setMyScore(resolvedScore)
        setMyParticipationRank(resolvedParticipation?.rank ?? '-')
        setScoreRankingTotal(scoreRankings.length)
      } catch {
        if (!isMounted) return

        setMyTeams(
          teams.filter((team) => ['jinwoo_k', 'dart_joon'].includes(team.leader)),
        )
        setMyScore(defaultScore)
        setMyParticipationRank('-')
        setScoreRankingTotal(0)
      }
    }

    loadMyPage()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section className="page-section">
      <section className="mypage-hero">
        <div className="mypage-hero__profile">
          <div className="mypage-hero__avatar">👤</div>
          <div className="mypage-hero__copy">
            <h1>{user.nickname}</h1>
            <p>
              {user.email} <span>•</span> GitHub 연동
            </p>
            <div className="mypage-hero__stats">
              <div>
                <strong>{myScore.score.toLocaleString()}</strong>
                <span>포인트</span>
              </div>
              <div>
                <strong>#{myScore.rank}</strong>
                <span>랭킹</span>
              </div>
              <div>
                <strong>{myScore.participationCount}</strong>
                <span>참가 횟수</span>
              </div>
            </div>
          </div>
        </div>

        <button type="button" className="mypage-hero__edit">
          프로필 수정
        </button>
      </section>

      <div className="mypage-grid">
        <section className="mypage-card">
          <h2 className="mypage-card__title">내 팀 현황</h2>
          <div className="mypage-team-list">
            {myTeams.map((team, index) => (
              <article
                key={team.id}
                className={`mypage-team-item${
                  index === 0 ? ' mypage-team-item--primary' : ''
                }`}
              >
                <div className="mypage-team-item__head">
                  <div>
                    <h3>{team.name}</h3>
                    <p>🏆 {team.hackathonName} · {team.currentMembers}명</p>
                  </div>
                  <span className="mypage-role-badge">
                    {index === 0 ? '팀장' : '팀원'}
                  </span>
                </div>

                {index === 0 && (
                  <div className="mypage-team-item__actions">
                    <button type="button" className="team-primary-button team-primary-button--small">
                      신청 관리
                    </button>
                    <button type="button" className="team-secondary-button team-secondary-button--muted">
                      팀 수정
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="mypage-card">
          <h2 className="mypage-card__title">나의 랭킹</h2>
          <div className="mypage-ranking">
            <strong>#{myScore.rank}</strong>
            <p>점수 기준 · 전체 {scoreRankingTotal}명 중</p>
          </div>
          <div className="mypage-ranking-meta">
            <div className="info-row">
              <span>참여 기준 순위</span>
              <strong>#{myParticipationRank}</strong>
            </div>
            <div className="info-row">
              <span>백분위</span>
              <strong className="ranking-points">
                {scoreRankingTotal > 0 && typeof myScore.rank === 'number'
                  ? `상위 ${(((myScore.rank / scoreRankingTotal) * 100).toFixed(1))}%`
                  : '-'}
              </strong>
            </div>
            <div className="info-row">
              <span>제출률</span>
              <strong>{myScore.submitRate}</strong>
            </div>
          </div>
          <Link to="/rankings" className="mypage-outline-button">
            전체 랭킹 보기
          </Link>
        </section>
      </div>

      <section className="mypage-card">
        <h2 className="mypage-card__title">참가 이력</h2>
        <div className="mypage-history-list">
          {participationHistory.map((item) => (
            <article key={item.title} className="mypage-history-item">
              <div className="mypage-history-item__left">
                <div className="mypage-history-item__icon">🏆</div>
                <div>
                  <h3>{item.title}</h3>
                  <p>
                    {item.period} · {item.teamName}
                  </p>
                </div>
              </div>

              <div className="mypage-history-item__right">
                <span className={`status-outline status-outline--${item.statusType}`}>
                  {item.status}
                </span>
                <strong>{item.rank}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}

export default MyPage
