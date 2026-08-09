import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [focusIdx, setFocusIdx] = useState(-1);
  const ref = useRef(null);

  const current =
    LANGUAGES.find((l) => l.code === i18n.language) ||
    LANGUAGES.find((l) => i18n.language?.startsWith(l.code)) ||
    LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (code) => {
      i18n.changeLanguage(code);
      setOpen(false);
      setFocusIdx(-1);
    },
    [i18n]
  );

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
        setFocusIdx(LANGUAGES.findIndex((l) => l.code === current.code));
      }
      return;
    }
    switch (e.key) {
      case 'Escape':
        setOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusIdx((prev) => (prev < LANGUAGES.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusIdx((prev) => (prev > 0 ? prev - 1 : LANGUAGES.length - 1));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusIdx >= 0 && focusIdx < LANGUAGES.length) {
          handleSelect(LANGUAGES[focusIdx].code);
        }
        break;
      default:
        break;
    }
  };

  const activeId = focusIdx >= 0 ? `lang-option-${LANGUAGES[focusIdx].code}` : undefined;

  return (
    <div
      ref={ref}
      style={{ position: 'relative', display: 'inline-block' }}
      role="combobox"
      aria-expanded={open}
      aria-controls={open ? 'language-listbox' : undefined}
      aria-haspopup="listbox"
      aria-activedescendant={activeId}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !open) {
            e.preventDefault();
            setOpen(true);
            // We need to wait for the DOM to update to focus the first li
            setTimeout(() => {
              ref.current?.querySelector('li')?.focus();
            }, 0);
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select language"
        tabIndex={-1}
        style={{
          background: 'transparent',
          border: '1px solid var(--bdr, #333)',
          borderRadius: '8px',
          padding: '4px 10px',
          cursor: 'pointer',
          color: 'var(--text-primary, #fff)',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'background 0.2s',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'var(--bdr, #333)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <span>{current.flag}</span>
        <span>{current.code.toUpperCase()}</span>
        <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>▼</span>
      </button>

      {open && (
        <ul
          id="language-listbox"
          role="listbox"
          aria-label="Language options"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            background: 'var(--bg-secondary, #1a1a2e)',
            border: '1px solid var(--bdr, #333)',
            borderRadius: '10px',
            padding: '4px',
            margin: 0,
            listStyle: 'none',
            minWidth: '160px',
            zIndex: 9999,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          {LANGUAGES.map((lang, idx) => {
            const isSelected = lang.code === current.code;
            const isActive = focusIdx === idx;
            return (
              <li
                id={`lang-option-${lang.code}`}
                key={lang.code}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(lang.code)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderRadius: '7px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.875rem',
                  color: isSelected ? '#E63946' : 'var(--text-primary, #fff)',
                  background: isActive
                    ? 'rgba(255,255,255,0.08)'
                    : isSelected
                      ? 'rgba(230,57,70,0.1)'
                      : 'transparent',
                  fontWeight: isSelected ? 600 : 400,
                  transition: 'background 0.15s',
                }}
                onMouseOver={() => setFocusIdx(idx)}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </li>
            );
          })}
          {LANGUAGES.map((lang, idx) => (
            <li
              key={lang.code}
              role="option"
              aria-selected={lang.code === current.code}
              tabIndex={0}
              onClick={() => handleSelect(lang.code)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect(lang.code);
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  const next = e.currentTarget.nextElementSibling;
                  if (next) next.focus();
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  const prev = e.currentTarget.previousElementSibling;
                  if (prev) prev.focus();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  setOpen(false);
                  ref.current?.querySelector('button')?.focus();
                }
              }}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                borderRadius: '7px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.875rem',
                color: lang.code === current.code ? '#E63946' : 'var(--text-primary, #fff)',
                background: lang.code === current.code ? 'rgba(230,57,70,0.1)' : 'transparent',
                fontWeight: lang.code === current.code ? 600 : 400,
                transition: 'background 0.15s',
                outline: 'none',
              }}
              onFocus={(e) => {
                if (lang.code !== current.code)
                  e.currentTarget.style.background = 'var(--bdr, #333)';
              }}
              onBlur={(e) => {
                if (lang.code !== current.code) e.currentTarget.style.background = 'transparent';
              }}
              onMouseOver={(e) => {
                if (lang.code !== current.code)
                  e.currentTarget.style.background = 'var(--bdr, #333)';
              }}
              onMouseOut={(e) => {
                if (lang.code !== current.code) e.currentTarget.style.background = 'transparent';
              }}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
