// ── Ideathon Activity Data ──
// To add a new conducted event: copy a block from conductedEvents and fill in details.
// To add an upcoming event: copy a block from upcomingEvents and fill in details.

const ideathon = {
  id: 'ideathon',
  icon: '💡',
  title: 'Ideathon',
  tagline: 'Dream. Design. Disrupt.',
  color: '#f59e0b',
  gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
  description:
    'Where creativity rules over code. Pitch your wildest ideas, challenge the status quo, and turn imagination into roadmaps for the future.',

  conductedEvents: [
    // ── Paste completed ideathon events here ──
    // {
    //   id: 'ideathon-1',
    //   name: 'Ideathon 1.0',
    //   shortName: 'Ideathon 1.0',
    //   date: 'Month Year',
    //   status: 'completed',
    //   tagline: 'One line description',
    //   stats: [
    //     { label: 'Teams', value: '15' },
    //     { label: 'Ideas', value: '15' },
    //     { label: 'Judges', value: '3' },
    //     { label: 'Winners', value: '3' },
    //   ],
    //   overview: 'Full description of the event...',
    //   topics: [],
    //   photoLink: null,
    //   videoLink: null,
    //   hashtags: ['#Ideathon', '#NexaSphere', '#GLBajaj'],
    // },
  ],

  upcomingEvents: [
    {
      name: 'Ideathon 1.0',
      date: 'Coming Soon',
      description:
        'Bring your boldest ideas. No code required — just vision, creativity, and the courage to disrupt.',
    },
  ],
};

export default ideathon;
