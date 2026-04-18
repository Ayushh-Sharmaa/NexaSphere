import { useEffect, useMemo, useRef, useState } from 'react';

const WHATSAPP_SCREENING = 'https://chat.whatsapp.com/EFbDGo6awGP2L0laESg3lq';
const WHATSAPP_COMMUNITY = 'https://chat.whatsapp.com/FhpJEaod2g419jFMfqrhGZ';

const ROLE_OPTIONS = [
  'Technical Lead',
  'Domain Lead',
  'Co-Lead',
  'Management Lead',
  'Core Team Member',
];

const INTEREST_OPTIONS = [
  'Cloud Computing',
  'Artificial Intelligence / Machine Learning',
  'Android Development',
  'Web / Full-Stack Development',
  'Cyber Security',
  'UI / UX Design',
  'Event Management',
  'Marketing & Social Media',
  'Content & Documentation',
  'Community & Outreach',
];

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const COMMIT_OPTIONS = ['Yes', 'No', 'Maybe'];

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

function Field({ label, required, hint, children }) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <div style={{
          fontFamily: 'Orbitron,monospace',
          fontSize: '.72rem',
          letterSpacing: '.12em',
          textTransform: 'uppercase',
          color: 'var(--t1)',
        }}>
          {label}{required ? <span style={{ color: 'var(--c4)', marginLeft: 6 }}>*</span> : null}
        </div>
        {hint ? <div style={{ color: 'var(--t3)', fontSize: '.82rem' }}>{hint}</div> : null}
      </div>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      style={{
        width: '100%',
        padding: '12px 14px',
        background: 'var(--card2)',
        border: '1px solid var(--bdr2)',
        borderRadius: 'var(--r2)',
        color: 'var(--t1)',
        fontFamily: 'Rajdhani,sans-serif',
        fontSize: '.98rem',
        outline: 'none',
      }}
      onFocus={e => { e.target.style.borderColor = 'var(--c1b)'; e.target.style.boxShadow = 'var(--sh1)'; }}
      onBlur={e => { e.target.style.borderColor = 'var(--bdr2)'; e.target.style.boxShadow = 'none'; }}
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 5 }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: '100%',
        padding: '12px 14px',
        background: 'var(--card2)',
        border: '1px solid var(--bdr2)',
        borderRadius: 'var(--r2)',
        color: 'var(--t1)',
        fontFamily: 'Rajdhani,sans-serif',
        fontSize: '.98rem',
        outline: 'none',
        resize: 'vertical',
      }}
      onFocus={e => { e.target.style.borderColor = 'var(--c1b)'; e.target.style.boxShadow = 'var(--sh1)'; }}
      onBlur={e => { e.target.style.borderColor = 'var(--bdr2)'; e.target.style.boxShadow = 'none'; }}
    />
  );
}

