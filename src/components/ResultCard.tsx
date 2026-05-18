"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { RARITY_PALETTE } from "@/lib/constants";
import type { WarpItem, ThreeStarItem, FourStarItem, FiveStarItem } from "@/lib/types";

interface Props {
  item:   WarpItem;
  rarity: number;
}

export default function ResultCard({ item, rarity }: Props) {
  const p = RARITY_PALETTE[rarity];

  const borderGrad =
    rarity === 5
      ? `linear-gradient(135deg, ${p.primary}, ${p.secondary}, ${p.primary})`
      : `linear-gradient(135deg, ${p.secondary}, ${p.primary})`;

  const bgGrad =
    rarity === 5 ? "linear-gradient(160deg,#2a1800,#3d2200)"
    : rarity === 4 ? "linear-gradient(160deg,#1a1230,#221840)"
    : "linear-gradient(160deg,#13131F,#1a1a2a)";

  return (
    <div style={{ borderRadius: 20, padding: 2, background: borderGrad,
                  boxShadow: `0 0 50px rgba(${p.glow},0.55), 0 0 100px rgba(${p.glow},0.2)` }}>
      <div style={{ background: bgGrad, borderRadius: 18, padding: "2rem", textAlign: "center" }}>

        {/* Stars */}
        <motion.div
          className="text-2xl mb-3 tracking-widest"
          style={{ color: p.primary, textShadow: rarity === 5 ? `0 0 18px rgba(${p.glow},0.9)` : undefined }}
          animate={{ opacity: [1, 0.6, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          {p.stars}
        </motion.div>

        {/* Label */}
        <p className="text-xs uppercase tracking-[0.2em] mb-4" style={{ color: p.primary }}>
          {p.label}
        </p>

        {/* ── Rarity-specific body ── */}
        {rarity === 3 && <ThreeStarBody item={item as ThreeStarItem} palette={p} />}
        {rarity === 4 && <FourStarBody  item={item as FourStarItem}  palette={p} />}
        {rarity === 5 && <FiveStarBody  item={item as FiveStarItem}  palette={p} />}
      </div>
    </div>
  );
}

function ThreeStarBody({ item, palette }: { item: ThreeStarItem; palette: ReturnType<typeof RARITY_PALETTE[number]> }) {
  return (
    <p className="text-base leading-relaxed italic max-w-sm mx-auto"
       style={{ color: "#d4d0c8", fontFamily: "Georgia, serif" }}>
      &ldquo;{item.content}&rdquo;
    </p>
  );
}

function FourStarBody({ item, palette }: { item: FourStarItem; palette: ReturnType<typeof RARITY_PALETTE[number]> }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
        <Image
          src={`/photos/${item.photo_file}`}
          alt="Memory fragment"
          fill
          className="object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        {/* Subtle vignette */}
        <div className="absolute inset-0 rounded-xl"
             style={{ background: "linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.4))" }} />
      </div>
      <p className="text-sm italic text-center max-w-xs" style={{ color: "#c8c8e0", fontFamily: "Georgia, serif" }}>
        &ldquo;{item.caption}&rdquo;
      </p>
    </div>
  );
}

function FiveStarBody({ item, palette }: { item: FiveStarItem; palette: ReturnType<typeof RARITY_PALETTE[number]> }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-2xl font-bold tracking-wide" style={{ color: palette.secondary, fontFamily: "Georgia, serif" }}>
        {item.destination}
      </p>
      <div className="rounded-xl p-4 text-left flex flex-col gap-2"
           style={{ background: `rgba(${palette.glow},0.08)`, border: `1px solid rgba(${palette.glow},0.25)` }}>
        <p className="text-sm leading-relaxed" style={{ color: "#e8d9b0" }}>{item.description}</p>
        <p className="text-xs" style={{ color: "#888" }}>📅 {item.validity}</p>
        <p className="text-xs italic" style={{ color: "#666" }}>{item.terms}</p>
      </div>
    </div>
  );
}