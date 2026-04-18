// ── Workshop Activity Data ──
// To add a new conducted event: copy a block from conductedEvents and fill in details.
// To add an upcoming event: add to upcomingEvents array.

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
    // Past workshops will appear here once completed.
  ],

  upcomingEvents: [
    {
      id: 'workshop-git-github',
      name: 'Workshop: Git & GitHub',
      shortName: 'Git & GitHub',
      date: 'April 24',
      status: 'upcoming',
      description:
        'Version control mastery for every developer. Learn Git from scratch — init, commit, branch, merge, pull requests — and start contributing to real projects like a pro.',
      tags: ['Git', 'GitHub', 'Version Control', 'Open Source'],
    },
    {
      id: 'workshop-python',
      name: 'Workshop: Python Basics',
      shortName: 'Python Basics',
      date: 'Coming Soon',
      status: 'upcoming',
      description:
        'Get started with Python — the language powering AI, automation, and the web.',
      tags: ['Python', 'Basics', 'Programming'],
    },
  ],
};

export default workshop;
