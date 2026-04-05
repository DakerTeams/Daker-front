import { apiRequest, extractArray } from './client.js'
import { getAccessToken } from '../lib/auth.js'

function authHeader() {
  return { Authorization: `Bearer ${getAccessToken()}` }
}

export async function fetchChatMessages(hackathonId, params = {}) {
  const { page = 0, size = 30 } = params
  const payload = await apiRequest(
    `/hackathons/${hackathonId}/chat/messages?page=${page}&size=${size}`,
  )
  return extractArray(payload).map(normalizeMessage)
}

export async function fetchMyChatRooms() {
  const payload = await apiRequest('/hackathons/me/chat', {
    headers: authHeader(),
  })
  return extractArray(payload).map((item) => ({
    hackathonId: item.hackathonId,
    hackathonTitle: item.hackathonTitle ?? `해커톤 #${item.hackathonId}`,
    thumbnailUrl: item.thumbnailUrl ?? null,
    joinedAt: item.joinedAt ?? '',
  }))
}

export async function joinChat(hackathonId) {
  return apiRequest(`/hackathons/${hackathonId}/chat/join`, {
    method: 'POST',
    headers: authHeader(),
  })
}

export async function leaveChat(hackathonId) {
  return apiRequest(`/hackathons/${hackathonId}/chat/leave`, {
    method: 'DELETE',
    headers: authHeader(),
  })
}

function normalizeMessage(item) {
  return {
    messageId: item.messageId,
    hackathonId: item.hackathonId,
    senderId: item.senderId,
    senderNickname: item.senderNickname ?? '알 수 없음',
    content: item.content ?? '',
    createdAt: item.createdAt ?? '',
  }
}

export { normalizeMessage }
