import React, { useState, useEffect, useRef } from 'react';

export default function CertificateTemplateEditor({ token }) {
  const [templates, setTemplates] = useState([]);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef(null);
  const [draggingElement, setDraggingElement] = useState(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const base = (import.meta?.env?.VITE_API_BASE || '').replace(/\/+$/, '');
      const res = await fetch(`${base}/admin/certificates/templates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.data.templates) {
        setTemplates(data.data.templates);
        if (data.data.templates.length > 0) setActiveTemplate(data.data.templates[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [token]);

  const drawPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas || !activeTemplate) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw elements
    const elements =
      typeof activeTemplate.elements === 'string'
        ? JSON.parse(activeTemplate.elements)
        : activeTemplate.elements;

    elements.forEach((el) => {
      if (el.type === 'text') {
        ctx.font = `${el.fontSize}px ${el.font || 'Arial'}`;
        ctx.fillStyle = el.color || '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Mock sample values
        let displayValue = el.value;
        if (displayValue === '{participant_name}') displayValue = 'John Doe';
        if (displayValue === '{course_name}') displayValue = 'Advanced React';
        if (displayValue === '{date}') displayValue = new Date().toLocaleDateString();

        ctx.fillText(displayValue, el.x, el.y);

        // Draw dashed border if it's the element being dragged
        if (draggingElement && draggingElement.id === el.id) {
          ctx.strokeStyle = '#3b82f6';
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(el.x - 100, el.y - 20, 200, 40);
          ctx.setLineDash([]);
        }
      }
    });
  };

  useEffect(() => {
    drawPreview();
  }, [activeTemplate, draggingElement]);

  const handleMouseDown = (e) => {
    if (!activeTemplate) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    const elements =
      typeof activeTemplate.elements === 'string'
        ? JSON.parse(activeTemplate.elements)
        : activeTemplate.elements;

    // Find if we clicked on an element (simple bounding box around text center)
    const clicked = elements.find((el) => {
      return x > el.x - 100 && x < el.x + 100 && y > el.y - 20 && y < el.y + 20;
    });

    if (clicked) {
      setDraggingElement(clicked);
    }
  };

  const handleMouseMove = (e) => {
    if (!draggingElement || !activeTemplate) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    const elements =
      typeof activeTemplate.elements === 'string'
        ? JSON.parse(activeTemplate.elements)
        : activeTemplate.elements;

    const updatedElements = elements.map((el) =>
      el.id === draggingElement.id ? { ...el, x, y } : el
    );

    setActiveTemplate({ ...activeTemplate, elements: updatedElements });
    setDraggingElement({ ...draggingElement, x, y });
  };

  const handleMouseUp = () => {
    setDraggingElement(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const base = (import.meta?.env?.VITE_API_BASE || '').replace(/\/+$/, '');
      const payload = { ...activeTemplate };
      if (typeof payload.elements !== 'string') {
        payload.elements = JSON.stringify(payload.elements);
      }

      const res = await fetch(`${base}/admin/certificates/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert('Template saved successfully!');
        fetchTemplates();
      } else {
        alert('Failed to save template');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving template');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading Template Editor...</div>;

  return (
    <div
      style={{ padding: '2rem', background: '#1e293b', borderRadius: '16px', color: 'var(--t1)' }}
    >
      <h2>Certificate Template Editor</h2>
      <p style={{ color: 'var(--t2)', marginBottom: '1.5rem' }}>
        Drag and drop text fields to customize your certificate layout.
      </p>

      {activeTemplate && (
        <div style={{ display: 'flex', gap: '2rem' }}>
          <div
            style={{
              flex: '1',
              background: 'rgba(0,0,0,0.2)',
              padding: '1rem',
              borderRadius: '8px',
            }}
          >
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              style={{
                width: '100%',
                border: '1px solid #334155',
                borderRadius: '4px',
                cursor: draggingElement ? 'grabbing' : 'grab',
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>

          <div
            style={{
              width: '300px',
              background: 'rgba(255,255,255,0.05)',
              padding: '1.5rem',
              borderRadius: '8px',
            }}
          >
            <h3>Template Properties</h3>
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                Template Name
              </label>
              <input
                className="input-field"
                value={activeTemplate.name}
                onChange={(e) => setActiveTemplate({ ...activeTemplate, name: e.target.value })}
              />
            </div>

            <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Elements</h4>
            {(typeof activeTemplate.elements === 'string'
              ? JSON.parse(activeTemplate.elements)
              : activeTemplate.elements
            ).map((el) => (
              <div
                key={el.id}
                style={{
                  marginBottom: '1rem',
                  padding: '0.5rem',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '4px',
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {el.id}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem' }}>Size</label>
                    <input
                      type="number"
                      className="input-field"
                      style={{ padding: '0.2rem' }}
                      value={el.fontSize}
                      onChange={(e) => {
                        const els =
                          typeof activeTemplate.elements === 'string'
                            ? JSON.parse(activeTemplate.elements)
                            : activeTemplate.elements;
                        const newEls = els.map((e) =>
                          e.id === el.id ? { ...e, fontSize: parseInt(e.target.value, 10) } : e
                        );
                        setActiveTemplate({ ...activeTemplate, elements: newEls });
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem' }}>Color</label>
                    <input
                      type="color"
                      value={el.color}
                      onChange={(e) => {
                        const els =
                          typeof activeTemplate.elements === 'string'
                            ? JSON.parse(activeTemplate.elements)
                            : activeTemplate.elements;
                        const newEls = els.map((e) =>
                          e.id === el.id ? { ...e, color: e.target.value } : e
                        );
                        setActiveTemplate({ ...activeTemplate, elements: newEls });
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem' }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
