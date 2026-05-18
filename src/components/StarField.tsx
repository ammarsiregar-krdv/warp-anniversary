"use client";
import { useEffect, useRef } from "react";

interface Star {
  x: number; y: number; r: number;
  alpha: number; speed: number; phase: number;
}

interface Props {
  converge?: boolean; // true during transit phase — stars stream inward
}

export default function StarField({ converge = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef  = useRef<Star[]>([]);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    function resize() {
      canvas!.width  = window.innerWidth;
      canvas!.height = window.innerHeight;
      // Re-seed stars on resize
      starsRef.current = Array.from({ length: 200 }, () => ({
        x:     Math.random() * canvas!.width,
        y:     Math.random() * canvas!.height,
        r:     Math.random() * 1.5 + 0.3,
        alpha: Math.random() * 0.8 + 0.1,
        speed: Math.random() * 0.01 + 0.003,
        phase: Math.random() * Math.PI * 2,
      }));
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      const cx = canvas!.width  / 2;
      const cy = canvas!.height / 2;

      for (const s of starsRef.current) {
        s.phase += s.speed;
        const a = s.alpha * (0.45 + 0.55 * Math.sin(s.phase));

        if (converge) {
          s.x += (cx - s.x) * 0.015;
          s.y += (cy - s.y) * 0.015;
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [converge]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}