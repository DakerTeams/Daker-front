import { apiRequest, createQueryString, extractArray } from './client.js'

function normalizeTeam(item) {
  return {
    id: item.id,
    hackathonId: item.hackathonId ?? item.hackathon?.id ?? null,
    name: item.name ?? '이름 없는 팀',
    hackathonSlug: item.hackathonSlug ?? item.hackathon?.slug ?? 'independent',
    hackathonName: item.hackathonName ?? item.hackathon?.title ?? '해커톤 미정',
    positions: Array.isArray(item.positions)
      ? item.positions.map((position) =>
          typeof position === 'string'
            ? position
            : position.positionName ?? position.name ?? '',
        ).filter(Boolean)
      : [],
    isOpen:
      item.isOpen ??
      item.open ??
      item.status === 'open' ??
      false,
    leader:
      item.leader ??
      item.ownerNickname ??
      item.owner?.nickname ??
      item.ownerUser?.nickname ??
      '-',
    currentMembers:
      item.currentMembers ??
      item.currentMemberCount ??
      item.memberCount ??
      1,
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
