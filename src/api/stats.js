import { apiRequest, extractObject } from './client.js'

function normalizeCurrency(value) {
  if (value === undefined || value === null) {
    return '₩0'
  }

  const amount = Number(value)
  if (Number.isNaN(amount)) {
    return String(value)
  }

  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount)
}

export async function fetchPlatformStats() {
  const payload = await apiRequest('/stats')
  const stats = extractObject(payload)

  return {
    participants:
      stats.participantCount ??
      stats.participants ??
      stats.userCount ??
      stats.totalUsers ??
      0,
    activeHackathons:
      stats.activeHackathonCount ??
      stats.activeHackathons ??
      stats.openHackathonCount ??
      0,
    totalPrize:
      normalizeCurrency(
        stats.totalPrizeAmount ?? stats.totalPrize ?? stats.prizePoolAmount ?? 0,
      ),
  }
}
