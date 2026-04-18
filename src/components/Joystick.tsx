
import React, { useRef, useState, useEffect } from 'react';

interface JoystickProps {
  onMove: (vector: { x: number; y: number }) => void;
  size?: number;
}

export const Joystick: React.FC<JoystickProps> = ({ onMove, size = 120 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const pointerId = useRef<number | null>(null);

  const handleStart = (e: React.PointerEvent) => {
    e.preventDefault();
    if (pointerId.current !== null) return;
    
    pointerId.current = e.pointerId;
    setIsDragging(true);
    
    if (containerRef.current) {
      containerRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handleMove = (e: React.PointerEvent) => {
    if (!isDragging || e.pointerId !== pointerId.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = e.clientX - centerX;
    let dy = e.clientY - centerY;

    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = rect.width / 2;

    if (distance > maxRadius) {
      dx = (dx / distance) * maxRadius;
      dy = (dy / distance) * maxRadius;
    }

    setPosition({ x: dx, y: dy });
    onMove({ x: dx / maxRadius, y: dy / maxRadius });
  };

  const handleEnd = (e: React.PointerEvent) => {
    if (e.pointerId !== pointerId.current) return;
    
    if (containerRef.current) {
      containerRef.current.releasePointerCapture(e.pointerId);
    }
    
    pointerId.current = null;
    setIsDragging(false);
    setPosition({ x: 0, y: 0 });
    onMove({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handleStart}
      onPointerMove={handleMove}
      onPointerUp={handleEnd}
      onPointerCancel={handleEnd}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        position: 'relative',
        touchAction: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: size * 0.4,
          height: size * 0.4,
          borderRadius: '50%',
          backgroundColor: 'rgba(16, 185, 129, 0.6)', // Emerald 500
          position: 'absolute',
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
        }}
      />
    </div>
  );
};
