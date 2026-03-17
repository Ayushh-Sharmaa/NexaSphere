// ── NexaSphere Insight Sessions Data ──
// Each insight session has a list of conducted events.
// Each event has a full detail page with topics, overview, photos, videos.

export const insightSessions = [
  {
    id: 'kss-1',
    title: 'KSS — Knowledge Sharing Session',
    shortTitle: 'KSS #1',
    date: 'March 14, 2025',
    status: 'completed',
    icon: '🧠',
    tagline: 'Peer-to-peer learning on emerging tech',
    coverColor: '#00d4ff',

    // ── Detail Page Content ──
    overview: `NexaSphere's inaugural Knowledge Sharing Session brought together curious minds for an evening of peer-to-peer learning. Members stepped up as speakers, sharing their expertise on emerging technologies — from AI concepts to web development workflows. The session fostered a culture of open knowledge exchange and set the tone for what NexaSphere stands for: learning together, growing together.`,

    topics: [
      {
        title: 'Introduction to Artificial Intelligence',
        speaker: 'Ayush Sharma',
        duration: '15 min',
        summary: 'Covered the fundamentals of AI — machine learning, neural networks, and how AI is transforming industries.',
      },
      {
        title: 'Web Development with React',
        speaker: 'Tanishk Bansal',
        duration: '15 min',
        summary: 'Walked through React component architecture, state management, and building interactive UIs.',
      },
      {
        title: 'Open Source Contribution — Getting Started',
        speaker: 'Swayam Dwivedi',
        duration: '10 min',
        summary: 'Explained how to find good first issues, make pull requests, and contribute to real-world projects.',
      },
      {
        title: 'Data Structures You Should Know',
        speaker: 'Tushar Goswami',
        duration: '10 min',
        summary: 'Quick overview of stacks, queues, trees, and graphs with practical coding examples.',
      },
    ],

    // Add Google Drive / YouTube links here when available
    photoLink: null,   // e.g. 'https://drive.google.com/...'
    videoLink: null,   // e.g. 'https://youtube.com/...'

    stats: [
      { label: 'Speakers', value: '4' },
      { label: 'Attendees', value: '40+' },
      { label: 'Duration', value: '1 hr' },
      { label: 'Topics', value: '4' },
    ],
  },

  // Add more KSS sessions below:
  // {
  //   id: 'kss-2',
  //   title: 'KSS #2 — ...',
  //   ...
  // },
];
