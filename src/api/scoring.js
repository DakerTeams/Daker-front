import { apiRequest, extractArray, extractObject } from './client.js'
import { getAccessToken } from '../lib/auth.js'

function authHeader() {
  return { Authorization: `Bearer ${getAccessToken()}` }
}

// 점수형 채점 — POST /hackathons/{id}/scores
// payload: { teamId, scores: [{ criteriaId, score }] }
export async function submitScores(hackathonId, payload) {
  const response = await apiRequest(`/hackathons/${hackathonId}/scores`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(payload),
  })
  return extractObject(response)
}

// 투표형 채점 — POST /hackathons/{id}/votes
// payload: { votes: [{ teamId, voteRank }] }
export async function submitVotes(hackathonId, payload) {
  const response = await apiRequest(`/hackathons/${hackathonId}/votes`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(payload),
  })
  return extractObject(response)
}

// 내 채점 현황 조회 — GET /hackathons/{id}/scores
export async function fetchMyScores(hackathonId) {
  const payload = await apiRequest(`/hackathons/${hackathonId}/scores`, {
    headers: authHeader(),
  })
  return extractArray(payload)
}
