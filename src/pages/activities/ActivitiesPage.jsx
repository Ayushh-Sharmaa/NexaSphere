import { useEffect, useRef } from "react";
import { activities } from "../../data/activitiesData";
import { BannerOrbs } from "../../shared/MotionLayer";
import Footer from '../../shared/Footer';
import { DynamicIcon } from '../../shared/Icons';

const activityDetails = {
  Hackathon: {
    color: "#CC1111",
    longDesc:
      "Intense 24–48 hour coding marathons where teams build innovative solutions to real-world problems under time pressure. Participants form cross-functional teams, brainstorm ideas, design architectures, and ship working prototypes — all under the clock.",
    highlights: [
      "Team-based challenges",
      "Mentorship from seniors",
      "Real problem statements",
      "Prizes & recognition",
    ],
    skills: [
      "Full-Stack Dev",
      "Problem Solving",
      "Team Collaboration",
      "System Design",
    ],
  },
  Codathon: {
    color: "#EE2222",
    longDesc:
      "Competitive programming contests that test your algorithmic thinking, data structures knowledge, and code efficiency. From greedy to dynamic programming — sharpen your edge for placements and ICPC-style rounds.",
    highlights: [
      "Timed challenge rounds",
      "Multi-difficulty problems",
      "Leaderboard ranking",
      "Individual & team modes",
    ],
    skills: ["Algorithms", "DSA", "Competitive Programming", "Optimization"],
  },
  Ideathon: {
    color: "#FF4444",
    longDesc:
      "Creativity-first competition where the best idea wins — no code required. Pitch your innovation, back it with research, and present a compelling case. Perfect for thinkers, designers, and business-minded builders.",
    highlights: [
      "Pitching rounds",
      "Expert panel judging",
      "Market research focus",
      "Cross-discipline teams",
    ],
    skills: ["Creative Thinking", "Presentation", "Research", "Product Design"],
  },
  Promptathon: {
    color: "#FF6666",
    longDesc:
      "The art of talking to AI turned into a competitive sport. Craft the sharpest, most creative prompts to solve real-world problems, generate stunning outputs, and outsmart your peers in the age of generative intelligence.",
    highlights: [
      "Multi-round prompt battles",
      "Judged on creativity & accuracy",
      "Real-world AI tasks",
      "Leaderboard & prizes",
    ],
    skills: [
      "Prompt Engineering",
      "AI Tools",
      "Creative Thinking",
      "Problem Solving",
    ],
  },
  Workshop: {
    color: "#AA0000",
    longDesc:
      "Hands-on learning sessions on cutting-edge tools, frameworks, and emerging technologies. Led by experienced peers, alumni, or industry guests — every workshop gets you building something real by the end.",
    highlights: [
      "Live coding sessions",
      "Take-home projects",
      "Q&A with experts",
      "Beginner to advanced tracks",
    ],
    skills: [
      "New Technologies",
      "Practical Skills",
      "Tool Mastery",
      "Applied Learning",
    ],
  },
  "Insight Session": {
    color: "#CC3333",
    longDesc:
      "Deep-dive talks and peer-to-peer knowledge sharing where every member is both teacher and student. Explore industry trends, career paths, emerging research, and the big ideas shaping tomorrow’s technology landscape.",
    highlights: [
      "Peer presentations",
      "Industry trend analysis",
      "Career guidance",
      "Open discussions",
    ],
    skills: [
      "Communication",
      "Research",
      "Critical Thinking",
      "Domain Knowledge",
    ],
  },
  "Open Source Day": {
    color: "#4CAF50",
    longDesc:
      "Dedicated events encouraging real contributions to open-source projects. Learn Git workflows, find your first issue, submit PRs, and become part of the global developer community — all in a guided, supportive environment.",
    highlights: [
      "First-PR guidance",
      "Project selection help",
      "Git & GitHub deep dive",
      "Community recognition",
    ],
    skills: ["Git", "Open Source", "Code Review", "Documentation"],
  },
  "Tech Debate": {
    color: "#880000",
    longDesc:
      "Structured debates on the most controversial topics in tech — AI vs Human Jobs, Native vs Cross-Platform, SQL vs NoSQL. Sharpen your ability to defend a position, handle rebuttals, and communicate technical ideas clearly.",
    highlights: [
      "Structured format",
      "Expert moderation",
      "Both sides argued",
      "Audience Q&A",
    ],
    skills: [
      "Public Speaking",
      "Critical Thinking",
      "Technical Communication",
      "Argumentation",
    ],
  },
};

