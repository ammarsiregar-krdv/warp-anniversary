"use client";
import { motion } from "framer-motion";

interface Props {
  onClaim:  () => void;
  disabled: boolean;
}

export default function SpecialOfferBanner({ onClaim, disabled }: Props) {
  return (
    <motion.div
      className="w-full rounded-2xl overflow-hidden relative"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.6 }}
      style={{
        background: "linear-gradient(135deg, #140e00, #221800, #140e00)",
        border:     "1px solid rgba(200,169,110,0.45)",
        boxShadow:  "0 0 48px rgba(200,169,110,0.12), inset 0 0 32px rgba(200,169,110,0.04)",
      }}
    >
      {/* Shimmer sweep */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(105deg, transparent 35%, rgba(200,169,110,0.09) 50%, transparent 65%)",
        }}
        animate={{ x: ["-120%", "120%"] }}
        transition={{ repeat: Infinity, duration: 2.6, ease: "linear", repeatDelay: 1.8 }}
      />

      <div className="relative px-5 py-5 flex flex-col items-center gap-3 text-center">

        {/* Badge */}
        <motion.div
          className="text-[9px] uppercase tracking-[0.35em] px-3 py-1 rounded-full"
          style={{
            background: "rgba(200,169,110,0.1)",
            border:     "1px solid rgba(200,169,110,0.35)",
            color:      "#C8A96E",
          }}
          animate={{ opacity: [0.65, 1, 0.65] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        >
          ✦ Limited · One-Time Offer ✦
        </motion.div>

        {/* Title */}
        <h2
          className="text-base font-bold uppercase tracking-widest"
          style={{ fontFamily: "'Cinzel', serif", color: "#e8d48a" }}
        >
          Special Gift
        </h2>

        {/* Body */}
        <p className="text-xs leading-relaxed max-w-[260px]" style={{ color: "#9a8050" }}>
          Your gacha luck? Officially fixed by Yours only babe...
          A guaranteed ★★★★★ pull, prepared just for you.
          Claim once. Cherish forever.
        </p>

        {/* Stars */}
        <motion.div
          className="text-xl tracking-[0.3em]"
          style={{ color: "#C8A96E" }}
          animate={{ opacity: [0.5, 1, 0.5], scale: [0.97, 1.03, 0.97] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          ★★★★★
        </motion.div>

        {/* Claim button */}
        <motion.button
          onClick={onClaim}
          disabled={disabled}
          className="w-full py-3.5 rounded-xl text-sm uppercase tracking-[0.2em] font-bold
                     relative overflow-hidden"
          style={{
            fontFamily: "'Cinzel', serif",
            background: disabled
              ? "rgba(255,255,255,0.04)"
              : "linear-gradient(135deg, #6B4F10, #C8A96E, #E8C96E, #C8A96E, #6B4F10)",
            color:  disabled ? "#404060" : "#07070f",
            border: disabled ? "1px solid rgba(255,255,255,0.07)" : "none",
            cursor: disabled ? "not-allowed" : "pointer",
          }}
          whileHover={!disabled ? {
            scale:     1.02,
            boxShadow: "0 0 56px rgba(200,169,110,0.65), 0 0 100px rgba(200,169,110,0.25)",
          } : {}}
          whileTap={!disabled ? { scale: 0.975 } : {}}
        >
          {disabled ? "Opening…" : "✦  Claim Your Gift  ★★★★★"}
        </motion.button>

        <p className="text-[9px] uppercase tracking-widest" style={{ color: "#3a2e10" }}>
          Disappears after claim · Non-transferable
        </p>
      </div>
    </motion.div>
  );
}
