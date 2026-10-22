import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

interface PixelParticlesProps {
  triggerKey?: string | number;
  type?: 'burst' | 'victory' | 'wild';
  className?: string;
}

export const PixelParticles: React.FC<PixelParticlesProps> = ({
  triggerKey,
  type = 'burst',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle canvas dimensions
    const width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    const height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#F43F5E', '#A855F7', '#FFFFFF'];
    const particles: Particle[] = [];
    const count = type === 'victory' ? 90 : 35;

    const originX = width / 2;
    const originY = type === 'victory' ? height * 0.3 : height * 0.5;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const speed = type === 'victory' ? Math.random() * 8 + 3 : Math.random() * 6 + 2;
      particles.push({
        x: originX + (Math.random() - 0.5) * 40,
        y: originY + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (type === 'victory' ? 4 : 1),
        size: Math.floor(Math.random() * 6) + 4, // chunky square pixel sizes 4-10px
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0,
        maxLife: type === 'victory' ? Math.random() * 60 + 80 : Math.random() * 30 + 40,
      });
    }

    let animationId: number;
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      let activeCount = 0;
      particles.forEach((p) => {
        p.life++;
        if (p.life < p.maxLife) {
          activeCount++;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.15; // Gravity
          p.alpha = Math.max(0, 1 - p.life / p.maxLife);

          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      if (activeCount > 0) {
        animationId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [triggerKey, type]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 z-50 w-full h-full pixel-art ${className}`}
    />
  );
};
