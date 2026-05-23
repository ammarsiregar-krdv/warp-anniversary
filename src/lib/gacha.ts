import {
  BASE_WEIGHT_3,
  BASE_WEIGHT_4,
  BASE_WEIGHT_5,
  HARD_PITY,
  SOFT_PITY,
  TICKETS_PER_DAY,
} from "./constants";
import type { ItemPool, PlayerState, WarpItem } from "./types";

// ── Pity curve ───────────────────────────────────────────────
function fiveStarWeight(pity: number): number {
  if (pity >= HARD_PITY) return 1000;
  if (pity >= SOFT_PITY) {
    const ramp = (pity - SOFT_PITY) / (HARD_PITY - SOFT_PITY);
    return BASE_WEIGHT_5 + ramp * (950 - BASE_WEIGHT_5);
  }
  return BASE_WEIGHT_5;
}

function determineRarity(pity: number, guaranteed4: number): 3 | 4 | 5 {
  const w5   = fiveStarWeight(pity);
  const roll = Math.floor(Math.random() * 1000) + 1;

  // Guarantee 4-star within 10 pulls
  if (guaranteed4 >= 9 && w5 < 1000) {
    return roll <= w5 ? 5 : 4;
  }

  if (roll <= w5)                 return 5;
  if (roll <= w5 + BASE_WEIGHT_4) return 4;
  return 3;
}

function pickItem(
  rarity: 3 | 4 | 5,
  pool: ItemPool,
  pulledIds: string[]
): WarpItem {
  const map = { 3: pool.three_star, 4: pool.four_star, 5: pool.five_star };
  const all = map[rarity] as WarpItem[];
  // Prefer unseen items; fall back to full pool
  const fresh = all.filter((i) => !pulledIds.includes(i.id));
  const source = fresh.length > 0 ? fresh : all;
  return source[Math.floor(Math.random() * source.length)];
}

// ── Main pull function ───────────────────────────────────────
export function executePull(
  state: PlayerState,
  pool: ItemPool
): { nextState: PlayerState; item: WarpItem } {
  const rarity = determineRarity(state.pity_counter, state.guaranteed_4star);
  const item   = pickItem(rarity, pool, state.pulled_ids);

  const nextState: PlayerState = {
    ...state,
    tickets:          state.tickets - 1,
    pity_counter:     rarity === 5 ? 0 : state.pity_counter + 1,
    guaranteed_4star: rarity === 5 ? 0 : rarity === 4 ? 0 : state.guaranteed_4star + 1,
    pulled_ids:       [...state.pulled_ids, item.id],
    inventory: [
      ...state.inventory,
      {
        id:        item.id,
        rarity,
        title:     item.title,
        timestamp: new Date().toISOString(),
      },
    ],
  };

  return { nextState, item };
}

// ── Daily ticket refill ──────────────────────────────────────
export function refillIfNewDay(state: PlayerState): PlayerState {
  const today = new Date().toISOString().slice(0, 10);
  if (state.last_refill_date !== today) {
    // Ensure she gets at least one 4-star within today's tickets:
    // The guarantee fires when guaranteed_4star >= 9, so starting at
    // (10 - TICKETS_PER_DAY) means it reaches 9 on the very last pull.
    const minPity = 10 - TICKETS_PER_DAY;
    return {
      ...state,
      tickets:          TICKETS_PER_DAY,
      last_refill_date: today,
      guaranteed_4star: Math.max(state.guaranteed_4star, minPity),
    };
  }
  return state;
}

// ── Special one-time offer ───────────────────────────────────
export function claimSpecialOffer(
  state: PlayerState,
  pool: ItemPool
): { nextState: PlayerState; item: WarpItem } {
  const OFFER_ID = "5s_004";
  const item = (pool.five_star as WarpItem[]).find(i => i.id === OFFER_ID)
    ?? pool.five_star[pool.five_star.length - 1] as WarpItem;

  const nextState: PlayerState = {
    ...state,
    special_offer_claimed: true,
    pity_counter:     0,
    guaranteed_4star: 0,
    pulled_ids:       [...state.pulled_ids, item.id],
    inventory: [
      ...state.inventory,
      {
        id:        item.id,
        rarity:    5,
        title:     item.title,
        timestamp: new Date().toISOString(),
      },
    ],
  };

  return { nextState, item };
}