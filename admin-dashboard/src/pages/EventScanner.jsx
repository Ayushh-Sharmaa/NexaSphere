import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { AdminIcon } from '../components/AdminIcon';
import { Skeleton } from '../components/Skeleton';
import { OfflineStatusIndicator } from '../components/OfflineStatusIndicator';
import { eventEmitter, EVENTS } from '../services/eventEmitter';

export function EventScanner() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [attendanceLog, setAttendanceLog] = useState([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);

  // Offline state
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [offlineAttendees, setOfflineAttendees] = useState([]);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Search state for offline mode
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  useEffect(() => {
    if (!eventsLoaded) {
      api.events
        .getAll()
        .then((data) => {
          if (data?.events) setEvents(data.events);
          setEventsLoaded(true);
        })
        .catch(() => setEventsLoaded(true));
    }
  }, [eventsLoaded]);

  useEffect(() => {
    if (selectedEventId) {
      loadOfflineState();
    } else {
      setOfflineAttendees([]);
      setPendingSyncCount(0);
    }
  }, [selectedEventId]);

  const loadOfflineState = useCallback(() => {
    if (!selectedEventId) return;
    const attendees = api.eventRegistrations.getOfflineList(selectedEventId);
    const pending = api.eventRegistrations.getPendingSync(selectedEventId);
    setOfflineAttendees(attendees);
    setPendingSyncCount(pending.length);
  }, [selectedEventId]);

  const downloadOfflineList = async () => {
    if (!selectedEventId) return;
    setIsDownloading(true);
    try {
      await api.eventRegistrations.downloadOfflineList(selectedEventId);
      loadOfflineState();
      eventEmitter.emit(EVENTS.NOTIFY, {
        type: 'success',
        message: 'Attendee list downloaded for offline use',
      });
    } catch (error) {
      eventEmitter.emit(EVENTS.NOTIFY, {
        type: 'error',
        message: 'Failed to download attendee list',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const syncPendingCheckins = async () => {
    if (!selectedEventId) return;
    setIsSyncing(true);
    try {
      const result = await api.eventRegistrations.syncPending(selectedEventId);
      loadOfflineState();
      if (result.success) {
        eventEmitter.emit(EVENTS.NOTIFY, {
          type: 'success',
          message: `Successfully synced ${result.count} check-ins`,
        });
      } else {
        eventEmitter.emit(EVENTS.NOTIFY, {
          type: 'error',
          message: `Synced ${result.count} but encountered ${result.errors.length} errors`,
        });
      }
    } catch (e) {
      eventEmitter.emit(EVENTS.NOTIFY, { type: 'error', message: 'Failed to sync check-ins' });
    } finally {
      setIsSyncing(false);
    }
  };

  const markAttendance = useCallback(
    async (payload) => {
      if (!selectedEventId) return;
      setScanning(true);
      setScanResult(null);
      try {
        let result;
        if (isOfflineMode) {
          result = api.eventRegistrations.markOfflineAttendance(selectedEventId, payload.email);
          loadOfflineState();
        } else {
          result = await api.eventRegistrations.markAttendance(selectedEventId, {
            ...payload,
            eventId: selectedEventId,
          });
        }

        setScanResult(result);
        if (!result.error && !result.already_attended) {
          setAttendanceLog((prev) => [result, ...prev]);
        }
      } catch (e) {
        setScanResult({ error: e.message });
      } finally {
        setScanning(false);
      }
    },
    [selectedEventId, isOfflineMode, loadOfflineState]
  );

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (isOfflineMode) {
      if (!manualEmail.trim() && !searchTerm.trim()) return;
      // If user typed email but didn't select, try to use search term
      markAttendance({ email: (manualEmail || searchTerm).trim().toLowerCase() });
    } else {
      if (!manualEmail.trim()) return;
      markAttendance({ email: manualEmail.trim().toLowerCase() });
    }
    setManualEmail('');
    setSearchTerm('');
    setShowSearchDropdown(false);
  };

  const filteredAttendees = useMemo(() => {
    if (!searchTerm.trim() || !offlineAttendees) return [];
    const term = searchTerm.toLowerCase();
    return offlineAttendees.filter(
      (a) =>
        a.email.toLowerCase().includes(term) ||
        (a.full_name && a.full_name.toLowerCase().includes(term))
    );
  }, [searchTerm, offlineAttendees]);

  return (
    <div className="page">
      <div
        className="page-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <h2 className="page-title">Event Scanner</h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--admin-text-muted)' }}>
            Offline Mode
          </label>
          <div
            className={`toggle-switch ${isOfflineMode ? 'active' : ''}`}
            onClick={() => setIsOfflineMode(!isOfflineMode)}
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              background: isOfflineMode ? 'var(--admin-accent)' : 'var(--admin-border)',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 2,
                left: isOfflineMode ? 22 : 2,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.2s',
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <select
          value={selectedEventId}
          onChange={(e) => {
            setSelectedEventId(e.target.value);
            setScanResult(null);
            setSearchTerm('');
          }}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid var(--admin-border, #333)',
            background: 'var(--admin-bg-card, #1a1a2e)',
            color: 'var(--admin-text, #eee)',
            width: 300,
          }}
        >
          <option value="">Select an event…</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name}
            </option>
          ))}
        </select>
      </div>

      {!selectedEventId && (
        <div className="empty-state">
          Select an event to start scanning QR codes or entering emails.
        </div>
      )}

      {selectedEventId && (
        <>
          <OfflineStatusIndicator
            isOffline={isOfflineMode}
            pendingCount={pendingSyncCount}
            onSync={syncPendingCheckins}
            isSyncing={isSyncing}
          />

          {!isOfflineMode && (
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
              <button
                onClick={downloadOfflineList}
                disabled={isDownloading}
                className="btn-secondary"
              >
                <AdminIcon name="Download" size={16} style={{ marginRight: 8 }} />
                {isDownloading ? 'Downloading...' : 'Download Attendee List for Offline Use'}
              </button>
              {offlineAttendees.length > 0 && (
                <span style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                  {offlineAttendees.length} attendees cached locally
                </span>
              )}
            </div>
          )}

          <div
            style={{
              background: 'var(--admin-bg-card, #1a1a2e)',
              border: '1px solid var(--admin-border, #333)',
              borderRadius: 12,
              padding: 24,
              marginBottom: 20,
              position: 'relative',
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 16, fontFamily: 'Rajdhani,sans-serif' }}>
              <AdminIcon name="Search" size={16} style={{ marginRight: 8 }} />
              Manual Entry {isOfflineMode && '(Offline Search)'}
            </h3>
            <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type={isOfflineMode ? 'text' : 'email'}
                  placeholder={
                    isOfflineMode ? 'Search attendee name or email…' : 'Enter attendee email…'
                  }
                  value={isOfflineMode ? searchTerm : manualEmail}
                  onChange={(e) => {
                    if (isOfflineMode) {
                      setSearchTerm(e.target.value);
                      setManualEmail('');
                      setShowSearchDropdown(true);
                    } else {
                      setManualEmail(e.target.value);
                    }
                  }}
                  required={!isOfflineMode}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border, #333)',
                    background: 'var(--admin-bg, #111)',
                    color: 'var(--admin-text, #eee)',
                  }}
                />

                {isOfflineMode && showSearchDropdown && filteredAttendees.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'var(--admin-bg-card, #1a1a2e)',
                      border: '1px solid var(--admin-border, #333)',
                      borderRadius: 8,
                      marginTop: 4,
                      maxHeight: 200,
                      overflowY: 'auto',
                      zIndex: 10,
                    }}
                  >
                    {filteredAttendees.map((a) => (
                      <div
                        key={a.email}
                        onClick={() => {
                          setSearchTerm(a.full_name || a.email);
                          setManualEmail(a.email);
                          setShowSearchDropdown(false);
                        }}
                        style={{
                          padding: '10px 14px',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--admin-border, #333)',
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                        className="hover-bg-accent"
                      >
                        <div>
                          <div style={{ fontWeight: 600 }}>{a.full_name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                            {a.email}
                          </div>
                        </div>
                        {a.attended && (
                          <span
                            className="status-badge"
                            style={{ background: '#22c55e', alignSelf: 'center' }}
                          >
                            Present
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={scanning || (isOfflineMode && !manualEmail && !searchTerm)}
                className="btn-primary"
              >
                {scanning ? 'Marking…' : 'Mark Present'}
              </button>
            </form>
          </div>

          {scanResult && (
            <div
              style={{
                background: scanResult.error ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                border: `1px solid ${scanResult.error ? '#ef4444' : '#22c55e'}40`,
                borderRadius: 12,
                padding: 16,
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <AdminIcon
                name={scanResult.error ? 'XCircle' : 'CheckCircle'}
                size={24}
                style={{ color: scanResult.error ? '#ef4444' : '#22c55e', flexShrink: 0 }}
              />
              <div>
                {scanResult.error ? (
                  <div style={{ color: '#ef4444', fontWeight: 600 }}>{scanResult.error}</div>
                ) : (
                  <>
                    <div style={{ fontWeight: 600, color: '#22c55e' }}>
                      {scanResult.already_attended
                        ? 'Already marked present'
                        : 'Attendance marked!'}
                    </div>
                    <div style={{ color: 'var(--admin-text-muted, #888)', fontSize: '0.85rem' }}>
                      {scanResult.full_name} — {scanResult.email}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {attendanceLog.length > 0 && (
            <div>
              <h3 style={{ marginBottom: 12, fontFamily: 'Rajdhani,sans-serif' }}>
                <AdminIcon name="Clock" size={16} style={{ marginRight: 8 }} />
                Recent Attendance
              </h3>
              <div className="list">
                {attendanceLog.map((entry, i) => (
                  <div key={i} className="list-item">
                    <div className="list-item-left">
                      <div>
                        <div className="item-name">{entry.full_name}</div>
                        <div className="item-meta">{entry.email}</div>
                      </div>
                    </div>
                    <div className="list-item-right">
                      <span className="status-badge" style={{ background: '#22c55e' }}>
                        Present
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
