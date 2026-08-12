import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../../../utils/apiClient.js';
import { getApiBase } from '../../../utils/runtimeConfig';
import 'heatmap.js';

export default function HeatmapView() {
  const [url, setUrl] = useState('/');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const heatmapInstance = useRef(null);

  const fetchHeatmap = async () => {
    setLoading(true);
    try {
      const base = getApiBase();
      const res = await apiClient(
        `${base}/api/admin/analytics/heatmap?url=${encodeURIComponent(url)}`,
        { credentials: 'include' }
      );
      setData(res);
      renderHeatmap(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderHeatmap = (points) => {
    // In a real implementation, you would load an iframe of `url`,
    // overlay a canvas, and map `element_selector` to coordinates.
    // For this prototype, we simulate rendering since heatmap.js requires x/y and we only have selectors.
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

    // Mock coordinates based on random layout for demonstration,
    // because real mapping requires DOM parsing of the target page.
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
        />
        <button className="btn btn-primary" onClick={fetchHeatmap}>
          Generate
        </button>
      </div>

      {loading && <p>Loading heatmap data...</p>}

      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '600px',
          background: 'var(--bg)',
          border: '1px solid rgba(255,255,255,0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.2,
          }}
        >
          {/* Mock Website Background */}
          <h2>Preview of {url}</h2>
        </div>
      </div>
    </div>
  );
}
