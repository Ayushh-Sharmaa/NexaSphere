import { useState, useEffect, useMemo } from 'react';
import { events as fallbackEvents } from '../../data/eventsData';
import { BannerOrbs } from '../../shared/MotionLayer';
import Footer from '../../shared/Footer';
import { DynamicIcon } from '../../shared/Icons';
import PersonalizedFeed from '../../components/recommendations/PersonalizedFeed';
import EventCountdown from '../../components/events/EventCountdown.jsx';
import { useRecommendations } from '../../hooks/useRecommendations';
import { getEventCountdownStatus, parseDate } from '../../hooks/useCountdown.js';
import EventCalendarView from '../../components/calendar/EventCalendarView';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { EventCardSkeleton } from '../../components/ui/skeleton/EventCardSkeleton';

export default function EventsPage({
  onBack,
  onEventClick,
  events = fallbackEvents,
  loading = false,
}) {
  const { user } = useStudentAuth();
  const [view, setView] = useState('timeline');
  const [recommendationView, setRecommendationView] = useState(false);
  const [now] = useState(() => Date.now());
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: '',
    location: '',
    search: '',
  });
  const EVENTS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);

  const getEffectiveStatus = (ev) => {
    if (ev.status === 'completed') return 'completed';
    const startDate = ev.startDate ?? ev.date;
    const endDate = ev.endDate ?? ev.date;
    return getEventCountdownStatus({ startDate, endDate });
  };

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const eventDate = new Date(ev.startDate ?? ev.date);

      if (filters.startDate && eventDate < new Date(filters.startDate)) {
        return false;
      }

      if (filters.endDate && eventDate > new Date(filters.endDate)) {
        return false;
      }

      if (
        filters.category &&
        !(ev.tags || []).join(' ').toLowerCase().includes(filters.category.toLowerCase())
      ) {
        return false;
      }

      if (
        filters.location &&
        !(ev.description || '').toLowerCase().includes(filters.location.toLowerCase())
      ) {
        return false;
      }

      if (
        filters.search &&
        !(
          ev.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
          ev.description?.toLowerCase().includes(filters.search.toLowerCase())
        )
      ) {
        return false;
      }

      return true;
    });
  }, [events, filters]);

  const sortedEvents = useMemo(() => {
    return [...filteredEvents]
      .map((ev) => ({
        ...ev,
        status: getEffectiveStatus(ev),
      }))
      .sort((a, b) => {
        const da = parseDate(a.startDate ?? a.date)?.getTime() ?? 0;
        const db = parseDate(b.startDate ?? b.date)?.getTime() ?? 0;
        const aIsUpcoming = a.status === 'UPCOMING' || a.status === 'REGISTRATION_OPEN';
        return aIsUpcoming ? da - db : db - da;
      });
  }, [filteredEvents]);

  const { recommendations, loading: recsLoading } = useRecommendations(user?.sub || user?.id || '');

  const buildGradient = (ev) => {
    if (ev.gradientColors?.length > 1) {
      return `linear-gradient(135deg, ${ev.gradientColors.join(', ')})`;
    }
    if (ev.gradientColors?.length === 1) {
      return `linear-gradient(135deg, ${ev.gradientColors[0]}, ${ev.gradientColors[0]}88)`;
    }
    return null;
  };

  useEffect(() => {
    window.scrollTo({ top: 0 });
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('fired');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0, rootMargin: '0px 0px -10px 0px' }
    );
    document
      .querySelectorAll(
        '#events-page .pop-in, #events-page .pop-left, #events-page .pop-right, #events-page .pop-word'
      )
      .forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div id="events-page" style={{ minHeight: '100vh', padding: '0 0 100px' }}>
      <div
        className="page-banner"
        style={{
          background: 'linear-gradient(135deg, rgba(0,212,255,.06), rgba(123,111,255,.04))',
          borderBottom: '1px solid var(--bdr)',
          padding: '70px 0 50px',
          textAlign: 'center',
          /* Normalized to 32px — content areas use paddingTop:32px, so the
           combined visual gap stays consistent (~32px) instead of ~116px */
          marginBottom: '32px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          className="page-banner-line"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg,var(--c1),var(--c2),var(--c3))',
          }}
        />
        <BannerOrbs color="rgba(123,111,255,.06)" />
        <button
          onClick={onBack}
          className="ns-back-btn"
          style={{
            position: 'absolute',
            top: '24px',
            left: '28px',
            background: 'var(--card)',
            border: '1px solid var(--bdr)',
            borderRadius: '50px',
            padding: '7px 16px',
            color: 'var(--t2)',
            fontSize: '.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 600,
          }}
        >
          ← Back
        </button>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <span className="cin-section-label pop-in">NexaSphere · GL Bajaj</span>
          <h1 className="section-title pop-word" style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)' }}>
            Our Events
          </h1>
          <p
            className="section-subtitle pop-in"
            style={{
              animationDelay: '.1s',
              maxWidth: '520px',
              margin: '0 auto',
            }}
          >
            Where ideas come to life. Every event is a milestone in the NexaSphere journey.
          </p>
        </div>

        {/* View Toggle Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            marginTop: '32px',
            position: 'relative',
            zIndex: 2,
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => {
              setView('timeline');
              setRecommendationView(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 20px',
              background: !recommendationView && view === 'timeline' ? 'var(--c1)' : 'transparent',
              border: !recommendationView && view === 'timeline' ? 'none' : '1px solid var(--bdr)',
              borderRadius: '100px',
              color: !recommendationView && view === 'timeline' ? 'white' : 'var(--t2)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
              fontFamily: "'Rajdhani', sans-serif",
            }}
          >
            <DynamicIcon name="List" size={16} />
            Timeline View
          </button>
          <button
            onClick={() => {
              setView('calendar');
              setRecommendationView(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 20px',
              background: !recommendationView && view === 'calendar' ? 'var(--c1)' : 'transparent',
              border: !recommendationView && view === 'calendar' ? 'none' : '1px solid var(--bdr)',
              borderRadius: '100px',
              color: !recommendationView && view === 'calendar' ? 'white' : 'var(--t2)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
              fontFamily: "'Rajdhani', sans-serif",
            }}
          >
            <DynamicIcon name="Calendar" size={16} />
            Calendar View
          </button>
          <button
            onClick={() => {
              setRecommendationView(true);
              setView('timeline');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 20px',
              background: recommendationView ? 'var(--c1)' : 'transparent',
              border: recommendationView ? 'none' : '1px solid var(--bdr)',
              borderRadius: '100px',
              color: recommendationView ? 'white' : 'var(--t2)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
              fontFamily: "'Rajdhani', sans-serif",
            }}
          >
            <DynamicIcon name="Sparkles" size={16} />
            For You
          </button>
        </div>
      </div>

      <div className="container">
        {loading ? (
          <EventCardSkeleton count={3} />
        ) : recommendationView ? (
          <PersonalizedFeed
            events={recommendations}
            loading={recsLoading}
            onEventClick={onEventClick}
          />
        ) : view === 'timeline' ? (
          <>
            <div className="events-timeline ns-reveal">
              {sortedEvents.map((ev, i) => {
                const hasDetailPage = ev.hasDetailPage !== false;
                const dynamicGradient = buildGradient(ev);
                const glowColor = ev.gradientColors?.[0] || null;
                return (
                  <div className="timeline-item" key={ev.id}>
                    <div
                      className={`timeline-dot${ev.status !== 'completed' ? ' upcoming' : ''}`}
                    />
                    <div
                      className={`timeline-card shimmer ${i % 2 === 0 ? 'pop-left' : 'pop-right'}`}
                      style={{
                        animationDelay: `${i * 0.11}s`,
                        cursor: hasDetailPage ? 'pointer' : 'default',
                        transition: 'all .28s ease',
                        ...(dynamicGradient
                          ? {
                              position: 'relative',
                              overflow: 'hidden',
                              borderColor: 'transparent',
                            }
                          : {}),
                      }}
                      onClick={hasDetailPage ? () => onEventClick(ev) : undefined}
                      onMouseEnter={
                        hasDetailPage
                          ? (e) => {
                              e.currentTarget.style.borderColor = glowColor || 'var(--c1b)';
                              e.currentTarget.style.boxShadow = `0 6px 24px ${glowColor ? glowColor + '44' : 'var(--c1g)'}`;
                              e.currentTarget.style.transform = 'translateY(-3px)';
                            }
                          : undefined
                      }
                      onMouseLeave={
                        hasDetailPage
                          ? (e) => {
                              e.currentTarget.style.borderColor = dynamicGradient
                                ? 'transparent'
                                : '';
                              e.currentTarget.style.boxShadow = '';
                              e.currentTarget.style.transform = '';
                            }
                          : undefined
                      }
                    >
                      {dynamicGradient && (
                        <div
                          aria-hidden="true"
                          style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: 'inherit',
                            padding: '1px',
                            background: dynamicGradient,
                            WebkitMask:
                              'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                            WebkitMaskComposite: 'xor',
                            maskComposite: 'exclude',
                            opacity: 0.6,
                            pointerEvents: 'none',
                            transition: 'opacity 0.3s',
                          }}
                        />
                      )}
                      {dynamicGradient && (
                        <div
                          aria-hidden="true"
                          style={{
                            position: 'absolute',
                            inset: -8,
                            background: dynamicGradient,
                            filter: 'blur(16px)',
                            opacity: 0.12,
                            pointerEvents: 'none',
                            transition: 'opacity 0.3s',
                          }}
                        />
                      )}
                      <div
                        className="timeline-event-name"
                        style={{
                          fontSize: '1.05rem',
                          fontWeight: 800,
                          color: 'var(--c1)',
                          marginBottom: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                        }}
                      >
                        <span>{ev.name}</span>
                        {hasDetailPage && (
                          <span
                            style={{
                              color: 'var(--c1)',
                              opacity: 0.8,
                              fontSize: '0.9rem',
                            }}
                          >
                            →
                          </span>
                        )}
                      </div>
                      <div
                        className="timeline-event-date"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '.74rem',
                          color: 'var(--t3)',
                          marginBottom: '8px',
                        }}
                      >
                        <DynamicIcon
                          name={ev.icon || 'Calendar'}
                          size={13}
                          style={{ color: 'var(--c1)' }}
                        />
                        {ev.dateText ?? ev.date}
                      </div>
                      <p
                        className="timeline-event-desc"
                        style={{
                          fontSize: '.84rem',
                          lineHeight: '1.55',
                          marginBottom: '12px',
                        }}
                      >
                        {ev.description}
                      </p>
                      <EventCountdown event={ev} />
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '7px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          className={`timeline-badge ${ev.status}`}
                          style={{ fontSize: '.64rem', padding: '1px 8px' }}
                        >
                          {ev.status === 'completed' ? (
                            <>
                              <DynamicIcon
                                name="CheckCircle"
                                size={11}
                                style={{ marginRight: '4px' }}
                              />{' '}
                              Completed
                            </>
                          ) : ev.status === 'live' ? (
                            <>
                              <DynamicIcon
                                name="PlayCircle"
                                size={11}
                                style={{ marginRight: '4px' }}
                              />{' '}
                              Live Now
                            </>
                          ) : ev.status === 'starting-soon' ? (
                            <>
                              <DynamicIcon name="Clock" size={11} style={{ marginRight: '4px' }} />{' '}
                              Starting Soon
                            </>
                          ) : (
                            <>
                              <DynamicIcon
                                name="Calendar"
                                size={11}
                                style={{ marginRight: '4px' }}
                              />{' '}
                              Upcoming
                            </>
                          )}
                        </span>
                        {ev.tags?.map((t) => (
                          <span
                            key={t}
                            style={{
                              fontSize: '.64rem',
                              padding: '1px 8px',
                              borderRadius: '10px',
                              background: 'var(--c2a)',
                              color: 'var(--c2)',
                              border: '1px solid var(--c2b)',
                              fontWeight: 600,
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}

              {currentPage === totalPages && (
                <div className="timeline-item">
                  <div className="timeline-dot upcoming" />
                  <div
                    className="timeline-card pop-in fired"
                    style={{
                      textAlign: 'center',
                      color: 'var(--t3)',
                    }}
                  >
                    <DynamicIcon
                      name="Rocket"
                      size={24}
                      style={{ color: 'var(--c1)', marginBottom: '8px' }}
                    />
                    <p style={{ marginTop: '6px', fontSize: '.84rem' }}>
                      More events coming soon. Watch this space!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '32px',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--bdr)',
                    background: 'var(--card)',
                    color: currentPage === 1 ? 'var(--t3)' : 'var(--t1)',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '.82rem',
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 600,
                    opacity: currentPage === 1 ? 0.5 : 1,
                  }}
                >
                  ← Previous
                </button>
                <span
                  style={{
                    fontSize: '.82rem',
                    color: 'var(--t2)',
                    fontFamily: "'Space Mono', monospace",
                    padding: '0 8px',
                  }}
                >
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => {
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--bdr)',
                    background: 'var(--card)',
                    color: currentPage === totalPages ? 'var(--t3)' : 'var(--t1)',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '.82rem',
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 600,
                    opacity: currentPage === totalPages ? 0.5 : 1,
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        ) : (
          <EventCalendarView events={sortedEvents} onEventClick={onEventClick} />
        )}
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '28px',
          alignItems: 'center',
        }}
      >
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) =>
            setFilters((p) => ({
              ...p,
              startDate: e.target.value,
            }))
          }
        />

        <input
          type="date"
          value={filters.endDate}
          onChange={(e) =>
            setFilters((p) => ({
              ...p,
              endDate: e.target.value,
            }))
          }
        />

        <select
          value={filters.category}
          onChange={(e) =>
            setFilters((p) => ({
              ...p,
              category: e.target.value,
            }))
          }
        >
          <option value="">All Categories</option>
          <option value="workshop">Workshop</option>
          <option value="hackathon">Hackathon</option>
          <option value="seminar">Seminar</option>
          <option value="competition">Competition</option>
        </select>

        <input
          type="text"
          placeholder="Location"
          value={filters.location}
          onChange={(e) =>
            setFilters((p) => ({
              ...p,
              location: e.target.value,
            }))
          }
        />

        <input
          type="text"
          placeholder="Search events..."
          value={filters.search}
          onChange={(e) =>
            setFilters((p) => ({
              ...p,
              search: e.target.value,
            }))
          }
        />
      </div>
      <Footer />
    </div>
  );
}
