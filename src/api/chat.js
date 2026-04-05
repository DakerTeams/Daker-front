import { apiRequest, extractArray } from './client.js'

export async function fetchChatMessages(hackathonId, params = {}) {
  const { page = 0, size = 30 } = params
  const payload = await apiRequest(
    `/hackathons/${hackathonId}/chat/messages?page=${page}&size=${size}`,
  )
  return extractArray(payload).map(normalizeMessage)
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
