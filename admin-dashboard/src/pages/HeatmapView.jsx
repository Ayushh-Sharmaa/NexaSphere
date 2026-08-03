import React, { useState, useEffect, useRef } from 'react';
import 'heatmap.js';

export function HeatmapView() {
  const [url, setUrl] = useState('/');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const heatmapInstance = useRef(null);

  const fetchHeatmap = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/admin/analytics/heatmap?url=${encodeURIComponent(url)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error('Failed to fetch heatmap data');
      const points = await res.json();
      setData(points);
      renderHeatmap(points);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderHeatmap = (points) => {
    if (!window.h337) return;

    if (!heatmapInstance.current && containerRef.current) {
      heatmapInstance.current = window.h337.create({
        container: containerRef.current,
        radius: 40,
        maxOpacity: 0.5,
        minOpacity: 0,
        blur: 0.75,
      });
    }

    // Mock coordinates based on random layout for demonstration
    const mockPoints = points.map((p) => ({
      x: Math.floor(Math.random() * 800),
      y: Math.floor(Math.random() * 600),
      value: parseInt(p.clicks, 10) * 10,
    }));

    if (heatmapInstance.current) {
      heatmapInstance.current.setData({
        max: Math.max(...mockPoints.map((p) => p.value), 100),
        data: mockPoints,
      });
    }
  };

  useEffect(() => {
    fetchHeatmap();
  }, []);

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Path to analyze (e.g. /)"
          className="input-field"
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            color: '#000',
            background: '#fff',
          }}
        />
        <button
          onClick={fetchHeatmap}
          style={{
            background: '#6366f1',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
          }}
        >
          Generate
        </button>
      </div>

      {loading && <p className="text-gray-500">Loading heatmap data...</p>}

      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '600px',
          background: '#fff',
          border: '1px solid #ccc',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ccc',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          [ Heatmap Overlay Container - {url} ]
        </div>
      </div>
    </div>
  );
}
