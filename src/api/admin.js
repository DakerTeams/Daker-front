import { apiRequest, createQueryString, extractArray, extractObject } from './client.js'
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
  const response = await apiRequest(`/users/${userId}/role`, {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify({ role }),
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
