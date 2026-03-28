export const adminOverviewStats = [
  { label: '전체 유저', value: '478', delta: '+23', suffix: '이번 주' },
  { label: '활성 해커톤', value: '4', delta: '+1', suffix: '신규' },
  { label: '참가 팀 수', value: '86', delta: '+12', suffix: '이번 주' },
  { label: '제출 수', value: '34', delta: '-', suffix: '마감 대기 중' },
]

export const adminHackathons = [
  {
    title: 'AI Summit 2026',
    status: '모집 중',
    statusType: 'open',
    period: '04-01 ~ 04-03',
    teams: '3팀',
    submissions: '0건',
    deadline: '2026-04-03',
    judgeType: '점수형',
    action: '마감',
    actionType: 'danger',
  },
  {
    title: 'Web3 Buildathon',
    status: '진행 중',
    statusType: 'upcoming',
    period: '03-10 ~ 03-20',
    teams: '2팀',
    submissions: '2건',
    deadline: '2026-03-20',
    judgeType: '투표형',
    action: '강제 종료',
    actionType: 'danger-solid',
  },
  {
    title: 'Data Quest 2025',
    status: '종료',
    statusType: 'closed',
    period: '11-15 ~ 11-17',
    teams: '1팀',
    submissions: '3건',
    deadline: '2025-11-17',
    judgeType: '점수형',
    action: '종료됨',
    actionType: 'muted',
  },
]

export const adminUsers = [
  {
    nickname: 'jinwoo_k',
    email: 'jinwoo@example.com',
    role: '관리자',
    roleType: 'admin',
    joinedAt: '2026-01-01',
    action: '변경 불가',
  },
  {
    nickname: 'sora_dev',
    email: 'sora@example.com',
    role: '심사위원',
    roleType: 'judge',
    joinedAt: '2026-01-15',
    action: '역할 회수',
    actionType: 'danger',
  },
  {
    nickname: 'minhyun99',
    email: 'min@example.com',
    role: '일반',
    roleType: 'user',
    joinedAt: '2026-02-10',
    action: '심사위원 추가',
    actionType: 'muted',
  },
  {
    nickname: 'block_kim',
    email: 'block@example.com',
    role: '일반',
    roleType: 'user',
    joinedAt: '2026-02-20',
    action: '심사위원 추가',
    actionType: 'muted',
  },
]

export const adminJudges = [
  { nickname: 'sora_dev', email: 'sora@example.com' },
  { nickname: 'ethereal_dev', email: 'eth@example.com' },
]

export const adminSubmissions = [
  {
    hackathon: 'AI Summit 2026',
    teamName: 'NeuralNinjas',
    submittedAt: '04-03 17:55',
    file: 'ZIP · 12MB',
    retry: '1회',
  },
  {
    hackathon: 'Web3 Buildathon',
    teamName: 'ChainCrafters',
    submittedAt: '03-20 22:41',
    file: 'PDF · 3MB',
    retry: '0회',
  },
]
