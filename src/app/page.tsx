"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayerState }  from "@/hooks/usePlayerState";
import { executePull, claimSpecialOffer, claimAnniversaryGift } from "@/lib/gacha";
import { RARITY_PALETTE, TICKETS_PER_DAY, HARD_PITY, SOFT_PITY } from "@/lib/constants";
import StarField           from "@/components/StarField";
import WarpAnimation       from "@/components/WarpAnimation";
import PityBar             from "@/components/PityBar";
import InventoryPanel      from "@/components/InventoryPanel";
import SpecialOfferBanner  from "@/components/SpecialOfferBanner";
import AnniversaryModal    from "@/components/AnniversaryModal";
import type { WarpItem }   from "@/lib/types";

// ── Item pool — inline so no extra fetch needed ───────────────
import itemPool from "../../data.json";

export default function Home() {
  const { state, loading, persist } = usePlayerState();
  const [animating, setAnimating]   = useState(false);
  const [result, setResult]         = useState<{ item: WarpItem; rarity: number } | null>(null);
  const [showInventory, setShowInventory] = useState(false);
  const [lastPull, setLastPull]     = useState<{ item: WarpItem; rarity: number } | null>(null);
  const [showAnniversary, setShowAnniversary] = useState(false);

  // Show anniversary modal on June 1st (once per device)
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (today >= "2026-06-01" && !localStorage.getItem("anniversary_claimed")) {
      setShowAnniversary(true);
    }
  }, []);

  if (loading || !state) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#07070f" }}>
        <motion.div
          className="w-16 h-16 rounded-full border-2"
          style={{ borderColor: "rgba(200,169,110,0.15)", borderTopColor: "rgba(200,169,110,0.9)" }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
        />
      </div>
    );
  }

  const noTickets = state.tickets <= 0;

  async function handlePull() {
    if (!state || noTickets || animating) return;
    setAnimating(true);
    const { nextState, item } = executePull(state, itemPool as any);
    const rarity = nextState.inventory[nextState.inventory.length - 1].rarity;
    await persist(nextState);
    setResult({ item, rarity });
  }

  function handleAnimationDone() {
    setLastPull(result);
    setResult(null);
    setAnimating(false);
  }

  async function handleAnniversaryClaim() {
    if (!state || animating) return;
    localStorage.setItem("anniversary_claimed", "true");
    setShowAnniversary(false);
    setAnimating(true);
    const { nextState, item } = claimAnniversaryGift(state, itemPool as any);
    await persist(nextState);
    setResult({ item, rarity: 5 });
  }

  function handleAnniversaryClose() {
    setShowAnniversary(false);
  }

  async function handleClaimOffer() {
    if (!state || animating) return;
    setAnimating(true);
    const { nextState, item } = claimSpecialOffer(state, itemPool as any);
    await persist(nextState);
    setResult({ item, rarity: 5 });
  }

  const fiveStarCount = state.inventory.filter(e => e.rarity === 5).length;
  const fourStarCount = state.inventory.filter(e => e.rarity === 4).length;
  const totalPulls    = state.inventory.length;

  return (
    <>
      {/* ── Background star field ── */}
      <div className="fixed inset-0" style={{ zIndex: 0 }}>
        <StarField />
      </div>

      {/* ── Main UI ── */}
      <main className="relative min-h-screen flex flex-col items-center justify-between py-10 px-4"
            style={{ zIndex: 1, maxWidth: 560, margin: "0 auto" }}>

        {/* ── HEADER ── */}
        <div className="w-full text-center mb-2">
          <motion.h1
            className="text-3xl font-bold tracking-[0.15em] uppercase mb-1"
            style={{ fontFamily: "'Cinzel', serif", color: "#C8A96E" }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            ✦ Warp System ✦
          </motion.h1>
          <motion.p
            className="text-[10px] uppercase tracking-[0.28em]"
            style={{ color: "#404060" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Bandung Edition · Astral Express
          </motion.p>
          {new Date().toISOString().slice(0, 10) >= "2026-06-01" && (
            <motion.p
              className="mt-1 text-[9px] uppercase tracking-[0.26em]"
              style={{ color: "#C8A96E" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ delay: 0.6, duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              ✦ 1 Month Anniversary ✦
            </motion.p>
          )}
        </div>

        {/* ── STATS ROW ── */}
        <motion.div
          className="w-full grid grid-cols-3 gap-3 my-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {[
            { label: "Tickets",     value: state.tickets,  sub: `${TICKETS_PER_DAY}/day`,  color: "#C8A96E" },
            { label: "Total Pulls", value: totalPulls,      sub: `${fourStarCount}× ★★★★`, color: "#c39bd3" },
            { label: "5-Stars",     value: fiveStarCount,  sub: "Stellar Relics",           color: "#f1c40f" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl p-3 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="text-2xl font-bold mb-0.5"
                   style={{ fontFamily: "'Cinzel', serif", color: stat.color }}>
                {stat.value}
              </div>
              <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "#505080" }}>
                {stat.label}
              </div>
              <div className="text-[9px]" style={{ color: "#404060" }}>{stat.sub}</div>
            </div>
          ))}
        </motion.div>

        {/* ── PITY BAR ── */}
        <motion.div
          className="w-full mb-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <PityBar pity={state.pity_counter} />
        </motion.div>

        {/* ── LAST PULL PREVIEW (mini, not animating) ── */}
        <AnimatePresence>
          {lastPull && !animating && (
            <motion.div
              className="w-full mb-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <LastPullBanner item={lastPull.item} rarity={lastPull.rarity} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SPECIAL OFFER (one-time) ── */}
        <AnimatePresence>
          {!state.special_offer_claimed && (
            <motion.div
              className="w-full mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
            >
              <SpecialOfferBanner onClaim={handleClaimOffer} disabled={animating} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── WARP BUTTON ── */}
        <motion.div className="w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <motion.button
            onClick={handlePull}
            disabled={noTickets || animating}
            className="w-full py-4 rounded-xl text-sm uppercase tracking-[0.2em] font-semibold
                       transition-all duration-200 relative overflow-hidden"
            style={{
              fontFamily: "'Cinzel', serif",
              background: noTickets
                ? "rgba(255,255,255,0.04)"
                : "linear-gradient(135deg, #8B6914, #C8A96E, #8B6914)",
              color:  noTickets ? "#404060" : "#07070f",
              border: noTickets ? "1px solid rgba(255,255,255,0.07)" : "none",
              cursor: noTickets ? "not-allowed" : "pointer",
            }}
            whileHover={!noTickets ? { scale: 1.015,
              boxShadow: "0 0 40px rgba(200,169,110,0.5), 0 0 80px rgba(200,169,110,0.2)" } : {}}
            whileTap={!noTickets ? { scale: 0.975 } : {}}
          >
            {noTickets ? "No Tickets — Come Back Tomorrow" : "▶  Warp  ×1"}
          </motion.button>

          {noTickets && (
            <motion.p
              className="text-center text-xs mt-3"
              style={{ color: "#404060" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Tickets refill daily at midnight 💙
            </motion.p>
          )}
        </motion.div>

        {/* ── HOW IT WORKS + INVENTORY BUTTON ── */}
        <motion.div
          className="w-full mt-6 flex flex-col gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <button
            onClick={() => setShowInventory(true)}
            className="w-full py-2.5 rounded-xl text-xs uppercase tracking-widest
                       transition-colors duration-200"
            style={{ background: "rgba(255,255,255,0.04)",
                     border: "1px solid rgba(255,255,255,0.07)",
                     color: "#6060a0" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#c8c8e0")}
            onMouseLeave={e => (e.currentTarget.style.color = "#6060a0")}
          >
            📦  Memory Archive  ({totalPulls} entries)
          </button>

          <details className="text-xs" style={{ color: "#404060" }}>
            <summary className="cursor-pointer text-center tracking-widest uppercase text-[10px]
                                hover:text-[#6060a0] transition-colors">
              ℹ How the warp system works
            </summary>
            <div className="mt-3 rounded-xl p-4 leading-relaxed space-y-1"
                 style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p>🎫 <strong style={{ color: "#C8A96E" }}>{TICKETS_PER_DAY} tickets per day</strong>, refilling at midnight.</p>
              <p>★★★ <strong style={{ color: "#7aa2d4" }}>Common Memories</strong> — daily affirmations.</p>
              <p>★★★★ <strong style={{ color: "#c39bd3" }}>Precious Memories</strong> — photo fragments. (~5%)</p>
              <p>★★★★★ <strong style={{ color: "#C8A96E" }}>Stellar Relics</strong> — date vouchers. (~0.6%)</p>
              <p style={{ color: "#383860" }}>Soft pity at {SOFT_PITY} pulls. Hard pity guaranteed at {HARD_PITY}.</p>
            </div>
          </details>
        </motion.div>

        <div className="mt-8 text-[9px] uppercase tracking-[0.2em]" style={{ color: "#2a2a45" }}>
          Made with intent · Not from a template
        </div>
      </main>

      {/* ── ANNIVERSARY MODAL ── */}
      <AnimatePresence>
        {showAnniversary && (
          <AnniversaryModal
            onClaim={handleAnniversaryClaim}
            onClose={handleAnniversaryClose}
          />
        )}
      </AnimatePresence>

      {/* ── WARP ANIMATION (full-screen takeover) ── */}
      <AnimatePresence>
        {result && (
          <WarpAnimation
            key="warp"
            item={result.item}
            rarity={result.rarity}
            onDone={handleAnimationDone}
          />
        )}
      </AnimatePresence>

      {/* ── INVENTORY DRAWER ── */}
      <InventoryPanel
        open={showInventory}
        onClose={() => setShowInventory(false)}
        inventory={state.inventory}
      />
    </>
  );
}

// ── Mini banner showing last pull result ─────────────────────
function LastPullBanner({ item, rarity }: { item: WarpItem; rarity: number }) {
  const p = RARITY_PALETTE[rarity];
  const label = rarity === 3
    ? (item as any).content?.slice(0, 60) + "…"
    : rarity === 4
    ? (item as any).caption?.slice(0, 60) + "…"
    : (item as any).destination ?? item.title;

  return (
    <div className="w-full rounded-xl px-4 py-3 flex items-center gap-3"
         style={{ background: `rgba(${p.glow},0.08)`, border: `1px solid rgba(${p.glow},0.2)` }}>
      <span className="text-base" style={{ color: p.primary }}>{"★".repeat(rarity)}</span>
      <p className="text-xs flex-1 italic" style={{ color: "#c8c8e0" }}>{label}</p>
    </div>
  );
}