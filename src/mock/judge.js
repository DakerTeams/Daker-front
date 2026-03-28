export const judgeHackathons = [
  {
    slug: 'ai-summit-2026',
    title: 'AI Summit 2026',
    mode: 'score',
    modeLabel: '점수형',
    completedCount: 2,
    totalCount: 5,
    criteria: [
      { label: '기술 완성도', weight: 35 },
      { label: '아이디어 창의성', weight: 30 },
      { label: '비즈니스 임팩트', weight: 20 },
      { label: '발표 품질', weight: 15 },
    ],
    teams: [
      {
        name: 'NeuralNinjas',
        leader: 'jinwoo_k',
        submittedAt: '2026-04-03 17:55',
        status: '채점 완료',
        statusType: 'done',
        scoreValues: [92, 95, 88, 90],
      },
      {
        name: 'DataDragons',
        leader: 'sora_dev',
        submittedAt: '2026-04-03 18:00',
        status: '미채점',
        statusType: 'pending',
        scoreValues: [0, 0, 0, 0],
      },
    ],
  },
  {
    slug: 'web3-buildathon',
    title: 'Web3 Buildathon',
    mode: 'vote',
    modeLabel: '투표형',
    voteTeams: ['ChainCrafters', 'DeFiDynamos', 'MetaMakers'],
    selections: {
      first: 'ChainCrafters',
      second: 'DeFiDynamos',
      third: 'MetaMakers',
    },
  },
]
