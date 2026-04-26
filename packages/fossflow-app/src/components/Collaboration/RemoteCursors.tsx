import React from 'react';
import { useCollabStore } from '../../stores/collabStore';

export const RemoteCursors: React.FC = () => {
  const cursors = useCollabStore((state) => state.cursors);

  if (cursors.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9998,
        overflow: 'hidden',
      }}
    >
      {cursors.map((cursor) => (
        <div
          key={cursor.id}
          style={{
            position: 'absolute',
            left: cursor.position.x,
            top: cursor.position.y,
            transform: 'translate(-2px, -2px)',
            transition: 'left 0.15s ease-out, top 0.15s ease-out',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        >
          {/* Cursor SVG */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
          >
            <path
              d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z"
              fill={cursor.color}
              stroke="white"
              strokeWidth="1"
            />
          </svg>
          {/* Name label */}
          <div
            style={{
              position: 'absolute',
              left: '14px',
              top: '14px',
              backgroundColor: cursor.color,
              color: '#fff',
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '4px',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {cursor.name}
          </div>
        </div>
      ))}
    </div>
  );
};
