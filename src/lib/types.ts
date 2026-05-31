// ── Item types ──────────────────────────────────────────────
export interface ThreeStarItem {
  id: string;
  rarity: 3;
  type: "affirmation";
  title: string;
  content: string;
}

export interface FourStarItem {
  id: string;
  rarity: 4;
  type: "memory";
  title: string;
  caption: string;
  photo_file: string;
}

export interface FiveStarItem {
  id: string;
  rarity: 5;
  type: "date_voucher" | "massage_voucher" | "anniversary_letter";
  title: string;
  destination?: string;
  description: string;
  validity: string;
  terms: string;
}

export type WarpItem = ThreeStarItem | FourStarItem | FiveStarItem;

// ── Item pool from data.json ──────────────────────────────────
export interface ItemPool {
  three_star: ThreeStarItem[];
  four_star:  FourStarItem[];
  five_star:  FiveStarItem[];
}

// ── Player state (mirrors Supabase warp_state table) ─────────
export interface PlayerState {
  player_id:             string;
  tickets:               number;
  last_refill_date:      string;
  pity_counter:          number;
  guaranteed_4star:      number;
  pulled_ids:            string[];
  inventory:             InventoryEntry[];
  special_offer_claimed: boolean;
}

export interface InventoryEntry {
  id:        string;
  rarity:    number;
  title:     string;
  timestamp: string;
}

// ── Animation phase state ────────────────────────────────────
export type WarpPhase =
  | "idle"
  | "initiation"
  | "transit"
  | "flash"
  | "reveal"
  | "showing";

// ── Rarity palette ───────────────────────────────────────────
export interface RarityPalette {
  primary:    string;
  secondary:  string;
  glow:       string;      // CSS rgb() values, e.g. "200,169,110"
  flash:      string;
  label:      string;
  stars:      string;
  streakColor:string;
  particleCount: number;
}