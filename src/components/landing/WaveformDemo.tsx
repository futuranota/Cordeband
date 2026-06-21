'use client';

import { useEffect, useRef } from 'react';

type WaveformDemoProps = {
  playing?: boolean;
  progress?: number;
};

const BAR_COUNT = 72;

function seededHeights(seed: number): number[] {
  const heights: number[] = [];
  let s = seed;
  for (let i = 0; i < BAR_COUNT; i++) {
    s = (s * 9301 + 49297) % 233280;
    heights.push(0.18 + (s / 233280) * 0.72);
  }
  return heights;
}

const HEIGHTS = seededHeights(42);

export function WaveformDemo({ playing = false, progress = 0 }: WaveformDemoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = (phase: number) => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, w, h);
      const gap = w / BAR_COUNT;
      const barW = Math.max(1.5, gap * 0.42);
      const playedX = progress * w;

      for (let i = 0; i < BAR_COUNT; i++) {
        const x = i * gap + (gap - barW) / 2;
        const pulse = playing ? 0.08 * Math.sin(phase + i * 0.35) : 0;
        const norm = Math.min(1, HEIGHTS[i] + pulse);
        const barH = norm * h * 0.88;
        const y = (h - barH) / 2;
        ctx.fillStyle = x + barW <= playedX ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.28)';
        ctx.fillRect(x, y, barW, barH);
      }

      if (progress > 0 && progress < 1) {
        ctx.fillStyle = 'rgba(79,184,255,0.95)';
        ctx.fillRect(playedX - 1, 0, 2, h);
      }
    };

    const tick = () => {
      if (playing) phaseRef.current += 0.12;
      draw(phaseRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };

    draw(phaseRef.current);
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, progress]);

  return (
    <div className="stem-demo-wave" aria-hidden="true">
      <canvas ref={canvasRef} className="stem-demo-wave-canvas" />
    </div>
  );
}
