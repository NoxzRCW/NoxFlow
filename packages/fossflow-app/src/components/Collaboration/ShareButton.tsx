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

interface ShareButtonProps {
  roomId?: string;
  isCollabActive?: boolean;
  onActivate?: () => void;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ roomId, isCollabActive, onActivate }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(() => {
    if (!isCollabActive && onActivate) {
      onActivate();
    }

    const url = roomId
      ? `${window.location.origin}/?collab=${roomId}`
      : window.location.href;

    const doCopy = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
  );
};
