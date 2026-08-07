import { useState, useEffect, useCallback, useRef } from 'react';
import { PLATFORMS, addUtmParams, getQRUrl, copyToClipboard } from '../../utils/shareUtils';
import useFocusTrap from '../../hooks/useFocusTrap';
import './ShareHub.css';

export default function ShareHub({ isOpen, onClose, data }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const copiedTimeoutRef = useRef(null);
  const modalRef = useFocusTrap(isOpen, onClose);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const shareUrl = isOpen && data ? addUtmParams(data.url || window.location.href, 'direct') : '';
  const shareTitle = data?.title || 'Check this out on NexaSphere!';

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(shareUrl);
    if (ok) {
      setCopied(true);
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } else {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 3000);
    }
  }, [shareUrl]);

  if (!isOpen || !data) return null;

  function handlePlatform(platform) {
    const url = platform.buildUrl({
      url: addUtmParams(shareUrl, platform.key),
      title: shareTitle,
    });
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=480');
  }

  function handleNativeShare() {
    if (navigator.share) {
      navigator.share({ title: shareTitle, url: shareUrl }).catch((err) => {
        if (err?.name !== 'AbortError' && navigator.clipboard) {
          navigator.clipboard
            .writeText(shareUrl)
            .then(() => {
              setCopied(true);
              if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
              copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
            })
            .catch(() => {
              setCopyError(true);
              setTimeout(() => setCopyError(false), 3000);
            });
        }
      });
    }
  }

  return (
    <div
      className="sharehub-overlay"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div
        ref={modalRef}
        className="sharehub-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sharehub-heading"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sharehub-header">
          <h2 id="sharehub-heading" className="sharehub-heading">
            Share
          </h2>
          <button className="sharehub-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="sharehub-preview">
          {data.image && (
            <img
              src={data.image}
              alt={`Preview image for ${data.title}`}
              className="sharehub-preview-img"
            />
          )}
          <div>
            <p className="sharehub-preview-title">{data.title}</p>
            {data.subtitle && <p className="sharehub-preview-sub">{data.subtitle}</p>}
          </div>
        </div>

        <div className="sharehub-platforms">
          {PLATFORMS.map((platform) => (
            <button
              key={platform.key}
              className="sharehub-platform-btn"
              style={{ '--platform-color': platform.color }}
              onClick={() => handlePlatform(platform)}
              aria-label={`Share on ${platform.name}`}
            >
              {platform.name}
            </button>
          ))}
          {typeof navigator !== 'undefined' && navigator.share && (
            <button
              className="sharehub-platform-btn sharehub-native"
              onClick={handleNativeShare}
              aria-label="Share via device"
            >
              More options
            </button>
          )}
        </div>

        <div className="sharehub-copy-row">
          <input
            className="sharehub-copy-input"
            value={shareUrl}
            readOnly
            aria-label="Shareable link"
          />
          <button className={`sharehub-copy-btn ${copyError ? 'error' : ''}`} onClick={handleCopy}>
            {copied ? 'Copied!' : copyError ? 'Failed' : 'Copy'}
          </button>
        </div>
        {copyError && (
          <p
            style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', textAlign: 'center' }}
          >
            Clipboard access denied. Please manually copy the link above.
          </p>
        )}

        <button
          className="sharehub-qr-toggle"
          onClick={() => setShowQR((v) => !v)}
          aria-expanded={showQR}
        >
          {showQR ? 'Hide QR Code' : 'Show QR Code'}
        </button>

        {showQR && (
          <div className="sharehub-qr">
            <img
              loading="lazy"
              src={getQRUrl(shareUrl)}
              alt="QR code for this link"
              width={200}
              height={200}
            />
            <p className="sharehub-qr-hint">Scan to open on any device</p>
          </div>
        )}
      </div>
    </div>
  );
}
