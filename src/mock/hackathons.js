export const hackathons = [
  {
    slug: 'ai-summit-2026',
    title: 'AI Summit 2026',
    summary: 'AI 기반 서비스 프로토타입을 만드는 집중형 해커톤입니다.',
    status: 'open',
    statusLabel: '모집중',
    period: '2026.04.01 - 2026.04.03',
    startDate: '2026.04.01',
    endDate: '2026.04.03',
    participantCount: 128,
    organizer: 'NAVER Cloud',
    tags: ['AI/ML', '데이터'],
    overview:
      'AI 기반 문제 해결 아이디어를 빠르게 MVP로 구현하고, 팀별 결과물을 제출해 경쟁하는 해커톤입니다.',
    notices: [
      '제출 마감 이후에는 제출 탭이 자동으로 비활성화됩니다.',
      '팀 탭에서 현재 내 팀 상태를 우선 확인할 수 있습니다.',
    ],
    schedules: [
      { label: '참가 신청 시작', at: '2026.04.01 09:00' },
      { label: '팀 구성 마감', at: '2026.04.02 18:00' },
      { label: '최종 제출 마감', at: '2026.04.03 18:00' },
    ],
    evaluations: [
      { label: '기술 완성도', value: '35%' },
      { label: '아이디어 창의성', value: '30%' },
      { label: '비즈니스 임팩트', value: '20%' },
      { label: '발표 품질', value: '15%' },
    ],
    prizes: [
      { label: '1등', value: '₩3,000,000' },
      { label: '2등', value: '80만원' },
      { label: '3등', value: '30만원' },
    ],
    teamStates: {
      notRegistered: {
        title: '해커톤 참가 신청 후 팀 기능을 사용할 수 있습니다.',
        description:
          '지금은 팀을 만들거나 합류할 수 없습니다. 먼저 참가 신청을 완료해주세요.',
        primaryAction: '참가 신청하기',
        secondaryAction: '안내 확인하기',
      },
      noTeam: {
        title: '참가 신청은 완료되었습니다. 이제 팀 구성이 필요합니다.',
        description:
          '팀이 없으면 제출할 수 없습니다. 팀을 직접 만들거나 팀원 모집 페이지에서 기존 팀을 찾아보세요.',
        primaryAction: '팀 만들기',
        secondaryAction: '기존 팀 찾기',
      },
      hasTeam: {
        teamName: 'Neural Ninjas',
        role: '팀장',
        members: ['jinwoo_k', 'minhyun99', 'dart_joon', 'ethereal_dev'],
        recruiting: ['백엔드', 'AI/ML'],
      },
    },
    submitStates: {
      notRegistered: '참가 신청 후 제출 탭을 사용할 수 있습니다.',
      noTeam: '팀 구성 후 제출 탭을 사용할 수 있습니다.',
      open: 'URL, PDF, ZIP 규칙에 맞춰 제출물을 업로드할 수 있습니다.',
      closed: '제출 기간이 종료되어 제출 탭이 비활성화됩니다.',
    },
    leaderboard: [
      { rank: 1, teamName: 'Neural Ninjas', score: 96.4, submitted: true },
      { rank: 2, teamName: 'Data Dragons', score: 92.1, submitted: true },
      { rank: 3, teamName: 'Vision Forge', score: null, submitted: false },
    ],
  },
  {
    slug: 'web3-buildathon',
    title: 'Web3 Buildathon',
    summary: '블록체인과 DApp 아이디어를 빠르게 구현하는 해커톤입니다.',
    status: 'closed',
    statusLabel: '마감',
    period: '2026.03.10 - 2026.03.20',
    startDate: '2026.03.10',
    endDate: '2026.03.20',
    participantCount: 86,
    organizer: 'Kakao Blockchain',
    tags: ['블록체인', 'Web'],
    overview:
      '스마트 컨트랙트와 서비스 UX를 결합해 Web3 프로덕트를 완성하는 빌드어톤입니다.',
    notices: ['현재 제출 마감 상태이며 리더보드만 확인할 수 있습니다.'],
    schedules: [
      { label: '참가 신청 시작', at: '2026.03.10 09:00' },
      { label: '최종 제출 마감', at: '2026.03.20 23:59' },
    ],
    evaluations: [
      { label: '제품 완성도', value: '50%' },
      { label: '기술 적합성', value: '30%' },
      { label: '확장성', value: '20%' },
    ],
    prizes: [
      { label: '1등', value: '200만원' },
      { label: '2등', value: '100만원' },
    ],
    teamStates: {
      notRegistered: {
        title: '마감된 해커톤입니다.',
        description: '신규 참가 신청과 팀 생성이 모두 종료되었습니다.',
        primaryAction: '목록으로 돌아가기',
        secondaryAction: '리더보드 보기',
      },
      noTeam: {
        title: '마감된 해커톤입니다.',
        description: '팀 생성 및 합류가 종료되었습니다.',
        primaryAction: '리더보드 보기',
        secondaryAction: '목록으로 돌아가기',
      },
      hasTeam: {
        teamName: 'Chain Flux',
        role: '팀원',
        members: ['sora_dev', 'block_jun', 'wallet_min'],
        recruiting: [],
      },
    },
    submitStates: {
      notRegistered: '제출 기간이 종료되었습니다.',
      noTeam: '제출 기간이 종료되었습니다.',
      open: '제출 기간이 종료되었습니다.',
      closed: '제출 기간이 종료되었습니다.',
    },
    leaderboard: [
      { rank: 1, teamName: 'Chain Flux', score: 94.3, submitted: true },
      { rank: 2, teamName: 'Node Sprint', score: 88.7, submitted: true },
    ],
  },
  {
    slug: 'mobile-craft-day',
    title: 'Mobile Craft Day',
    summary: '모바일 UX와 빠른 MVP 구현에 초점을 맞춘 단기 해커톤입니다.',
    status: 'upcoming',
    statusLabel: '오픈예정',
    period: '2026.05.09 - 2026.05.11',
    startDate: '2026.05.10',
    endDate: '2026.05.11',
    participantCount: 54,
    organizer: 'LINE Plus',
    tags: ['Mobile', 'Web'],
    overview:
      '모바일 UX와 빠른 MVP 검증에 집중하는 해커톤으로, 오픈 예정 단계입니다.',
    notices: ['오픈 예정인 해커톤은 일정과 상금 정보 위주로 먼저 노출됩니다.'],
    schedules: [
      { label: '오픈 예정', at: '2026.05.09 09:00' },
      { label: '최종 제출 마감', at: '2026.05.11 18:00' },
    ],
    evaluations: [
      { label: 'UX 완성도', value: '45%' },
      { label: '실행 가능성', value: '35%' },
      { label: '아이디어 명확성', value: '20%' },
    ],
    prizes: [
      { label: '1등', value: '120만원' },
      { label: '2등', value: '60만원' },
    ],
    teamStates: {
      notRegistered: {
        title: '아직 참가 신청이 열리지 않았습니다.',
        description: '오픈 일정 이후 참가 신청과 팀 구성이 가능해집니다.',
        primaryAction: '일정 확인하기',
        secondaryAction: '상금 보기',
      },
      noTeam: {
        title: '아직 참가 신청이 열리지 않았습니다.',
        description: '오픈 예정 상태라 팀 구성은 아직 시작되지 않았습니다.',
        primaryAction: '일정 확인하기',
        secondaryAction: '목록으로 돌아가기',
      },
      hasTeam: {
        teamName: 'Pocket Makers',
        role: '팀장',
        members: ['miju', 'ux_sena'],
        recruiting: ['iOS'],
      },
    },
    submitStates: {
      notRegistered: '참가 신청 오픈 전입니다.',
      noTeam: '참가 신청 오픈 전입니다.',
      open: '참가 신청 오픈 전입니다.',
      closed: '참가 신청 오픈 전입니다.',
    },
    leaderboard: [],
  },
]
