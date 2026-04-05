import {
  apiRequest,
  createQueryString,
  extractArray,
  extractObject,
} from './client.js'
import { getAccessToken } from '../lib/auth.js'

const hackathonStatusLabels = {
  upcoming: '오픈예정',
  open: '모집중',
  closed: '진행중',
  ended: '종료',
}

function formatDate(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10)
  }

  return date.toISOString().slice(0, 10)
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return []

  return tags
    .map((tag) => {
      if (typeof tag === 'string') return tag
      if (typeof tag?.name === 'string') return tag.name
      if (typeof tag?.displayName === 'string') return tag.displayName
      return ''
    })
    .filter(Boolean)
}

function normalizeHackathon(item) {
  const status = String(item.status ?? 'upcoming').toLowerCase()
  const startDate = formatDate(item.startAt ?? item.startDate)
  const endDate = formatDate(item.endAt ?? item.endDate)

  return {
    id: item.id,
    slug: item.slug ?? `hackathon-${item.id}`,
    title: item.title ?? '제목 없는 해커톤',
    summary: item.summary ?? item.description ?? '',
    description: item.description ?? '',
    status,
    statusLabel: hackathonStatusLabels[status] ?? status,
    scoreType: item.scoreType ?? null,
    votingOpen: item.votingOpen ?? false,
    period: startDate && endDate ? `${startDate} - ${endDate}` : '',
    startDate,
    endDate,
    participantCount:
      item.participantCount ??
      item.participantsCount ??
      item.participants ??
      item.registrationCount ??
      item.registrationsCount ??
      0,
    organizer: item.organizerName ?? item.organizer ?? '-',
    tags: normalizeTags(item.tags),
    raw: item,
  }
}

export async function fetchHackathons(params = {}) {
  const query = createQueryString(params)
  const payload = await apiRequest(`/hackathons${query}`)
  return extractArray(payload).map(normalizeHackathon)
}

export async function fetchHackathonTeams(id, params = {}) {
  const query = createQueryString(params)
  const payload = await apiRequest(`/hackathons/${id}/teams${query}`)
  return extractArray(payload).map((item) => ({
    id: item.id,
    hackathonId: item.hackathonId ?? id,
    name: item.name ?? '이름 없는 팀',
    hackathonName: item.hackathonName ?? `해커톤 #${id}`,
    isOpen: item.isOpen ?? true,
    leader: item.leader?.nickname ?? '-',
    currentMembers: item.memberCount ?? item.currentMemberCount ?? 1,
    maxMembers: item.maxMemberCount ?? item.maxTeamSize ?? 1,
    description: item.description ?? '',
    positions: [],
    raw: item,
  }))
}

export async function fetchHackathonDetail(id) {
  const payload = await apiRequest(`/hackathons/${id}`)
  const detail = extractObject(payload)

  const normalized = normalizeHackathon(detail)

  return {
    ...normalized,
    overview: detail.desc ?? detail.description ?? '',
    schedules: Array.isArray(detail.timeline ?? detail.milestones)
      ? (detail.timeline ?? detail.milestones).map((item) => ({
          label: item.label ?? item.title ?? '일정',
          at: formatDate(item.date),
          description: item.description ?? '',
        }))
      : [],
    prizes: Array.isArray(detail.prizes)
      ? detail.prizes.map((item) => ({
          label: item.label ?? `${item.rank ?? item.ranking}등`,
          value:
            typeof item.amount === 'number'
              ? new Intl.NumberFormat('ko-KR', {
                  style: 'currency',
                  currency: 'KRW',
                  maximumFractionDigits: 0,
                }).format(item.amount)
              : String(item.amount ?? '-'),
          description: item.description ?? '',
        }))
      : [],
    evaluations: Array.isArray(detail.criteria)
      ? detail.criteria.map((item) => ({
          label: item.label ?? item.name ?? '평가 항목',
          value: item.weight ?? (item.maxScore ? `${item.maxScore}점` : ''),
          description: item.description ?? '',
        }))
      : [],
    registrationStartDate: detail.registrationStartDate ?? '',
    registrationEndDate: detail.registrationEndDate ?? '',
    maxTeamSize: detail.maxTeamSize ?? 1,
  }
}

export async function fetchRegistrationStatus(id) {
  const payload = await apiRequest(`/hackathons/${id}/register`, {
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
  })

  return extractObject(payload)
}

export async function cancelRegistration(id) {
  return apiRequest(`/hackathons/${id}/register`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
  })
}

export async function registerHackathon(id) {
  return apiRequest(`/hackathons/${id}/register`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
  })
}

export async function submitResult(id, formData) {
  return apiRequest(`/hackathons/${id}/submit`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: formData,
  })
}

export async function fetchMySubmissions(id) {
  const payload = await apiRequest(`/hackathons/${id}/submissions/me`, {
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
  })
  return extractObject(payload)
}

export async function fetchTeamSubmission(hackathonId, teamId) {
  const payload = await apiRequest(`/hackathons/${hackathonId}/teams/${teamId}/submission`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  })
  return extractObject(payload)
}

export async function submitVote(hackathonId, teamId) {
  const response = await apiRequest(`/hackathons/${hackathonId}/votes`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    body: JSON.stringify({ teamId }),
  })
  return extractObject(response)
}

export async function fetchHackathonLeaderboard(id) {
  const payload = await apiRequest(`/hackathons/${id}/leaderboard`)
  const data = extractObject(payload)
  return {
    scoreType: data.scoreType ?? 'SCORE',
    items: Array.isArray(data.items)
      ? data.items.map((item) => ({
          rank: item.rank ?? null,
          score: item.score ?? null,
          teamName: item.teamName ?? '',
          submitted: item.submitted ?? false,
        }))
      : [],
  }
}

