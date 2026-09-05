import { useEffect, useMemo, useRef, useState } from 'react';
import { DynamicIcon, IconArrowLeft, IconArrowRight, IconBolt, IconShieldCheck, IconUsers } from '../../shared/Icons';
import Footer from '../../shared/Footer';

const WHATSAPP_COMMUNITY = 'https://chat.whatsapp.com/Jjc5cuUKENu0RC1vWSEs20';
const LINKEDIN_PAGE      = 'https://www.linkedin.com/showcase/glbajaj-nexasphere/';

const COURSE_OPTIONS  = ['B-Tech', 'MBA', 'Other'];
const BRANCH_OPTIONS  = [
  'Computer Science Engineering (CSE)',
  'Computer Science (CS)',
  'Information Technology (IT)',
  'AI & Machine Learning (AIML)',
  'Computer Science & Design (CSD)',
  'MBA',
  'Other',
];
const SECTION_OPTIONS  = ['A', 'B', 'C', 'D', 'E', 'F', 'Other'];
const SEMESTER_OPTIONS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
const GROUP_OPTIONS    = [
  'NexaSphere Cybersecurity',
  'NexaSphere AI/ML',
  'NexaSphere Web Development',
  'NexaSphere Cloud Wing',
  'NexaSphere Management Crew',
  'NexaSphere Android Development',
  'NexaSphere AWS',
  'NexaSphere Career & Placement',
];

const MEMBERSHIP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyRQOW3Xjv13vXvft8ezD9sJdvjV3kf-VHm1l_mImHRDUAEqsilK0wb5QBD5GOkixwe/exec';

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
        boxSizing: 'border-box',
      }}
      onFocus={e => { e.target.style.borderColor = 'var(--c1b)'; e.target.style.boxShadow = 'var(--sh1)'; }}
      onBlur={e  => { e.target.style.borderColor = 'var(--bdr2)';  e.target.style.boxShadow = 'none'; }}
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
        boxSizing: 'border-box',
      }}
      onFocus={e => { e.target.style.borderColor = 'var(--c1b)'; e.target.style.boxShadow = 'var(--sh1)'; }}
      onBlur={e  => { e.target.style.borderColor = 'var(--bdr2)';  e.target.style.boxShadow = 'none'; }}
    />
  );
}

const SELECT_ARROW = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23CC1111' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`;

