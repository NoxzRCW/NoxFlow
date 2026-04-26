import React, { useState, useCallback } from 'react';

export const ShareButton: React.FC<{ roomId?: string }> = ({ roomId }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(() => {
    const url = roomId
      ? `${window.location.origin}/?collab=${roomId}`
      : window.location.href;

    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [roomId]);

  return (
    <button
      onClick={handleShare}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
        color: copied ? '#34d399' : '#60a5fa',
        border: `1px solid ${copied ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
        borderRadius: '6px',
        padding: '6px 12px',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        transition: 'all 0.2s',
      }}
      title="Copy collaboration link"
    >
      <span>{copied ? '✅' : '🔗'}</span>
      <span>{copied ? 'Link copied!' : 'Share'}</span>
    </button>
  );
};
