// ── NexaSphere Activity Pages Data ──

export const activityPages = {
  'Hackathon': {
    id: 'hackathon',
    icon: '⚡',
    title: 'Hackathon',
    tagline: 'Build. Break. Repeat.',
    color: '#00d4ff',
    gradient: 'linear-gradient(135deg, #00d4ff, #0891b2)',
    description: 'Intense coding marathons where teams race against the clock to build innovative solutions. From ideation to deployment in hours — this is where legends are born.',
    conductedEvents: [],
    upcomingEvents: [
      { name: 'Hackathon 1.0', date: 'Coming Soon', description: 'NexaSphere\'s first major hackathon. Stay tuned for details.' }
    ],
  },

  'Codathon': {
    id: 'codathon',
    icon: '💻',
    title: 'Codathon',
    tagline: 'Code. Compete. Conquer.',
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    description: 'Competitive programming challenges that push your algorithmic thinking to the limit. Every millisecond counts, every line matters.',
    conductedEvents: [],
    upcomingEvents: [
      { name: 'Codathon 1.0', date: 'Coming Soon', description: 'First competitive coding session. Sharpen your algorithms.' }
    ],
  },

  'Ideathon': {
    id: 'ideathon',
    icon: '💡',
    title: 'Ideathon',
    tagline: 'Dream. Design. Disrupt.',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    description: 'Where creativity rules over code. Pitch your wildest ideas, challenge the status quo, and turn imagination into roadmaps for the future.',
    conductedEvents: [],
    upcomingEvents: [
      { name: 'Ideathon 1.0', date: 'Coming Soon', description: 'Bring your boldest ideas. No code required — just vision.' }
    ],
  },

  'Workshop': {
    id: 'workshop',
    icon: '🔧',
    title: 'Workshop',
    tagline: 'Learn. Build. Master.',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    description: 'Hands-on deep dives into the tools, frameworks, and technologies shaping the industry. Get your hands dirty and leave with real skills.',
    conductedEvents: [],
    upcomingEvents: [
      { name: 'Workshop: Git & GitHub', date: 'Coming Soon', description: 'Version control mastery for every developer.' }
    ],
  },

  'Insight Session': {
    id: 'insight-session',
    icon: '🔍',
    title: 'Insight Session',
    tagline: 'Share. Inspire. Elevate.',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #a855f7, #9333ea)',
    description: 'Peer-to-peer knowledge sharing where every member is both a student and a teacher. Deep-dive talks on tech, careers, and the ideas shaping tomorrow.',
    conductedEvents: [
      {
        id: 'kss-153',
        name: 'KSS #153 — Impact of AI',
        shortName: 'KSS #153',
        date: 'March 2025',
        status: 'completed',
        tagline: 'They came. They listened. They left thinking differently.',
        hashtags: ['#KSS153', '#ImpactOfAI', '#GLBajaj', '#KnowledgeSharingSession', '#Nexasphere', '#StudentLeaders', '#AIForAll', '#AKTU', '#Mathura', '#FindYourSpark'],
        stats: [
          { label: 'Presenters', value: '3' },
          { label: 'Video Presentors', value: '2' },
          { label: 'Volunteers', value: '5' },
          { label: 'Session', value: '#153' },
        ],
        overview: `Knowledge Sharing Session #153 on the topic "Impact of AI" just wrapped up at GL Bajaj Group of Institutions, Mathura — and what a session it was! 🧠💡\n\nThink about it — today, even deciding whether to have chai ☕ or coffee is being influenced by AI. Recommendation engines, smart assistants, predictive habits... AI has quietly slipped into every corner of our lives. And our presenters made sure we felt every bit of that reality.`,
        topics: [
          {
            title: 'Impact of AI on Everyday Life',
            speaker: 'Ankit Singh',
            role: 'Presenter',
            duration: '—',
            summary: 'Explored how AI silently shapes our daily decisions — from what we watch, eat, and buy, to how recommendation engines and smart assistants predict our habits before we even realise it.',
          },
          {
            title: 'AI in Industry & Career Paths',
            speaker: 'Astha Shukla',
            role: 'Presenter',
            duration: '—',
            summary: 'Deep-dived into how AI is transforming industries — healthcare, finance, education, and beyond — and what it means for the careers of tomorrow\'s engineers.',
          },
          {
            title: 'The Future of AI — Opportunities & Challenges',
            speaker: 'Vikas Kumar Sharma',
            role: 'Presenter',
            duration: '—',
            summary: 'Discussed the ethical landscape of AI, its growing capabilities, and the responsibilities that come with building intelligent systems.',
          },
        ],
        videoPresenter: [
          { name: 'Tanishk Bansal', role: 'Video Presentor' },
          { name: 'Swayam Dwivedi', role: 'Video Presentor' },
        ],
        anchor: { name: 'Arya Kaushik', role: 'Anchor' },
        volunteers: [
          { name: 'Ayush Sharma' },
          { name: 'Aryan Singh' },
          { name: 'Vartika Sharma' },
          { name: 'Tushar Goswami' },
          { name: 'Roshni Gupta' },
        ],
        acknowledgements: [
          { name: 'Prof. Neeta Awasthy Ma\'am', title: 'Director', note: 'For your vision, encouragement, and leadership that pushes every student to find their spark.' },
          { name: 'Prof.(Dr.) V.K. Singh Sir', title: 'HOD', note: 'For your constant guidance and belief in student-led initiatives.' },
          { name: 'Dr. Shashi Shekhar (PhD) Sir', title: 'HOD', note: 'For your constant guidance and belief in student-led initiatives.' },
          { name: 'Richa Mishra Ma\'am & Vivek Bhardwaj Sir', title: 'Faculty', note: 'For being the backbone behind every event and always pushing us to do better.' },
          { name: 'Dr. Wazir Singh Sir', title: 'KSS Coordinator', note: 'For approving and supporting this session. Your trust in us means everything!' },
        ],
        closingNote: 'This is just the BEGINNING. Bigger events. Deeper sessions. More ideas. More inspiration. The journey has just started and we\'re only getting warmed up! 🔥',
        photoLink: 'https://drive.google.com/drive/folders/18cJWugHDXdvO-taHgljnlSvi-NtaKpHd?usp=drive_link',
        videoLink: 'https://drive.google.com/drive/folders/18cJWugHDXdvO-taHgljnlSvi-NtaKpHd?usp=drive_link',
      },
    ],
    upcomingEvents: [],
  },

  'Open Source Day': {
    id: 'open-source-day',
    icon: '🌐',
    title: 'Open Source Day',
    tagline: 'Contribute. Collaborate. Create.',
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
    description: 'Dedicated sessions to explore, contribute, and celebrate open-source. Find your first PR, or your hundredth — every contribution counts.',
    conductedEvents: [],
    upcomingEvents: [
      { name: 'Open Source Day 1.0', date: 'Coming Soon', description: 'First open source contribution drive. Pick a project, make an impact.' }
    ],
  },

  'Tech Debate': {
    id: 'tech-debate',
    icon: '🎙️',
    title: 'Tech Debate',
    tagline: 'Argue. Defend. Evolve.',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
    description: 'Structured battles of ideas where technology meets rhetoric. Defend your stance, challenge assumptions, and walk away sharper than when you arrived.',
    conductedEvents: [],
    upcomingEvents: [
      { name: 'Tech Debate 1.0', date: 'Coming Soon', description: 'First tech debate session. AI vs Human Creativity? You decide.' }
    ],
  },
};
