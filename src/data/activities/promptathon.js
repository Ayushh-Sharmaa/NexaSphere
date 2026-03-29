// ── Promptathon Activity Data ──
// To add a new conducted event: copy a block from conductedEvents and fill in details.
// To add an upcoming event: copy a block from upcomingEvents and fill in details.

const promptathon = {
  id: 'promptathon',
  icon: '🤖',
  title: 'Promptathon',
  tagline: 'Prompt. Engineer. Dominate.',
  color: '#8b5cf6',
  gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  description:
    'The art of talking to AI — turned into a competitive sport. Craft the sharpest, most creative prompts to solve real-world problems, generate stunning outputs, and outsmart your peers in the age of generative intelligence.',

  conductedEvents: [
    // ── Paste completed promptathon events here ──
    // {
    //   id: 'promptathon-1',
    //   name: 'Promptathon 1.0',
    //   shortName: 'Promptathon 1.0',
    //   date: 'Month Year',
    //   status: 'completed',
    //   tagline: 'One line description',
    //   stats: [
    //     { label: 'Participants', value: '60' },
    //     { label: 'Prompts', value: '120+' },
    //     { label: 'Rounds', value: '3' },
    //     { label: 'Winners', value: '3' },
    //   ],
    //   overview: 'Full description of the event...',
    //   topics: [],
    //   photoLink: null,
    //   videoLink: null,
    //   hashtags: ['#Promptathon', '#NexaSphere', '#GLBajaj'],
    // },
  ],

  upcomingEvents: [
    {
      name: 'Promptathon 1.0',
      date: 'Coming Soon',
      description:
        'The first-ever NexaSphere Promptathon — where prompt engineering meets creativity. Master AI, craft killer prompts, and compete for the top spot.',
    },
  ],

  highlights: [
    {
      icon: '🧠',
      title: 'Prompt Engineering',
      desc: 'Learn to write precise, creative prompts that unlock AI\'s full potential across text, code, and images.',
    },
    {
      icon: '⚔️',
      title: 'Competitive Rounds',
      desc: 'Multi-round battles where prompts are judged on creativity, accuracy, efficiency, and output quality.',
    },
    {
      icon: '🎯',
      title: 'Real-World Tasks',
      desc: 'Tackle genuine challenges — from content generation to data analysis — using only natural language.',
    },
    {
      icon: '🏆',
      title: 'Leaderboard & Prizes',
      desc: 'Top prompt engineers earn recognition, certificates, and exclusive NexaSphere rewards.',
    },
  ],

  whatYouLearn: [
    'How to structure prompts for maximum AI output quality',
    'Chain-of-thought and few-shot prompting techniques',
    'Role-based and persona-driven prompting strategies',
    'Prompt debugging and iterative refinement',
    'Using AI tools: ChatGPT, Gemini, Claude, Midjourney',
    'Real-world applications of prompt engineering',
  ],

  tools: ['ChatGPT', 'Google Gemini', 'Claude', 'Midjourney', 'Stable Diffusion', 'GitHub Copilot'],
};

export default promptathon;