function StyledSelect({ value, onChange, children, placeholder }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '12px 14px',
        background: 'var(--card2)',
        border: '1px solid var(--bdr2)',
        borderRadius: 'var(--r2)',
        color: value ? 'var(--t1)' : 'var(--t3)',
        fontFamily: 'Rajdhani,sans-serif',
        fontSize: '.98rem',
        outline: 'none',
        cursor: 'pointer',
        appearance: 'none',
        WebkitAppearance: 'none',
        backgroundImage: SELECT_ARROW,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 14px center',
        paddingRight: '36px',
        boxSizing: 'border-box',
      }}
      onFocus={e => { e.target.style.borderColor = 'var(--c1b)'; e.target.style.boxShadow = 'var(--sh1)'; }}
      onBlur={e  => { e.target.style.borderColor = 'var(--bdr2)';  e.target.style.boxShadow = 'none'; }}
    >
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {children}
    </select>
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
              background:   active ? 'linear-gradient(135deg,var(--c1),var(--c2))' : undefined,
              color:        active ? '#fff' : undefined,
              borderColor:  active ? 'transparent' : undefined,
              boxShadow:    active ? '0 0 18px var(--c1g)' : undefined,
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
              background:  active ? 'rgba(0,212,255,.12)' : undefined,
              borderColor: active ? 'var(--c1)' : undefined,
              color:       active ? 'var(--t1)' : undefined,
              boxShadow:   active ? '0 0 14px var(--c1g)' : undefined,
              textTransform: 'none',
              letterSpacing: '.03em',
              fontSize: '.82rem',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {active ? <DynamicIcon name="CheckCircle" size={13} /> : null}{opt}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function MembershipPage({ onBack }) {
  const [step, setStep]   = useState(0); 
  const [busy, setBusy]   = useState(false);
  const [done, setDone]   = useState(false);
  const [err,  setErr]    = useState('');
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const topRef = useRef(null);

  
  useEffect(() => {
    try {
      const submitted = JSON.parse(localStorage.getItem('ns_member_emails') || '[]');
      if (submitted.length > 0) setAlreadySubmitted(true);
    } catch { /* ignore */ }
  }, []);

  const [form, setForm] = useState({
    
    fullName:     '',
    collegeEmail: '',
    rollNumber:   '',
    course:       '',
    courseOther:  '',
    branch:       '',
    branchOther:  '',
    section:      '',
    sectionOther: '',
    semester:     '',
    whatsapp:     '',
    
    groups:       [],
    whyJoin:      '',
  });

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  
  const missingRequired = useMemo(() => {
    const missing = [];
    
    if (step === 1) {
      if (!form.fullName.trim())     missing.push('fullName');
      if (!form.collegeEmail.trim()) missing.push('collegeEmail');
      if (!form.rollNumber.trim())   missing.push('rollNumber');
      if (!form.course)              missing.push('course');
      if (form.course === 'Other' && !form.courseOther.trim()) missing.push('courseOther');
      if (!form.branch)              missing.push('branch');
      if (form.branch === 'Other' && !form.branchOther.trim()) missing.push('branchOther');
      if (!form.section)             missing.push('section');
      if (form.section === 'Other' && !form.sectionOther.trim()) missing.push('sectionOther');
      if (!form.semester)            missing.push('semester');
      const phone = String(form.whatsapp || '').trim();
      if (!phone || !/^\d{10}$/.test(phone)) missing.push('whatsapp');
      
      const email = form.collegeEmail.trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) missing.push('collegeEmail');
      if (email && !email.endsWith('@glbajajgroup.org')) missing.push('collegeEmail');
    }
    if (step === 2) {
      if (form.groups.length === 0) missing.push('groups');
      if (!form.whyJoin.trim())     missing.push('whyJoin');
    }
    return missing;
  }, [form, step]);

  const canNext = missingRequired.length === 0;

  function scrollTop() {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  
  async function submit() {
    setErr('');
    setBusy(true);
    try {
      const emailKey = String(form.whatsapp || '').trim(); 
      try {
        const existing = JSON.parse(localStorage.getItem('ns_member_emails') || '[]');
        if (existing.includes(emailKey)) {
          setErr('This number has already been used to submit a membership form. Each member may submit only once.');
          setBusy(false);
          return;
        }
      } catch { /* ignore */ }

      const payload = {
        fullName:     form.fullName.trim(),
        collegeEmail: form.collegeEmail.trim().toLowerCase(),
        rollNumber:   form.rollNumber.trim(),
        course:       form.course === 'Other' ? (form.courseOther.trim() || 'Other') : form.course,
        branch:       form.branch === 'Other' ? (form.branchOther.trim() || 'Other') : form.branch,
        section:      form.section === 'Other' ? form.sectionOther : form.section,
        semester:     form.semester,
        whatsapp:     form.whatsapp,
        groups:       form.groups.join(', '),
        whyJoin:      form.whyJoin.trim(),
        submittedAt:  new Date().toISOString(),
        userAgent:    navigator.userAgent,
        formType:     'membership',
      };

      const res = await fetch(MEMBERSHIP_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || (data && data.ok === false)) {
        throw new Error(data?.error || 'Membership form submission failed');
      }

      
      try {
        const existing = JSON.parse(localStorage.getItem('ns_member_emails') || '[]');
        existing.push(emailKey);
        localStorage.setItem('ns_member_emails', JSON.stringify(existing));
      } catch { /* ignore */ }

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
    document.querySelectorAll('#pg-member .pop-flip, #pg-member .pop-in, #pg-member .pop-word, #pg-member .pop-scale')
      .forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [step]);

  
  const steps = useMemo(() => [
    
    {
      title:    'About NexaSphere',
      subtitle: 'NexaSphere Membership Form — GL Bajaj Group of Institutions',
      icon:     <IconBolt style={{ width: 18, height: 18 }} />,
      render: () => (
        <div style={{ display: 'grid', gap: 18 }}>
          
          <div style={{
            background: 'rgba(255,180,0,.08)',
            border: '1px solid rgba(255,180,0,.32)',
            borderRadius: 'var(--r3)',
            padding: '14px 18px',
            display: 'flex', alignItems: 'flex-start', gap: 12,
          }}>
            <span style={{ display: 'flex', color: '#ffb400', flexShrink: 0 }}><DynamicIcon name="AlertTriangle" size={22} /></span>
            <div style={{ lineHeight: 1.75 }}>
              <div style={{ fontFamily: 'Orbitron,monospace', fontSize: '.75rem', letterSpacing: '.1em', color: 'var(--t1)', marginBottom: 6, textTransform: 'uppercase' }}>
                Important — Read Before Proceeding
              </div>
              <div style={{ fontSize: '.9rem', color: 'var(--t2)' }}>
                This form can be filled <b style={{ color: 'var(--t1)' }}>only once</b> per device.
                Please <b style={{ color: 'var(--t1)' }}>read all questions carefully</b> and
                <b style={{ color: 'var(--t1)' }}> verify your details</b> before submitting.
                Once submitted, you will not be able to edit your response.
              </div>
            </div>
          </div>

          
          <p style={{ color: 'var(--t2)', lineHeight: 1.8, fontSize: '.96rem' }}>
            <span className="grad-text" style={{ fontWeight: 700 }}>NexaSphere</span> is the official
            student tech ecosystem at <b style={{ color: 'var(--t1)' }}>GL Bajaj Group of Institutions, Mathura</b>.
            We bring together students from all branches and years under one platform — organising and
            supporting <b>tech and non-tech events</b> across every domain:
          </p>

          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: 10,
          }}>
            {[
              { icon: 'ShieldCheck', label: 'Cybersecurity' },
              { icon: 'Brain', label: 'AI / Machine Learning' },
              { icon: 'Globe', label: 'Web Development' },
              { icon: 'Cloud', label: 'Cloud & AWS' },
              { icon: 'Smartphone', label: 'Android Development' },
              { icon: 'Megaphone', label: 'Management & Events' },
              { icon: 'Briefcase', label: 'Career & Placement' },
              { icon: 'Palette', label: 'Design & Media' },
            ].map(d => (
              <div key={d.label} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'var(--card)',
                border: '1px solid var(--bdr)',
                borderRadius: 'var(--r2)',
                padding: '10px 14px',
              }}>
                <span style={{ display: 'flex', color: 'var(--c1)' }}><DynamicIcon name={d.icon} size={20} /></span>
                <span style={{ fontSize: '.88rem', color: 'var(--t2)', fontFamily: 'Rajdhani,sans-serif', fontWeight: 600 }}>{d.label}</span>
              </div>
            ))}
          </div>

          
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
              fontFamily: 'Space Mono,monospace', fontSize: '.65rem',
              color: 'var(--t3)', letterSpacing: '.22em',
              textTransform: 'uppercase', marginBottom: 10,
            }}>As a NexaSphere Member you get</div>
            <ul style={{ paddingLeft: 18, display: 'grid', gap: 8, color: 'var(--t2)', fontSize: '.92rem' }}>
              <li>Access to <b>exclusive WhatsApp domain groups</b> for learning & collaboration</li>
              <li>Early access to <b>workshops, hackathons, and events</b></li>
              <li>Network with peers and Core Team across all domains</li>
              <li><b>Certificates</b> for events you participate in</li>
              <li>Career, placement, and industry insights from our sessions</li>
            </ul>
          </div>

          
          <div style={{
            background: 'linear-gradient(135deg,rgba(0,119,181,.10),rgba(0,212,255,.05))',
            border: '1px solid rgba(0,119,181,.24)',
            borderRadius: 'var(--r2)',
            padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          }}>
            <span style={{ display: 'flex', color: 'var(--c1)' }}><DynamicIcon name="Link" size={18} /></span>
            <span style={{ fontSize: '.88rem', color: 'var(--t2)', flex: 1 }}>
              Before filling the form, please follow our official LinkedIn page:
            </span>
            <a
              href={LINKEDIN_PAGE}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm"
              style={{ textTransform: 'none', letterSpacing: 0, fontSize: '.82rem' }}
            >Follow on LinkedIn</a>
          </div>
        </div>
      ),
    },
    
    {
      title:    'Personal Details',
      subtitle: 'Fill in your basic information accurately using your college details.',
      icon:     <IconUsers style={{ width: 18, height: 18 }} />,
      render: () => (
        <div style={{ display: 'grid', gap: 18 }}>
          <Field label="Full Name" required>
            <Input
              value={form.fullName}
              onChange={v => set('fullName', v.replace(/[^a-zA-Z\s.\-']/g, ''))}
              placeholder="Your full name"
              maxLength={60}
            />
          </Field>

          <Field label="College Email ID" required hint="Use your official college email">
            <Input
              value={form.collegeEmail}
              onChange={v => set('collegeEmail', v.trim().toLowerCase())}
              placeholder="yourname@glbajajgroup.org"
              type="email"
              maxLength={100}
            />
            {form.collegeEmail && !form.collegeEmail.endsWith('@glbajajgroup.org') && (
              <div style={{ color: '#ef4444', fontSize: '.82rem', marginTop: 4 }}>
                Please use your official GL Bajaj email (@glbajajgroup.org)
              </div>
            )}
          </Field>

          <Field label="University Roll Number" required>
            <Input
              value={form.rollNumber}
              onChange={v => set('rollNumber', v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15))}
              placeholder="e.g. 2301234"
              maxLength={15}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
            <Field label="Course" required>
              <div style={{ display: 'grid', gap: 8 }}>
                <StyledSelect value={form.course} onChange={v => set('course', v)} placeholder="Select course">
                  {COURSE_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </StyledSelect>
                {form.course === 'Other' && (
                  <Input
                    value={form.courseOther}
                    onChange={v => set('courseOther', v.replace(/[^a-zA-Z0-9\s\-&().]/g, ''))}
                    placeholder="Specify your course"
                    maxLength={60}
                  />
                )}
              </div>
            </Field>

            <Field label="Branch / Department" required>
              <div style={{ display: 'grid', gap: 8 }}>
                <StyledSelect value={form.branch} onChange={v => set('branch', v)} placeholder="Select branch">
                  {BRANCH_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                </StyledSelect>
                {form.branch === 'Other' && (
                  <Input
                    value={form.branchOther}
                    onChange={v => set('branchOther', v.replace(/[^a-zA-Z0-9\s\-&().]/g, ''))}
                    placeholder="Specify your branch"
                    maxLength={60}
                  />
                )}
              </div>
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
            <Field label="Section" required hint="Academic Section (A/B/C/...)">
              <StyledSelect value={form.section} onChange={v => set('section', v)} placeholder="-- Select Section --">
                {SECTION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </StyledSelect>
              {form.section === 'Other' && (
                <div style={{ marginTop: 10 }}>
                  <Input
                    value={form.sectionOther}
                    onChange={v => set('sectionOther', v)}
                    placeholder="Type your section manually..."
                  />
                </div>
              )}
            </Field>

            <Field label="Semester" required>
              <StyledSelect value={form.semester} onChange={v => set('semester', v)} placeholder="Select semester">
                {SEMESTER_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </StyledSelect>
            </Field>
          </div>

          <Field label="WhatsApp Number" required hint="10-digit mobile number">
            <Input
              value={form.whatsapp}
              onChange={v => set('whatsapp', String(v || '').replace(/[^\d]/g, '').slice(0, 10))}
              onPaste={e => {
                e.preventDefault();
                const pasted = e.clipboardData.getData('text').replace(/[^\d]/g, '').slice(0, 10);
                set('whatsapp', pasted);
              }}
              placeholder="10-digit mobile number"
              type="tel"
              inputMode="numeric"
              maxLength={10}
            />
          </Field>
        </div>
      ),
    },
    
    {
      title:    'Domain Selection',
      subtitle: 'Choose the NexaSphere groups you want to join and share your motivation.',
      icon:     <IconBolt style={{ width: 18, height: 18 }} />,
      render: () => (
        <div style={{ display: 'grid', gap: 20 }}>
          <Field label="Which NexaSphere groups would you like to join?" required hint="Select one or more.">
            <MultiSelectChips
              options={GROUP_OPTIONS}
              values={form.groups}
              onToggle={opt => set('groups', form.groups.includes(opt)
                ? form.groups.filter(x => x !== opt)
                : [...form.groups, opt]
              )}
            />
          </Field>

          <Field label="Why do you want to join NexaSphere?" required>
            <TextArea
              value={form.whyJoin}
              onChange={v => set('whyJoin', v)}
              placeholder="Share your motivation and what you hope to learn or contribute."
              rows={6}
            />
          </Field>
        </div>
      ),
    },
  ], [form]);

  const current  = steps[step];
  const progress = step / (steps.length - 1);

  
  return (
    <div id="pg-member" ref={topRef}>
      <style>{`
        .member-hero { text-align:center; padding:64px 24px 46px; position:relative; }
        .member-hero-bg {
          position:absolute; inset:0; pointer-events:none;
          background:
            radial-gradient(ellipse 60% 55% at 50% 0%, rgba(123,111,255,.10) 0%, transparent 62%),
            radial-gradient(ellipse 40% 40% at 20% 85%, rgba(0,212,255,.07) 0%, transparent 55%),
            radial-gradient(ellipse 40% 40% at 80% 70%, rgba(189,92,255,.05) 0%, transparent 55%);
        }
        [data-theme="light"] .member-hero-bg {
          background:
            radial-gradient(ellipse 60% 55% at 50% 0%, rgba(109,40,217,.06) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 20% 85%, rgba(194,119,10,.04) 0%, transparent 55%);
        }
        .member-divider {
          width:100%; height:1px;
          background:linear-gradient(90deg,transparent,var(--c2) 18%,var(--c1) 50%,var(--c3) 82%,transparent);
          opacity:.18; margin:0 auto;
        }
        .member-shell {
          max-width:860px; margin:0 auto;
          background:var(--card); border:1px solid var(--bdr);
          border-radius:var(--r4); overflow:hidden;
          position:relative; box-shadow:var(--shcard);
        }
        [data-theme="light"] .member-shell {
          background:#fff; border-color:rgba(28,25,23,.1);
          box-shadow:0 8px 44px rgba(0,0,0,.10);
        }
        .member-topbar {
          padding:18px 18px 14px; border-bottom:1px solid var(--bdr);
          background:linear-gradient(180deg,rgba(123,111,255,.04),transparent);
        }
        [data-theme="light"] .member-topbar { background:linear-gradient(180deg,rgba(109,40,217,.03),transparent); }
        .member-progress {
          height:8px; background:rgba(255,255,255,.04);
          border:1px solid var(--bdr); border-radius:999px; overflow:hidden;
        }
        [data-theme="light"] .member-progress { background:rgba(28,25,23,.04); }
        .member-progress > div {
          height:100%; width:0%;
          background:linear-gradient(90deg,var(--c2),var(--c1),var(--c3));
          box-shadow:0 0 18px var(--c1g);
          transition:width .35s cubic-bezier(.22,1,.36,1);
        }
        .member-body { padding:22px 18px 18px; }
        @media (min-width:720px){
          .member-body  { padding:26px 26px 22px; }
          .member-topbar{ padding:18px 26px 14px; }
        }
      `}</style>

      
      <div className="member-hero">
        <div className="member-hero-bg"/>
        {onBack ? (
          <button
            onClick={onBack}
            className="btn btn-outline btn-sm"
            style={{ position:'absolute', top:24, left:24 }}
          >
            <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
              <IconArrowLeft style={{ width:14, height:14 }}/> Back
            </span>
          </button>
        ) : null}

        <div className="pop-in" style={{
          display:'inline-block',
          background:'linear-gradient(135deg,var(--c2),var(--c3))',
          borderRadius:999, padding:'7px 22px',
          fontFamily:'Orbitron,monospace', fontSize:'.85rem',
          fontWeight:700, letterSpacing:'.1em',
          color:'#fff', textTransform:'uppercase',
          boxShadow:'0 0 24px rgba(123,111,255,.4)',
          marginBottom:16,
        }}>
          Membership Form
        </div>

        <h1 className="section-title pop-word" style={{ marginBottom:14 }}>
          Join NexaSphere Community
        </h1>
        <p className="pop-in" style={{
          color:'var(--t2)',
          fontSize:'clamp(.9rem,2vw,1.08rem)',
          maxWidth:660, margin:'0 auto',
          lineHeight:1.75, animationDelay:'.12s',
        }}>
          NexaSphere connects students with opportunities across Tech and Non-Tech domains —
          development, cloud, cybersecurity, management, and career growth.
        </p>
        <div className="member-divider" style={{ marginTop:34, maxWidth:780 }}/>
      </div>

      <div className="container" style={{ paddingBottom:86 }}>
        <div className="member-shell pop-scale">
          <div className="corner-tl"/><div className="corner-br"/>

          
          <div className="member-topbar">
            <div style={{
              display:'flex', justifyContent:'space-between',
              alignItems:'center', gap:14, flexWrap:'wrap', marginBottom:12,
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{
                  width:44, height:44, borderRadius:14,
                  background:'linear-gradient(135deg,rgba(123,111,255,.25),rgba(0,212,255,.15))',
                  border:'1px solid var(--bdr2)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 0 20px rgba(123,111,255,.12)',
                  fontSize:'1.25rem',
                }}>
                  {done ? <IconShieldCheck style={{ width:18, height:18 }}/> : current.icon}
                </div>
                <div>
                  <div style={{
                    fontFamily:'Orbitron,monospace', fontSize:'.9rem',
                    letterSpacing:'.08em', color:'var(--t1)',
                    display:'flex', gap:10, alignItems:'baseline', flexWrap:'wrap',
                  }}>
                    <span>{done ? 'Submission Complete' : current.title}</span>
                    {!done ? (
                      <span style={{ fontFamily:'Space Mono,monospace', fontSize:'.62rem', letterSpacing:'.18em', color:'var(--t3)' }}>
                        SECTION {step + 1}/{steps.length}
                      </span>
                    ) : null}
                  </div>
                  <div style={{ color:'var(--t2)', fontSize:'.9rem' }}>
                    {done
                      ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>Thank you for joining NexaSphere — GL Bajaj Group of Institutions <DynamicIcon name="Rocket" size={14} /></span>
                      : current.subtitle}
                  </div>
                </div>
              </div>

              <div style={{ fontFamily:'Space Mono,monospace', fontSize:'.62rem', letterSpacing:'.14em', color:'var(--t3)', textTransform:'uppercase', textAlign:'right' }}>
                {done ? 'Form Submitted' : `Section ${step + 1} of ${steps.length}`}
              </div>
            </div>

            <div className="member-progress">
              <div style={{ width: `${Math.round(progress * 100)}%` }}/>
            </div>
          </div>

          
          <div className="member-body">
            {alreadySubmitted && !done ? (
              <div style={{
                background:'rgba(255,45,120,.08)', border:'1px solid rgba(255,45,120,.22)',
                borderRadius:'var(--r3)', padding:'20px 22px', textAlign:'center',
              }}>
                <div style={{ display:'flex', justifyContent:'center', color:'#ff2d78', marginBottom:10 }}><DynamicIcon name="AlertTriangle" size={22} /></div>
                <div style={{ color:'var(--t1)', fontSize:'.98rem', fontWeight:600, marginBottom:16 }}>
                  Membership Form Already Submitted
                </div>
                <div style={{ color:'var(--t2)', fontSize:'.88rem', lineHeight:1.6, marginBottom:24 }}>
                  A membership form has already been submitted from this device.<br/>
                  If you need to update your application, please contact us at{' '}
                  <a href="mailto:nexasphere@glbajajgroup.org" style={{ color:'var(--c1)', fontWeight:600 }}>
                    nexasphere@glbajajgroup.org
                  </a>
                </div>

                <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center' }}>
                  <a
                    href={WHATSAPP_COMMUNITY}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-whatsapp"
                    style={{ flex:1, minWidth:0, justifyContent:'center' }}
                  >
                    Join WhatsApp Community
                  </a>
                  <a
                    href={LINKEDIN_PAGE}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                    style={{ flex:1, minWidth:0, justifyContent:'center' }}
                  >
                    NexaSphere LinkedIn
                  </a>
                </div>
              </div>
            ) : done ? (
              /* ── Success screen ── */
              <div style={{ display:'grid', gap:18 }}>
                <div style={{
                  background:'linear-gradient(135deg,rgba(123,111,255,.08),rgba(0,212,255,.06))',
                  border:'1px solid var(--bdr2)', borderRadius:'var(--r3)',
                  padding:22, position:'relative', overflow:'hidden', textAlign:'center',
                }}>
                  <div className="corner-tl"/><div className="corner-br"/>
                  <div style={{ display:'flex', justifyContent:'center', color:'var(--c1)', marginBottom:14 }}><DynamicIcon name="Rocket" size={38} /></div>
                  <div style={{ fontFamily:'Orbitron,monospace', fontSize:'1rem', color:'var(--t1)', fontWeight:700, marginBottom:12 }}>
                    Thank you for filling the NexaSphere Membership Form!
                  </div>
                  <p style={{ color:'var(--t2)', lineHeight:1.8, maxWidth:540, margin:'0 auto' }}>
                    Your form has been successfully submitted.
                    <br/><br/>
                    Now request to join the NexaSphere WhatsApp group using the link below — and
                    <b style={{ color:'var(--t1)' }}> mention that you have already filled the NexaSphere form</b>.
                    <br/><br/>
                    Our team will verify your responses and add you to the respective NexaSphere spaces/groups.
                  </p>
                </div>

                
                <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center' }}>
                  <a
                    className="btn btn-whatsapp"
                    href={WHATSAPP_COMMUNITY}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                      Join NexaSphere WhatsApp Group <IconArrowRight/>
                    </span>
                  </a>
                  <a
                    className="btn btn-outline"
                    href={LINKEDIN_PAGE}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                      Follow on LinkedIn <IconArrowRight/>
                    </span>
                  </a>
                </div>

                <div style={{
                  background:'var(--card)', border:'1px solid var(--bdr)',
                  borderRadius:'var(--r2)', padding:'14px 16px',
                  fontSize:'.88rem', color:'var(--t3)', lineHeight:1.7, textAlign:'center',
                }}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:6, justifyContent:'center', flexWrap:'wrap' }}>
                    <DynamicIcon name="Pin" size={14} /> Also make sure to follow the official NexaSphere LinkedIn page for updates.
                  </span><br/>
                  <b style={{ color:'var(--t2)', display:'inline-flex', alignItems:'center', gap:6, justifyContent:'center', flexWrap:'wrap' }}>
                    <DynamicIcon name="Rocket" size={14} /> Stay connected and keep building — NexaSphere Team
                  </b>
                </div>
              </div>
            ) : (
              <>
                {current.render()}

                {err ? (
                  <div style={{
                    marginTop:18,
                    background:'rgba(255,45,120,.10)', border:'1px solid rgba(255,45,120,.22)',
                    color:'var(--t1)', borderRadius:'var(--r2)', padding:'12px 14px', fontWeight:600,
                  }}>
                    {err}
                  </div>
                ) : null}

                
                <div style={{ marginTop:22, display:'flex', justifyContent:'space-between', gap:10, flexWrap:'wrap' }}>
                  <button
                    className="btn btn-outline"
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setErr('');
                      if (step === 0) { if (onBack) onBack(); }
                      else { setStep(s => clamp(s - 1, 0, steps.length - 1)); scrollTop(); }
                    }}
                  >
                    <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                      <IconArrowLeft/> Back
                    </span>
                  </button>

                  {step < steps.length - 1 ? (
                    <button
                      className="btn btn-primary btn-ripple"
                      type="button"
                      disabled={busy || !canNext}
                      onClick={() => {
                        if (!canNext) { setErr('Please complete the required fields (*) to proceed.'); return; }
                        setErr('');
                        setStep(s => clamp(s + 1, 0, steps.length - 1));
                        scrollTop();
                      }}
                      style={{ opacity: canNext ? 1 : .65 }}
                    >
                      <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                        Continue <IconArrowRight/>
                      </span>
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-ripple"
                      type="button"
                      disabled={busy || !canNext}
                      onClick={() => {
                        if (!canNext) { setErr('Please complete the required fields (*) to submit.'); return; }
                        submit();
                      }}
                    >
                      {busy ? 'Submitting…' : 'Submit Membership Form'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="pop-in" style={{
          marginTop:18, textAlign:'center',
          color:'var(--t3)', fontSize:'.82rem',
        }}>
          Need help? Contact NexaSphere team via WhatsApp or email nexasphere@glbajajgroup.org
        </div>

        <Footer />
      </div>
    </div>
  );
}


