// ── Codathon Activity Data ──
// To add a new conducted event: copy a block from conductedEvents and fill in details.
// To add an upcoming event: copy a block from upcomingEvents and fill in details.

const codathon = {
  id: 'codathon',
  icon: '💻',
  title: 'Codathon',
  tagline: 'Code. Compete. Conquer.',
  color: '#6366f1',
  gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
  description:
    'Competitive programming challenges that push your algorithmic thinking to the limit. Every millisecond counts, every line matters.',

  conductedEvents: [
    // ── Paste completed codathon events here ──
    // {
    //   id: 'codathon-1',
    //   name: 'Codathon 1.0',
    //   shortName: 'Codathon 1.0',
    //   date: 'Month Year',
    //   status: 'completed',
    //   tagline: 'One line description',
    //   stats: [
    //     { label: 'Participants', value: '50' },
    //     { label: 'Problems', value: '10' },
    //     { label: 'Duration', value: '3 hrs' },
    //     { label: 'Winners', value: '3' },
    //   ],
    //   overview: 'Full description of the event...',
    //   topics: [],            // List problems/challenges if needed
    //   photoLink: null,
    //   videoLink: null,
    //   hashtags: ['#Codathon', '#NexaSphere', '#GLBajaj'],
    // },
  ],

  upcomingEvents: [
    {
      name: 'Codathon 1.0',
      date: 'Coming Soon',
      description:
        'First competitive coding session. Sharpen your algorithms and get ready to compete.',
    },
  ],
};

export default codathon;
