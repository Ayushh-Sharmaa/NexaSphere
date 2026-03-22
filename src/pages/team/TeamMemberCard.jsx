import { useRef } from 'react';

export default function TeamMemberCard({ member, onClick, extraClass = '', style={} }) {
  const ref = useRef(null);

  const onMove = e => {
    const c = ref.current; if (!c) return;
    const rect = c.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - .5;
    const y = (e.clientY - rect.top)  / rect.height - .5;
    c.style.transform = `translateY(-10px) rotateX(${-y*13}deg) rotateY(${x*13}deg)`;
  };
  const onLeave = () => { if (ref.current) ref.current.style.transform = ''; };
  const click = () => {
    const c = ref.current;
    if (c) { c.style.transform='scale(.94)'; setTimeout(()=>{c.style.transform='';},140); }
    setTimeout(()=>onClick(member),100);
  };

  return (
    <div ref={ref}
      className={`team-card shimmer tilt ${extraClass}`}
      style={{perspective:'600px',cursor:'pointer',...style}}
      onMouseMove={onMove} onMouseLeave={onLeave}
      onClick={click}
      role="button" tabIndex={0}
      onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')click();}}
      aria-label={`View ${member.name}'s profile`}
    >
      <div className="team-card-photo-wrap">
        <img src={member.photo} alt={member.name} className="team-card-photo"/>
      </div>
      <div className="team-card-name">{member.name}</div>
      <div className="team-card-role">{member.role}</div>
      <div className="team-card-click-hint">Click to view profile →</div>
    </div>
  );
}
