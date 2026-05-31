"use client";
import { motion } from "framer-motion";

interface Props {
  onClaim: () => void;
  onClose: () => void;
}

const PARTICLES = [
  { symbol: "✦", l: "7%",  delay: 0,    dur: 6   },
  { symbol: "★", l: "17%", delay: 0.6,  dur: 5   },
  { symbol: "♡", l: "26%", delay: 1.3,  dur: 7   },
  { symbol: "✦", l: "37%", delay: 0.4,  dur: 5.5 },
  { symbol: "★", l: "49%", delay: 2.0,  dur: 6.5 },
  { symbol: "♡", l: "61%", delay: 0.9,  dur: 5   },
  { symbol: "✦", l: "71%", delay: 2.2,  dur: 7   },
  { symbol: "★", l: "81%", delay: 0.3,  dur: 6   },
  { symbol: "♡", l: "90%", delay: 1.6,  dur: 5.5 },
  { symbol: "✦", l: "13%", delay: 3.0,  dur: 8   },
  { symbol: "★", l: "44%", delay: 3.4,  dur: 7   },
  { symbol: "♡", l: "67%", delay: 2.7,  dur: 6   },
  { symbol: "✦", l: "55%", delay: 4.1,  dur: 5.5 },
  { symbol: "★", l: "33%", delay: 1.8,  dur: 6.5 },
  { symbol: "♡", l: "78%", delay: 3.9,  dur: 5   },
];

export default function AnniversaryModal({ onClaim, onClose }: Props) {
  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden"
      style={{ background: "rgba(2,1,10,0.97)", backdropFilter: "blur(14px)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Radial gold aura */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 600,
          height: 600,
          background:
            "radial-gradient(circle, rgba(200,169,110,0.07) 0%, transparent 68%)",
        }}
      />

      {/* Floating particles */}
      {PARTICLES.map((p, i) => (
        <motion.span
          key={i}
          className="fixed text-xs pointer-events-none select-none"
          style={{ left: p.l, bottom: "-2rem", color: "rgba(200,169,110,0.42)" }}
          animate={{ y: "-115vh", opacity: [0, 0.9, 0.9, 0] }}
          transition={{
            duration:    p.dur,
            delay:       p.delay,
            repeat:      Infinity,
            repeatDelay: 0.8,
            ease:        "linear",
            times:       [0, 0.12, 0.88, 1],
          }}
        >
          {p.symbol}
        </motion.span>
      ))}

      {/* ── Main card ── */}
      <motion.div
        className="relative mx-4 rounded-3xl overflow-hidden w-full"
        style={{
          maxWidth: 400,
          background: "linear-gradient(160deg, #0c091a, #120d00, #0c091a)",
          border: "1px solid rgba(200,169,110,0.38)",
          boxShadow:
            "0 0 80px rgba(200,169,110,0.13), 0 0 200px rgba(200,169,110,0.05)",
        }}
        initial={{ scale: 0.82, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 22, stiffness: 140, delay: 0.25 }}
      >
        {/* Shimmer sweep */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(105deg, transparent 35%, rgba(200,169,110,0.055) 50%, transparent 65%)",
          }}
          animate={{ x: ["-130%", "130%"] }}
          transition={{
            repeat:      Infinity,
            duration:    3.4,
            ease:        "linear",
            repeatDelay: 2.8,
          }}
        />

        <div className="relative px-6 pt-8 pb-7 flex flex-col items-center gap-4 text-center">

          {/* Badge */}
          <motion.div
            className="text-[9px] uppercase tracking-[0.32em] px-3 py-1 rounded-full"
            style={{
              background: "rgba(200,169,110,0.1)",
              border:     "1px solid rgba(200,169,110,0.32)",
              color:      "#C8A96E",
            }}
            animate={{ opacity: [0.55, 1, 0.55] }}
            transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
          >
            ✦ 1 Month Anniversary · June 1, 2026 ✦
          </motion.div>

          {/* Pulsing heart */}
          <motion.div
            className="text-5xl"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
          >
            🤍
          </motion.div>

          {/* Title */}
          <div>
            <h2
              className="text-[22px] font-bold uppercase tracking-widest mb-1"
              style={{ fontFamily: "'Cinzel', serif", color: "#e8d48a" }}
            >
              Satu Bulan
            </h2>
            <p
              className="text-[9px] uppercase tracking-[0.26em]"
              style={{ color: "#6B4F10" }}
            >
              & I&apos;d choose you again every single time
            </p>
          </div>

          {/* Day counter */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: 0.55, damping: 15 }}
          >
            <p
              className="text-[68px] font-bold leading-none"
              style={{ fontFamily: "'Cinzel', serif", color: "#C8A96E" }}
            >
              30
            </p>
            <p
              className="text-[10px] uppercase tracking-[0.22em] mt-0.5"
              style={{ color: "#5a4010" }}
            >
              hari yang aku syukuri
            </p>
          </motion.div>

          {/* Divider */}
          <div
            className="w-24 h-px"
            style={{ background: "rgba(200,169,110,0.18)" }}
          />

          {/* Love letter */}
          <div className="text-xs leading-relaxed text-left space-y-3 px-1">
            <p style={{ color: "#9a8050" }}>
              Sebulan. Dari yang awalnya{" "}
              <em>figuring this out bareng</em>,
              sekarang jadi sesuatu yang aku syukuri setiap pagi.
            </p>
            <p style={{ color: "#9a8050" }}>
              Makasih ya sayang — buat setiap DC call,
              setiap <em>i miss you</em>, setiap cerita yang kamu bagiin,
              dan setiap momen kecil yang kita tulis bareng.
            </p>
            <p style={{ color: "#C8A96E", fontStyle: "italic" }}>
              Happy 1 Month, my babygirl.{" "}
              <span style={{ fontStyle: "normal" }}>I love you. 🤍</span>
            </p>
          </div>

          {/* Stars */}
          <motion.div
            className="text-lg tracking-[0.35em]"
            style={{ color: "#C8A96E" }}
            animate={{ opacity: [0.4, 1, 0.4], scale: [0.97, 1.04, 0.97] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
          >
            ★★★★★
          </motion.div>

          {/* Claim button */}
          <motion.button
            onClick={onClaim}
            className="w-full py-4 rounded-xl text-sm uppercase tracking-[0.18em]
                       font-bold relative overflow-hidden"
            style={{
              fontFamily: "'Cinzel', serif",
              background:
                "linear-gradient(135deg, #6B4F10, #C8A96E, #E8C96E, #C8A96E, #6B4F10)",
              color: "#07070f",
            }}
            whileHover={{
              scale:     1.02,
              boxShadow:
                "0 0 60px rgba(200,169,110,0.7), 0 0 120px rgba(200,169,110,0.25)",
            }}
            whileTap={{ scale: 0.975 }}
          >
            ✦&nbsp; Claim Anniversary Gift &nbsp;★★★★★
          </motion.button>

          {/* Soft dismiss */}
          <button
            onClick={onClose}
            className="text-[9px] uppercase tracking-widest transition-colors duration-200"
            style={{ color: "#2a2040" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "#5a5080")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "#2a2040")
            }
          >
            nanti aja
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
