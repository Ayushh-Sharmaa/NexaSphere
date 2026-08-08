import React, { useEffect, useMemo, useState } from 'react';
import * as Y from 'yjs';
import WhiteboardCollabCanvas from './WhiteboardCollabCanvas';
import { createYjsDoc, createYjsProvider } from './yjsWhiteboardProvider';
import { whiteboardTemplates } from './whiteboardTemplates';

const STORAGE_KEY_PREFIX = 'ns_whiteboard_event:';

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function WhiteboardEventSection({ eventId, width = 1100, height = 680 }) {
  const storageKey = useMemo(() => `${STORAGE_KEY_PREFIX}${eventId}`, [eventId]);

  const doc = useMemo(() => createYjsDoc(), [eventId]);

  const [provider, setProvider] = useState(null);
  const [presenceUsers, setPresenceUsers] = useState([]);

  // Minimal user identity for presence.
  const user = useMemo(() => {
    const initials = (Math.random().toString(36).slice(2, 4).toUpperCase() || 'U').slice(0, 2);
    return {
      id: String(doc.clientID),
      name: `User ${initials}`,
      initials,
      color: '#00d4ff',
    };
  }, [doc]);

  const roomName = `whiteboard:${eventId}`;

  useEffect(() => {
    const p = createYjsProvider({
      roomName,
      doc,
      user,
      onAwarenessChange: (users) => setPresenceUsers(users),
    });
    setProvider(p);
    return () => p.destroy();
  }, [doc, roomName, user]);

  // Optional: migrate old localStorage board into CRDT on first join.
  useEffect(() => {
    if (!provider) return;

    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    const parsed = safeParse(raw);
    if (!Array.isArray(parsed)) return;

    // Seed only if doc is empty.
    const yElements = doc.getArray('elements');
    if (yElements.length > 0) return;

    doc.transact(() => {
      yElements.push(parsed);
      doc.getMap('state').set('seeded', true);
    });
  }, [provider, storageKey, doc]);

  // Autosave every 30 seconds (for offline/local restore)

  useEffect(() => {
    if (!provider) return;
    const t = setInterval(() => {
      try {
        const yElements = doc.getArray('elements');
        localStorage.setItem(storageKey, JSON.stringify(yElements.toArray()));
      } catch {
        // ignore
      }
    }, 30_000);
    return () => clearInterval(t);
  }, [provider, storageKey, doc]);

  const [templateKey, setTemplateKey] = useState('');
  const initialElements = useMemo(() => {
    if (!templateKey) return null;
    const tpl = whiteboardTemplates[templateKey];
    return tpl?.elements || null;
  }, [templateKey]);

  const exportPNG = () => {
    const canvas = document.querySelector('#ns-whiteboard-canvas');
    if (!canvas) {
      alert('Export failed: canvas not found');
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `whiteboard-${eventId}.png`;
    a.click();
  };

  const exportSVG = () => {
    const yElements = doc.getArray('elements').toArray();
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 680" width="1100" height="680" style="background:#ffffff;">`;

    for (const el of yElements) {
      const opacity = el.opacity ?? 1;
      const strokeWidth = el.strokeWidth ?? 2;
      const color = el.color || '#000000';

      if (el.type === 'rect') {
        const fill = el.fill && el.fill !== 'transparent' ? el.fill : 'none';
        svgContent += `\n  <rect x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" stroke="${color}" stroke-width="${strokeWidth}" fill="${fill}" opacity="${opacity}" />`;
      } else if (el.type === 'circle') {
        const cx = el.x + el.w / 2;
        const cy = el.y + el.h / 2;
        const r = Math.min(Math.abs(el.w), Math.abs(el.h)) / 2;
        const fill = el.fill && el.fill !== 'transparent' ? el.fill : 'none';
        svgContent += `\n  <circle cx="${cx}" cy="${cy}" r="${r}" stroke="${color}" stroke-width="${strokeWidth}" fill="${fill}" opacity="${opacity}" />`;
      } else if (el.type === 'triangle') {
        const p1 = `${el.x + el.w / 2},${el.y}`;
        const p2 = `${el.x + el.w},${el.y + el.h}`;
        const p3 = `${el.x},${el.y + el.h}`;
        const fill = el.fill && el.fill !== 'transparent' ? el.fill : 'none';
        svgContent += `\n  <polygon points="${p1} ${p2} ${p3}" stroke="${color}" stroke-width="${strokeWidth}" fill="${fill}" opacity="${opacity}" />`;
      } else if (el.type === 'line') {
        svgContent += `\n  <line x1="${el.x}" y1="${el.y}" x2="${el.x + el.w}" y2="${el.y + el.h}" stroke="${color}" stroke-width="${strokeWidth}" opacity="${opacity}" />`;
      } else if (el.type === 'arrow') {
        const fromX = el.x;
        const fromY = el.y;
        const toX = el.x + el.w;
        const toY = el.y + el.h;
        const angle = Math.atan2(toY - fromY, toX - fromX);
        const headLength = 12;
        const h1X = toX - headLength * Math.cos(angle - Math.PI / 6);
        const h1Y = toY - headLength * Math.sin(angle - Math.PI / 6);
        const h2X = toX - headLength * Math.cos(angle + Math.PI / 6);
        const h2Y = toY - headLength * Math.sin(angle + Math.PI / 6);

        svgContent += `\n  <g opacity="${opacity}">`;
        svgContent += `\n    <line x1="${fromX}" y1="${fromY}" x2="${toX}" y2="${toY}" stroke="${color}" stroke-width="${strokeWidth}" />`;
        svgContent += `\n    <polygon points="${toX},${toY} ${h1X},${h1Y} ${h2X},${h2Y}" fill="${color}" />`;
        svgContent += `\n  </g>`;
      } else if (el.type === 'text') {
        const boldStyle = el.bold ? 'font-weight="bold"' : '';
        const style = el.fontStyle === 'italic' ? 'font-style="italic"' : '';
        const fontSize = el.fontSize || 16;
        const fontFamily = el.fontFamily || 'sans-serif';
        const safeText = String(el.text || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
        svgContent += `\n  <text x="${el.x}" y="${el.y}" fill="${color}" font-size="${fontSize}" font-family="${fontFamily}" ${boldStyle} ${style} opacity="${opacity}">${safeText}</text>`;
      } else if (el.type === 'sticky') {
        const fill = el.fill || color || '#fbbf24';
        const textLines = String(el.text || '').split('\n');
        let tspanText = '';
        let currentY = el.y + 18;
        textLines.slice(0, 6).forEach((line) => {
          const safeLine = line
            .slice(0, 30)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
          tspanText += `<tspan x="${el.x + 12}" y="${currentY}">${safeLine}</tspan>`;
          currentY += 18;
        });

        svgContent += `\n  <g opacity="${opacity}">`;
        svgContent += `\n    <rect x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" rx="10" ry="10" fill="${fill}" stroke="rgba(0,0,0,0.15)" stroke-width="1" />`;
        svgContent += `\n    <text font-size="${el.fontSize || 14}" font-family="sans-serif" font-weight="600" fill="rgba(0,0,0,0.75)">${tspanText}</text>`;
        svgContent += `\n  </g>`;
      } else if (el.type === 'stroke') {
        if (el.points && el.points.length > 0) {
          const pathD = el.points.reduce((acc, p, i) => {
            if (i === 0) return `M ${p.x} ${p.y}`;
            return `${acc} L ${p.x} ${p.y}`;
          }, '');
          const strokeColor = el.isEraser ? '#ffffff' : color;
          svgContent += `\n  <path d="${pathD}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}" />`;
        }
      }
    }

    svgContent += '\n</svg>';

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `whiteboard-${eventId}.svg`;
    a.click();
  };

  const exportPDF = async () => {
    try {
      const yElements = doc.getArray('elements').toArray();
      const response = await fetch('/api/whiteboard/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          elements: yElements,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `whiteboard-${eventId}.pdf`;
      a.click();
    } catch (err) {
      alert(`Export PDF failed: ${err.message}`);
    }
  };

  return (
    <div style={{ marginTop: 26 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 12,
        }}
      >
        <div>
          <div style={{ fontFamily: "'Orbitron', monospace", fontWeight: 900, fontSize: 18 }}>
            Event Whiteboard
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
            Live collaboration • Presence: {presenceUsers.length}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select
            value={templateKey}
            onChange={(e) => setTemplateKey(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 12,
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)',
              cursor: 'pointer',
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            <option value="">Templates</option>
            <option value="kanban">Kanban</option>
            <option value="mindmap">Mindmap</option>
            <option value="flowchart">Flowchart</option>
            <option value="swot">SWOT</option>
            <option value="leanCanvas">Lean Canvas</option>
          </select>

          <select
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'png') exportPNG();
              else if (val === 'svg') exportSVG();
              else if (val === 'pdf') exportPDF();
              e.target.value = '';
            }}
            style={{
              padding: '8px 12px',
              borderRadius: 12,
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)',
              cursor: 'pointer',
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            <option value="">Export Board</option>
            <option value="png">PNG Image</option>
            <option value="svg">SVG Vector</option>
            <option value="pdf">PDF Document</option>
          </select>
        </div>
      </div>

      <div style={{ width: '100%' }}>
        <WhiteboardCollabCanvas
          width={width}
          height={height}
          doc={doc}
          providerAwareness={provider?.awareness}
          user={user}
          initialElements={initialElements}
        />
      </div>
    </div>
  );
}
