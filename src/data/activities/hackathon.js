// ── Hackathon Activity Data ──
// To add a new conducted event: copy a block from conductedEvents and fill in details.
// To add an upcoming event: copy a block from upcomingEvents and fill in details.

const hackathon = {
  id: 'hackathon',
  icon: '⚡',
  title: 'Hackathon',
  tagline: 'Build. Break. Repeat.',
  color: '#00d4ff',
  gradient: 'linear-gradient(135deg, #00d4ff, #0891b2)',
  description:
    'Intense coding marathons where teams race against the clock to build innovative solutions. From ideation to deployment in hours — this is where legends are born.',

  conductedEvents: [
    // ── Paste completed hackathon events here ──
    // {
    //   id: 'hackathon-1',
    //   name: 'Hackathon 1.0',
    //   shortName: 'Hackathon 1.0',
    //   date: 'Month Year',
    //   status: 'completed',
    //   tagline: 'One line description',
    //   stats: [
    //     { label: 'Teams', value: '20' },
    //     { label: 'Participants', value: '60' },
    //     { label: 'Hours', value: '24' },
    //     { label: 'Projects', value: '20' },
    //   ],
    //   overview: 'Full description of the event...',
    //   topics: [],            // Leave empty for hackathons OR list problem statements
    //   photoLink: null,       // Add Google Drive link when available
    //   videoLink: null,       // Add YouTube link when available
    //   hashtags: ['#Hackathon', '#NexaSphere', '#GLBajaj'],
    // },
  ],

  upcomingEvents: [
    {
      name: 'Hackathon 1.0',
      date: 'Coming Soon',
      description:
        "NexaSphere's first major hackathon. Teams will compete to build innovative solutions to real-world problems. Stay tuned for details.",
    },
  ],
};

export default hackathon;