function PillRadio({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {options.map(opt => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className="btn btn-outline btn-sm"
            style={{
              background: active ? 'linear-gradient(135deg,var(--c1),var(--c2))' : undefined,
              color: active ? '#fff' : undefined,
              borderColor: active ? 'transparent' : undefined,
              boxShadow: active ? '0 0 18px var(--c1g)' : undefined,
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function MultiSelectChips({ options, values, onToggle }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {options.map(opt => {
        const active = values.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className="btn btn-outline btn-sm"
            style={{
              background: active ? 'rgba(0,212,255,.12)' : undefined,
              borderColor: active ? 'var(--c1)' : undefined,
              color: active ? 'var(--t1)' : undefined,
              boxShadow: active ? '0 0 14px var(--c1g)' : undefined,
              textTransform: 'none',
              letterSpacing: '.03em',
              fontSize: '.82rem',
            }}
          >
            {active ? '✓ ' : ''}{opt}
          </button>
        );
      })}
    </div>
  );
}

export default function RecruitmentPage({ onBack }) {
  const [step, setStep] = useState(0); // 0..6
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const topRef = useRef(null);

  const [form, setForm] = useState({
    fullName: '',
    collegeEmail: '',
    whatsapp: '',
    year: '',
    branch: '',
    section: '',

    role: '',
    interests: [],

    skills: '',
    comms: '',
    campusExp: '',
    campusExpDetails: '',
    links: '',

    commitHours: '',
    attendCampus: '',
    assessmentOk: '',

    whyJoin: '',
    anythingElse: '',

    declaration: '',
  });

  const steps = useMemo(() => ([
    {
      title: 'Mission Briefing',
      subtitle: 'NexaSphere Core Team Recruitment (2026)',
      icon: '🛰️',
      xp: 80,
      requiredKeys: [],
      render: () => (
        <div style={{ display: 'grid', gap: 18 }}>
          <p style={{ color: 'var(--t2)' }}>
            We are building the Core Team for <span className="grad-text" style={{ fontWeight: 700 }}>NexaSphere</span> — the central tech community
            that brings together GDG On Campus activities, cloud programs, workshops, hackathons, and multi-domain learning on campus.
          </p>
          <div style={{
            background: 'var(--card)',
            border: '1px solid var(--bdr)',
            borderRadius: 'var(--r3)',
            padding: 18,
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div className="corner-tl"/><div className="corner-br"/>
            <div style={{
              fontFamily: 'Space Mono,monospace',
              fontSize: '.65rem',
              color: 'var(--t3)',
              letterSpacing: '.22em',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}>Important notes</div>
            <ul style={{ paddingLeft: 18, display: 'grid', gap: 8, color: 'var(--t2)' }}>
              <li>By filling this form, you are committing <b>4–6 hours/week</b> to NexaSphere activities.</li>
              <li>Attendance support will be provided for lectures missed due to officially approved events.</li>
              <li>Short test / trial activities may be conducted to evaluate credibility, consistency, and teamwork.</li>
              <li>Only serious, responsible, and committed students should apply.</li>
            </ul>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
          }}>
            <div className="activity-card" style={{ cursor: 'default' }}>
              <div className="card-accent-line"/>
              <div className="activity-icon">⏱️</div>
              <div className="activity-title">Weekly Commitment</div>
              <div className="activity-desc">4–6 hours, consistent.</div>
            </div>
            <div className="activity-card" style={{ cursor: 'default' }}>
              <div className="card-accent-line"/>
              <div className="activity-icon">🤝</div>
              <div className="activity-title">Team First</div>
              <div className="activity-desc">Collaboration and reliability.</div>
            </div>
            <div className="activity-card" style={{ cursor: 'default' }}>
              <div className="card-accent-line"/>
              <div className="activity-icon">🧪</div>
              <div className="activity-title">Trial Rounds</div>
              <div className="activity-desc">Short assessments may happen.</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Basic Details',
      subtitle: 'Tell us who you are.',
      icon: '🪪',
      xp: 120,
      requiredKeys: ['fullName', 'collegeEmail', 'whatsapp', 'year', 'branch', 'section'],
      render: () => (
        <div style={{ display: 'grid', gap: 18 }}>
          <Field label="Full Name" required>
            <Input value={form.fullName} onChange={v => setForm(f => ({ ...f, fullName: v }))} placeholder="Your full name" />
          </Field>
          <Field label="College Email ID" required hint="Use your official college email.">
            <Input value={form.collegeEmail} onChange={v => setForm(f => ({ ...f, collegeEmail: v }))} placeholder="name@college.edu" type="email" />
          </Field>
          <Field label="Contact Number (WhatsApp preferred)" required>
            <Input value={form.whatsapp} onChange={v => setForm(f => ({ ...f, whatsapp: v }))} placeholder="+91 XXXXX XXXXX" type="tel" />
          </Field>
          <Field label="Year of Study" required>
            <PillRadio options={YEAR_OPTIONS} value={form.year} onChange={v => setForm(f => ({ ...f, year: v }))} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Branch / Department" required>
              <Input value={form.branch} onChange={v => setForm(f => ({ ...f, branch: v }))} placeholder="CSE / IT / AIML / ..." />
            </Field>
            <Field label="Section" required>
              <Input value={form.section} onChange={v => setForm(f => ({ ...f, section: v }))} placeholder="A / B / C / ..." />
            </Field>
          </div>
        </div>
      ),
    },
    {
      title: 'Role & Domain Preference',
      subtitle: 'Choose your quest path.',
      icon: '🧭',
      xp: 140,
      requiredKeys: ['role', 'interests'],
      render: () => (
        <div style={{ display: 'grid', gap: 18 }}>
          <div style={{
            background: 'var(--card)',
            border: '1px solid var(--bdr)',
            borderRadius: 'var(--r3)',
            padding: 16,
            position: 'relative',
          }}>
            <div className="corner-tl"/><div className="corner-br"/>
            <div style={{ color: 'var(--t2)', fontSize: '.92rem', lineHeight: 1.7 }}>
              Before selecting any role, please review roles & responsibilities here:
              <div style={{ marginTop: 8 }}>
                <a
                  href="https://tinyurl.com/gdg-core-team"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm"
                  style={{ display: 'inline-flex' }}
                >
                  🔎 View roles guide
                </a>
              </div>
            </div>
          </div>

          <Field label="Which role do you wish to apply for?" required>
            <PillRadio options={ROLE_OPTIONS} value={form.role} onChange={v => setForm(f => ({ ...f, role: v }))} />
          </Field>

          <Field label="Area's of Interest" required hint="Select one or more.">
            <MultiSelectChips
              options={INTEREST_OPTIONS}
              values={form.interests}
              onToggle={(opt) => setForm(f => ({
                ...f,
                interests: f.interests.includes(opt)
                  ? f.interests.filter(x => x !== opt)
                  : [...f.interests, opt],
              }))}
            />
          </Field>
        </div>
      ),
    },
    {
      title: 'Skills & Experience',
      subtitle: 'Show your loadout.',
      icon: '🧰',
      xp: 170,
      requiredKeys: ['skills', 'comms', 'campusExp'],
      render: () => (
        <div style={{ display: 'grid', gap: 18 }}>
          <Field
            label="Programming language(s) / tools you know + level"
            required
            hint="Beginner / Intermediate / Advanced"
          >
            <TextArea
              value={form.skills}
              onChange={v => setForm(f => ({ ...f, skills: v }))}
              placeholder={'Example:\nPython – Intermediate\nJava – Beginner\nHTML – Advanced\nKotlin – Beginner'}
              rows={6}
            />
          </Field>

          <Field
            label="Communication language(s) + fluency"
            required
            hint="English / Hindi / Both"
          >
            <TextArea
              value={form.comms}
              onChange={v => setForm(f => ({ ...f, comms: v }))}
              placeholder={'Example:\nEnglish – Basic\nHindi – Fluent\nBoth – Moderate'}
              rows={4}
            />
          </Field>

          <Field label="Have you participated in any community, club, or event before? (On Campus)" required>
            <PillRadio
              options={['Yes', 'No']}
              value={form.campusExp}
              onChange={v => setForm(f => ({ ...f, campusExp: v }))}
            />
          </Field>

          {form.campusExp === 'Yes' ? (
            <Field label="If yes, mention the community / role">
              <Input
                value={form.campusExpDetails}
                onChange={v => setForm(f => ({ ...f, campusExpDetails: v }))}
                placeholder="Community name + your role"
              />
            </Field>
          ) : null}

          <Field label="Links to work (GitHub / LinkedIn / Portfolio)">
            <Input
              value={form.links}
              onChange={v => setForm(f => ({ ...f, links: v }))}
              placeholder="Paste links (comma-separated is fine)"
            />
          </Field>
        </div>
      ),
    },
    {
      title: 'Commitment & Availability',
      subtitle: 'Can you keep the streak?',
      icon: '🔥',
      xp: 160,
      requiredKeys: ['commitHours', 'attendCampus', 'assessmentOk'],
      render: () => (
        <div style={{ display: 'grid', gap: 18 }}>
          <Field label="Are you willing to commit 4–6 hours per week consistently?" required>
            <PillRadio options={COMMIT_OPTIONS} value={form.commitHours} onChange={v => setForm(f => ({ ...f, commitHours: v }))} />
          </Field>
          <Field label="Are you comfortable attending meetings, events, and sessions on campus?" required>
            <PillRadio options={COMMIT_OPTIONS} value={form.attendCampus} onChange={v => setForm(f => ({ ...f, attendCampus: v }))} />
          </Field>
          <Field label="Do you understand that short assessment may be conducted?" required>
            <PillRadio options={COMMIT_OPTIONS} value={form.assessmentOk} onChange={v => setForm(f => ({ ...f, assessmentOk: v }))} />
          </Field>
        </div>
      ),
    },
    {
      title: 'Final Confirmation',
      subtitle: 'One last checkpoint.',
      icon: '🧩',
      xp: 180,
      requiredKeys: ['whyJoin'],
      render: () => (
        <div style={{ display: 'grid', gap: 18 }}>
          <Field label="Why do you want to be part of NexaSphere Core Team?" required>
            <TextArea
              value={form.whyJoin}
              onChange={v => setForm(f => ({ ...f, whyJoin: v }))}
              placeholder="Share your motivation, what you’ll bring, and what you want to learn."
              rows={6}
            />
          </Field>
          <Field label="Anything else you want us to know?">
            <TextArea
              value={form.anythingElse}
              onChange={v => setForm(f => ({ ...f, anythingElse: v }))}
              placeholder="Optional"
              rows={4}
            />
          </Field>
        </div>
      ),
    },
    {
      title: 'Final Consent',
      subtitle: 'Confirm the rules of the game.',
      icon: '✅',
      xp: 220,
      requiredKeys: ['declaration'],
      render: () => (
        <div style={{ display: 'grid', gap: 18 }}>
          <Field label="Declaration" required>
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                'I confirm that all details provided are true.',
                'I understand the time commitment (4–6 hours/week).',
                'I agree to participate in test sessions and team activities.',
                'I do not agree to the above declaration.',
              ].map(opt => {
                const active = form.declaration === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, declaration: opt }))}
                    style={{
                      textAlign: 'left',
                      background: active ? 'rgba(0,212,255,.10)' : 'var(--card)',
                      border: `1px solid ${active ? 'var(--c1b)' : 'var(--bdr)'}`,
                      color: 'var(--t1)',
                      borderRadius: 'var(--r2)',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      transition: 'transform .22s cubic-bezier(.34,1.56,.64,1), box-shadow .25s ease',
                      boxShadow: active ? '0 0 16px var(--c1g)' : 'none',
                    }}
                    className="shimmer"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        width: 18, height: 18, borderRadius: '50%',
                        border: `2px solid ${active ? 'var(--c1)' : 'var(--bdr2)'}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: active ? 'var(--c1)' : 'transparent',
                        fontSize: '.8rem',
                      }}>
                        ✓
                      </span>
                      <span style={{ fontSize: '.98rem', fontWeight: 600 }}>{opt}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Field>
        </div>
      ),
    },
  ]), [form]);

  const xpTotal = useMemo(() => steps.reduce((a, s) => a + s.xp, 0), [steps]);
  const xpEarned = useMemo(() => steps.slice(0, step + 1).reduce((a, s) => a + s.xp, 0), [steps, step]);
  const progress = useMemo(() => (step / (steps.length - 1)), [step, steps.length]);

  const current = steps[step];

  const missingRequired = useMemo(() => {
    const keys = current.requiredKeys;
    const missing = [];
    for (const k of keys) {
      const v = form[k];
      if (Array.isArray(v)) {
        if (v.length === 0) missing.push(k);
      } else if (!String(v || '').trim()) {
        missing.push(k);
      }
    }
    if (step === 3 && form.campusExp === 'Yes' && !String(form.campusExpDetails || '').trim()) {
      // Not required in the original form, but it’s useful when they select Yes.
    }
    return missing;
  }, [current.requiredKeys, form, step]);

  const canNext = missingRequired.length === 0;

  function scrollTop() {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function submit() {
    setErr('');
    setBusy(true);
    try {
      const apiBase = (import.meta?.env?.VITE_API_BASE || '').replace(/\/+$/, '');
      const url = `${apiBase}/api/core-team/apply`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          submittedAt: new Date().toISOString(),
          userAgent: navigator.userAgent,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Submission failed');
      setDone(true);
      scrollTop();
    } catch (e) {
      setErr(e?.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('fired'); obs.unobserve(e.target); }
      });
    }, { threshold: .1, rootMargin: '0px 0px -30px 0px' });
    document.querySelectorAll('#pg-apply .pop-flip, #pg-apply .pop-in, #pg-apply .pop-word, #pg-apply .pop-scale')
      .forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div id="pg-apply" ref={topRef}>
      <style>{`
        .apply-hero {
          text-align:center;
          padding: 64px 24px 46px;
          position: relative;
        }
        .apply-hero-bg {
          position:absolute; inset:0; pointer-events:none;
          background:
            radial-gradient(ellipse 60% 55% at 50% 0%, rgba(0,212,255,.10) 0%, transparent 62%),
            radial-gradient(ellipse 40% 40% at 20% 85%, rgba(123,111,255,.06) 0%, transparent 55%),
            radial-gradient(ellipse 40% 40% at 80% 70%, rgba(189,92,255,.05) 0%, transparent 55%);
        }
        [data-theme="light"] .apply-hero-bg {
          background:
            radial-gradient(ellipse 60% 55% at 50% 0%, rgba(194,119,10,.06) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 20% 85%, rgba(109,40,217,.04) 0%, transparent 55%);
        }
        .apply-divider {
          width:100%; height:1px;
          background: linear-gradient(90deg, transparent, var(--c1) 18%, var(--c2) 50%, var(--c3) 82%, transparent);
          opacity:.18; margin: 0 auto;
        }
        .apply-shell {
          max-width: 980px;
          margin: 0 auto;
          background: var(--card);
          border: 1px solid var(--bdr);
          border-radius: var(--r4);
          overflow: hidden;
          position: relative;
          box-shadow: var(--shcard);
        }
        [data-theme="light"] .apply-shell {
          background: #fff;
          border-color: rgba(28,25,23,.1);
          box-shadow: 0 8px 44px rgba(0,0,0,.10);
        }
        .apply-topbar {
          padding: 18px 18px 14px;
          border-bottom: 1px solid var(--bdr);
          background: linear-gradient(180deg, rgba(0,212,255,.03), transparent);
        }
        [data-theme="light"] .apply-topbar { background: linear-gradient(180deg, rgba(194,119,10,.03), transparent); }
        .apply-progress {
          height: 8px;
          background: rgba(255,255,255,.04);
          border: 1px solid var(--bdr);
          border-radius: 999px;
          overflow: hidden;
        }
        [data-theme="light"] .apply-progress { background: rgba(28,25,23,.04); }
        .apply-progress > div {
          height: 100%;
          width: 0%;
          background: linear-gradient(90deg, var(--c1), var(--c2), var(--c3));
          box-shadow: 0 0 18px var(--c1g);
          transition: width .35s cubic-bezier(.22,1,.36,1);
        }
        .apply-body { padding: 22px 18px 18px; }
        @media (min-width: 720px) {
          .apply-body { padding: 26px 26px 22px; }
          .apply-topbar { padding: 18px 26px 14px; }
        }
      `}</style>

      <div className="apply-hero">
        <div className="apply-hero-bg"/>
        {onBack ? (
          <button
            onClick={onBack}
            className="btn btn-outline btn-sm"
            style={{ position: 'absolute', top: 24, left: 24 }}
          >
            ← Back
          </button>
        ) : null}
        <span className="cin-section-label pop-in">Core Team Recruitment</span>
        <h1 className="section-title pop-word" style={{ marginBottom: 14 }}>
          NexaSphere Application Form
        </h1>
        <p className="pop-in" style={{
          color: 'var(--t2)',
          fontSize: 'clamp(.9rem,2vw,1.08rem)',
          maxWidth: 720,
          margin: '0 auto',
          lineHeight: 1.75,
          animationDelay: '.12s',
        }}>
          A 7-step quest. Earn XP as you go. Finish strong — shortlisted candidates will be contacted for the next round.
        </p>
        <div className="apply-divider" style={{ marginTop: 34, maxWidth: 780 }}/>
      </div>

      <div className="container" style={{ paddingBottom: 86 }}>
        <div className="apply-shell pop-scale">
          <div className="corner-tl"/><div className="corner-br"/>

          <div className="apply-topbar">
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 14,
              flexWrap: 'wrap',
              marginBottom: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: 'linear-gradient(135deg,var(--c1a),var(--c2a))',
                  border: '1px solid var(--bdr2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(0,212,255,.08)',
                  fontSize: '1.25rem',
                }}>
                  {done ? '🏁' : current.icon}
                </div>
                <div>
                  <div style={{
                    fontFamily: 'Orbitron,monospace',
                    fontSize: '.9rem',
                    letterSpacing: '.08em',
                    color: 'var(--t1)',
                    display: 'flex',
                    gap: 10,
                    alignItems: 'baseline',
                    flexWrap: 'wrap',
                  }}>
                    <span>{done ? 'Submission Complete' : current.title}</span>
                    {!done ? (
                      <span style={{
                        fontFamily: 'Space Mono,monospace',
                        fontSize: '.62rem',
                        letterSpacing: '.18em',
                        color: 'var(--t3)',
                      }}>
                        STEP {step + 1}/{steps.length}
                      </span>
                    ) : null}
                  </div>
                  <div style={{ color: 'var(--t2)', fontSize: '.9rem' }}>
                    {done ? 'Thank you for applying to NexaSphere – GL Bajaj Group of Institutions 🚀' : current.subtitle}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gap: 4,
                minWidth: 220,
                justifyItems: 'end',
              }}>
                <div style={{
                  fontFamily: 'Space Mono,monospace',
                  fontSize: '.65rem',
                  letterSpacing: '.18em',
                  color: 'var(--t3)',
                  textTransform: 'uppercase',
                }}>
                  XP {clamp(xpEarned, 0, xpTotal)}/{xpTotal}
                </div>
                <div style={{
                  fontFamily: 'Orbitron,monospace',
                  fontSize: '.78rem',
                  letterSpacing: '.1em',
                  color: 'var(--c1)',
                }}>
                  {form.role ? `Class: ${form.role}` : 'Class: Unlocked at Step 3'}
                </div>
              </div>
            </div>

            <div className="apply-progress">
              <div style={{ width: `${Math.round(progress * 100)}%` }}/>
            </div>
          </div>

          <div className="apply-body">
            {done ? (
              <div style={{ display: 'grid', gap: 18 }}>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(0,212,255,.08), rgba(123,111,255,.06))',
                  border: '1px solid var(--bdr2)',
                  borderRadius: 'var(--r3)',
                  padding: 18,
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <div className="corner-tl"/><div className="corner-br"/>
                  <p style={{ color: 'var(--t2)', lineHeight: 1.8 }}>
                    We truly appreciate your interest in becoming a part of our growing tech community.
                    <br/><br/>
                    Shortlisted candidates will be contacted soon regarding the next steps, including test activities, trial sessions, and onboarding.
                    <br/><br/>
                    <b style={{ color: 'var(--t1)' }}>Stay consistent. Stay curious. Keep building.</b>
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <a className="btn btn-whatsapp" href={WHATSAPP_SCREENING} target="_blank" rel="noopener noreferrer">
                    🎯 Core Team Screening Room
                  </a>
                  <a className="btn btn-join" href={WHATSAPP_COMMUNITY} target="_blank" rel="noopener noreferrer">
                    🌐 Join NexaSphere Community
                  </a>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <button
                    className="btn btn-outline"
                    type="button"
                    onClick={() => {
                      setDone(false);
                      setStep(0);
                      setForm({
                        fullName: '',
                        collegeEmail: '',
                        whatsapp: '',
                        year: '',
                        branch: '',
                        section: '',
                        role: '',
                        interests: [],
                        skills: '',
                        comms: '',
                        campusExp: '',
                        campusExpDetails: '',
                        links: '',
                        commitHours: '',
                        attendCampus: '',
                        assessmentOk: '',
                        whyJoin: '',
                        anythingElse: '',
                        declaration: '',
                      });
                      scrollTop();
                    }}
                  >
                    ↺ Submit another response
                  </button>
                </div>
              </div>
            ) : (
              <>
                {current.render()}

                {err ? (
                  <div style={{
                    marginTop: 18,
                    background: 'rgba(255,45,120,.10)',
                    border: '1px solid rgba(255,45,120,.22)',
                    color: 'var(--t1)',
                    borderRadius: 'var(--r2)',
                    padding: '12px 14px',
                    fontWeight: 600,
                  }}>
                    {err}
                  </div>
                ) : null}

                <div style={{
                  marginTop: 22,
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 10,
                  flexWrap: 'wrap',
                }}>
                  <button
                    className="btn btn-outline"
                    type="button"
                    onClick={() => { setErr(''); setStep(s => clamp(s - 1, 0, steps.length - 1)); scrollTop(); }}
                    disabled={busy || step === 0}
                    style={{ opacity: step === 0 ? .55 : 1 }}
                  >
                    ← Back
                  </button>

                  {step < steps.length - 1 ? (
                    <button
                      className="btn btn-primary btn-ripple"
                      type="button"
                      disabled={busy || !canNext}
                      onClick={() => {
                        if (!canNext) {
                          setErr('Please complete the required fields (*) to proceed.');
                          return;
                        }
                        setErr('');
                        setStep(s => clamp(s + 1, 0, steps.length - 1));
                        scrollTop();
                      }}
                      style={{ opacity: canNext ? 1 : .65 }}
                    >
                      Next → <span style={{ opacity: .85, fontFamily: 'Space Mono,monospace', fontSize: '.65rem' }}>+{current.xp} XP</span>
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-ripple"
                      type="button"
                      disabled={busy || !canNext || form.declaration === 'I do not agree to the above declaration.'}
                      onClick={() => {
                        if (form.declaration === 'I do not agree to the above declaration.') {
                          setErr('You must agree to the declaration to submit.');
                          return;
                        }
                        if (!canNext) {
                          setErr('Please complete the required fields (*) to submit.');
                          return;
                        }
                        submit();
                      }}
                    >
                      {busy ? 'Submitting…' : 'Submit Application'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="pop-in" style={{
          marginTop: 18,
          textAlign: 'center',
          color: 'var(--t3)',
          fontFamily: 'Space Mono,monospace',
          fontSize: '.62rem',
          letterSpacing: '.18em',
          textTransform: 'uppercase',
          opacity: .9,
        }}>
          Powered by NexaSphere • Responses are stored in Google Sheets
        </div>
      </div>
    </div>
  );
}

