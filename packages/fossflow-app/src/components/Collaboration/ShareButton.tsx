import React, { useState, useCallback } from 'react';

function fallbackCopyText(text: string) {
  const el = document.createElement('textarea');
  el.value = text;
  el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
  document.body.appendChild(el);
  el.focus();
  el.select();
  try { document.execCommand('copy'); } catch (_) {}
  document.body.removeChild(el);
}

function isLocalhost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

interface ShareButtonProps {
  roomId?: string;
  isCollabActive?: boolean;
  onActivate?: () => void;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ roomId, isCollabActive, onActivate }) => {
  const [copied, setCopied] = useState(false);
  const [showLocalhostWarning, setShowLocalhostWarning] = useState(false);

  const handleShare = useCallback(() => {
    if (!isCollabActive && onActivate) {
      onActivate();
    }

    const hostname = window.location.hostname;
    const usingLocalhost = isLocalhost(hostname);

    const url = roomId
      ? `${window.location.origin}/?collab=${roomId}`
      : window.location.href;

    const doCopy = () => {
      setCopied(true);
      if (usingLocalhost) setShowLocalhostWarning(true);
      setTimeout(() => {
        setCopied(false);
        setShowLocalhostWarning(false);
      }, 5000);
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(doCopy).catch(() => {
        fallbackCopyText(url);
        doCopy();
      });
    } else {
      fallbackCopyText(url);
      doCopy();
    }
  }, [roomId, isCollabActive, onActivate]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={handleShare}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: copied
            ? 'rgba(16, 185, 129, 0.2)'
            : isCollabActive
              ? 'rgba(168, 85, 247, 0.2)'
              : 'rgba(59, 130, 246, 0.2)',
          color: copied ? '#34d399' : isCollabActive ? '#c084fc' : '#60a5fa',
          border: `1px solid ${
            copied
              ? 'rgba(16, 185, 129, 0.3)'
              : isCollabActive
                ? 'rgba(168, 85, 247, 0.3)'
                : 'rgba(59, 130, 246, 0.3)'
          }`,
          borderRadius: '6px',
          padding: '6px 12px',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          transition: 'all 0.2s',
        }}
        title={isCollabActive ? 'Copy collaboration link (collab active)' : 'Start collaboration & copy link'}
      >
        <span>{copied ? '✅' : isCollabActive ? '👥' : '🔗'}</span>
        <span>{copied ? 'Link copied!' : isCollabActive ? 'Collab active' : 'Share'}</span>
      </button>
      {showLocalhostWarning && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          zIndex: 1000,
          backgroundColor: '#1e1e2e',
          border: '1px solid rgba(251, 191, 36, 0.4)',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.85)',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          lineHeight: 1.5,
        }}>
          <strong style={{ color: '#fbbf24' }}>⚠️ localhost detected</strong><br />
          Replace <code style={{ color: '#f87171' }}>localhost</code> with your PC&apos;s local IP<br />
          (e.g. <code style={{ color: '#34d399' }}>192.168.x.x</code>) for other devices.
        </div>
      )}
    </div>
  );
};
