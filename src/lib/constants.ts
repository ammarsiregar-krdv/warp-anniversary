import type { RarityPalette } from "./types";

export const TICKETS_PER_DAY = 10;
export const SOFT_PITY       = 60;
export const HARD_PITY       = 80;
export const PLAYER_ID       = "player_one";

export const BASE_WEIGHT_5   = 6;    // out of 1000 → 0.6%
export const BASE_WEIGHT_4   = 51;   // 5.1%
export const BASE_WEIGHT_3   = 943;  // 94.3%

export const RARITY_PALETTE: Record<number, RarityPalette> = {
  3: {
    primary:      "#7aa2d4",
    secondary:    "#4a6fa5",
    glow:         "74,111,165",
    flash:        "rgba(100,150,220,0.82)",
    label:        "Common Memory",
    stars:        "★★★☆☆",
    streakColor:  "#a0c4f1",
    particleCount: 32,
  },
  4: {
    primary:      "#c39bd3",
    secondary:    "#9b59b6",
    glow:         "155,89,182",
    flash:        "rgba(180,100,220,0.88)",
    label:        "Precious Memory",
    stars:        "★★★★☆",
    streakColor:  "#d8b4fe",
    particleCount: 60,
  },
  5: {
    primary:      "#C8A96E",
    secondary:    "#f1c40f",
    glow:         "200,169,110",
    flash:        "rgba(240,200,90,0.95)",
    label:        "✦ Stellar Relic ✦",
    stars:        "★★★★★",
    streakColor:  "#ffe08a",
    particleCount: 95,
  },
};

export const DEFAULT_STATE = {
  player_id:        PLAYER_ID,
  tickets:          TICKETS_PER_DAY,
  last_refill_date: new Date().toISOString().slice(0, 10),
  pity_counter:     0,
  guaranteed_4star: 0,
  pulled_ids:       [] as string[],
  inventory:        [] as never[],
};