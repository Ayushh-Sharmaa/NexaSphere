import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QRScanner({ token }) {
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [eventId, setEventId] = useState('');

  useEffect(() => {
    // We only want the scanner active if an event is selected
    if (!eventId) return;

    let scanner;

    // We need to wait a tick for the DOM element to be available
    setTimeout(() => {
      scanner = new Html5QrcodeScanner('reader', {
        qrbox: { width: 250, height: 250 },
        fps: 5,
      });

      scanner.render(success, error);
    }, 100);

    function success(result) {
      if (!loading) {
        handleScan(result);
      }
    }

    function error(err) {
      // Ignore routine scan errors (e.g. no code in view)
    }

    return () => {
      if (scanner) {
        scanner.clear().catch((e) => console.error(e));
      }
    };
  }, [eventId]);

  const handleScan = async (scannedToken) => {
    try {
      setLoading(true);
      const base = (import.meta?.env?.VITE_API_BASE || '').replace(/\/+$/, '');
      const res = await fetch(`${base}/attendance/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ eventId, token: scannedToken }),
      });

      const data = await res.json();
      if (res.ok) {
        setScanResult({ type: 'success', data: data.data });
      } else {
        setScanResult({ type: 'error', message: data.message || 'Scan failed' });
      }
    } catch (err) {
      console.error(err);
      setScanResult({ type: 'error', message: 'An error occurred' });
    } finally {
      // Keep loading true for 2 seconds to prevent rapid multiple scans
      setTimeout(() => setLoading(false), 2000);
    }
  };

  const handleManualEntry = async (e) => {
    e.preventDefault();
    const form = e.target;
    const email = form.email.value;
    if (!email) return;

    try {
      setLoading(true);
      const base = (import.meta?.env?.VITE_API_BASE || '').replace(/\/+$/, '');
      const res = await fetch(`${base}/attendance/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ eventId, email }),
      });

      const data = await res.json();
      if (res.ok) {
        setScanResult({ type: 'success', data: data.data });
        form.reset();
      } else {
        setScanResult({ type: 'error', message: data.message || 'Manual entry failed' });
      }
    } catch (err) {
      console.error(err);
      setScanResult({ type: 'error', message: 'An error occurred' });
    } finally {
      setTimeout(() => setLoading(false), 2000);
    }
  };

  const exportAttendance = async () => {
    if (!eventId) return;
    const base = (import.meta?.env?.VITE_API_BASE || '').replace(/\/+$/, '');
    window.open(`${base}/attendance?eventId=${eventId}&export=csv`, '_blank');
  };

  return (
    <div
      style={{ padding: '2rem', background: '#1e293b', borderRadius: '16px', color: 'var(--t1)' }}
    >
      <h2>Activity Attendance Scanner</h2>

      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          Select Event to Mark Attendance For
        </label>
        <input
          className="input-field"
          placeholder="Enter Event ID"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
        />
      </div>

      {eventId && (
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '300px' }}>
            <h3>QR Code Scanner</h3>
            <div
              id="reader"
              style={{
                width: '100%',
                maxWidth: '400px',
                background: '#fff',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            ></div>
          </div>

          <div style={{ flex: '1', minWidth: '300px' }}>
            <h3>Fallback Manual Entry</h3>
            <form
              onSubmit={handleManualEntry}
              style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '1.5rem',
                borderRadius: '8px',
              }}
            >
              <input
                type="email"
                name="email"
                className="input-field"
                placeholder="Participant Email"
                style={{ width: '100%', marginBottom: '1rem' }}
              />
              <button className="btn btn-primary" type="submit" disabled={loading}>
                Mark Attendance
              </button>
            </form>

            {scanResult && (
              <div
                style={{
                  marginTop: '2rem',
                  padding: '1.5rem',
                  background:
                    scanResult.type === 'success'
                      ? 'rgba(16, 185, 129, 0.1)'
                      : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${scanResult.type === 'success' ? '#10b981' : '#ef4444'}`,
                  borderRadius: '8px',
                }}
              >
                <h4 style={{ color: scanResult.type === 'success' ? '#10b981' : '#ef4444' }}>
                  {scanResult.type === 'success' ? 'Attendance Marked!' : 'Error'}
                </h4>
                {scanResult.type === 'success' ? (
                  <div>
                    <p>
                      <strong>Name:</strong> {scanResult.data.full_name}
                    </p>
                    <p>
                      <strong>Email:</strong> {scanResult.data.email}
                    </p>
                    {scanResult.data.already_attended && (
                      <p style={{ color: '#f59e0b' }}>
                        Note: Participant had already marked attendance.
                      </p>
                    )}
                  </div>
                ) : (
                  <p>{scanResult.message}</p>
                )}
              </div>
            )}

            <div style={{ marginTop: '2rem' }}>
              <button className="btn" onClick={exportAttendance}>
                Export Attendance (CSV)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
