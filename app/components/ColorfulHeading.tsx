'use client';

import { useRef, useState } from 'react';

const PALETTE = [
  '#f472b6', // pink-400
  '#a78bfa', // violet-400
  '#60a5fa', // blue-400
  '#34d399', // emerald-400
  '#fbbf24', // amber-400
  '#fb7185', // rose-400
  '#818cf8', // indigo-400
  '#fb923c', // orange-400
];

const BASE_COLOR = '#e2e8f0';

export default function ColorfulHeading({ text }: { text: string }) {
  const [hoveredSet, setHoveredSet] = useState<Set<number>>(new Set());
  const timeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const words = text.split(' ');
  let letterIndex = -1;

  function handleEnter(idx: number) {
    const existing = timeoutsRef.current.get(idx);
    if (existing) clearTimeout(existing);

    setHoveredSet((prev) => new Set(prev).add(idx));

    const timeout = setTimeout(() => {
      setHoveredSet((prev) => {
        const next = new Set(prev);
        next.delete(idx);
        return next;
      });
      timeoutsRef.current.delete(idx);
    }, 2000);
    timeoutsRef.current.set(idx, timeout);
  }

  return (
    <p
      className="select-none text-center font-semibold tracking-normal leading-tight text-[9vw] sm:text-5xl md:text-6xl lg:text-7xl"
      style={{ fontFamily: 'var(--font-quicksand)' }}
    >
      {words.map((word, wi) => (
        <span key={wi}>
          <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
            {word.split('').map((ch, ci) => {
              letterIndex++;
              const idx = letterIndex;
              const isHovered = hoveredSet.has(idx);
              return (
                <span
                  key={ci}
                  onMouseEnter={() => handleEnter(idx)}
                  style={{
                    display: 'inline-block',
                    color: isHovered ? PALETTE[idx % PALETTE.length] : BASE_COLOR,
                    transform: isHovered ? 'translateY(-0.12em) scale(1.15)' : 'translateY(0) scale(1)',
                    transitionProperty: 'color, transform',
                    transitionDuration: '250ms',
                    transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </span>
          {wi < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </p>
  );
}
