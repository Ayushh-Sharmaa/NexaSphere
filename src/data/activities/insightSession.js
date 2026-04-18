// ── Insight Session Activity Data ──
// To add a new KSS: copy a block from conductedEvents and fill in details.
// To mark as upcoming: set status: 'upcoming'.

const insightSession = {
  id: 'insight-session',
  icon: '🔍',
  title: 'Insight Session',
  tagline: 'Share. Inspire. Elevate.',
  color: '#a855f7',
  gradient: 'linear-gradient(135deg, #a855f7, #9333ea)',
  description:
    'Peer-to-peer knowledge sharing where every member is both a student and a teacher. Deep-dive talks on tech, careers, and the ideas shaping tomorrow.',

  conductedEvents: [
    {
      id: 'kss-153',
      name: 'KSS #153 — Impact of AI',
      shortName: 'KSS #153',
      date: 'March 2025',
      status: 'completed',
      tagline: "They came. They listened. They left thinking differently.",
      hashtags: [
        '#KSS153', '#ImpactOfAI', '#GLBajaj', '#KnowledgeSharingSession',
        '#Nexasphere', '#StudentLeaders', '#AIForAll', '#AKTU', '#Mathura', '#FindYourSpark',
      ],
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
          summary:
            'Explored how AI silently shapes our daily decisions — from what we watch, eat, and buy, to how recommendation engines and smart assistants predict our habits before we even realise it.',
        },
        {
          title: 'AI in Industry & Career Paths',
          speaker: 'Astha Shukla',
          role: 'Presenter',
          duration: '—',
          summary:
            "Deep-dived into how AI is transforming industries — healthcare, finance, education, and beyond — and what it means for the careers of tomorrow's engineers.",
        },
        {
          title: 'The Future of AI — Opportunities & Challenges',
          speaker: 'Vikas Kumar Sharma',
          role: 'Presenter',
          duration: '—',
          summary:
            'Discussed the ethical landscape of AI, its growing capabilities, and the responsibilities that come with building intelligent systems.',
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
        {
          name: "Prof. Neeta Awasthy Ma'am",
          title: 'Director',
          note: 'For your vision, encouragement, and leadership that pushes every student to find their spark.',
        },
        {
          name: 'Prof.(Dr.) V.K. Singh Sir',
          title: 'HOD',
          note: 'For your constant guidance and for creating space for student-led learning.',
        },
        {
          name: 'Dr. Shashi Shekhar Sir',
          title: 'Faculty',
          note: 'For showing us what it means to be a lifelong learner.',
        },
        {
          name: 'Richa Mishra & Vivek Bhardwaj',
          title: 'Coordinators',
          note: 'For your on-ground support and making the logistics feel effortless.',
        },
        {
          name: 'Dr. Wazir Singh Sir',
          title: 'KSS Coordinator',
          note: 'For trusting NexaSphere with this platform and guiding us every step.',
        },
      ],
      photoLink: null,
      videoLink: null,
      closingNote: `That's the magic of a KSS — it doesn't just inform, it transforms. A big thank you to every presenter, every volunteer, every face in the audience. You are NexaSphere. 🌐✨`,
    },
  ],

  upcomingEvents: [],
};

export default insightSession;
