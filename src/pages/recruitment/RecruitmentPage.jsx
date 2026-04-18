import { useEffect, useMemo, useRef, useState } from 'react';
import { IconArrowLeft, IconArrowRight, IconBolt, IconShieldCheck, IconSpark, IconUsers } from '../../shared/Icons';

/* ── Roles & Responsibilities slide-over modal ─────────────────────────── */
function RolesGuideModal({ onClose }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const sec = (emoji, title, children) => (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        fontFamily: 'Orbitron,monospace', fontSize: '.75rem', letterSpacing: '.14em',
        color: 'var(--c1)', textTransform: 'uppercase', marginBottom: 12,
        display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: '1px solid var(--bdr)', paddingBottom: 8,
      }}>
        <span style={{ fontSize: '1rem' }}>{emoji}</span> {title}
      </div>
      {children}
    </div>
  );

  const role = (icon, name, domain, items) => (
    <div style={{
      background: 'var(--card2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r2)',
      padding: '14px 16px', marginBottom: 10, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--t1)', marginBottom: 4 }}>
        {icon} {name}
      </div>
      {domain && <div style={{ fontSize: '.78rem', color: 'var(--c1)', marginBottom: 8, fontFamily: 'Space Mono,monospace' }}>Domain: {domain}</div>}
      <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 4 }}>
        {items.map((it, i) => <li key={i} style={{ fontSize: '.86rem', color: 'var(--t2)', lineHeight: 1.55 }}>{it}</li>)}
      </ul>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 99998,
          background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(4px)',
        }}
      />
      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 99999,
        width: 'min(680px, 96vw)',
        background: 'var(--bg)',
        borderLeft: '1px solid var(--bdr2)',
        boxShadow: '-8px 0 48px rgba(0,0,0,.5)',
        display: 'flex', flexDirection: 'column',
        animation: 'slideInRight .28s cubic-bezier(.22,1,.36,1)',
      }}>
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
        `}</style>

        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--bdr)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(0,212,255,.06), rgba(123,111,255,.04))',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: 'Orbitron,monospace', fontSize: '.95rem', fontWeight: 700, color: 'var(--t1)' }}>
              🎯 Core Team Structure & Roles
            </div>
            <div style={{ fontSize: '.78rem', color: 'var(--t3)', marginTop: 4 }}>
              NexaSphere — GL Bajaj Group of Institutions · Last Updated: 25/01/2026
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--card2)', border: '1px solid var(--bdr2)',
              borderRadius: 8, width: 36, height: 36, cursor: 'pointer',
              color: 'var(--t1)', fontSize: '1.1rem', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >✕</button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', scrollbarWidth: 'thin' }}>
          <p style={{ color: 'var(--t2)', fontSize: '.88rem', lineHeight: 1.7, marginBottom: 24 }}>
            NexaSphere operates through a structured, responsibility-driven Core Team where every role has defined authority, accountability, and execution ownership.
            All roles function under NexaSphere governance and college approval where applicable.
          </p>

          {sec('🧠', '1. Technical Leadership Team', <>
            {role('🔹', 'Technical Lead (Overall)', 'Cloud, AI/ML, Android, Web, Cybersecurity', [
              'Maintain overall technical quality across all NexaSphere initiatives',
              'Guide and mentor all Domain Leads',
              'Review and approve session content, workshop plans, and project roadmaps',
              'Ensure learning remains hands-on, practical, and industry-aligned',
              'Act as the final technical decision-maker',
            ])}
            {role('🔹', 'Domain Lead', 'One specific domain', [
              'Plan and conduct domain-specific sessions & workshops',
              'Lead hands-on projects and mentor members in their domain',
              'Stay updated with tools and trends',
              'Align activities with Technical Lead\'s roadmap',
            ])}
            {role('☁️', 'Cloud Lead', 'Google Cloud, Firebase, DevOps, AWS', [
              'Conduct Cloud study jams & labs',
              'Organize certification prep sessions',
              'Manage demo environments and guide cloud-based projects',
            ])}
            {role('🤖', 'AI / ML Lead', 'AI, ML, Generative AI', [
              'Design structured AI/ML learning paths',
              'Conduct workshops with live demos',
              'Mentor AI projects and promote responsible AI practices',
            ])}
            {role('📱', 'Android Lead', 'Android, Kotlin, Jetpack', [
              'Conduct Android workshops and run live coding sessions',
              'Mentor mobile app projects',
              'Support hackathons (mobile tech)',
            ])}
            {role('🌐', 'Web / Full-Stack Lead', 'Frontend, Backend, MERN', [
              'Deliver web workshops and guide full-stack learning paths',
              'Maintain GitHub repositories',
              'Provide technical support in events',
            ])}
            {role('🔐', 'Cybersecurity Lead', 'Cybersecurity, Ethical Hacking', [
              'Conduct security awareness sessions',
              'Organize CTF workshops',
              'Teach secure coding fundamentals',
            ])}
          </>)}

          {sec('🎨', '2. Product & Creative Team', <>
            {role('🎨', 'UI/UX Lead', null, [
              'Conduct design workshops',
              'Promote user-centric thinking',
              'Collaborate with tech teams',
            ])}
            {role('🧩', 'Product Management Lead', null, [
              'Bridge tech and user needs',
              'Guide MVP development',
              'Support hackathons with product strategy',
            ])}
            {role('🎥', 'Media & Design Lead', null, [
              'Design posters & certificates',
              'Handle photography & reels',
              'Maintain NexaSphere brand consistency',
            ])}
          </>)}

          {sec('📋', '3. Operations & Management Team', <>
            {role('📅', 'Event Management Lead', null, [
              'Plan and execute events end-to-end',
              'Manage timelines & logistics',
              'Coordinate across teams',
            ])}
            {role('📅', 'Event Management Co-Lead', null, [
              'Assist in execution and handle on-ground coordination',
              'Manage contingencies',
            ])}
            {role('📢', 'Marketing & Social Media Lead', null, [
              'Promote initiatives and manage official platforms',
              'Increase reach & engagement',
            ])}
            {role('✍️', 'Content & Documentation Lead', null, [
              'Write event reports & announcements',
              'Maintain internal documentation and collect feedback',
              'Design two certificates per event (Top 3 Performer + Participation)',
              'Provide official certificates to Core Team members for events they organised',
            ])}
            {role('🎓', 'Community & Outreach Lead', null, [
              'Manage onboarding and build partnerships',
              'Drive engagement initiatives',
              'Represent student voice',
            ])}
            {role('👥', 'Volunteers & Coordinators', null, [
              'Support event execution and handle registrations',
              'Assist participants and provide technical/logistical support',
            ])}
          </>)}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px', borderTop: '1px solid var(--bdr)',
          display: 'flex', justifyContent: 'flex-end', flexShrink: 0,
          background: 'var(--card)',
        }}>
          <button type="button" onClick={onClose} className="btn btn-primary">
            Back to Application Form
          </button>
        </div>
      </div>
    </>
  );
}

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

function Input({ value, onChange, placeholder, type = 'text', maxLength, inputMode: inputModeProp, onPaste }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      onPaste={onPaste}
      placeholder={placeholder}
      type={type}
      maxLength={maxLength}
      inputMode={inputModeProp || (type === 'tel' ? 'numeric' : undefined)}
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

const BRANCH_OPTIONS = [
  'Computer Science Engineering (CSE)',
  'Computer Science (CS)',
  'Information Technology (IT)',
  'AI & Machine Learning (AIML)',
  'Computer Science & Design (CSD)',
  'MBA',
  'Other',
];

export default function RecruitmentPage({ onBack }) {
  const [step, setStep] = useState(0); // 0..6
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [err, setErr] = useState('');
  const [showRoles, setShowRoles] = useState(false); // lifted out of useMemo to obey Rules of Hooks
  const topRef = useRef(null);

  // Check on mount if this device already submitted
  useEffect(() => {
    try {
      const submitted = JSON.parse(localStorage.getItem('ns_submitted_emails') || '[]');
      if (submitted.length > 0) setAlreadySubmitted(true);
    } catch { /* ignore */ }
  }, []);

  const [form, setForm] = useState({
    fullName: '',
    collegeEmail: '',
    whatsapp: '',
    year: '',
    branch: '',
    branchOther: '',
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

    declarations: {
      truth: false,
      time: false,
      participate: false,
      disagree: false,
    },
  });

  const steps = useMemo(() => ([
    {
      title: 'About NexaSphere',
      subtitle: 'NexaSphere Core Team Recruitment — 2026',
      icon: <IconBolt style={{ width: 18, height: 18 }} />,
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
              <div className="activity-icon" style={{ display: 'flex', justifyContent: 'center' }}>
                <IconBolt style={{ width: 34, height: 34 }} />
              </div>
              <div className="activity-title">Weekly Commitment</div>
              <div className="activity-desc">4–6 hours, consistent.</div>
            </div>
            <div className="activity-card" style={{ cursor: 'default' }}>
              <div className="card-accent-line"/>
              <div className="activity-icon" style={{ display: 'flex', justifyContent: 'center' }}>
                <IconUsers style={{ width: 34, height: 34 }} />
              </div>
              <div className="activity-title">Team First</div>
              <div className="activity-desc">Collaboration and reliability.</div>
            </div>
            <div className="activity-card" style={{ cursor: 'default' }}>
              <div className="card-accent-line"/>
              <div className="activity-icon" style={{ display: 'flex', justifyContent: 'center' }}>
                <IconShieldCheck style={{ width: 34, height: 34 }} />
              </div>
              <div className="activity-title">Trial Rounds</div>
              <div className="activity-desc">Short assessments may happen.</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Personal Information',
      subtitle: 'Please fill in your basic details accurately.',
      icon: <IconUsers style={{ width: 18, height: 18 }} />,
      requiredKeys: ['fullName', 'collegeEmail', 'whatsapp', 'year', 'branch', 'section'],
      render: () => (
        <div style={{ display: 'grid', gap: 18 }}>
          <Field label="Full Name" required>
            <Input
              value={form.fullName}
              onChange={v => {
                // Letters, spaces, dots, hyphens only — no numbers or symbols
                const cleaned = v.replace(/[^a-zA-Z\s.\-']/g, '');
                setForm(f => ({ ...f, fullName: cleaned }));
              }}
              placeholder="Your full name"
              maxLength={60}
            />
          </Field>
          <Field label="College Email ID" required hint="Must end with @glbajajgroup.org">
            <Input
              value={form.collegeEmail}
              onChange={v => setForm(f => ({ ...f, collegeEmail: v.trim().toLowerCase() }))}
              placeholder="name@glbajajgroup.org"
              type="email"
              maxLength={80}
            />
          </Field>
          <Field label="WhatsApp Number" required>
            <Input
              value={form.whatsapp}
              onChange={v => {
                // Strip everything except digits, cap at 10
                const cleaned = String(v || '').replace(/[^\d]/g, '').slice(0, 10);
                setForm(f => ({ ...f, whatsapp: cleaned }));
              }}
              onPaste={e => {
                e.preventDefault();
                const pasted = e.clipboardData.getData('text').replace(/[^\d]/g, '').slice(0, 10);
                setForm(f => ({ ...f, whatsapp: pasted }));
              }}
              placeholder="10-digit mobile number"
              type="tel"
              inputMode="numeric"
              maxLength={10}
            />
          </Field>
          <Field label="Year of Study" required>
            <PillRadio options={YEAR_OPTIONS} value={form.year} onChange={v => setForm(f => ({ ...f, year: v }))} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Branch / Department" required>
              <div style={{ display: 'grid', gap: 8 }}>
                <select
                  value={form.branch}
                  onChange={e => setForm(f => ({ ...f, branch: e.target.value, branchOther: '' }))}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: 'var(--card2)',
                    border: '1px solid var(--bdr2)',
                    borderRadius: 'var(--r2)',
                    color: form.branch ? 'var(--t1)' : 'var(--t3)',
                    fontFamily: 'Rajdhani,sans-serif',
                    fontSize: '.98rem',
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2300d4ff' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 14px center',
                    paddingRight: '36px',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--c1b)'; e.target.style.boxShadow = 'var(--sh1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--bdr2)'; e.target.style.boxShadow = 'none'; }}
                >
                  <option value="" disabled>Select your department</option>
                  {BRANCH_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                {form.branch === 'Other' && (
                  <Input
                    value={form.branchOther}
                    onChange={v => {
                      const cleaned = v.replace(/[^a-zA-Z0-9\s\/\-&().]/g, '');
                      setForm(f => ({ ...f, branchOther: cleaned }));
                    }}
                    placeholder="Please specify your department"
                    maxLength={60}
                  />
                )}
              </div>
            </Field>
            <Field label="Section" required>
              <Input
                value={form.section}
                onChange={v => {
                  const cleaned = v.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 1);
                  setForm(f => ({ ...f, section: cleaned }));
                }}
                placeholder="A / B / C"
                maxLength={1}
              />
            </Field>
          </div>
        </div>
      ),
    },
    {
      title: 'Role & Domain Preference',
      subtitle: 'Select the role you wish to apply for and your areas of interest.',
      icon: <IconArrowRight style={{ width: 18, height: 18 }} />,
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
              Before selecting a role, please review the full roles & responsibilities guide.
              <div style={{ marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowRoles(true)}
                  className="btn btn-outline btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  🔎 View Roles & Responsibilities
                </button>
              </div>
            </div>
          </div>

          <Field label="Which role do you wish to apply for?" required>
            <PillRadio options={ROLE_OPTIONS} value={form.role} onChange={v => setForm(f => ({ ...f, role: v }))} />
          </Field>

          <Field label="Areas of Interest" required hint="Select one or more.">
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
      subtitle: 'Share your technical background, communication skills, and prior experience.',
      icon: <IconBolt style={{ width: 18, height: 18 }} />,
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
                placeholder="e.g. Leo Club – Event Coordinator"
                maxLength={100}
              />
            </Field>
          ) : null}

          <Field label="GitHub Profile URL" hint="Optional">
            <Input
              value={form.links}
              onChange={v => {
                // Only allow valid GitHub profile URL characters while typing
                // Strip spaces automatically
                setForm(f => ({ ...f, links: v.replace(/\s/g, '') }));
              }}
              placeholder="https://github.com/YourUsername"
              type="url"
              inputMode="url"
              maxLength={120}
            />
            <div style={{ color: 'var(--t3)', fontSize: '.8rem', marginTop: 4 }}>
              Format: <span style={{ fontFamily: 'Space Mono,monospace', color: 'var(--c1)' }}>https://github.com/YourUsername</span>
            </div>
          </Field>
        </div>
      ),
    },
    {
      title: 'Commitment & Availability',
      subtitle: 'Confirm your availability and willingness to commit to NexaSphere responsibilities.',
      icon: <IconBolt style={{ width: 18, height: 18 }} />,
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
      title: 'Motivation & Statement',
      subtitle: 'Tell us why you want to join and what you bring to the team.',
      icon: <IconSpark style={{ width: 18, height: 18 }} />,
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
      title: 'Declaration & Consent',
      subtitle: 'Please read and confirm the following declarations before submitting.',
      icon: <IconShieldCheck style={{ width: 18, height: 18 }} />,
      requiredKeys: ['declarations'],
      render: () => (
        <div style={{ display: 'grid', gap: 18 }}>
          <Field label="Declaration" required>
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                { k: 'truth', label: 'I confirm that all details provided are true.' },
                { k: 'time', label: 'I understand the time commitment (4–6 hours/week).' },
                { k: 'participate', label: 'I agree to participate in test sessions and team activities.' },
                { k: 'disagree', label: 'I do not agree to the above declaration.' },
              ].map(opt => {
                const active = !!form.declarations?.[opt.k];
                const isDisagree = opt.k === 'disagree';
                return (
                  <button
                    key={opt.k}
                    type="button"
                    onClick={() => setForm(f => {
                      const next = { ...(f.declarations || {}) };
                      const nextVal = !next[opt.k];
                      if (isDisagree && nextVal) {
                        return { ...f, declarations: { truth: false, time: false, participate: false, disagree: true } };
                      }
                      if (!isDisagree && nextVal) {
                        next.disagree = false;
                      }
                      next[opt.k] = nextVal;
                      return { ...f, declarations: { truth: !!next.truth, time: !!next.time, participate: !!next.participate, disagree: !!next.disagree } };
                    })}
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
                        width: 18, height: 18, borderRadius: 5,
                        border: `2px solid ${active ? 'var(--c1)' : 'var(--bdr2)'}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: active ? 'var(--c1)' : 'transparent',
                        fontSize: '.8rem',
                      }}>
                        ✓
                      </span>
                      <span style={{ fontSize: '.98rem', fontWeight: 600 }}>{opt.label}</span>
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

  const progress = useMemo(() => (step / (steps.length - 1)), [step, steps.length]);

  const current = steps[step];

  const missingRequired = useMemo(() => {
    const keys = current.requiredKeys;
    const missing = [];
    for (const k of keys) {
      const v = form[k];
      if (k === 'declarations') {
        const d = v || {};
        const ok = !!d.truth && !!d.time && !!d.participate && !d.disagree;
        if (!ok) missing.push(k);
      } else if (Array.isArray(v)) {
        if (v.length === 0) missing.push(k);
      } else if (!String(v || '').trim()) {
        missing.push(k);
      }
    }
    // Extra validation rules (cannot be bypassed by just typing anything)
    const email = String(form.collegeEmail || '').trim().toLowerCase();
    if (step === 1 && email && !email.endsWith('@glbajajgroup.org')) missing.push('collegeEmail');
    const phone = String(form.whatsapp || '').trim();
    if (step === 1 && phone && !/^\d{10}$/.test(phone)) missing.push('whatsapp');
    // GitHub URL validation (optional field — only validate format if something is entered)
    const githubUrl = String(form.links || '').trim();
    if (step === 3 && githubUrl) {
      // Must match https://github.com/username or https://github.com/username/
      const githubPattern = /^https:\/\/github\.com\/[a-zA-Z0-9][a-zA-Z0-9\-]{0,37}\/?$/;
      if (!githubPattern.test(githubUrl)) missing.push('links');
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

  // Google Apps Script Web App URL — writes responses directly to Google Sheets
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzo1g6WNiO-f8kySE4Mqbdlh3VxZx9pRGLcjt7qyzRCNB1TMK0kRwjZbDD2UsaJFQ0q/exec';

  async function submit() {
    setErr('');
    setBusy(true);
    try {
      const payload = {
        ...form,
        // If 'Other' was selected, use the custom text; otherwise use the selected option
        branch: form.branch === 'Other' ? (form.branchOther || 'Other') : form.branch,
        interests: Array.isArray(form.interests) ? form.interests.join(', ') : '',
        declarationAccepted: !!form.declarations?.truth && !!form.declarations?.time && !!form.declarations?.participate && !form.declarations?.disagree,
        declarationSelected: Object.entries(form.declarations || {}).filter(([,v])=>!!v).map(([k])=>k).join(', '),
        submittedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
      };

      // Block duplicate email submissions
      const emailKey = String(form.collegeEmail || '').trim().toLowerCase();
      try {
        const existing = JSON.parse(localStorage.getItem('ns_submitted_emails') || '[]');
        if (existing.includes(emailKey)) {
          setErr('This email address has already been used to submit an application. Each applicant may submit only once.');
          setBusy(false);
          return;
        }
      } catch { /* ignore */ }

      // Try Google Apps Script first (primary — writes to Google Sheet directly)
      const gasUrl = import.meta?.env?.VITE_APPS_SCRIPT_URL || APPS_SCRIPT_URL;
      const useGas = gasUrl && !gasUrl.includes('PLACEHOLDER');

      if (useGas) {
        // Use no-cors mode for Apps Script (it returns opaque response — treat success as ok)
        // IMPORTANT: must use 'text/plain' not 'application/json' — only simple headers
        // are allowed in no-cors mode; json triggers a preflight that Apps Script blocks,
        // causing the body to be silently dropped. Apps Script still parses the raw text as JSON.
        await fetch(gasUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payload),
        });
        // Save email to localStorage to prevent duplicate from this device
        try {
          const existing = JSON.parse(localStorage.getItem('ns_submitted_emails') || '[]');
          existing.push(emailKey);
          localStorage.setItem('ns_submitted_emails', JSON.stringify(existing));
        } catch { /* ignore */ }
        setDone(true);
        scrollTop();
        return;
      }

      // Fallback: backend API route
      const apiBase = (import.meta?.env?.VITE_API_BASE || '').replace(/\/+$/, '');
      const url = apiBase ? `${apiBase}/api/core-team/apply` : '/api/core-team/apply';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Submission failed');
      setDone(true);
      scrollTop();
    } catch (e) {
      setErr(e?.message || 'Something went wrong. Please try again.');
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
      {showRoles && <RolesGuideModal onClose={() => setShowRoles(false)} />}
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
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <IconArrowLeft style={{ width: 14, height: 14 }} /> Back
            </span>
          </button>
        ) : null}
        <div className="pop-in" style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg, var(--c1), var(--c2))',
          borderRadius: 999,
          padding: '7px 22px',
          fontFamily: 'Orbitron,monospace',
          fontSize: '.85rem',
          fontWeight: 700,
          letterSpacing: '.1em',
          color: '#fff',
          textTransform: 'uppercase',
          boxShadow: '0 0 24px var(--c1g)',
          marginBottom: 16,
        }}>Core Team Recruitment</div>
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
          A 7-step application process. Complete all sections carefully — shortlisted candidates will be contacted for the next steps.
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
                  {done ? <IconShieldCheck style={{ width: 18, height: 18 }} /> : current.icon}
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
                    {done ? 'Thank you for applying to NexaSphere – GL Bajaj Group of Institutions' : current.subtitle}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gap: 4,
                justifyItems: 'end',
              }}>
                <div style={{
                  fontFamily: 'Space Mono,monospace',
                  fontSize: '.62rem',
                  letterSpacing: '.14em',
                  color: 'var(--t3)',
                  textTransform: 'uppercase',
                }}>
                  {done ? 'Application Submitted' : `Step ${step + 1} of ${steps.length}`}
                </div>
                {!done && form.role && (
                  <div style={{
                    fontFamily: 'Rajdhani,sans-serif',
                    fontSize: '.82rem',
                    color: 'var(--c1)',
                    fontWeight: 600,
                  }}>
                    Applying for: {form.role}
                  </div>
                )}
              </div>
            </div>

            <div className="apply-progress">
              <div style={{ width: `${Math.round(progress * 100)}%` }}/>
            </div>
          </div>

          <div className="apply-body">
            {alreadySubmitted && !done ? (
              <div style={{
                background: 'rgba(255,45,120,.08)',
                border: '1px solid rgba(255,45,120,.22)',
                borderRadius: 'var(--r3)',
                padding: '20px 22px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.4rem', marginBottom: 10 }}>⚠️</div>
                <div style={{ color: 'var(--t1)', fontWeight: 700, fontSize: '1rem', marginBottom: 8 }}>Application Already Submitted</div>
                <div style={{ color: 'var(--t2)', fontSize: '.92rem', lineHeight: 1.7 }}>
                  An application has already been submitted from this device. Each candidate may apply only once.
                  <br/>If you believe this is an error, please contact us directly.
                </div>
              </div>
            ) : done ? (
              <div style={{ display: 'grid', gap: 18 }}>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(0,212,255,.08), rgba(123,111,255,.06))',
                  border: '1px solid var(--bdr2)',
                  borderRadius: 'var(--r3)',
                  padding: 22,
                  position: 'relative',
                  overflow: 'hidden',
                  textAlign: 'center',
                }}>
                  <div className="corner-tl"/><div className="corner-br"/>
                  <div style={{ fontSize: '2rem', marginBottom: 12 }}>✅</div>
                  <div style={{ fontFamily: 'Orbitron,monospace', fontSize: '1rem', color: 'var(--t1)', fontWeight: 700, marginBottom: 12 }}>
                    Application Submitted Successfully
                  </div>
                  <p style={{ color: 'var(--t2)', lineHeight: 1.8, maxWidth: 520, margin: '0 auto' }}>
                    Thank you for applying to the NexaSphere Core Team — GL Bajaj Group of Institutions.
                    <br/><br/>
                    Your application has been recorded. Shortlisted candidates will be contacted regarding the next steps, which may include a short assessment or trial session.
                    <br/><br/>
                    <b style={{ color: 'var(--t1)' }}>Stay consistent. Stay curious. Keep building.</b>
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <a className="btn btn-whatsapp" href={WHATSAPP_SCREENING} target="_blank" rel="noopener noreferrer">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      Core Team Screening Room <IconArrowRight />
                    </span>
                  </a>
                  <a className="btn btn-join" href={WHATSAPP_COMMUNITY} target="_blank" rel="noopener noreferrer">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      Join NexaSphere Community <IconArrowRight />
                    </span>
                  </a>
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
                    onClick={() => {
                      setErr('');
                      if (step === 0) {
                        // Go back to previous page
                        if (onBack) onBack();
                      } else {
                        setStep(s => clamp(s - 1, 0, steps.length - 1));
                        scrollTop();
                      }
                    }}
                    disabled={busy}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <IconArrowLeft /> Back
                    </span>
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
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        Continue <IconArrowRight />
                      </span>
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-ripple"
                      type="button"
                      disabled={busy || !canNext || !!form.declarations?.disagree}
                      onClick={() => {
                        if (form.declarations?.disagree) {
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
          Powered by NexaSphere
        </div>
      </div>
    </div>
  );
}

