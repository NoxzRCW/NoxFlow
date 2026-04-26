import React, { useState } from 'react';
import { useCollabStore } from '../../stores/collabStore';

export const ParticipantsPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const participants = useCollabStore((state) => state.participants);
  const isConnected = useCollabStore((state) => state.isConnected);
  const myUserName = useCollabStore((state) => state.myUserName);
  const myColor = useCollabStore((state) => state.myColor);

  if (!isConnected && participants.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        zIndex: 10000,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'rgba(30, 30, 30, 0.9)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '8px 12px',
          color: '#fff',
          fontSize: '13px',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isConnected ? '#10b981' : '#ef4444',
            display: 'inline-block',
          }}
        />
        <span>
          {participants.length + 1} participant{participants.length + 1 !== 1 ? 's' : ''}
        </span>
        <span style={{ marginLeft: '4px', fontSize: '10px' }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            marginTop: '6px',
            backgroundColor: 'rgba(30, 30, 30, 0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '10px',
            minWidth: '180px',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          {/* You */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 0',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              marginBottom: '6px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: myColor || '#3b82f6',
              }}
            />
            <span style={{ fontSize: '13px', color: '#fff', fontWeight: 500 }}>
              {myUserName || 'You'} (you)
            </span>
          </div>

          {/* Others */}
          {participants.length === 0 && (
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', padding: '4px 0' }}>
              No other participants yet...
            </div>
          )}

          {participants.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 0',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: p.color || '#999',
                }}
              />
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>
                {p.name || 'Anonymous'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
