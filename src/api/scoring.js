import { apiRequest, extractObject } from './client.js'
import { getAccessToken } from '../lib/auth.js'

function authHeader() {
  return { Authorization: `Bearer ${getAccessToken()}` }
}

// 배정된 해커톤 목록 — GET /judges/hackathons
export async function fetchJudgeHackathons() {
  const payload = await apiRequest('/judges/hackathons', { headers: authHeader() })
  const data = extractObject(payload)
  return Array.isArray(data.items) ? data.items : []
}

// 심사 대상 팀 목록 + 채점 현황 — GET /judges/hackathons/{id}/teams
export async function fetchJudgeTeams(hackathonId) {
  const payload = await apiRequest(`/judges/hackathons/${hackathonId}/teams`, {
    headers: authHeader(),
  })
  return extractObject(payload)
}

// 팀 제출물 조회 — GET /judges/hackathons/{hackathonId}/teams/{teamId}/submission
export async function fetchJudgeSubmission(hackathonId, teamId) {
  const payload = await apiRequest(
    `/judges/hackathons/${hackathonId}/teams/${teamId}/submission`,
    { headers: authHeader() },
  )
  return extractObject(payload)
}

// 팀 채점 저장 — POST /judges/hackathons/{hackathonId}/teams/{teamId}
// payload: { scores: [{ score: number }, ...] }
export async function submitJudgeScore(hackathonId, teamId, scores) {
  const response = await apiRequest(`/judges/hackathons/${hackathonId}/teams/${teamId}`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({ scores }),
  })
  return extractObject(response)
}
