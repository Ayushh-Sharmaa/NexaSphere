// ── Tech Debate Activity Data ──
// To add a new conducted event: copy a block from conductedEvents and fill in details.
// To add an upcoming event: copy a block from upcomingEvents and fill in details.

const techDebate = {
  id: 'tech-debate',
  icon: '🎙️',
  title: 'Tech Debate',
  tagline: 'Argue. Defend. Evolve.',
  color: '#ef4444',
  gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
  description:
    'Structured battles of ideas where technology meets rhetoric. Defend your stance, challenge assumptions, and walk away sharper than when you arrived.',

  conductedEvents: [
    // ── Paste completed tech debate events here ──
    // {
    //   id: 'debate-1',
    //   name: 'Tech Debate 1.0 — AI vs Human Creativity',
    //   shortName: 'Debate 1.0',
    //   date: 'Month Year',
    //   status: 'completed',
    //   tagline: 'One line description',
    //   stats: [
    //     { label: 'Debaters', value: '8' },
    //     { label: 'Rounds', value: '3' },
    //     { label: 'Audience', value: '50' },
    //     { label: 'Duration', value: '1.5 hrs' },
    //   ],
    //   overview: 'Full description...',
    //   topics: [
    //     { title: 'Motion', speaker: 'Proposer Name', role: 'Proposer', duration: '5 min', summary: '...' },
    //   ],
    //   volunteers: [],
    //   acknowledgements: [],
    //   photoLink: null,
    //   videoLink: null,
    //   hashtags: ['#TechDebate', '#NexaSphere', '#GLBajaj'],
    // },
  ],

  upcomingEvents: [
    {
      name: 'Tech Debate 1.0',
      date: 'Coming Soon',
      description:
        'First tech debate session. Motion: "AI will replace human creativity." — Which side are you on?',
    },
  ],
};

export default techDebate;
