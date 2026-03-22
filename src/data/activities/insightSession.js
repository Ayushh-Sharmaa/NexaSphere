// ── Insight Session Activity Data ──
// To add a new KSS: copy the KSS #153 block, change id/name/date and fill in details.
// To mark as upcoming: set status: 'upcoming' and remove topics/volunteers etc.

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
          note: 'For your constant guidance and belief in student-led initiatives.',
        },
        {
          name: 'Dr. Shashi Shekhar (PhD) Sir',
          title: 'HOD',
          note: 'For your constant guidance and belief in student-led initiatives.',
        },
        {
          name: "Richa Mishra Ma'am & Vivek Bhardwaj Sir",
          title: 'Faculty',
          note: 'For being the backbone behind every event and always pushing us to do better.',
        },
        {
          name: 'Dr. Wazir Singh Sir',
          title: 'KSS Coordinator',
          note: 'For approving and supporting this session. Your trust in us means everything!',
        },
      ],
      closingNote:
        "This is just the BEGINNING. Bigger events. Deeper sessions. More ideas. More inspiration. The journey has just started and we're only getting warmed up! 🔥",
      photoLink: null,   // ← Add Google Drive link here when ready
      videoLink: null,   // ← Add YouTube link here when ready
    },

    // ── Add next KSS below ──
    // {
    //   id: 'kss-154',
    //   name: 'KSS #154 — Topic Name',
    //   shortName: 'KSS #154',
    //   date: 'Month Year',
    //   status: 'completed',
    //   tagline: '...',
    //   hashtags: ['#KSS154', '#NexaSphere', '#GLBajaj'],
    //   stats: [],
    //   overview: '...',
    //   topics: [],
    //   videoPresenter: [],
    //   anchor: null,
    //   volunteers: [],
    //   acknowledgements: [],
    //   closingNote: '',
    //   photoLink: null,
    //   videoLink: null,
    // },
  ],

  upcomingEvents: [],
};

export default insightSession;
