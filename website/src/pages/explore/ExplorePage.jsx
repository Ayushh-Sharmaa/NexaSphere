import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  TrendingUp,
  Users,
  Calendar,
  Star,
  Sparkles,
  Clock,
  Zap,
  Tag,
} from 'lucide-react';
import apiClient from '../../utils/apiClient';
import { getApiBase } from '../../utils/runtimeConfig';
import AdvancedFilters from '../../components/explore/AdvancedFilters';

const SECTION_ICONS = {
  trending: <TrendingUp size={18} color="var(--c1)" />,
  upcoming: <Calendar size={18} color="#9999ff" />,
  members: <Users size={18} color="#00c864" />,
  recommended: <Sparkles size={18} color="#f59e0b" />,
};

export default function ExplorePage({ onBack, eventsData }) {
  const [trending, setTrending] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [filters, setFilters] = useState(null);
  const [activeTab, setActiveTab] = useState('discover');

  useEffect(() => {
    // Guard against state updates after unmount; this page does not pass its
    // own AbortSignal to apiClient, so we still need an `alive` flag here.
    let alive = true;
    const fetchData = async () => {
      const base = getApiBase();
      setLoading(true);
      try {
        const [trendingRes, recsRes, teamRes] = await Promise.all([
          base ? apiClient(`${base}/api/search/trending`).catch(() => null) : null,
          base ? apiClient(`${base}/api/recommendations`).catch(() => null) : null,
          base ? apiClient(`${base}/api/content/team`).catch(() => null) : null,
        ]);

        if (!alive) return;
        if (trendingRes?.trending) setTrending(trendingRes.trending);
        if (recsRes?.recommendations) setRecommendations(recsRes.recommendations);
        if (teamRes?.members) setMembers(teamRes.members);
      } catch (err) {
        if (!alive) return;
        if (import.meta.env.DEV) {
          console.warn('[ExplorePage] Failed to fetch explore data:', err.message);
        }
        setFetchError('Failed to load content. Please try again.');
      }
      if (alive) setLoading(false);
    };
    fetchData();
    return () => {
      alive = false;
    };
  }, []);

  const filteredEvents = useMemo(() => {
    let items = trending.length > 0 ? trending : eventsData || [];
    if (!filters) return items;

    if (filters.status === 'upcoming') items = items.filter((ev) => ev.status !== 'completed');
    else if (filters.status === 'completed')
      items = items.filter((ev) => ev.status === 'completed');

    if (filters.dateRange === 'upcoming') items = items.filter((ev) => ev.status !== 'completed');
    else if (filters.dateRange === 'past') items = items.filter((ev) => ev.status === 'completed');

    if (filters.category !== 'all') {
      const cat = filters.category.toLowerCase();
      items = items.filter(
        (ev) => ev.category?.toLowerCase() === cat || ev.tags?.some((t) => t.toLowerCase() === cat)
      );
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (ev) =>
          ev.title?.toLowerCase().includes(q) ||
          ev.name?.toLowerCase().includes(q) ||
          ev.description?.toLowerCase().includes(q)
      );
    }

    return items;
  }, [trending, eventsData, filters]);

  const upcomingEvents = useMemo(
    () => (eventsData || []).filter((ev) => ev.status !== 'completed').slice(0, 6),
    [eventsData]
  );

  const featuredMembers = useMemo(() => (members || []).slice(0, 6), [members]);

  const sections = {
    discover: {
      title: 'Discover',
      subtitle: 'Trending events, recommended picks, and featured members',
    },
    events: {
      title: 'Events',
      subtitle: 'Browse all events with advanced filters',
    },
  };

  return (
    <div
      className="roadmaps-page-container"
      style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px 100px' }}
    >
      <div style={{ marginBottom: '32px' }}>
        <button
          onClick={onBack}
          className="btn btn-sm btn-outline"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}
          aria-label="Go back"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="roadmaps-title" style={{ marginBottom: '8px' }}>
          Explore
        </h1>
        <p style={{ color: 'var(--t2)', maxWidth: '600px', lineHeight: '1.6' }}>
          Discover trending events, connect with community members, and find your next opportunity.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '32px',
          borderBottom: '1px solid var(--bdr)',
          paddingBottom: '12px',
        }}
      >
        {Object.entries(sections).map(([key, sec]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === key ? 'var(--c1)' : 'transparent',
              color: activeTab === key ? '#fff' : 'var(--t2)',
              cursor: 'pointer',
              fontFamily: "'Orbitron', monospace",
              fontSize: '0.8rem',
              fontWeight: 700,
              transition: 'all 0.2s',
            }}
          >
            {sec.title}
          </button>
        ))}
      </div>

      {activeTab === 'discover' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--t2)' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '3px solid rgba(204,17,17,0.2)',
                  borderTop: '3px solid #CC1111',
                  animation: 'spin 0.8s linear infinite',
                  margin: '0 auto 16px',
                }}
              />
              Loading discoveries…
            </div>
          ) : (
            <>
              <SectionBlock
                icon={SECTION_ICONS.trending}
                title="Trending Events"
                subtitle="Most popular and registered events"
                items={trending.slice(0, 6)}
                renderItem={(ev) => <EventCard event={ev} />}
                emptyText="No trending events right now"
              />

              <SectionBlock
                icon={SECTION_ICONS.upcoming}
                title="Upcoming Events"
                subtitle="Events happening soon"
                items={upcomingEvents}
                renderItem={(ev) => <EventCard event={ev} />}
                emptyText="No upcoming events"
              />

              <SectionBlock
                icon={SECTION_ICONS.recommended}
                title="Recommended For You"
                subtitle="Based on community trends"
                items={recommendations.slice(0, 6)}
                renderItem={(ev) => <EventCard event={ev} />}
                emptyText="Recommendations coming soon"
              />

              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '6px',
                  }}
                >
                  {SECTION_ICONS.members}
                  <h3
                    style={{
                      fontFamily: "'Orbitron', monospace",
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      color: 'var(--t1)',
                      margin: 0,
                    }}
                  >
                    Featured Members
                  </h3>
                </div>
                <p style={{ color: 'var(--t3)', fontSize: '0.85rem', marginBottom: '16px' }}>
                  Connect with the community
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: '12px',
                  }}
                >
                  {featuredMembers.length > 0 ? (
                    featuredMembers.map((m, i) => (
                      <motion.div
                        key={m.id || i}
                        whileHover={{ y: -4 }}
                        style={{
                          background: 'var(--card)',
                          border: '1px solid var(--bdr)',
                          borderRadius: '12px',
                          padding: '16px',
                          textAlign: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--c1), var(--c2))',
                            margin: '0 auto 10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem',
                            fontWeight: 700,
                            color: '#fff',
                          }}
                        >
                          {(m.name || '?')[0]}
                        </div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            color: 'var(--t1)',
                            marginBottom: '4px',
                          }}
                        >
                          {m.name || 'Anonymous'}
                        </div>
                        {m.role && (
                          <div
                            style={{ fontSize: '0.78rem', color: 'var(--t2)', marginBottom: '6px' }}
                          >
                            {m.role}
                          </div>
                        )}
                        {m.skills && m.skills.length > 0 && (
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '4px',
                              justifyContent: 'center',
                            }}
                          >
                            {m.skills.slice(0, 3).map((s, j) => (
                              <span
                                key={j}
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  background: 'rgba(0,200,100,0.1)',
                                  color: '#00c864',
                                }}
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))
                  ) : (
                    <div
                      style={{
                        color: 'var(--t3)',
                        fontSize: '0.9rem',
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        padding: '20px',
                      }}
                    >
                      No featured members yet
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'events' && (
        <div>
          <AdvancedFilters events={eventsData} onFilterChange={setFilters} />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {filteredEvents.length > 0 ? (
              filteredEvents.map((ev, i) => <EventCard key={ev.id || i} event={ev} detailed />)
            ) : (
              <div
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: 'var(--t3)',
                }}
              >
                <Calendar size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
                <div style={{ fontSize: '1rem', marginBottom: '6px' }}>
                  No events match your filters
                </div>
                <div style={{ fontSize: '0.85rem' }}>Try adjusting your filter criteria</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionBlock({ icon, title, subtitle, items, renderItem, emptyText }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
        {icon}
        <div>
          <h3
            style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: '1.1rem',
              fontWeight: 800,
              color: 'var(--t1)',
              margin: 0,
            }}
          >
            {title}
          </h3>
          <p style={{ color: 'var(--t3)', fontSize: '0.8rem', margin: '2px 0 0' }}>{subtitle}</p>
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '12px',
          marginTop: '14px',
        }}
      >
        {items.length > 0 ? (
          items.map((item, i) => (
            <motion.div
              key={item.id || i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              {renderItem(item)}
            </motion.div>
          ))
        ) : (
          <div
            style={{
              color: 'var(--t3)',
              fontSize: '0.9rem',
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '20px',
            }}
          >
            {emptyText}
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({ event, detailed }) {
  const navigate = useNavigate();
  const title = event?.title || event?.name || event?.shortName || '';
  const desc = event?.description || '';
  const tags = event?.tags || [];
  const date = event?.date || '';
  const score = event?.score || event?.registrationCount;

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--bdr)',
        borderRadius: '12px',
        padding: '16px',
        transition: 'border-color 0.2s, transform 0.2s',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--c1)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--bdr)';
        e.currentTarget.style.transform = 'none';
      }}
      onClick={() => {
        const url = event?.url || `/events/${event?.id || ''}`;
        navigate(url);
        window.location.href = url;
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}
      >
        <div
          style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: '0.85rem',
            fontWeight: 700,
            color: 'var(--t1)',
            flex: 1,
          }}
        >
          {title}
        </div>
        {score !== undefined && (
          <div
            style={{
              fontSize: '0.72rem',
              padding: '2px 8px',
              borderRadius: '6px',
              background: 'rgba(245,158,11,0.1)',
              color: '#f59e0b',
              whiteSpace: 'nowrap',
              marginLeft: '8px',
            }}
          >
            {typeof score === 'number' ? score.toFixed(2) : score} pts
          </div>
        )}
      </div>
      {desc && (
        <div
          style={{
            fontSize: '0.82rem',
            color: 'var(--t2)',
            lineHeight: '1.5',
            marginBottom: '10px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {desc}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {date && (
          <span
            style={{
              fontSize: '0.72rem',
              color: 'var(--t3)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Calendar size={11} /> {date}
          </span>
        )}
        {tags.slice(0, 3).map((t, i) => (
          <span
            key={i}
            style={{
              fontSize: '0.68rem',
              padding: '2px 8px',
              borderRadius: '6px',
              background: 'rgba(204,17,17,0.08)',
              color: 'var(--c1)',
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
