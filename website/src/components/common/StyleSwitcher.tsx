import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { DesignStyle, DESIGN_STYLES } from '../../context/theme/ThemeProvider';
import { useTranslation } from 'react-i18next';

export const StyleSwitcher: React.FC = () => {
  const { designStyle, setDesignStyle } = useTheme();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handle keyboard navigation (escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const activeStyleInfo = DESIGN_STYLES.find((s) => s.value === designStyle) || DESIGN_STYLES[0];

  return (
    <div className="style-switcher-wrapper" style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="ns-nav-menu-toggle style-switcher-btn"
        aria-label="Design Style Switcher"
        aria-expanded={isOpen}
        style={{
          width: 'auto',
          padding: '0 12px',
          display: 'flex',
          flexDirection: 'row',
          gap: '8px',
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 600,
          fontSize: '0.9rem',
          letterSpacing: '0.05em',
        }}
      >
        <span style={{ transform: 'none', opacity: 1, width: 'auto', height: 'auto' }}>
          {activeStyleInfo.emoji}{' '}
          <span className="style-label-desktop" style={{ marginLeft: '4px' }}>
            {activeStyleInfo.label}
          </span>
        </span>
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          className="style-switcher-panel material-glass"
          style={{
            position: 'absolute',
            top: 'calc(100% + 12px)',
            right: 0,
            width: '320px',
            maxHeight: '60vh',
            overflowY: 'auto',
            padding: '16px',
            borderRadius: 'var(--r3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 13000,
            boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          }}
        >
          <div
            style={{
              marginBottom: '8px',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--bdr)',
            }}
          >
            <h4
              style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: '0.85rem',
                color: 'var(--t2)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Select Design Language
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {DESIGN_STYLES.map((styleOption) => {
              const isActive = styleOption.value === designStyle;
              return (
                <button
                  key={styleOption.value}
                  onClick={() => {
                    setDesignStyle(styleOption.value);
                    setIsOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: '8px',
                    padding: '8px 12px',
                    background: isActive ? 'var(--c1a)' : 'transparent',
                    border: `1px solid ${isActive ? 'var(--c1)' : 'var(--bdr2)'}`,
                    borderRadius: 'var(--r1)',
                    color: isActive ? 'var(--t1)' : 'var(--t2)',
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'var(--c1b)';
                      e.currentTarget.style.color = 'var(--t1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'var(--bdr2)';
                      e.currentTarget.style.color = 'var(--t2)';
                    }
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{styleOption.emoji}</span>
                  <span
                    style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {styleOption.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StyleSwitcher;
