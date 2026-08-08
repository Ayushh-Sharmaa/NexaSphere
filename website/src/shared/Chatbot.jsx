import React, { useState, useRef, useEffect } from 'react';
import apiClient from '../utils/apiClient.js';
import '../styles/chatbot.css';
import PromptHistorySidebar from '../components/history/PromptHistorySidebar';
import SearchBar from '../components/history/SearchBar';
import PinnedChats from '../components/history/PinnedChats';
import { savePrompt, exportPrompts } from '../lib/promptStore';
import { initializeWorkspaces } from '../lib/workspaceService';
import { buildUrl, getAiApiBase } from '../utils/runtimeConfig';

/* ─── Expanded NexaSphere Knowledge Base ─── */
const knowledgeBase = [
  {
    keywords: ['nexasphere', 'about', 'community', 'what is', 'gl bajaj', 'glbajaj'],
    answer:
      'NexaSphere is the official tech ecosystem at GL Bajaj Group of Institutions, Mathura — run by students, for students. It fosters innovation through hackathons, workshops, mentorship, open-source collaboration, and knowledge-sharing events.',
    quickReplies: ['How do I join?', 'Who leads NexaSphere?', 'What activities do you run?'],
  },
  {
    keywords: ['hackathon', 'codathon', 'ideathon', 'promptathon', 'competition', 'contest'],
    answer:
      'NexaSphere hosts four flagship competitions:\n• **Hackathon** — Build a working app in 24-48 hours\n• **Codathon** — DSA & competitive programming challenges\n• **Ideathon** — Pitch your startup idea to judges\n• **Promptathon** — Showcase AI prompting mastery\nAll events award XP, certificates, and often cash prizes!',
    quickReplies: [
      'How do I register for events?',
      'What prizes are offered?',
      'Show upcoming events',
    ],
  },
  {
    keywords: ['workshop', 'git', 'github', 'react', 'learn', 'session', 'kss', 'knowledge'],
    answer:
      'We run hands-on workshops on Git/GitHub, React, DSA, UI/UX, Cloud, AI/ML, and more. Knowledge Sharing Sessions (KSS) happen every week where community members share expertise and industry trends. Check the **Events** tab for the full schedule.',
    quickReplies: ['Show upcoming events', 'How do I attend a workshop?', 'What is a KSS?'],
  },
  {
    keywords: ['join', 'member', 'membership', 'register', 'sign up'],
    answer:
      "To join NexaSphere as a member:\n1. Click the **Join** button in the navbar\n2. Fill in your details using your **@glbajajgroup.org** email\n3. Submit the form — you'll receive a confirmation on WhatsApp\n\nMembership is free and gives you access to all events, workshops, and certificates!",
    quickReplies: ['What are the benefits?', 'Apply for core team', 'Contact us'],
  },
  {
    keywords: ['apply', 'core team', 'recruitment', 'hiring', 'join team'],
    answer:
      'Core Team applications open periodically (usually each semester). To apply:\n1. Click **Apply** in the navbar\n2. Choose your domain: Development, Design, Content, or Management\n3. Fill the recruitment form\n\nLook for announcements on our WhatsApp community and the Announcements section.',
    quickReplies: [
      'What domains can I apply for?',
      'Who is the current team?',
      'How does selection work?',
    ],
  },
  {
    keywords: ['team', 'leader', 'organizer', 'head', 'ayush', 'tanishk', 'core team members'],
    answer:
      'NexaSphere is led by **Ayush Sharma** (Founder & Lead) and **Tanishk Bansal** (Co-Lead), supported by a passionate Core Team of 15+ members across Development, Design, Content, and Management domains. Visit the **Core Team** tab to see all members.',
    quickReplies: ['How do I join the team?', 'Contact us', 'What does each domain do?'],
  },
  {
    keywords: ['contact', 'email', 'reach out', 'help', 'support', 'whatsapp'],
    answer:
      "📧 Email: **nexasphere@glbajajgroup.org**\n💬 WhatsApp: Check the Contact page for the community link\n🌐 Website: You're here!\n\nFor urgent queries, use the **Contact** tab to send a direct message.",
    quickReplies: ['Go to contact page', 'What is your email?', 'Join WhatsApp community'],
  },
  {
    keywords: ['certificate', 'verify', 'badge', 'proof', 'achievement'],
    answer:
      'NexaSphere issues digital certificates for event participation, workshop completion, and contest achievements. You can:\n• Download certificates from your **Dashboard**\n• Verify any certificate at **/verify/[certificate-id]**\n• Share verified certificates directly on LinkedIn',
    quickReplies: [
      'How to download my certificate?',
      'Go to dashboard',
      'How to verify a certificate?',
    ],
  },
  {
    keywords: ['mentorship', 'mentor', 'guidance', 'career'],
    answer:
      'The NexaSphere Mentorship Program connects students with experienced mentors from industry and senior batches. Navigate to the **Mentorship** tab to:\n• Browse available mentors\n• Book 1-on-1 sessions\n• Track your mentorship progress',
    quickReplies: ['Browse mentors', 'How does mentorship work?', 'Who can be a mentor?'],
  },
  {
    keywords: ['roadmap', 'learning path', 'skill', 'curriculum'],
    answer:
      'NexaSphere offers structured **Learning Roadmaps** for popular tech paths:\n• Full Stack Development\n• Data Science & AI\n• UI/UX Design\n• DevOps & Cloud\n• Competitive Programming\n\nEach roadmap includes curated resources, milestones, and XP rewards. Visit the **Roadmaps** tab!',
    quickReplies: ['Show roadmaps', 'What is XP?', 'How to start learning?'],
  },
  {
    keywords: ['xp', 'points', 'gamification', 'level', 'badge', 'leaderboard'],
    answer:
      'NexaSphere has a Gamification system to reward your participation!\n• Earn **XP** by attending events, posting comments, creating content, and more\n• Level up from Newcomer → Explorer → Contributor → Expert → Legend\n• Unlock **badges** and compete on the **leaderboard**\n\nVisit the **Gamification** tab to track your progress!',
    quickReplies: ['Go to gamification hub', 'How to earn XP?', 'What are the levels?'],
  },
  {
    keywords: ['project', 'collab', 'collaboration', 'open source', 'contribute'],
    answer:
      "NexaSphere's **Projects & Collab** section lets you:\n• Browse student projects and contribute\n• Start your own project and find collaborators\n• Join live collaborative workspaces\n• Build your portfolio through real-world projects\n\nCheck the **Projects** and **Collab** tabs!",
    quickReplies: ['Browse projects', 'Start a project', 'What is a workspace?'],
  },
  {
    keywords: ['portfolio', 'resume', 'profile', 'showcase'],
    answer:
      'NexaSphere has a built-in **Portfolio Builder** where you can:\n• Add projects with live demos and GitHub links\n• List skills, achievements, and certificates\n• Share a public portfolio URL: nexasphere.in/p/[username]\n• Get a resume score and AI-powered suggestions\n\nVisit the **Portfolio** tab to get started!',
    quickReplies: ['Build my portfolio', 'Share portfolio link', 'Get resume tips'],
  },
  {
    keywords: ['event', 'upcoming', 'schedule', 'when', 'next'],
    answer:
      'You can find all NexaSphere events in the **Events** tab. We have:\n• Timeline view — chronological list of all events\n• Calendar view — month/week/day grid with drag-drop scheduling\n• "For You" view — AI-personalized event recommendations\n\nFilter by upcoming, live, or completed events!',
    quickReplies: ['Show upcoming events', 'How to register?', 'Show calendar view'],
  },
  {
    keywords: ['history', 'save', 'workspace', 'chat history'],
    answer:
      'Your chats are automatically saved! Use the 📋 icon to toggle the history sidebar, or use the workspace selector (General / Coding & Debug / Research) to organize your queries. You can also export your entire chat history using the ⬇ button.',
    quickReplies: ['Export chat history', 'Clear history', 'How workspaces work?'],
  },
  {
    keywords: ['dark mode', 'light mode', 'theme', 'color'],
    answer:
      'You can toggle between dark and light modes using the 🌙/☀️ button in the top navbar. NexaSphere remembers your preference across sessions.',
    quickReplies: ['How to change language?', 'Accessibility options', 'Report a bug'],
  },
  {
    keywords: ['language', 'hindi', 'english', 'translate', 'i18n'],
    answer:
      'NexaSphere supports 7 languages: English, Hindi, Spanish, French, German, Portuguese, and Arabic! Use the language selector (flag icon) in the navbar to switch instantly.',
    quickReplies: ['Switch to Hindi', 'Contact us', 'Report a bug'],
  },
  {
    keywords: ['bug', 'error', 'issue', 'problem', 'broken', 'not working'],
    answer:
      'Sorry to hear that! You can report bugs via:\n• **GitHub Issues**: github.com/Ayushh-Sharmaa/NexaSphere\n• **Email**: nexasphere@glbajajgroup.org\n• **Contact page**: Use the contact form on our website\n\nPlease describe the issue and which page/feature is affected.',
    quickReplies: ['Contact us', 'Go to GitHub', 'Try refreshing the page'],
  },
  {
    keywords: ['nexasphere', 'about', 'community', 'what is'],
    answer:
      'NexaSphere is the official tech ecosystem at GL Bajaj Group of Institutions, Mathura, run by students for students to foster innovation and learning.',
  },
  {
    keywords: ['hackathon', 'codathon', 'ideathon', 'promptathon'],
    answer:
      'NexaSphere hosts various competitions: Hackathons (building apps), Codathons (DSA/Competitive Programming), Ideathons (pitching ideas), and Promptathons (AI prompting).',
  },
  {
    keywords: ['workshop', 'git', 'github', 'react', 'learn'],
    answer:
      'We conduct hands-on workshops on Git, GitHub, React, and emerging tech. Check the "Activities" page for upcoming sessions!',
  },
  {
    keywords: ['event', 'kss', 'insight', 'session'],
    answer:
      'NexaSphere organizes Knowledge Sharing Sessions (KSS) and Insight Sessions where peers share technical expertise and industry trends.',
  },
  {
    keywords: ['team', 'mentor', 'leader', 'organizer', 'ayush', 'tanishk'],
    answer:
      'NexaSphere is led by Ayush Sharma and Tanishk Bansal, supported by a dedicated Core Team of developers, designers, and content creators.',
  },
  {
    keywords: ['join', 'member', 'membership', 'register'],
    answer:
      'To join as a member, click the "Join" button on our homepage. Note: You must use your @glbajajgroup.org email address.',
  },
  {
    keywords: ['apply', 'core team', 'recruitment', 'hiring'],
    answer:
      'Core Team applications open periodically. Keep an eye on the "Apply" button in the navigation bar or our WhatsApp community updates.',
  },
  {
    keywords: ['contact', 'email', 'reach out', 'help'],
    answer:
      'You can reach us at nexasphere@glbajajgroup.org or via the official contact form on the website.',
  },
  {
    keywords: ['history', 'save', 'workspace'],
    answer:
      'Your chats are automatically saved! Use the 📋 icon to toggle history, or use the workspace selector to organize your queries into General, Coding, or Research.',
  },
];

