import { apiRequest, createQueryString, extractArray, extractObject } from './client.js'
import { getAccessToken } from '../lib/auth.js'

const periodMap = {
  all: 'all',
  month: '30d',
  week: '7d',
}

function normalizeRanking(item, index) {
  return {
    userId: item.userId ?? item.id ?? index + 1,
    rank: item.rank ?? item.rankNo ?? index + 1,
    nickname: item.nickname ?? item.userNickname ?? item.name ?? `user_${index + 1}`,
    score: item.score ?? item.points ?? item.point ?? 0,
    participationCount:
      item.participationCount ?? item.participation ?? item.joinedCount ?? 0,
    completedCount:
      item.completedCount ?? item.completionCount ?? item.submittedCount ?? 0,
    submitRate:
      typeof item.submitRate === 'string'
        ? item.submitRate
        : `${item.submitRate ?? item.submissionRate ?? 0}%`,
    bestRank:
      item.bestRank ??
      item.bestRankLabel ??
      `${item.bestRankNo ?? item.rank ?? index + 1}위`,
    isMe: Boolean(item.isMe),
  }
}

export async function fetchScoreRankings(period = 'all') {
  const query = createQueryString({ period: periodMap[period] ?? period })
  const payload = await apiRequest(`/rankings${query}`)
  return extractArray(payload).map(normalizeRanking)
}

export async function fetchParticipationRankings(period = 'all') {
  const query = createQueryString({ period: periodMap[period] ?? period })
  const payload = await apiRequest(`/rankings/participation${query}`)
  return extractArray(payload).map(normalizeRanking)
}

export async function fetchMyRanking() {
  const payload = await apiRequest('/rankings/me', {
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
  })
  const data = extractObject(payload)
  return {
    score: data.score ?? null,
    participation: data.participation ?? null,
  }
}
