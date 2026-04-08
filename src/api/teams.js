import {
  apiRequest,
  createQueryString,
  extractArray,
  extractObject,
  extractPage,
} from './client.js'
import { getAccessToken } from '../lib/auth.js'

function normalizeTeam(item) {
  const positionDetails = Array.isArray(item.positions)
    ? item.positions
        .map((position) =>
          typeof position === 'string'
            ? {
                positionName: position,
                requiredCount: 1,
              }
            : {
                positionName: position.positionName ?? position.name ?? '',
                requiredCount: position.requiredCount ?? position.count ?? 1,
              },
        )
        .filter((position) => position.positionName)
    : []

  return {
    id: item.id,
    hackathonId: item.hackathonId ?? item.hackathon?.id ?? null,
    name: item.name ?? '이름 없는 팀',
    hackathonSlug: item.hackathonSlug ?? item.hackathon?.slug ?? 'independent',
    hackathonName:
      item.hackathonTitle ??
      item.hackathonName ??
      item.hackathon?.title ??
      (item.hackathonId ? `해커톤 #${item.hackathonId}` : '해커톤 미정'),
    positions: positionDetails.map((position) => position.positionName),
    positionDetails,
    isOpen:
      item.isOpen ?? item.open ?? (item.status === 'open'),
    leaderId:
      item.leader?.userId ??
      item.owner?.userId ??
      item.ownerUser?.userId ??
      null,
    leader:
      item.leader?.nickname ??
      (typeof item.leader === 'string' ? item.leader : undefined) ??
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
    contact: item.contact
      ? { type: item.contact.type ?? '', value: item.contact.value ?? '' }
      : null,
    description: item.description ?? item.intro ?? '',
    raw: item,
  }
}

export async function fetchTeams(params = {}) {
  const { page = 0, size = 10, ...serverParams } = params
  const query = createQueryString({ ...serverParams, page: page + 1, limit: size })
  const payload = await apiRequest(`/teams${query}`)
  const result = extractPage(payload)

  if (result.totalPages > 1 || result.totalElements > size) {
    return {
      items: result.content.map(normalizeTeam),
      totalPages: result.totalPages,
      totalElements: result.totalElements,
      page,
      size,
    }
  }

  const allItems = result.content.map(normalizeTeam)
  const totalPages = Math.max(1, Math.ceil(allItems.length / size))
  const start = page * size
  return {
    items: allItems.slice(start, start + size),
    totalPages,
    totalElements: allItems.length,
    page,
    size,
  }
}

export async function fetchMyTeams(hackathonId) {
  const query = hackathonId != null ? createQueryString({ hackathonId }) : ''
  const payload = await apiRequest(`/teams/me${query}`, {
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
  const token = getAccessToken()
  const payload = await apiRequest(`/teams/${id}`, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
  const data = extractObject(payload)

  return {
    ...normalizeTeam(data),
    members: Array.isArray(data.members)
      ? data.members.map((member) => ({
          userId: member.userId,
          nickname: member.nickname,
          position: member.position ?? null,
          roleType: member.roleType ?? null,
        }))
      : [],
  }
}

export async function applyToTeam(id, position = null) {
  return apiRequest(`/teams/${id}/applications`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify(position ? { position } : {}),
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
    position: item.position ?? null,
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