function ActivityCard({ a, idx, onNavigate }) {
  const ref = useRef(null);
  const details = activityDetails[a.title] || {};

  const onMove = (e) => {
    const c = ref.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    c.style.transform = `translateY(-10px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg) scale(1.02)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };
  const click = () => {
    const c = ref.current;
    if (c) {
      c.style.transform = "scale(.93)";
      setTimeout(() => {
        c.style.transform = "";
      }, 140);
    }
    setTimeout(() => onNavigate("activity", a.title), 160);
  };

  return (
    <div
      ref={ref}
      onClick={click}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`ns-reveal ns-act-card ns-d${(idx % 6) + 1}`}
      style={{
        background: "var(--card)",
        border: `1px solid var(--bdr)`,
        borderRadius: "var(--r3)",
        padding: "28px 24px",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        perspective: "800px",
        animation: `ag 7s ease-in-out ${[-0, -2.1, -4.2, -1.0, -3.3, -5.5, -0.7][idx % 7]}s infinite`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: details.color || "var(--c1)",
          borderRadius: "var(--r3) var(--r3) 0 0",
        }}
      />

      <div
        className="ns-act-icon"
        style={{
          fontSize: "2.4rem",
          marginBottom: "14px",
          display: "inline-block",
          color: details.color || "var(--c1)",
        }}
      >
        <DynamicIcon name={a.icon} size={34} />
      </div>
      <div
        style={{
          fontFamily: "'Orbitron', monospace",
          fontSize: ".8rem",
          fontWeight: 700,
          color: details.color || "var(--c1)",
          marginBottom: "10px",
          letterSpacing: ".06em",
          textTransform: "uppercase",
        }}
      >
        {a.title}
      </div>
      <p
        style={{
          fontSize: ".88rem",
          color: "var(--t2)",
          lineHeight: 1.72,
          marginBottom: "18px",
        }}
      >
        {details.longDesc || a.description}
      </p>

      {details.skills && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            marginBottom: "18px",
          }}
        >
          {details.skills.map((s) => (
            <span
              key={s}
              style={{
                fontSize: ".62rem",
                padding: "3px 9px",
                borderRadius: "20px",
                background: `${details.color}18`,
                color: details.color,
                border: `1px solid ${details.color}35`,
                fontFamily: "'Space Mono', monospace",
                fontWeight: 600,
                transition: "transform .2s, background .2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.background = `${details.color}30`;
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "";
                e.target.style.background = `${details.color}18`;
              }}
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {details.highlights && (
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 18px" }}>
          {details.highlights.map((h) => (
            <li
              key={h}
              style={{
                fontSize: ".8rem",
                color: "var(--t2)",
                padding: "4px 0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ color: details.color, fontWeight: 700 }}>→</span>{" "}
              {h}
            </li>
          ))}
        </ul>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: ".72rem",
          fontWeight: 700,
          color: details.color || "var(--c1)",
          textTransform: "uppercase",
          letterSpacing: ".1em",
          opacity: 0.7,
          transition: "opacity .2s, letter-spacing .2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "1";
          e.currentTarget.style.letterSpacing = ".16em";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = ".7";
          e.currentTarget.style.letterSpacing = ".1em";
        }}
      >
        <span>View Sessions</span>
        <span>→</span>
      </div>

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "16px",
          height: "16px",
          borderTop: `1.5px solid ${details.color || "var(--c1)"}`,
          borderLeft: `1.5px solid ${details.color || "var(--c1)"}`,
          opacity: 0.5,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: "16px",
          height: "16px",
          borderBottom: `1.5px solid ${details.color || "var(--c1)"}`,
          borderRight: `1.5px solid ${details.color || "var(--c1)"}`,
          opacity: 0.5,
        }}
      />
    </div>
  );
}

export default function ActivitiesPage({ onNavigate, onBack }) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("fired");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px -10px 0px" },
    );
    document
      .querySelectorAll("#activities-page .pop-in, #activities-page .pop-word")
      .forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div
      id="activities-page"
      style={{ minHeight: "100vh", padding: "60px 0 100px" }}
    >
      <div
        className="page-banner"
        style={{
          background:
            "linear-gradient(135deg, rgba(204,17,17,.07), rgba(136,0,0,.04))",
          borderBottom: "1px solid var(--bdr)",
          padding: "60px 0 50px",
          textAlign: "center",
          marginBottom: "60px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          className="page-banner-line"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: "linear-gradient(90deg,var(--c1),var(--c2),var(--c3))",
          }}
        />
        <BannerOrbs color="rgba(204,17,17,.06)" />
        <button
          onClick={onBack}
          className="ns-back-btn"
          style={{
            position: "absolute",
            top: "24px",
            left: "28px",
            background: "var(--card)",
            border: "1px solid var(--bdr)",
            borderRadius: "50px",
            padding: "7px 16px",
            color: "var(--t2)",
            fontSize: ".8rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 600,
          }}
        >
          ← Back
        </button>

        <span
          className="cin-section-label pop-in"
          style={{ position: "relative", zIndex: 1 }}
        >
          NexaSphere · GL Bajaj
        </span>
        <h1
          className="section-title pop-word"
          style={{
            fontSize: "clamp(2rem, 5vw, 3.2rem)",
            position: "relative",
            zIndex: 1,
          }}
        >
          Our Activities
        </h1>
        <p
          className="section-subtitle pop-in"
          style={{
            animationDelay: ".1s",
            maxWidth: "580px",
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          Every format is designed to sharpen a different skill. Explore what excites you — then dive in.
        </p>
      </div>

      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "24px",
          }}
        >
          {activities.map((a, i) => (
            <ActivityCard key={a.id} a={a} idx={i} onNavigate={onNavigate} />
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
