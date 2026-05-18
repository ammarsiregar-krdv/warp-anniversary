"use client";
import { useEffect, useRef } from "react";
import { RARITY_PALETTE } from "@/lib/constants";

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  alpha: number; decay: number;
  size: number; color: string;
}

interface Props {
  rarity: number;
  active: boolean;
}

export default function ParticleCanvas({ rarity, active }: Props) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const particles   = useRef<Particle[]>([]);
  const rafRef      = useRef<number>(0);
  const spawnedRef  = useRef(false);

  const palette = RARITY_PALETTE[rarity];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const onResize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!active || spawnedRef.current) return;
    spawnedRef.current = true;

    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;
    const cx     = canvas.width  / 2;
    const cy     = canvas.height / 2;
    const count  = palette.particleCount;

    // Spawn burst
    particles.current = Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 2 + Math.random() * (rarity === 5 ? 6 : rarity === 4 ? 4 : 2.5);
      // 5-star gets gold + primary mix
      const color = rarity === 5 && Math.random() > 0.5
        ? "#f1c40f"
        : palette.primary;
      return {
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        decay: 0.013 + Math.random() * 0.012,
        size:  Math.random() * (rarity === 5 ? 4.5 : 3) + 1,
        color,
      };
    });

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.965; p.vy *= 0.965;
        p.alpha -= p.decay;
        if (p.alpha <= 0) return;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur  = p.alpha > 0.4 ? 10 : 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.restore();
      });
      particles.current = particles.current.filter((p) => p.alpha > 0);
      if (particles.current.length > 0) {
        rafRef.current = requestAnimationFrame(draw);
      }
    }
    rafRef.current = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(rafRef.current);
  }, [active, palette, rarity]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 3 }}
    />
  );
}