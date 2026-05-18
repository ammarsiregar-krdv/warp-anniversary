"use client";
import { motion, AnimatePresence } from "framer-motion";
import { RARITY_PALETTE } from "@/lib/constants";
import type { InventoryEntry } from "@/lib/types";

interface Props {
  open:      boolean;
  onClose:   () => void;
  inventory: InventoryEntry[];
}

export default function InventoryPanel({ open, onClose, inventory }: Props) {
  const sorted = [...inventory].reverse();

  return (
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
            style={{ background: "#0f0f1e", border: "1px solid rgba(255,255,255,0.08)",
                     maxHeight: "70vh" }}
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
                    <motion.div
                      key={`${entry.id}-${entry.timestamp}`}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-xl mb-1.5"
                      style={{ background: "rgba(255,255,255,0.03)",
                               borderLeft: `3px solid ${p.primary}` }}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
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
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}