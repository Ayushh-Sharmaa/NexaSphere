import { useState, useEffect, useRef } from 'react';

// Validates a date value before formatting — avoids rendering literal
// "Invalid Date" text when the API returns a null or malformed timestamp.
function formatAchievementDate(value) {
  if (!value) return 'Unknown date';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Unknown date';
  return d.toLocaleDateString();
}
import { gamificationService, ACHIEVEMENTS } from '../../services/gamification/gamificationService';
import { DynamicIcon } from '../../shared/Icons';

export default function GamificationDashboard() {
  const [userStats, setUserStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [toasts, setToasts] = useState([]);
  const toastTimerIds = useRef([]);

  useEffect(() => {
    loadData();
    return () => {
      toastTimerIds.current.forEach(clearTimeout);
      toastTimerIds.current = [];
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      gamificationService.getLeaderboard().then((lb) => {
        if (lb && lb.length > 0) setLeaderboard(lb);
      });
    }
  }, [activeTab]);

  const showToast = (type, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const formatAchievementDate = (value) => {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString() : 'Unknown date';
  };

  const loadData = async () => {
    const stats = gamificationService.getUserStats();
    setUserStats(stats);

    // Show initial notifications (e.g., loaded from constructor) as toasts and clear them
    if (stats.notifications && stats.notifications.length > 0) {
      stats.notifications.forEach((notif) => {
        showToast(notif.type, notif.message);
      });
      gamificationService.clearNotifications();
    }

    const lb = await gamificationService.getLeaderboard();
    setLeaderboard(lb);
  };

  const handleAction = async (action) => {
    const result = gamificationService.trackAction(action);
    const stats = gamificationService.getUserStats();
    setUserStats(stats);

    // Show toasts for new achievements with their actual rewards
    if (result.newAchievements && result.newAchievements.length > 0) {
      result.newAchievements.forEach((ach) => {
        showToast('achievement', `🏆 Achievement Unlocked: ${ach.title}! +${ach.xpReward} XP`);
      });
    }

    // Show toasts for level up or streak notifications
    if (stats.notifications && stats.notifications.length > 0) {
      stats.notifications.forEach((notif) => {
        if (notif.type !== 'achievement') {
          showToast(notif.type, notif.message);
        }
      });
      gamificationService.clearNotifications();
    }

    const lb = await gamificationService.getLeaderboard();
    setLeaderboard(lb);
  };

  if (!userStats) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '2px solid #CC1111',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto',
          }}
        ></div>
        <p style={{ color: '#9CA3AF', marginTop: '16px' }}>Loading gamification data...</p>
      </div>
    );
  }

  const currentThreshold = userStats.currentLevelXP || 0;
  const nextThreshold = userStats.nextLevelXP || 100;
  const xpRange = nextThreshold - currentThreshold;
  const xpProgress =
    xpRange > 0
      ? Math.min(100, Math.max(0, ((userStats.xp - currentThreshold) / xpRange) * 100))
      : 100;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '8px' }}>
          Gamification Hub
        </h1>
        <p style={{ color: '#9CA3AF' }}>Earn XP, unlock achievements, and climb the leaderboard</p>
      </div>

      {/* XP Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1A1A1A, #0F0F0F)',
          borderRadius: '24px',
          padding: '24px',
          marginBottom: '32px',
          border: '1px solid #2A2A2A',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}
            >
              <div style={{ display: 'flex', color: '#F59E0B' }}>
                <DynamicIcon name="Trophy" size={48} />
              </div>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFFFFF' }}>
                  Level {userStats.level} {userStats.title}
                </h2>
                <p style={{ color: '#9CA3AF' }}>
                  {userStats.xp} / {userStats.nextLevelXP} XP
                </p>
              </div>
            </div>
            <div
              style={{
                width: '300px',
                background: '#2A2A2A',
                borderRadius: '10px',
                height: '8px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${xpProgress}%`,
                  background: '#CC1111',
                  height: '100%',
                  transition: 'width 0.5s',
                }}
              />
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: '#6B7280', fontSize: '13px' }}>Total XP Earned</p>
            <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#CC1111' }}>{userStats.xp}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            background: '#1A1A1A',
            borderRadius: '16px',
            padding: '16px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#FFFFFF' }}>
            {userStats.stats.events_attended}
          </p>
          <p style={{ color: '#9CA3AF', fontSize: '13px' }}>Events Attended</p>
        </div>
        <div
          style={{
            background: '#1A1A1A',
            borderRadius: '16px',
            padding: '16px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#FFFFFF' }}>
            {userStats.stats.current_streak}
          </p>
          <p
            style={{
              color: '#9CA3AF',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            Day Streak <DynamicIcon name="Flame" size={14} />
          </p>
        </div>
        <div
          style={{
            background: '#1A1A1A',
            borderRadius: '16px',
            padding: '16px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#FFFFFF' }}>
            {userStats.stats.comments}
          </p>
          <p style={{ color: '#9CA3AF', fontSize: '13px' }}>Comments</p>
        </div>
        <div
          style={{
            background: '#1A1A1A',
            borderRadius: '16px',
            padding: '16px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#FFFFFF' }}>
            {userStats.badges.length}
          </p>
          <p style={{ color: '#9CA3AF', fontSize: '13px' }}>Badges Earned</p>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          borderBottom: '1px solid #2A2A2A',
          paddingBottom: '12px',
        }}
      >
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '8px 20px',
            borderRadius: '100px',
            background: activeTab === 'overview' ? '#CC1111' : 'transparent',
            border: 'none',
            color: activeTab === 'overview' ? 'white' : '#9CA3AF',
            cursor: 'pointer',
          }}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('badges')}
          style={{
            padding: '8px 20px',
            borderRadius: '100px',
            background: activeTab === 'badges' ? '#CC1111' : 'transparent',
            border: 'none',
            color: activeTab === 'badges' ? 'white' : '#9CA3AF',
            cursor: 'pointer',
          }}
        >
          Badges
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          style={{
            padding: '8px 20px',
            borderRadius: '100px',
            background: activeTab === 'leaderboard' ? '#CC1111' : 'transparent',
            border: 'none',
            color: activeTab === 'leaderboard' ? 'white' : '#9CA3AF',
            cursor: 'pointer',
          }}
        >
          Leaderboard
        </button>
        <button
          onClick={() => setActiveTab('actions')}
          style={{
            padding: '8px 20px',
            borderRadius: '100px',
            background: activeTab === 'actions' ? '#CC1111' : 'transparent',
            border: 'none',
            color: activeTab === 'actions' ? 'white' : '#9CA3AF',
            cursor: 'pointer',
          }}
        >
          Earn XP
        </button>
        <button
          onClick={() => setActiveTab('quests')}
          style={{
            padding: '8px 20px',
            borderRadius: '100px',
            background: activeTab === 'quests' ? '#CC1111' : 'transparent',
            border: 'none',
            color: activeTab === 'quests' ? 'white' : '#9CA3AF',
            cursor: 'pointer',
          }}
        >
          Quests
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div>
          <h3 style={{ color: '#FFFFFF', marginBottom: '16px' }}>Recent Achievements</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {userStats.achievements
              .slice(-5)
              .reverse()
              .map((ach) => (
                <div
                  key={ach.id}
                  style={{
                    background: '#1A1A1A',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <div style={{ fontSize: '32px' }}>{ach.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', color: '#FFFFFF' }}>{ach.title}</div>
                    <div style={{ fontSize: '13px', color: '#9CA3AF' }}>{ach.description}</div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>
                    {formatAchievementDate(ach.unlockedAt)}
                  </div>
                </div>
              ))}
            {userStats.achievements.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  background: '#1A1A1A',
                  borderRadius: '12px',
                }}
              >
                <p style={{ color: '#6B7280' }}>No achievements yet. Start earning XP!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'badges' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          {userStats.badges.map((badge) => {
            const achDef = Object.values(ACHIEVEMENTS || {}).find(
              (a) => a.id === badge.id || a.title === badge.title
            );
            const tooltipText = achDef
              ? `${achDef.description} (Earn +${achDef.xpReward} XP)`
              : 'Unlocked via system achievement milestone';

            return (
              <div
                key={badge.id}
                title={tooltipText}
                style={{
                  background: '#1A1A1A',
                  borderRadius: '16px',
                  padding: '20px',
                  textAlign: 'center',
                  border: `1px solid ${gamificationService.getTierColor(badge.tier)}`,
                  cursor: 'help',
                  position: 'relative',
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>{badge.icon}</div>
                <div style={{ fontWeight: 'bold', color: '#FFFFFF' }}>{badge.title}</div>
                <div
                  style={{
                    fontSize: '11px',
                    color: gamificationService.getTierColor(badge.tier),
                    marginTop: '4px',
                  }}
                >
                  {badge.tier.toUpperCase()}
                </div>
              </div>
            );
          })}
          {userStats.badges.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '40px',
                background: '#1A1A1A',
                borderRadius: '12px',
                gridColumn: '1/-1',
              }}
            >
              <p style={{ color: '#6B7280' }}>
                No badges yet. Complete achievements to earn badges!
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div style={{ background: '#1A1A1A', borderRadius: '16px', overflow: 'hidden' }}>
          {leaderboard.length === 0 ? (
            <p style={{ color: '#9CA3AF', padding: '24px 16px', margin: 0 }}>
              Leaderboard is empty or unavailable. Rankings will appear when live data is available.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#0F0F0F' }}>
                <tr>
                  <th style={{ padding: '12px 16px', color: '#9CA3AF', textAlign: 'left' }}>
                    Rank
                  </th>
                  <th style={{ padding: '12px 16px', color: '#9CA3AF', textAlign: 'left' }}>
                    User
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: '#9CA3AF' }}>
                    Streak
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', color: '#9CA3AF' }}>
                    Level
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', color: '#9CA3AF' }}>XP</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.some((u) => u.isSample) && (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ padding: '12px 16px', color: '#f59e0b', fontSize: '0.85rem' }}
                    >
                      Sample data — not live rankings.
                    </td>
                  </tr>
                )}
                {leaderboard.map((user) => (
                  <tr key={user.rank} style={{ borderTop: '1px solid #2A2A2A' }}>
                    <td style={{ padding: '12px 16px', color: '#FFFFFF', fontWeight: 'bold' }}>
                      #{user.rank}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>{user.avatar}</span>
                        <span style={{ color: '#FFFFFF' }}>{user.name}</span>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        color: '#F59E0B',
                        fontWeight: 'bold',
                      }}
                    >
                      {user.streak > 0 ? (
                        <span title={`${user.streak} day streak!`}>
                          {user.streak}{' '}
                          <DynamicIcon
                            name="Flame"
                            size={14}
                            style={{ display: 'inline', verticalAlign: 'middle' }}
                          />
                        </span>
                      ) : (
                        <span style={{ color: '#4B5563' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: '#FFFFFF' }}>
                      {user.level}
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        textAlign: 'right',
                        color: '#CC1111',
                        fontWeight: 'bold',
                      }}
                    >
                      {user.xp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'actions' && (
        <div>
          <h3 style={{ color: '#FFFFFF', marginBottom: '16px' }}>Earn XP by taking actions</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <button
              onClick={() => handleAction('EVENT_ATTENDANCE')}
              style={{
                background: '#1A1A1A',
                border: '1px solid #2A2A2A',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <span style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8 }}>
                <DynamicIcon name="Calendar" size={18} /> Attend an Event
              </span>
              <span style={{ color: '#10B981', fontWeight: 'bold' }}>+50 XP</span>
            </button>
            <button
              onClick={() => handleAction('COMMENT_POSTED')}
              style={{
                background: '#1A1A1A',
                border: '1px solid #2A2A2A',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <span style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8 }}>
                <DynamicIcon name="MessageCircle" size={18} /> Post a Comment
              </span>
              <span style={{ color: '#10B981', fontWeight: 'bold' }}>+5 XP</span>
            </button>
            <button
              onClick={() => handleAction('CONTENT_CREATION')}
              style={{
                background: '#1A1A1A',
                border: '1px solid #2A2A2A',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <span style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8 }}>
                <DynamicIcon name="FileText" size={18} /> Create Content
              </span>
              <span style={{ color: '#10B981', fontWeight: 'bold' }}>+30 XP</span>
            </button>
            <button
              onClick={() => handleAction('REFERRAL')}
              style={{
                background: '#1A1A1A',
                border: '1px solid #2A2A2A',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <span style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8 }}>
                <DynamicIcon name="Users" size={18} /> Refer a Friend
              </span>
              <span style={{ color: '#10B981', fontWeight: 'bold' }}>+100 XP</span>
            </button>
            <button
              onClick={() => handleAction('FEEDBACK_GIVEN')}
              style={{
                background: '#1A1A1A',
                border: '1px solid #2A2A2A',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <span style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8 }}>
                <DynamicIcon name="Clipboard" size={18} /> Give Feedback
              </span>
              <span style={{ color: '#10B981', fontWeight: 'bold' }}>+10 XP</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'quests' && (
        <div>
          <h3 style={{ color: '#FFFFFF', marginBottom: '16px' }}>Skill Verification Quests</h3>
          <p style={{ color: '#9CA3AF', marginBottom: '24px' }}>
            Prove your expertise by completing interactive quests. Earn a "Verified" badge for your
            profile and boost your visibility in the Skill Exchange!
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {['React', 'Node.js', 'Python', 'UI/UX Design', 'Cloud Computing'].map((skill) => {
              const isVerified = userStats.stats.verified_skills?.includes(skill);
              return (
                <div
                  key={skill}
                  style={{
                    background: '#1A1A1A',
                    border: isVerified ? '1px solid #10B981' : '1px solid #2A2A2A',
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFFFFF' }}>
                      {skill}
                    </div>
                    {isVerified ? (
                      <span style={{ color: '#10B981', fontSize: '20px' }}>✅</span>
                    ) : (
                      <span style={{ color: '#6B7280', fontSize: '20px' }}>🎯</span>
                    )}
                  </div>
                  <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0, flex: 1 }}>
                    {isVerified
                      ? 'You are a verified expert in this skill.'
                      : `Take the ${skill} quest to prove your skills and earn a badge.`}
                  </p>
                  <button
                    disabled={isVerified}
                    onClick={() => {
                      const res = gamificationService.verifySkill(skill);
                      if (res.success) {
                        loadData(); // refresh stats and badges
                      }
                    }}
                    style={{
                      background: isVerified ? '#064E3B' : '#CC1111',
                      color: isVerified ? '#10B981' : 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px',
                      fontWeight: 'bold',
                      cursor: isVerified ? 'default' : 'pointer',
                      marginTop: '8px',
                      transition: 'background 0.2s',
                    }}
                  >
                    {isVerified ? 'Verified Expert' : 'Take Verification Quest'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Floating Toasts System */}
      {toasts.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            pointerEvents: 'none',
          }}
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              style={{
                background: 'rgba(26, 26, 26, 0.95)',
                border: `1px solid ${
                  toast.type === 'achievement'
                    ? '#10B981'
                    : toast.type === 'level_up'
                      ? '#F59E0B'
                      : '#CC1111'
                }`,
                borderRadius: '16px',
                padding: '16px 24px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                maxWidth: '350px',
                backdropFilter: 'blur(8px)',
                pointerEvents: 'auto',
                animation: 'slideIn 0.3s ease-out forwards',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
              }}
            >
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    color: '#FFFFFF',
                    fontSize: '13.5px',
                    margin: 0,
                    fontWeight: 500,
                    lineHeight: 1.4,
                  }}
                >
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#9CA3AF',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '0 4px',
                  lineHeight: 1,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.target.style.color = '#FFFFFF')}
                onMouseLeave={(e) => (e.target.style.color = '#9CA3AF')}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Styled Animations */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateY(20px) scale(0.9);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
