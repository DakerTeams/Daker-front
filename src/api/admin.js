import { apiRequest, buildApiUrl, createQueryString, extractArray, extractObject } from './client.js'
import { getAccessToken } from '../lib/auth.js'

function authHeader() {
  return { Authorization: `Bearer ${getAccessToken()}` }
}

export async function fetchAdminDashboard(params = {}) {
  const query = createQueryString(params)
  const payload = await apiRequest(`/admin/dashboard${query}`, {
    headers: authHeader(),
  })
  return extractObject(payload)
}

// 해커톤 관리
export async function fetchAdminHackathons(params = {}) {
  const query = createQueryString(params)
  const payload = await apiRequest(`/admin/hackathons${query}`, {
    headers: authHeader(),
  })
  // 실제 응답: { data: { hackathonList: { items: [...] } } }
  const items = payload?.data?.hackathonList?.items
  if (Array.isArray(items)) return items
  return extractArray(payload)
}

export async function createAdminHackathon(payload) {
  const response = await apiRequest('/admin/hackathons', {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(payload),
  })
  return extractObject(response)
}

export async function updateAdminHackathon(id, payload) {
  const response = await apiRequest(`/admin/hackathons/${id}`, {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify(payload),
  })
  return extractObject(response)
}

export async function closeAdminHackathon(id) {
  const response = await apiRequest(`/admin/hackathons/${id}/close`, {
    method: 'PATCH',
    headers: authHeader(),
  })
  return extractObject(response)
}

export async function deleteAdminHackathon(id) {
  return apiRequest(`/admin/hackathons/${id}`, {
    method: 'DELETE',
    headers: authHeader(),
  })
}

// 유저 관리
export async function fetchAdminUsers(params = {}) {
  const query = createQueryString(params)
  const payload = await apiRequest(`/admin/users${query}`, {
    headers: authHeader(),
  })
  return extractArray(payload)
}

export async function changeUserRole(userId, role) {
  const action = role === 'JUDGE' ? 'grant' : 'revoke'

  const response = await apiRequest(`/admin/users/${userId}/judges`, {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify({ action }),
  })
  return extractObject(response)
}

// 제출물 관리
export async function fetchAdminSubmissions(params = {}) {
  const query = createQueryString(params)
  const payload = await apiRequest(`/admin/submissions${query}`, {
    headers: authHeader(),
  })
  return extractArray(payload)
}

export async function fetchAdminSubmissionHackathons() {
  const payload = await apiRequest('/admin/submissions/hackathons', {
    headers: authHeader(),
  })
  return extractArray(payload)
}

export async function fetchAdminSubmissionHackathonDetails(hackathonId) {
  const payload = await apiRequest(`/admin/submissions/hackathons/${hackathonId}`, {
    headers: authHeader(),
  })
  return extractArray(payload)
}

async function downloadWithAuth(path) {
  const response = await fetch(buildApiUrl(path), {
    headers: authHeader(),
  })

  if (!response.ok) {
    throw new Error(`다운로드에 실패했습니다. (${response.status})`)
  }

  const disposition = response.headers.get('content-disposition') ?? ''
  const fileNameMatch = disposition.match(/filename="([^"]+)"/)
  const fileName = fileNameMatch?.[1] ?? 'download.zip'
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(url)
}

export async function downloadAdminSubmission(submissionId) {
  return downloadWithAuth(`/admin/submissions/${submissionId}/download`)
}

export async function downloadAdminHackathonSubmissions(hackathonId) {
  return downloadWithAuth(`/admin/submissions/hackathons/${hackathonId}/download-all`)
}
