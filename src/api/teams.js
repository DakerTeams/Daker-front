import {
  apiRequest,
  createQueryString,
  extractArray,
  extractObject,
} from './client.js'
import { getAccessToken } from '../lib/auth.js'

function normalizeTeam(item) {
  return {
    id: item.id,
    hackathonId: item.hackathonId ?? item.hackathon?.id ?? null,
    name: item.name ?? '이름 없는 팀',
    hackathonSlug: item.hackathonSlug ?? item.hackathon?.slug ?? 'independent',
    hackathonName:
      item.hackathonName ??
      item.hackathon?.title ??
      (item.hackathonId ? `해커톤 #${item.hackathonId}` : '해커톤 미정'),
    positions: Array.isArray(item.positions)
      ? item.positions.map((position) =>
          typeof position === 'string'
            ? position
            : position.positionName ?? position.name ?? '',
        ).filter(Boolean)
      : [],
    isOpen:
      item.isOpen ?? item.open ?? item.status === 'open' ?? false,
    leader:
      item.leader ??
      item.leader?.nickname ??
      item.ownerNickname ??
      item.owner?.nickname ??
      item.ownerUser?.nickname ??
      '-',
    currentMembers:
      item.currentMembers ?? item.currentMemberCount ?? item.memberCount ?? 1,
    maxMembers:
      item.maxMembers ??
      item.maxMemberCount ??
      item.maxTeamSize ??
      1,
    contactLabel: item.contactLabel ?? '연락하기',
    description: item.description ?? item.intro ?? '',
    raw: item,
  }
}

export async function fetchTeams(params = {}) {
  const query = createQueryString(params)
  const payload = await apiRequest(`/teams${query}`)
  return extractArray(payload).map(normalizeTeam)
}

export async function fetchMyTeams() {
  const payload = await apiRequest('/teams/me', {
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
  })

  return extractArray(payload).map(normalizeTeam)
}

export async function createTeam(payload) {
  const response = await apiRequest('/teams', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify(payload),
  })

  return normalizeTeam(extractObject(response))
}

export async function updateTeam(id, payload) {
  const response = await apiRequest(`/teams/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify(payload),
  })

  return normalizeTeam(extractObject(response))
}

export async function deleteTeam(id) {
  return apiRequest(`/teams/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
  })
}

export async function fetchTeamDetail(id) {
  const payload = await apiRequest(`/teams/${id}`)
  const data = extractObject(payload)

  return {
    ...normalizeTeam(data),
    members: Array.isArray(data.members)
      ? data.members.map((member) => ({
          userId: member.userId,
          nickname: member.nickname,
        }))
      : [],
  }
}

export async function applyToTeam(id) {
  return apiRequest(`/teams/${id}/applications`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
  })
}

export async function fetchTeamApplications(id) {
  const payload = await apiRequest(`/teams/${id}/applications`, {
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
  })

  return extractArray(payload).map((item) => ({
    applicationId: item.applicationId,
    userId: item.userId,
    nickname: item.nickname,
    status: item.status,
    createdAt: item.createdAt,
  }))
}

export async function decideTeamApplication(teamId, appId, status) {
  const payload = await apiRequest(`/teams/${teamId}/applications/${appId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify({ status }),
  })

  return extractObject(payload)
}
