'use client';

import { useEffect, useRef } from 'react';

const GLYPHS = ['♪', '♩', '♫', '♬', '𝄞', '♭'];
const N = 28;

type Particle = {
  x: number; y: number;
  vx: number; vy: number;
  g: string;
  size: number;
  opacity: number;
  rot: number; vr: number;
};

export function HeroMotion() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;
    let last = performance.now();

    const particles: Particle[] = Array.from({ length: N }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 18,
      vy: (Math.random() - 0.5) * 18,
      g: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
      size: 14 + Math.random() * 22,
      opacity: 0.12 + Math.random() * 0.22,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.6,
    }));

    function resize() {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx!.scale(dpr, dpr);
    }
    resize();
    window.addEventListener('resize', resize);

    function tick(now: number) {
      const dt = Math.min(50, now - last) / 1000;
      last = now;
      ctx!.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx!.fillStyle = '#4fb8ff';

      for (const p of particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        if (p.x < -40) p.x = window.innerWidth + 20;
        if (p.x > window.innerWidth + 40) p.x = -20;
        if (p.y < -40) p.y = window.innerHeight + 20;
        if (p.y > window.innerHeight + 40) p.y = -20;

        ctx!.save();
        ctx!.globalAlpha = p.opacity;
        ctx!.font = `${p.size}px serif`;
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.rot);
        ctx!.fillText(p.g, 0, 0);
        ctx!.restore();
      }
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}
