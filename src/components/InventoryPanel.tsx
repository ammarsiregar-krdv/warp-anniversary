"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RARITY_PALETTE } from "@/lib/constants";
import type { InventoryEntry, WarpItem } from "@/lib/types";
import itemPool from "../../data.json";

interface Props {
  open:      boolean;
  onClose:   () => void;
  inventory: InventoryEntry[];
}

function findItem(id: string): WarpItem | undefined {
  const pool = itemPool as any;
  return (
    pool.three_star.find((i: any) => i.id === id) ??
    pool.four_star.find((i: any)  => i.id === id) ??
    pool.five_star.find((i: any)  => i.id === id)
  );
}

export default function InventoryPanel({ open, onClose, inventory }: Props) {
  const [selected, setSelected] = useState<{ entry: InventoryEntry; item: WarpItem } | null>(null);
  const sorted = [...inventory].reverse();

  function handleSelect(entry: InventoryEntry) {
    const item = findItem(entry.id);
    if (item) setSelected({ entry, item });
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            {/* Panel */}
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl overflow-hidden"
              style={{ background: "#0f0f1e", border: "1px solid rgba(255,255,255,0.08)", maxHeight: "70vh" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3"
                   style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-sm uppercase tracking-widest" style={{ color: "#C8A96E" }}>
                  Memory Archive
                </span>
                <div className="flex gap-4 text-xs" style={{ color: "#6060a0" }}>
                  <span>★★★ {inventory.filter(e => e.rarity === 3).length}</span>
                  <span style={{ color: "#c39bd3" }}>★★★★ {inventory.filter(e => e.rarity === 4).length}</span>
                  <span style={{ color: "#C8A96E" }}>★★★★★ {inventory.filter(e => e.rarity === 5).length}</span>
                </div>
              </div>

              {/* List */}
              <div className="overflow-y-auto px-4 py-3" style={{ maxHeight: "calc(70vh - 100px)" }}>
                {sorted.length === 0 ? (
                  <p className="text-center py-8 text-xs" style={{ color: "#404060" }}>
                    No pulls yet. Go warp something.
                  </p>
                ) : (
                  sorted.map((entry, i) => {
                    const p = RARITY_PALETTE[entry.rarity];
                    return (
                      <motion.button
                        key={`${entry.id}-${entry.timestamp}`}
                        onClick={() => handleSelect(entry)}
                        className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl mb-1.5 text-left"
                        style={{ background: "rgba(255,255,255,0.03)", borderLeft: `3px solid ${p.primary}`,
                                 cursor: "pointer" }}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        whileHover={{ background: `rgba(${p.glow},0.08)` }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="text-sm" style={{ color: p.primary, minWidth: 64 }}>
                          {"★".repeat(entry.rarity)}
                        </span>
                        <span className="text-sm flex-1" style={{ color: "#c8c8e0" }}>
                          {entry.title}
                        </span>
                        <span className="text-xs" style={{ color: "#404060" }}>
                          {entry.timestamp.slice(0, 10)}
                        </span>
                        <span className="text-xs ml-1" style={{ color: "#404060" }}>›</span>
                      </motion.button>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Detail Modal ── */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              className="fixed inset-0 z-60"
              style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
            />
            <motion.div
              className="fixed inset-x-4 z-60 rounded-2xl overflow-hidden"
              style={{
                top: "50%",
                background: "#0f0f1e",
                border: `1px solid rgba(${RARITY_PALETTE[selected.entry.rarity].glow},0.35)`,
                boxShadow: `0 0 60px rgba(${RARITY_PALETTE[selected.entry.rarity].glow},0.2)`,
                maxWidth: 480,
                margin: "0 auto",
              }}
              initial={{ opacity: 0, scale: 0.92, y: "-50%" }}
              animate={{ opacity: 1, scale: 1, y: "-50%" }}
              exit={{ opacity: 0, scale: 0.92, y: "-50%" }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
            >
              <DetailView
                entry={selected.entry}
                item={selected.item}
                onClose={() => setSelected(null)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function DetailView({ entry, item, onClose }: { entry: InventoryEntry; item: WarpItem; onClose: () => void }) {
  const p = RARITY_PALETTE[entry.rarity];

  return (
    <div>
      {/* Detail header */}
      <div className="flex items-center justify-between px-5 py-4"
           style={{ borderBottom: `1px solid rgba(${p.glow},0.15)` }}>
        <div>
          <p className="text-xs uppercase tracking-widest mb-0.5" style={{ color: p.primary }}>
            {p.label}
          </p>
          <p className="text-base font-semibold" style={{ color: "#e8e8f0", fontFamily: "'Cinzel', serif" }}>
            {item.title}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-xl leading-none px-2"
          style={{ color: "#404060" }}
        >
          ×
        </button>
      </div>

      {/* Detail body */}
      <div className="px-5 py-5">
        {item.rarity === 3 && (
          <p className="text-sm leading-relaxed italic" style={{ color: "#c8c8e0" }}>
            "{item.content}"
          </p>
        )}

        {item.rarity === 4 && (
          <div className="flex flex-col gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/photos/${item.photo_file}`}
              alt={item.title}
              className="w-full rounded-xl object-cover"
              style={{ maxHeight: 280 }}
            />
            <p className="text-sm leading-relaxed italic text-center" style={{ color: "#c8c8e0" }}>
              "{item.caption}"
            </p>
          </div>
        )}

        {item.rarity === 5 && (
          <div className="flex flex-col gap-3">
            {(item as any).destination && (
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest" style={{ color: p.primary }}>📍 Destination</span>
                <span className="text-sm" style={{ color: "#c8c8e0" }}>{(item as any).destination}</span>
              </div>
            )}
            <p className="text-sm leading-relaxed" style={{ color: "#c8c8e0" }}>
              {item.description}
            </p>
            <div className="rounded-xl px-4 py-3 mt-1"
                 style={{ background: `rgba(${p.glow},0.07)`, border: `1px solid rgba(${p.glow},0.15)` }}>
              <p className="text-xs mb-1" style={{ color: p.primary }}>
                🗓 {(item as any).validity}
              </p>
              <p className="text-xs" style={{ color: "#505070" }}>
                {(item as any).terms}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Timestamp */}
      <div className="px-5 pb-4 text-right">
        <span className="text-xs" style={{ color: "#303050" }}>
          Pulled on {entry.timestamp.slice(0, 10)}
        </span>
      </div>
    </div>
  );
}