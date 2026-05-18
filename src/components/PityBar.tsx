"use client";
import { motion } from "framer-motion";
import { HARD_PITY, SOFT_PITY } from "@/lib/constants";

interface Props {
  pity: number;
}

export default function PityBar({ pity }: Props) {
  const pct        = Math.min(pity / HARD_PITY, 1);
  const isSoft     = pity >= SOFT_PITY;
  const barColor   = isSoft
    ? "linear-gradient(90deg, #C8A96E, #f1c40f, #C8A96E)"
    : "linear-gradient(90deg, #4a6fa5, #7aa2d4)";

  return (
    <div className="w-full flex flex-col gap-1.5">
      <div className="flex justify-between items-center text-xs"
           style={{ color: "#6060a0", letterSpacing: "0.1em" }}>
        <span className="uppercase tracking-widest text-[10px]">Pity</span>
        <span style={{ color: isSoft ? "#C8A96E" : "#6060a0" }}>
          {pity} / {HARD_PITY}
          {isSoft && <span className="ml-2 text-[10px] text-[#C8A96E]">✨ Soft pity</span>}
        </span>
      </div>
      <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            background: barColor,
            backgroundSize: "200% 100%",
            animation: isSoft ? "shimmer 2.5s linear infinite" : undefined,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        {/* Soft pity marker */}
        <div
          className="absolute top-0 h-full w-px"
          style={{ left: `${(SOFT_PITY / HARD_PITY) * 100}%`, background: "rgba(200,169,110,0.4)" }}
        />
      </div>
    </div>
  );
}