/* ─── Scoring-based intent matcher ─── */
function queryLocalKnowledge(input) {
  const text = input.toLowerCase().trim();
  if (!text) return null;

  let bestMatch = null;
  let bestScore = 0;

  for (const item of knowledgeBase) {
    let score = 0;
    for (const kw of item.keywords) {
      if (text.includes(kw)) {
        // Longer keywords = more specific match = higher score
        score += kw.length + 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  if (bestScore > 0 && bestMatch) {
    return {
      answer: bestMatch.answer,
      quickReplies: bestMatch.quickReplies || [],
    };
  }

  return {
    answer:
      "I'm not sure about that specific query. I can help you with:\n• Joining NexaSphere\n• Upcoming events & workshops\n• Core Team applications\n• Certificates & achievements\n• Gamification & XP\n• Portfolio building\n\nTry asking one of those topics!",
    quickReplies: ['How to join?', 'Show events', 'Contact us'],
  };
}

/* ─── Typing indicator ─── */
function TypingIndicator() {
  return (
    <div
      className="msg-bubble bot"
      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '10px 16px' }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'var(--c1, #CC1111)',
            display: 'inline-block',
            animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ─── Quick Reply Chips ─── */
function QuickReplies({ replies, onSelect }) {
  if (!replies || replies.length === 0) return null;
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        padding: '6px 8px 10px',
      }}
    >
      {replies.map((reply) => (
        <button
          key={reply}
          onClick={() => onSelect(reply)}
          style={{
            background: 'rgba(204,17,17,0.1)',
            border: '1px solid rgba(204,17,17,0.35)',
            borderRadius: 20,
            padding: '4px 12px',
            fontSize: '0.75rem',
            color: 'var(--c1, #CC1111)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 600,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(204,17,17,0.2)';
            e.currentTarget.style.borderColor = 'rgba(204,17,17,0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(204,17,17,0.1)';
            e.currentTarget.style.borderColor = 'rgba(204,17,17,0.35)';
          }}
        >
          {reply}
        </button>
      ))}
    </div>
  );
}

/* ─── Format bot message (handles **bold** markdown) ─── */
function BotMessage({ text }) {
  // Convert **text** → <strong>text</strong> and \n → <br>
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return part.split('\n').map((line, j) => (
          <React.Fragment key={`${i}-${j}`}>
            {j > 0 && <br />}
            {line}
          </React.Fragment>
        ));
      })}
    </span>
  );
}

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: `msg-init`,
      role: 'bot',
      text: 'Nexa-Intelligence Online. How can I assist your journey?',
      quickReplies: ['How to join NexaSphere?', 'Show upcoming events', 'Apply for core team'],
    },
  ]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState('default');
  const [historyVersion, setHistoryVersion] = useState(0);
  const scrollRef = useRef(null);

  const triggerHistoryRefresh = () => setHistoryVersion((v) => v + 1);

  // Initialize workspaces on mount
  useEffect(() => {
    initializeWorkspaces();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isTyping]);

  useEffect(() => {
    if (messages.length >= 2) {
      const lastBotMsg = [...messages].reverse().find((m) => m.role === 'bot');
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
      if (lastBotMsg && lastUserMsg) {
        const lastBotIndex = messages.indexOf(lastBotMsg);
        const lastUserIndex = messages.indexOf(lastUserMsg);
        if (lastBotIndex > lastUserIndex) {
          savePrompt(lastUserMsg.text, lastBotMsg.text, currentWorkspace)
            .then(() => {
              triggerHistoryRefresh();
            })
            .catch((err) => {
              if (import.meta.env.DEV) console.error('[Chatbot] Error saving prompt:', err.message);
            });
        }
      }
    }
  }, [messages, currentWorkspace]);

  const sendBotReply = (query) => {
    const result = queryLocalKnowledge(query);
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}-bot`,
        role: 'bot',
        text: result.answer,
        quickReplies: result.quickReplies,
      },
    ]);
  };

  const handleSend = async (textOverride) => {
    const text = (textOverride || input).trim();
    if (!text || isSending) return;

    const userMsg = { id: `msg-${Date.now()}-user`, role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    if (!textOverride) setInput('');
    setIsSending(true);
    setIsTyping(true);

    const aiChatUrl = buildUrl(getAiApiBase(), '/ai/chat');

    if (!aiChatUrl) {
      // Simulate typing delay for local fallback
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
      setIsTyping(false);
      sendBotReply(text);
      setIsSending(false);
      return;
    }

    const controller = new AbortController();
    try {
      const data = await apiClient(aiChatUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      });
      setIsTyping(false);
      const localResult = queryLocalKnowledge(text);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-bot`,
          role: 'bot',
          text: data.reply,
          quickReplies: localResult.quickReplies,
        },
      ]);
    } catch (e) {
      if (import.meta.env.DEV) console.error('[Chatbot] AI chat request failed:', e.message);
      setIsTyping(false);
      sendBotReply(text);
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectPrompt = (prompt) => {
    setMessages([
      {
        id: 'msg-init',
        role: 'bot',
        text: 'Nexa-Intelligence Online. How can I assist your journey?',
        quickReplies: ['How to join NexaSphere?', 'Show upcoming events', 'Apply for core team'],
      },
      { id: `msg-${Date.now()}-user`, role: 'user', text: prompt.userPrompt },
      { id: `msg-${Date.now() + 1}-bot`, role: 'bot', text: prompt.botResponse, quickReplies: [] },
    ]);
    setShowSidebar(false);
  };

  return (
    <div className="ns-chatbot-wrapper">
      {!isOpen ? (
        <button
          className="chat-trigger-btn"
          onClick={() => setIsOpen(true)}
          aria-expanded={isOpen}
          aria-controls="chatbot-window"
        >
          <div className="pulse-ring"></div>
          💬
        </button>
      ) : (
        <div id="chatbot-window" className="chat-window-glass">
          <PromptHistorySidebar
            isOpen={showSidebar}
            onSelectPrompt={handleSelectPrompt}
            currentWorkspace={currentWorkspace}
            historyVersion={historyVersion}
            onHistoryChange={triggerHistoryRefresh}
          />

          <div className={`chat-main ${showSidebar ? 'sidebar-open' : ''}`}>
            <div className="chat-header">
              <button
                className="history-toggle-btn"
                onClick={() => setShowSidebar(!showSidebar)}
                title="Toggle History"
                aria-expanded={showSidebar}
                aria-controls="prompt-history-sidebar"
              >
                📋
              </button>
              <button
                className="export-btn"
                onClick={() => exportPrompts(currentWorkspace)}
                title="Export chat history"
              >
                ⬇
              </button>
              <div className="header-status">
                <span className="status-dot"></span>
                <span>NEXA-AI</span>
              </div>
              <button className="close-btn" onClick={() => setIsOpen(false)}>
                ×
              </button>
            </div>

            <div className="chat-content">
              <PinnedChats
                onSelectPrompt={handleSelectPrompt}
                workspace={currentWorkspace}
                historyVersion={historyVersion}
                onHistoryChange={triggerHistoryRefresh}
              />

              <SearchBar onSelectPrompt={handleSelectPrompt} workspace={currentWorkspace} />

              <div className="chat-messages" ref={scrollRef}>
                {messages.map((m) => (
                  <div key={m.id}>
                    <div className={`msg-bubble ${m.role}`}>
                      {m.role === 'bot' ? <BotMessage text={m.text} /> : m.text}
                    </div>
                    {m.role === 'bot' && m.quickReplies?.length > 0 && (
                      <QuickReplies
                        replies={m.quickReplies}
                        onSelect={(reply) => handleSend(reply)}
                      />
                    )}
                  </div>
                ))}
                {isTyping && <TypingIndicator />}
              </div>
            </div>

            <div className="chat-input-container">
              <select
                value={currentWorkspace}
                onChange={(e) => setCurrentWorkspace(e.target.value)}
                className="workspace-selector-inline"
              >
                <option value="default">General</option>
                <option value="coding">Coding &amp; Debug</option>
                <option value="research">Research</option>
              </select>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isSending ? 'Transmitting…' : 'Query system…'}
                disabled={isSending}
              />
              <button onClick={() => handleSend()} className="send-btn" disabled={isSending}>
                {isSending ? '…' : '🚀'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
