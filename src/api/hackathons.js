import { apiRequest, createQueryString, extractArray } from './client.js'

const hackathonStatusLabels = {
  draft: '임시저장',
  upcoming: '오픈예정',
  open: '모집중',
  closed: '마감',
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
  const status = item.status ?? 'upcoming'
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
    period: startDate && endDate ? `${startDate} - ${endDate}` : '',
    startDate,
    endDate,
    participantCount:
      item.participantCount ??
      item.participantsCount ??
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

export async function fetchHackathonDetail(id) {
  const payload = await apiRequest(`/hackathons/${id}`)
  return normalizeHackathon(payload?.data ?? payload)
}

export async function fetchHackathonLeaderboard(id) {
  const payload = await apiRequest(`/hackathons/${id}/leaderboard`)
  const rows = extractArray(payload)

  return rows.map((item, index) => ({
    rank: item.rank ?? item.rankNo ?? index + 1,
    teamName: item.teamName ?? item.name ?? item.team?.name ?? `team_${index + 1}`,
    score: item.score ?? item.totalScore ?? null,
    submitted: item.submitted ?? item.isSubmitted ?? item.score !== undefined,
  }))
}
