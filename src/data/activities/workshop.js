// ── Workshop Activity Data ──
// To add a new conducted event: copy a block from conductedEvents and fill in details.
// To add an upcoming event: copy a block from upcomingEvents and fill in details.

const workshop = {
  id: 'workshop',
  icon: '🔧',
  title: 'Workshop',
  tagline: 'Learn. Build. Master.',
  color: '#10b981',
  gradient: 'linear-gradient(135deg, #10b981, #059669)',
  description:
    'Hands-on deep dives into the tools, frameworks, and technologies shaping the industry. Get your hands dirty and leave with real skills.',

  conductedEvents: [
    // ── Paste completed workshop events here ──
    // {
    //   id: 'workshop-git-1',
    //   name: 'Workshop: Git & GitHub',
    //   shortName: 'Git & GitHub',
    //   date: 'Month Year',
    //   status: 'completed',
    //   tagline: 'One line description',
    //   stats: [
    //     { label: 'Attendees', value: '40' },
    //     { label: 'Duration', value: '2 hrs' },
    //     { label: 'Trainer', value: '1' },
    //     { label: 'Topics', value: '5' },
    //   ],
    //   overview: 'Full description of the workshop...',
    //   topics: [
    //     { title: 'Topic Name', speaker: 'Speaker Name', role: 'Trainer', duration: '20 min', summary: 'Summary...' },
    //   ],
    //   volunteers: [],
    //   acknowledgements: [],
    //   photoLink: null,
    //   videoLink: null,
    //   hashtags: ['#Workshop', '#NexaSphere', '#GLBajaj'],
    // },
  ],

  upcomingEvents: [
    {
      name: 'Workshop: Git & GitHub',
      date: 'Coming Soon',
      description:
        'Version control mastery for every developer. Learn Git from scratch and start contributing like a pro.',
    },
    {
      name: 'Workshop: Python Basics',
      date: 'Coming Soon',
      description:
        'Get started with Python — the language powering AI, automation, and the web.',
    },
  ],
};

export default workshop;
