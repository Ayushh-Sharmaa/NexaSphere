import { useState, useEffect } from 'react';
import { teamMembers } from '../data/teamData';
import TeamMemberCard from './TeamMemberCard';
import TeamMemberModal from './TeamMemberModal';

export default function TeamSection() {
  const [selectedMember, setSelectedMember] = useState(null);

  // Scroll reveal for all cards
  useEffect(() => {
    const cards = document.querySelectorAll('#section-team .team-card');
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('visible');
        }),
      { threshold: 0.08 }
    );
    cards.forEach((c) => obs.observe(c));
    return () => obs.disconnect();
  }, []);

  // Scroll reveal for title
  useEffect(() => {
    const els = document.querySelectorAll('#section-team .reveal:not(.team-card)');
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('visible');
        }),
      { threshold: 0.1 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <section className="section" id="section-team">
      <div className="container">
        <h2 className="section-title reveal">Core Team</h2>
        <p className="section-subtitle reveal" style={{ transitionDelay: '0.1s' }}>
          The Minds Behind NexaSphere
        </p>

        <div className="team-grid">
          {teamMembers.map((member, i) => (
            <TeamMemberCard
              key={member.id}
              member={member}
              onClick={setSelectedMember}
              style={{ transitionDelay: `${(i % 5) * 0.08}s` }}
            />
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedMember && (
        <TeamMemberModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </section>
  );
}
