"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StarField    from "./StarField";
import ParticleCanvas from "./ParticleCanvas";
import ResultCard   from "./ResultCard";
import { RARITY_PALETTE } from "@/lib/constants";
import { soundBuildup, soundTransit, soundImpact } from "@/lib/audio";
import type { WarpItem, WarpPhase } from "@/lib/types";

interface Props {
  item:    WarpItem;
  rarity:  number;
  onDone:  () => void;   // called when user dismisses
}

// Streak line that shoots across the screen
function Streak({ color, delay }: { color: string; delay: number }) {
  const width = 100 + Math.random() * 200;
  const top   = `${Math.random() * 100}vh`;
  const angle = -15 + Math.random() * 30;
  return (
    <motion.div
      className="absolute pointer-events-none rounded-full"
      style={{
        top,
        left: "-5vw",
        width,
        height: Math.random() * 2.5 + 0.5,
        rotate: angle,
        background: `linear-gradient(90deg, ${color}, transparent)`,
        zIndex: 1,
      }}
      initial={{ x: 0, opacity: 0 }}
      animate={{ x: "115vw", opacity: [0, 1, 1, 0] }}
      transition={{ duration: 0.35 + Math.random() * 0.2, delay, ease: "easeOut" }}
    />
  );
}

export default function WarpAnimation({ item, rarity, onDone }: Props) {
  const [phase, setPhase]         = useState<WarpPhase>("initiation");
  const [showSkip, setShowSkip]   = useState(false);
  const [skipped, setSkipped]     = useState(false);
  const palette = RARITY_PALETTE[rarity];
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  function after(ms: number, fn: () => void) {
    const id = setTimeout(fn, ms);
    timeouts.current.push(id);
    return id;
  }

  useEffect(() => {
    // Unlock audio + fire buildup
    soundBuildup();

    // INITIATION → TRANSIT
    after(1100, () => {
      soundTransit();
      setPhase("transit");
    });

    // TRANSIT → FLASH
    after(1500, () => {
      setPhase("flash");
      soundImpact(rarity);
    });

    // FLASH → REVEAL
    after(1650, () => setPhase("reveal"));

    // REVEAL → SHOWING (skip becomes available)
    after(2200, () => {
      setPhase("showing");
      setShowSkip(true);
    });

    return () => timeouts.current.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSkip() {
    timeouts.current.forEach(clearTimeout);
    setSkipped(true);
    setPhase("showing");
    setShowSkip(true);
  }

  const isConverging = phase === "transit";
  const showParticles = phase === "flash" || phase === "reveal" || phase === "showing";
  const showCard      = phase === "reveal" || phase === "showing";
  const isFlash       = phase === "flash";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-void flex items-center justify-center">
      {/* ── Layer 0: Star field ── */}
      <StarField converge={isConverging} />

      {/* ── Layer 1: Streak lines (transit only) ── */}
      <AnimatePresence>
        {phase === "transit" && (
          <>
            {Array.from({ length: rarity === 5 ? 22 : rarity === 4 ? 14 : 8 }, (_, i) => (
              <Streak key={i} color={palette.streakColor} delay={i * 0.018} />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* ── Layer 2: Flash overlay ── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: palette.flash, zIndex: 2 }}
        animate={{ opacity: isFlash ? 1 : 0 }}
        transition={{ duration: isFlash ? 0.04 : 0.35 }}
      />

      {/* ── Layer 3: Particles ── */}
      <ParticleCanvas rarity={rarity} active={showParticles} />

      {/* ── Layer 4: Loading ring (initiation only) ── */}
      <AnimatePresence>
        {phase === "initiation" && !skipped && (
          <motion.div
            key="ring"
            className="absolute rounded-full border-2 pointer-events-none"
            style={{
              width: 90, height: 90,
              borderColor: `rgba(${palette.glow},0.15)`,
              borderTopColor: `rgba(${palette.glow},0.9)`,
              zIndex: 4,
            }}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.85, ease: "linear" }}
            exit={{ opacity: 0, scale: 0.5 }}
          />
        )}
      </AnimatePresence>

      {/* ── Layer 5: Result card ── */}
      <AnimatePresence>
        {showCard && (
          <motion.div
            key="card"
            style={{ zIndex: 5, width: "min(480px, 90vw)" }}
            initial={{ opacity: 0, scale: 0.82, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <ResultCard item={item} rarity={rarity} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Layer 6: Skip + Done buttons ── */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 6 }}>
        {/* Skip (during animation) */}
        <AnimatePresence>
          {!showSkip && phase !== "showing" && (
            <motion.button
              className="absolute bottom-8 right-8 text-xs uppercase tracking-widest
                         text-white/40 border border-white/10 rounded-full
                         px-5 py-2 pointer-events-auto
                         hover:text-white/80 hover:border-white/30 transition-colors"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.6 }}
              onClick={handleSkip}
            >
              Skip ▶
            </motion.button>
          )}
        </AnimatePresence>

        {/* Continue (after reveal) */}
        <AnimatePresence>
          {showSkip && (
            <motion.button
              className="absolute bottom-8 right-8 text-sm uppercase tracking-widest
                         text-white/70 border border-white/20 rounded-full
                         px-6 py-2.5 pointer-events-auto
                         hover:text-white hover:border-white/50
                         transition-all duration-200"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              onClick={onDone}
            >
              Continue ✦
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}