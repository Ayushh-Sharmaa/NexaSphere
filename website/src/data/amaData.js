export const amaThreads = [
  {
    id: 'ama-1',
    topic: "How I cleared GSSoC '26 and secured a full-time role",
    status: 'active', // active, upcoming, archived
    mentor: {
      name: 'Ayush Sharma',
      role: 'SDE @ Google | Ex-GSSoC',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ayush',
    },
    date: '2026-07-05T10:00:00Z',
    description:
      'Join me for an AMA where I share my journey from open-source contributor to a full-time Software Engineer. Ask me anything about GSSoC, resumes, or interview prep!',
    tags: ['GSSoC', 'Career', 'Open Source'],
    questionsCount: 4,
    questions: [
      {
        id: 'q1',
        author: {
          name: 'Priya Patel',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
        },
        content: 'What was the most challenging part of GSSoC for you?',
        upvotes: 12,
        createdAt: '2026-07-01T14:30:00Z',
        reply: {
          content:
            'The most challenging part was definitely getting started with large codebases. My advice is to start with documentation or "good first issues" to build confidence before tackling complex features.',
          createdAt: '2026-07-01T16:00:00Z',
        },
      },
      {
        id: 'q2',
        author: {
          name: 'Rahul Kumar',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul',
        },
        content: 'How many PRs should I aim for to be in the top 100?',
        upvotes: 8,
        createdAt: '2026-07-01T15:10:00Z',
        reply: null,
      },
      {
        id: 'q3',
        author: {
          name: 'Sarah Lee',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        },
        content: 'Did your open source contributions directly help in your Google interview?',
        upvotes: 24,
        createdAt: '2026-07-02T09:15:00Z',
        reply: {
          content:
            'Absolutely! It gave me a lot to talk about during the behavioral rounds, and my experience with large-scale architecture reviews during OSS translated well to the system design rounds.',
          createdAt: '2026-07-02T11:20:00Z',
        },
      },
      {
        id: 'q4',
        author: {
          name: 'Dev Singh',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dev',
        },
        content: 'What tech stack do you recommend for beginners?',
        upvotes: 5,
        createdAt: '2026-07-02T12:05:00Z',
        reply: null,
      },
    ],
  },
  {
    id: 'ama-2',
    topic: 'Transitioning from Frontend Developer to DevOps Engineer',
    status: 'upcoming',
    mentor: {
      name: 'Rohan Verma',
      role: 'DevOps Engineer @ AWS',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan',
    },
    date: '2026-07-15T14:00:00Z',
    description:
      'I made the switch from writing React components to managing Kubernetes clusters. If you are curious about infrastructure as code, cloud architectures, or DevOps culture, leave your questions here!',
    tags: ['DevOps', 'Career Transition', 'AWS'],
    questionsCount: 1,
    questions: [
      {
        id: 'q1',
        author: {
          name: 'Anita Roy',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anita',
        },
        content: 'Do I need to be an expert in Linux to get started with DevOps?',
        upvotes: 15,
        createdAt: '2026-07-02T10:00:00Z',
        reply: null,
      },
    ],
  },
  {
    id: 'ama-3',
    topic: 'Mastering System Design for SDE-2 Roles',
    status: 'archived',
    mentor: {
      name: 'Neha Gupta',
      role: 'Senior SDE @ Netflix',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Neha',
    },
    date: '2026-06-10T18:00:00Z',
    description:
      'We discussed common system design patterns, how to approach scalable architectures, and what interviewers look for in mid-level engineering roles.',
    tags: ['System Design', 'Interviews', 'Senior Roles'],
    questionsCount: 2,
    questions: [
      {
        id: 'q1',
        author: {
          name: 'Vikas Sharma',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikas',
        },
        content: 'How do you handle pagination in a feed like Netflix?',
        upvotes: 32,
        createdAt: '2026-06-10T17:30:00Z',
        reply: {
          content:
            'We heavily use cursor-based pagination rather than offset-based. Offset-based pagination gets very slow with large datasets because the database still has to scan through all previous rows.',
          createdAt: '2026-06-10T18:15:00Z',
        },
      },
      {
        id: 'q2',
        author: {
          name: 'Karan Patel',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Karan',
        },
        content: 'What is the most underrated system design concept?',
        upvotes: 18,
        createdAt: '2026-06-10T17:45:00Z',
        reply: {
          content:
            'Idempotency. Ensuring an API can be called multiple times without changing the result beyond the initial application is critical for robust distributed systems, especially when dealing with network retries.',
          createdAt: '2026-06-10T18:40:00Z',
        },
      },
    ],
  },
];
