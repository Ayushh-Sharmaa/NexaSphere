import { useEffect } from 'react';

const WHATSAPP_URL = 'https://chat.whatsapp.com/Jjc5cuUKENu0RC1vWSEs20';
const LINKEDIN_URL = 'https://www.linkedin.com/showcase/glbajaj-nexasphere/';

export default function AboutSection() {
  useEffect(() => {
    const els = document.querySelectorAll('#section-about .reveal');
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <section className="section" id="section-about">
      <div className="container">
        <h2 className="section-title reveal">About NexaSphere</h2>
        <p className="section-subtitle reveal" style={{ transitionDelay: '0.1s' }}>
          Building Tomorrow&apos;s Tech Leaders Today
        </p>

        <div className="about-content">
          <p className="about-text reveal" style={{ transitionDelay: '0.15s' }}>
            <strong style={{ color: 'var(--cyan)' }}>NexaSphere</strong> is a student-driven tech
            ecosystem at <strong style={{ color: 'var(--indigo)' }}>GL Bajaj Group of Institutions, Mathura</strong>.
            Founded with a mission to create a thriving community of passionate engineers and innovators,
            we bridge the gap between academic learning and real-world technology.
          </p>

          <p className="about-text reveal" style={{ transitionDelay: '0.2s' }}>
            From intense hackathons to insightful knowledge sessions, NexaSphere is where curiosity
            meets collaboration. We believe that the best learning happens when you build, share, and
            grow together — and that&apos;s exactly what our community is all about.
          </p>

          <p className="about-text reveal" style={{ transitionDelay: '0.25s' }}>
            Whether you&apos;re a beginner writing your first line of code or a seasoned developer
            pushing the boundaries of what&apos;s possible — NexaSphere is your launchpad. Join us,
            and let&apos;s shape the future of technology together.
          </p>

          <div className="about-actions reveal" style={{ transitionDelay: '0.3s' }}>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp"
            >
              💬 Join WhatsApp Community
            </a>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-linkedin"
            >
              🔗 Follow on LinkedIn
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
