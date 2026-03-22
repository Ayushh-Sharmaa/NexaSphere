// ── Open Source Day Activity Data ──
// To add a new conducted event: copy a block from conductedEvents and fill in details.
// To add an upcoming event: copy a block from upcomingEvents and fill in details.

const openSourceDay = {
  id: 'open-source-day',
  icon: '🌐',
  title: 'Open Source Day',
  tagline: 'Contribute. Collaborate. Create.',
  color: '#06b6d4',
  gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
  description:
    'Dedicated sessions to explore, contribute, and celebrate open-source. Find your first PR, or your hundredth — every contribution counts.',

  conductedEvents: [
    // ── Paste completed open source day events here ──
    // {
    //   id: 'osd-1',
    //   name: 'Open Source Day 1.0',
    //   shortName: 'OSD 1.0',
    //   date: 'Month Year',
    //   status: 'completed',
    //   tagline: 'One line description',
    //   stats: [
    //     { label: 'Contributors', value: '30' },
    //     { label: 'PRs Merged', value: '15' },
    //     { label: 'Projects', value: '5' },
    //     { label: 'Duration', value: '4 hrs' },
    //   ],
    //   overview: 'Full description...',
    //   topics: [],
    //   volunteers: [],
    //   acknowledgements: [],
    //   photoLink: null,
    //   videoLink: null,
    //   hashtags: ['#OpenSourceDay', '#NexaSphere', '#GLBajaj'],
    // },
  ],

  upcomingEvents: [
    {
      name: 'Open Source Day 1.0',
      date: 'Coming Soon',
      description:
        'First open source contribution drive. Pick a project, make an impact, and join the global developer community.',
    },
  ],
};

export default openSourceDay;
