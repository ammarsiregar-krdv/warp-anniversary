"""
Warp System — Anniversary Edition
A gacha-style memory puller for one special person.
Persistence: Supabase (Postgres)
"""

import streamlit as st
import json
import random
import os
import time
from datetime import date, datetime
from supabase import create_client, Client

# ─────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────
TICKETS_PER_DAY = 3
DATA_FILE = "data.json"
PHOTOS_DIR = "assets/photos"
PLAYER_ID = "player_one"          # Single-player app — one fixed row in DB

SOFT_PITY = 60
HARD_PITY = 80

BASE_WEIGHT_5 = 6    # 0.6%
BASE_WEIGHT_4 = 51   # 5.1%
BASE_WEIGHT_3 = 943  # 94.3%


# ─────────────────────────────────────────────────────────────
# SUPABASE CLIENT
# ─────────────────────────────────────────────────────────────
@st.cache_resource
def get_supabase() -> Client:
    """
    Initialise the Supabase client once per session.
    Secrets are loaded from .streamlit/secrets.toml locally,
    or from Streamlit Cloud's Secrets UI in production.
    """
    url = st.secrets["SUPABASE_URL"]
    key = st.secrets["SUPABASE_KEY"]
    return create_client(url, key)


# ─────────────────────────────────────────────────────────────
# STATE MANAGEMENT — Supabase-backed
# ─────────────────────────────────────────────────────────────
DEFAULT_STATE = {
    "player_id":        PLAYER_ID,
    "tickets":          TICKETS_PER_DAY,
    "last_refill_date": str(date.today()),
    "pity_counter":     0,
    "guaranteed_4star": 0,
    "pulled_ids":       [],    # stored as JSONB in Supabase
    "inventory":        [],    # stored as JSONB in Supabase
}


def load_state() -> dict:
    """
    Fetch the player row from Supabase.
    If it doesn't exist yet, insert the default row and return it.
    """
    sb = get_supabase()
    try:
        res = (
            sb.table("warp_state")
            .select("*")
            .eq("player_id", PLAYER_ID)
            .single()
            .execute()
        )
        row = res.data
        # Merge defaults for any columns added after initial deploy
        return {**DEFAULT_STATE, **row}
    except Exception:
        # Row doesn't exist yet — create it
        sb.table("warp_state").insert(DEFAULT_STATE).execute()
        return dict(DEFAULT_STATE)


def save_state(state: dict):
    """
    Upsert the player row back to Supabase.
    Only mutable columns are written; player_id is the conflict key.
    """
    sb = get_supabase()
    payload = {
        "player_id":        state["player_id"],
        "tickets":          state["tickets"],
        "last_refill_date": state["last_refill_date"],
        "pity_counter":     state["pity_counter"],
        "guaranteed_4star": state["guaranteed_4star"],
        "pulled_ids":       state["pulled_ids"],
        "inventory":        state["inventory"],
    }
    sb.table("warp_state").upsert(payload).execute()


def refill_tickets_if_new_day(state: dict) -> dict:
    """Give new tickets if it's a new calendar day."""
    today = str(date.today())
    if state["last_refill_date"] != today:
        state["tickets"] = TICKETS_PER_DAY
        state["last_refill_date"] = today
    return state


def load_data() -> dict:
    """Load the item pool from data.json."""
    with open(DATA_FILE, "r") as f:
        return json.load(f)


# ─────────────────────────────────────────────────────────────
# CSS INJECTION — Astral Express Aesthetic
# ─────────────────────────────────────────────────────────────
def inject_css():
    st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Raleway:wght@300;400;500&display=swap');

    html, body, [class*="css"] { font-family: 'Raleway', sans-serif; }

    .stApp {
        background: radial-gradient(ellipse at 20% 50%, #1a1040 0%, #0D0D14 60%),
                    radial-gradient(ellipse at 80% 20%, #0f1a3a 0%, transparent 50%);
        background-color: #0D0D14;
    }

    h1, h2, h3 {
        font-family: 'Cinzel', serif !important;
        color: #C8A96E !important;
        letter-spacing: 0.08em;
    }

    [data-testid="stMetric"] {
        background: linear-gradient(135deg, #13131F 60%, #1c1c30);
        border: 1px solid #2a2a45;
        border-radius: 12px;
        padding: 1rem 1.2rem;
    }
    [data-testid="stMetricValue"] {
        color: #C8A96E !important;
        font-family: 'Cinzel', serif !important;
        font-size: 2rem !important;
    }
    [data-testid="stMetricLabel"] {
        color: #9090b0 !important;
        font-size: 0.75rem !important;
        letter-spacing: 0.1em;
        text-transform: uppercase;
    }

    .stButton > button {
        background: linear-gradient(135deg, #8B6914, #C8A96E, #8B6914) !important;
        color: #0D0D14 !important;
        font-family: 'Cinzel', serif !important;
        font-weight: 600 !important;
        font-size: 0.9rem !important;
        letter-spacing: 0.12em !important;
        border: none !important;
        border-radius: 6px !important;
        padding: 0.6rem 1.8rem !important;
        transition: all 0.3s ease !important;
        box-shadow: 0 0 20px rgba(200, 169, 110, 0.2) !important;
    }
    .stButton > button:hover {
        box-shadow: 0 0 35px rgba(200, 169, 110, 0.5) !important;
        transform: translateY(-1px) !important;
    }
    .stButton > button:disabled {
        background: linear-gradient(135deg, #2a2a2a, #3a3a3a) !important;
        color: #555 !important;
        box-shadow: none !important;
    }

    .result-card {
        border-radius: 16px;
        padding: 2rem;
        margin: 1rem 0;
        text-align: center;
        animation: fadeIn 0.6s ease;
        position: relative;
        overflow: hidden;
    }
    .result-card::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 16px;
        padding: 2px;
        background: var(--card-border);
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
    }
    .card-3star { background: linear-gradient(160deg, #13131F, #1a1a2a); --card-border: linear-gradient(135deg, #4a6fa5, #7aa2d4); }
    .card-4star { background: linear-gradient(160deg, #1a1230, #221840); --card-border: linear-gradient(135deg, #9b59b6, #c39bd3); }
    .card-5star {
        background: linear-gradient(160deg, #2a1800, #3d2200);
        --card-border: linear-gradient(135deg, #f39c12, #C8A96E, #f1c40f);
        box-shadow: 0 0 60px rgba(200, 169, 110, 0.3) !important;
    }

    .rarity-badge { font-size: 1.1rem; margin-bottom: 0.5rem; display: block; }
    .stars-3 { color: #7aa2d4; }
    .stars-4 { color: #c39bd3; }
    .stars-5 { color: #C8A96E; text-shadow: 0 0 15px rgba(200,169,110,0.8); }

    hr { border-color: #2a2a45 !important; }

    .stProgress > div > div > div {
        background: linear-gradient(90deg, #8B6914, #C8A96E) !important;
    }

    .inv-item {
        background: #13131F;
        border: 1px solid #2a2a45;
        border-radius: 10px;
        padding: 0.8rem 1rem;
        margin-bottom: 0.5rem;
        font-size: 0.85rem;
    }
    .inv-item-5 { border-left: 3px solid #C8A96E; }
    .inv-item-4 { border-left: 3px solid #c39bd3; }
    .inv-item-3 { border-left: 3px solid #7aa2d4; }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
    }

    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: #0D0D14; }
    ::-webkit-scrollbar-thumb { background: #2a2a45; border-radius: 3px; }
    </style>
    """, unsafe_allow_html=True)


# ─────────────────────────────────────────────────────────────
# GACHA LOGIC
# ─────────────────────────────────────────────────────────────
def calculate_five_star_weight(pity: int) -> float:
    if pity >= HARD_PITY:
        return 1000
    if pity >= SOFT_PITY:
        ramp = (pity - SOFT_PITY) / (HARD_PITY - SOFT_PITY)
        return BASE_WEIGHT_5 + ramp * (950 - BASE_WEIGHT_5)
    return BASE_WEIGHT_5


def determine_rarity(pity_counter: int, guaranteed_4star: int) -> int:
    w5 = calculate_five_star_weight(pity_counter)
    if guaranteed_4star >= 9 and w5 < 1000:
        roll = random.randint(1, 1000)
        return 5 if roll <= w5 else 4
    w4 = BASE_WEIGHT_4
    roll = random.randint(1, 1000)
    if roll <= w5:
        return 5
    elif roll <= w5 + w4:
        return 4
    return 3


def pick_item(rarity: int, data: dict, pulled_ids: list) -> dict:
    pool_key = {3: "three_star", 4: "four_star", 5: "five_star"}[rarity]
    pool = data[pool_key]
    fresh = [i for i in pool if i["id"] not in pulled_ids]
    return random.choice(fresh if fresh else pool)


def do_pull(state: dict, data: dict) -> tuple[dict, dict]:
    state["tickets"] -= 1
    rarity = determine_rarity(state["pity_counter"], state["guaranteed_4star"])

    if rarity == 5:
        state["pity_counter"] = 0
        state["guaranteed_4star"] = 0
    else:
        state["pity_counter"] += 1
        if rarity == 4:
            state["guaranteed_4star"] = 0
        else:
            state["guaranteed_4star"] += 1

    item = pick_item(rarity, data, state["pulled_ids"])
    state["pulled_ids"].append(item["id"])
    state["inventory"].append({
        "id":        item["id"],
        "rarity":    rarity,
        "title":     item.get("title", "Unknown"),
        "timestamp": datetime.now().isoformat()
    })
    return state, item


# ─────────────────────────────────────────────────────────────
# UI COMPONENTS
# ─────────────────────────────────────────────────────────────

# ─────────────────────────────────────────────────────────────
# WARP ANIMATION ENGINE
# ─────────────────────────────────────────────────────────────
def build_warp_engine(item: dict, rarity: int) -> str:
    """
    Returns a fully self-contained HTML string that runs the complete
    multi-phase warp animation + audio sequence, then reveals the card.
    Phases:
      0  INITIATION   — button click, stars converge, rising tension audio
      1  TRANSIT      — shooting-star streak across black void
      2  FLASH        — rarity-coloured full-screen flash + impact sound
      3  REVEAL       — card fades in with particle field + idle glow loop
      4  IDLE         — card sits with ambient shimmer; skip available
    """
    import base64, os, json as _json

    # ── Rarity palette ──
    palette = {
        3: {
            "primary":   "#7aa2d4",
            "secondary": "#4a6fa5",
            "glow":      "74,111,165",
            "flash_col": "rgba(100,150,220,0.85)",
            "label":     "Common Memory",
            "stars":     "★★★☆☆",
            "streak":    "#a0c4f1",
        },
        4: {
            "primary":   "#c39bd3",
            "secondary": "#9b59b6",
            "glow":      "155,89,182",
            "flash_col": "rgba(180,120,220,0.9)",
            "label":     "Precious Memory",
            "stars":     "★★★★☆",
            "streak":    "#d8b4fe",
        },
        5: {
            "primary":   "#C8A96E",
            "secondary": "#f1c40f",
            "glow":      "200,169,110",
            "flash_col": "rgba(240,200,100,0.95)",
            "label":     "✦ Stellar Relic ✦",
            "stars":     "★★★★★",
            "streak":    "#ffe08a",
        },
    }[rarity]

    # ── Build card body HTML ──
    if rarity == 3:
        content   = item.get("content", "")
        card_body = f"""
        <div class="card-label">{palette['label']}</div>
        <div class="card-quote">&ldquo;{content}&rdquo;</div>
        """

    elif rarity == 4:
        caption    = item.get("caption", "")
        photo_file = item.get("photo_file", "")
        photo_path = os.path.join("assets/photos", photo_file)
        if os.path.exists(photo_path):
            with open(photo_path, "rb") as fh:
                img_b64 = base64.b64encode(fh.read()).decode()
            ext      = photo_file.rsplit(".", 1)[-1].lower()
            img_tag  = f'<img class="card-photo" src="data:image/{ext};base64,{img_b64}" alt="memory" />'
        else:
            img_tag = '<div class="card-photo-placeholder">[ photo ]</div>'
        card_body = f"""
        <div class="card-label">{palette['label']}</div>
        {img_tag}
        <div class="card-caption">&ldquo;{caption}&rdquo;</div>
        """

    else:  # 5-star
        dest  = item.get("destination", "")
        desc  = item.get("description", "")
        valid = item.get("validity", "")
        terms = item.get("terms", "")
        card_body = f"""
        <div class="card-label">{palette['label']}</div>
        <div class="card-destination">{dest}</div>
        <div class="card-voucher-box">
            <div class="card-desc">{desc}</div>
            <div class="card-validity">&#128197; {valid}</div>
            <div class="card-terms">{terms}</div>
        </div>
        """

    # ── Number of particles scales with rarity ──
    particle_count = {3: 30, 4: 55, 5: 90}[rarity]
    # ── Streak count ──
    streak_count   = {3: 8,  4: 14, 5: 22}[rarity]

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
/* ═══════════════════════════════════════════
   RESET & BASE
═══════════════════════════════════════════ */
*, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
html, body {{
  width: 100%; height: 100%;
  background: #07070f;
  overflow: hidden;
  font-family: 'Georgia', serif;
  color: #e8e4da;
  user-select: none;
}}

/* ═══════════════════════════════════════════
   STAGE LAYERS (z-index stack)
   bg-stars | streaks | flash | card | particles | ui
═══════════════════════════════════════════ */
#stage {{
  position: relative;
  width: 100vw; height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}}

/* ── Background star field ── */
#bg-canvas {{
  position: absolute;
  inset: 0;
  z-index: 0;
}}

/* ── Streak layer ── */
#streak-layer {{
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}}
.streak {{
  position: absolute;
  border-radius: 9999px;
  background: linear-gradient(90deg, {palette['streak']}, transparent);
  opacity: 0;
  transform-origin: left center;
}}

/* ── Flash overlay ── */
#flash {{
  position: absolute;
  inset: 0;
  z-index: 2;
  background: {palette['flash_col']};
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.06s ease-in;
}}

/* ── Particle canvas ── */
#particle-canvas {{
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
}}

/* ── Card wrapper ── */
#card-wrapper {{
  position: relative;
  z-index: 4;
  width: min(460px, 90vw);
  opacity: 0;
  transform: scale(0.88) translateY(24px);
  transition: opacity 0.55s cubic-bezier(.22,1,.36,1),
              transform 0.55s cubic-bezier(.22,1,.36,1);
}}
#card-wrapper.revealed {{
  opacity: 1;
  transform: scale(1) translateY(0);
}}

/* Border glow wrapper */
#card-border {{
  border-radius: 20px;
  padding: 2px;
  background: linear-gradient(135deg, {palette['primary']}, {palette['secondary']}, {palette['primary']});
  box-shadow: 0 0 0px rgba({palette['glow']}, 0);
  transition: box-shadow 1.2s ease;
}}
#card-border.glowing {{
  box-shadow: 0 0 45px rgba({palette['glow']}, 0.65),
              0 0 90px rgba({palette['glow']}, 0.3);
}}

/* Card inner */
#card-inner {{
  border-radius: 18px;
  background: {'linear-gradient(160deg,#2a1800,#3d2200)' if rarity==5
               else 'linear-gradient(160deg,#1a1230,#221840)' if rarity==4
               else 'linear-gradient(160deg,#13131F,#1a1a2a)'};
  padding: 2.2rem 2rem 2rem;
  text-align: center;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.9rem;
}}

/* ── Stars ── */
.card-stars {{
  font-size: 1.4rem;
  color: {palette['primary']};
  letter-spacing: 0.15em;
  {'text-shadow: 0 0 18px rgba(' + palette['glow'] + ',0.9);' if rarity==5 else ''}
  animation: starPulse 2.4s ease-in-out infinite;
}}
@keyframes starPulse {{
  0%,100% {{ opacity:1; }}
  50%      {{ opacity:0.65; }}
}}

/* ── Label ── */
.card-label {{
  font-size: 0.68rem;
  color: {palette['primary']};
  text-transform: uppercase;
  letter-spacing: 0.22em;
  opacity: 0.9;
}}

/* ── 3-star quote ── */
.card-quote {{
  font-size: 1.0rem;
  color: #d4d0c8;
  line-height: 1.75;
  font-style: italic;
  max-width: 360px;
}}

/* ── 4-star photo ── */
.card-photo {{
  width: 100%;
  max-width: 360px;
  border-radius: 12px;
  display: block;
  margin: 0 auto;
}}
.card-photo-placeholder {{
  width: 100%; height: 160px;
  background: #1a1a2a;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;
  font-size: 0.85rem;
}}
.card-caption {{
  font-size: 0.88rem;
  color: #c8c8e0;
  font-style: italic;
  max-width: 340px;
}}

/* ── 5-star voucher ── */
.card-destination {{
  font-size: 1.5rem;
  font-weight: bold;
  color: {palette['secondary']};
  letter-spacing: 0.05em;
}}
.card-voucher-box {{
  background: rgba({palette['glow']}, 0.08);
  border: 1px solid rgba({palette['glow']}, 0.25);
  border-radius: 12px;
  padding: 1rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  text-align: left;
  width: 100%;
}}
.card-desc    {{ font-size: 0.92rem; color: #e8d9b0; line-height: 1.65; }}
.card-validity{{ font-size: 0.72rem; color: #888; }}
.card-terms   {{ font-size: 0.68rem; color: #666; font-style: italic; }}

/* ═══════════════════════════════════════════
   UI LAYER — Skip button, tickets
═══════════════════════════════════════════ */
#ui-layer {{
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
}}
#skip-btn {{
  position: absolute;
  bottom: 2rem;
  right: 2rem;
  padding: 0.5rem 1.4rem;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 999px;
  color: #aaa;
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  cursor: pointer;
  pointer-events: all;
  opacity: 0;
  transition: opacity 0.4s ease, background 0.2s ease, color 0.2s ease;
  text-transform: uppercase;
}}
#skip-btn:hover {{
  background: rgba(255,255,255,0.14);
  color: #eee;
}}
#skip-btn.visible {{
  opacity: 1;
}}

/* Loading pulse shown during initiation phase */
#loading-ring {{
  position: absolute;
  width: 80px; height: 80px;
  border-radius: 50%;
  border: 2px solid rgba({palette['glow']}, 0.15);
  border-top-color: rgba({palette['glow']}, 0.8);
  opacity: 0;
  animation: spin 0.9s linear infinite;
  z-index: 4;
}}
#loading-ring.visible {{
  opacity: 1;
}}
@keyframes spin {{
  to {{ transform: rotate(360deg); }}
}}
</style>
</head>
<body>
<div id="stage">
  <canvas id="bg-canvas"></canvas>
  <div id="streak-layer"></div>
  <div id="flash"></div>
  <canvas id="particle-canvas"></canvas>

  <div id="loading-ring"></div>

  <div id="card-wrapper">
    <div id="card-border">
      <div id="card-inner">
        <div class="card-stars">{palette['stars']}</div>
        {card_body}
      </div>
    </div>
  </div>

  <div id="ui-layer">
    <button id="skip-btn">Skip  ▶</button>
  </div>
</div>

<script>
/* ═══════════════════════════════════════════════════════════
   CONFIG
═══════════════════════════════════════════════════════════ */
const RARITY         = {rarity};
const PRIMARY_COL    = "{palette['primary']}";
const GLOW_RGB       = "{palette['glow']}";
const STREAK_COL     = "{palette['streak']}";
const FLASH_COL      = "{palette['flash_col']}";
const PARTICLE_COUNT = {particle_count};
const STREAK_COUNT   = {streak_count};

/* ═══════════════════════════════════════════════════════════
   WEB AUDIO ENGINE
═══════════════════════════════════════════════════════════ */
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let ctx;
function getCtx() {{
  if (!ctx) ctx = new AudioCtx();
  return ctx;
}}

function playNoise(duration, gainVal, freq_lo=200, freq_hi=800) {{
  const c      = getCtx();
  const size   = c.sampleRate * duration;
  const buf    = c.createBuffer(1, size, c.sampleRate);
  const data   = buf.getChannelData(0);
  for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
  const src    = c.createBufferSource();
  src.buffer   = buf;
  const bpf    = c.createBiquadFilter();
  bpf.type     = 'bandpass';
  bpf.frequency.value = (freq_lo + freq_hi) / 2;
  bpf.Q.value  = 0.8;
  const gain   = c.createGain();
  gain.gain.setValueAtTime(gainVal, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  src.connect(bpf); bpf.connect(gain); gain.connect(c.destination);
  src.start(); src.stop(c.currentTime + duration);
}}

function playTone(freq, duration, gainVal, type='sine', fadeIn=0.01) {{
  const c    = getCtx();
  const osc  = c.createOscillator();
  const gain = c.createGain();
  osc.type   = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  gain.gain.setValueAtTime(0.0001, c.currentTime);
  gain.gain.linearRampToValueAtTime(gainVal, c.currentTime + fadeIn);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  osc.connect(gain); gain.connect(c.destination);
  osc.start(); osc.stop(c.currentTime + duration + 0.05);
}}

function playRamp(freqStart, freqEnd, duration, gainVal, type='sine') {{
  const c    = getCtx();
  const osc  = c.createOscillator();
  const gain = c.createGain();
  osc.type   = type;
  osc.frequency.setValueAtTime(freqStart, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(freqEnd, c.currentTime + duration);
  gain.gain.setValueAtTime(gainVal, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  osc.connect(gain); gain.connect(c.destination);
  osc.start(); osc.stop(c.currentTime + duration + 0.05);
}}

function audioPhase_buildup() {{
  // Rising tension: low rumble + ascending ramp
  playNoise(1.1, 0.08, 60, 200);
  playRamp(90, 320, 1.0, 0.12, 'sawtooth');
  playRamp(180, 480, 0.9, 0.07, 'sine');
}}

function audioPhase_transit() {{
  // Whoosh streak
  playNoise(0.4, 0.18, 300, 3000);
  playRamp(600, 200, 0.45, 0.15, 'sine');
}}

function audioPhase_impact_3star() {{
  playNoise(0.15, 0.22, 400, 2000);
  playTone(420, 0.6, 0.18, 'sine', 0.005);
  playTone(630, 0.4, 0.10, 'sine', 0.005);
}}

function audioPhase_impact_4star() {{
  playNoise(0.2, 0.28, 200, 2400);
  playTone(280, 0.9, 0.20, 'sine', 0.005);
  playTone(420, 0.7, 0.14, 'sine', 0.01);
  playTone(560, 0.5, 0.08, 'triangle', 0.015);
  // Choir-like shimmer
  setTimeout(() => {{
    playTone(840, 1.2, 0.09, 'sine', 0.08);
    playTone(1050, 1.0, 0.06, 'sine', 0.1);
  }}, 180);
}}

function audioPhase_impact_5star() {{
  // Heavy resonant impact
  playNoise(0.3, 0.35, 80, 1200);
  playTone(120, 2.0, 0.28, 'sine', 0.003);     // deep bell body
  playTone(240, 1.8, 0.22, 'sine', 0.003);
  playTone(360, 1.5, 0.16, 'triangle', 0.005);
  playTone(480, 1.2, 0.12, 'sine', 0.008);
  // Choir layer — delayed shimmer cascade
  [0, 80, 160, 260].forEach((ms, i) => {{
    setTimeout(() => {{
      playTone(660 + i*110, 1.8 - i*0.2, 0.10 - i*0.015, 'sine', 0.06 + i*0.02);
    }}, ms);
  }});
  // High sparkle glitter
  setTimeout(() => {{
    for (let i = 0; i < 6; i++) {{
      setTimeout(() => {{
        playTone(1800 + Math.random()*800, 0.3, 0.06, 'sine', 0.02);
      }}, i * 55);
    }}
  }}, 350);
}}

const impactFns = {{
  3: audioPhase_impact_3star,
  4: audioPhase_impact_4star,
  5: audioPhase_impact_5star,
}};

/* ═══════════════════════════════════════════════════════════
   BACKGROUND STAR FIELD
═══════════════════════════════════════════════════════════ */
const bgCanvas  = document.getElementById('bg-canvas');
const bgCtx     = bgCanvas.getContext('2d');
let stars       = [];
let bgAnimId;

function initStars() {{
  bgCanvas.width  = window.innerWidth;
  bgCanvas.height = window.innerHeight;
  stars = Array.from({{length: 180}}, () => ({{
    x: Math.random() * bgCanvas.width,
    y: Math.random() * bgCanvas.height,
    r: Math.random() * 1.4 + 0.3,
    a: Math.random(),
    speed: Math.random() * 0.008 + 0.002,
    twinkle: Math.random() * Math.PI * 2,
  }}));
}}

function drawStars(convergeFactor = 0) {{
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  const cx = bgCanvas.width / 2;
  const cy = bgCanvas.height / 2;
  stars.forEach(s => {{
    s.twinkle += s.speed;
    const alpha = s.a * (0.5 + 0.5 * Math.sin(s.twinkle));
    // During transit, stars stream toward center
    if (convergeFactor > 0) {{
      s.x += (cx - s.x) * 0.012 * convergeFactor;
      s.y += (cy - s.y) * 0.012 * convergeFactor;
    }}
    bgCtx.beginPath();
    bgCtx.arc(s.x, s.y, s.r, 0, Math.PI*2);
    bgCtx.fillStyle = `rgba(255,255,255,${{alpha}})`;
    bgCtx.fill();
  }});
}}

function animateStars(convergeFactor = 0) {{
  drawStars(convergeFactor);
  bgAnimId = requestAnimationFrame(() => animateStars(convergeFactor));
}}

/* ═══════════════════════════════════════════════════════════
   PARTICLE ENGINE
═══════════════════════════════════════════════════════════ */
const pCanvas = document.getElementById('particle-canvas');
const pCtx    = pCanvas.getContext('2d');
let particles = [];
let pAnimId;

function initParticleCanvas() {{
  pCanvas.width  = window.innerWidth;
  pCanvas.height = window.innerHeight;
}}

function spawnParticles() {{
  const cx = pCanvas.width / 2;
  const cy = pCanvas.height / 2;
  particles = Array.from({{length: PARTICLE_COUNT}}, (_, i) => {{
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.4;
    const speed = 1.5 + Math.random() * (RARITY === 5 ? 5 : RARITY === 4 ? 3.5 : 2.2);
    const size  = Math.random() * (RARITY === 5 ? 4 : 3) + 1;
    return {{
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1,
      size,
      decay: 0.012 + Math.random() * 0.015,
      color: PRIMARY_COL,
      isGold: RARITY === 5 && Math.random() > 0.4,
    }};
  }});
}}

function drawParticles() {{
  pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
  particles.forEach(p => {{
    p.x     += p.vx;
    p.y     += p.vy;
    p.vx    *= 0.97;
    p.vy    *= 0.97;
    p.alpha -= p.decay;
    if (p.alpha <= 0) return;
    pCtx.save();
    pCtx.globalAlpha = p.alpha;
    pCtx.beginPath();
    pCtx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    pCtx.fillStyle = p.isGold ? '#f1c40f' : p.color;
    if (p.alpha > 0.5) {{
      pCtx.shadowColor  = p.color;
      pCtx.shadowBlur   = 8;
    }}
    pCtx.fill();
    pCtx.restore();
  }});
  particles = particles.filter(p => p.alpha > 0);
}}

function animateParticles() {{
  drawParticles();
  if (particles.length > 0) {{
    pAnimId = requestAnimationFrame(animateParticles);
  }}
}}

/* ═══════════════════════════════════════════════════════════
   STREAK ANIMATION
═══════════════════════════════════════════════════════════ */
function spawnStreaks() {{
  const layer = document.getElementById('streak-layer');
  layer.innerHTML = '';
  for (let i = 0; i < STREAK_COUNT; i++) {{
    const el     = document.createElement('div');
    el.className = 'streak';
    const w      = 80 + Math.random() * 180;
    const h      = Math.random() * 2.5 + 0.5;
    const angle  = -15 + Math.random() * 30;
    const top    = Math.random() * 100;
    const left   = -10;
    const delay  = Math.random() * 0.35;
    const dur    = 0.3 + Math.random() * 0.25;
    el.style.cssText = [
      `width:${{w}}px`, `height:${{h}}px`,
      `top:${{top}}vh`, `left:${{left}}vw`,
      `transform:rotate(${{angle}}deg)`,
      `background:linear-gradient(90deg,${{STREAK_COL}},transparent)`,
      `animation: streakAnim ${{dur}}s ${{delay}}s ease-out forwards`,
    ].join(';');
    layer.appendChild(el);
  }}
  // Inject keyframes once
  if (!document.getElementById('streak-kf')) {{
    const style = document.createElement('style');
    style.id = 'streak-kf';
    style.textContent = `
      @keyframes streakAnim {{
        0%   {{ opacity:0; transform: translateX(0) rotate(var(--a,0deg)); }}
        15%  {{ opacity:1; }}
        100% {{ opacity:0; transform: translateX(115vw) rotate(var(--a,0deg)); }}
      }}
    `;
    document.head.appendChild(style);
  }}
}}

/* ═══════════════════════════════════════════════════════════
   FLASH
═══════════════════════════════════════════════════════════ */
function triggerFlash(duration=80) {{
  const flash = document.getElementById('flash');
  flash.style.transition = 'none';
  flash.style.opacity    = '1';
  setTimeout(() => {{
    flash.style.transition = `opacity ${{duration * 8}}ms ease-out`;
    flash.style.opacity    = '0';
  }}, duration);
}}

/* ═══════════════════════════════════════════════════════════
   PHASE SEQUENCER
═══════════════════════════════════════════════════════════ */
let phase = 'idle';

function runSequence() {{
  // ── PHASE 0: INITIATION (0ms) ──
  phase = 'initiation';
  getCtx(); // unlock audio context on user gesture
  audioPhase_buildup();
  document.getElementById('loading-ring').classList.add('visible');
  animateStars(0);
  initParticleCanvas();

  // ── PHASE 1: TRANSIT (1100ms) ──
  setTimeout(() => {{
    phase = 'transit';
    document.getElementById('loading-ring').classList.remove('visible');
    audioPhase_transit();
    spawnStreaks();
    cancelAnimationFrame(bgAnimId);
    // Stars converge during transit
    let convAnim;
    const startConv = () => {{
      drawStars(1);
      convAnim = requestAnimationFrame(startConv);
    }};
    startConv();
    setTimeout(() => cancelAnimationFrame(convAnim), 450);

    // ── PHASE 2: FLASH + IMPACT (1500ms) ──
    setTimeout(() => {{
      phase = 'flash';
      triggerFlash(RARITY === 5 ? 120 : 70);
      impactFns[RARITY]();
      spawnParticles();
      animateParticles();

      // ── PHASE 3: REVEAL (1650ms) ──
      setTimeout(() => {{
        phase = 'reveal';
        const wrapper = document.getElementById('card-wrapper');
        const border  = document.getElementById('card-border');
        wrapper.classList.add('revealed');
        setTimeout(() => border.classList.add('glowing'), 400);

        // Show skip button
        setTimeout(() => {{
          document.getElementById('skip-btn').classList.add('visible');
        }}, 600);

        // ── PHASE 4: IDLE ambient ──
        animateStars(0);

      }}, 150);
    }}, 400);
  }}, 1100);
}}

/* ═══════════════════════════════════════════════════════════
   SKIP BUTTON
═══════════════════════════════════════════════════════════ */
document.getElementById('skip-btn').addEventListener('click', () => {{
  // Snap everything to final reveal state instantly
  cancelAnimationFrame(bgAnimId);
  cancelAnimationFrame(pAnimId);
  const wrapper = document.getElementById('card-wrapper');
  const border  = document.getElementById('card-border');
  wrapper.style.transition = 'none';
  wrapper.classList.add('revealed');
  border.classList.add('glowing');
  document.getElementById('flash').style.opacity = '0';
  document.getElementById('loading-ring').classList.remove('visible');
  document.getElementById('streak-layer').innerHTML = '';
  particles = [];
  pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
  animateStars(0);
}});

/* ═══════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════ */
window.addEventListener('resize', () => {{
  initStars();
  initParticleCanvas();
}});
initStars();
runSequence();
</script>
</body>
</html>"""

    return html


def render_pity_info(pity: int):
    progress = min(pity / HARD_PITY, 1.0)
    label    = f"Pity: {pity}/{HARD_PITY}"
    if pity >= SOFT_PITY:
        label += " ✨ Soft pity active"
    st.progress(progress, text=label)


# ─────────────────────────────────────────────────────────────
# MAIN APP
# ─────────────────────────────────────────────────────────────
def main():
    st.set_page_config(page_title="Warp System · Anniversary", page_icon="✨", layout="centered")
    inject_css()

    # ── Bootstrap session ──
    if "state" not in st.session_state:
        st.session_state.state = load_state()
    if "last_pull" not in st.session_state:
        st.session_state.last_pull = None
    if "data" not in st.session_state:
        try:
            st.session_state.data = load_data()
        except FileNotFoundError:
            st.error("data.json not found. Place it in the same folder as app.py.")
            st.stop()

    st.session_state.state = refill_tickets_if_new_day(st.session_state.state)
    state = st.session_state.state
    data  = st.session_state.data

    # ── Header ──
    st.markdown("<h1 style='text-align:center;'>✦ WARP SYSTEM ✦</h1>", unsafe_allow_html=True)
    st.markdown(
        "<p style='text-align:center;color:#9090b0;font-size:0.8rem;letter-spacing:0.2em;'>ANNIVERSARY EDITION · ASTRAL EXPRESS</p>",
        unsafe_allow_html=True
    )
    st.markdown("---")

    # ── Stats ──
    col1, col2, col3 = st.columns(3)
    col1.metric("🎫 Tickets",     state["tickets"],   f"Resets daily ({TICKETS_PER_DAY}/day)")
    col2.metric("💫 Total Pulls", len(state["inventory"]))
    col3.metric("🌟 5-Stars",     sum(1 for i in state["inventory"] if i["rarity"] == 5))

    st.markdown("<br>", unsafe_allow_html=True)
    render_pity_info(state["pity_counter"])
    st.markdown("---")

    # ── Tabs ──
    tabs = st.tabs(["✦ Warp", "📦 Inventory"])

    with tabs[0]:
        st.markdown("<br>", unsafe_allow_html=True)
        no_tickets = state["tickets"] <= 0
        pull_btn   = st.button(
            "▶  WARP  ×1" if not no_tickets else "No tickets — come back tomorrow",
            disabled=no_tickets,
            use_container_width=True
        )
        if no_tickets:
            st.info(f"You've used all {TICKETS_PER_DAY} tickets for today. See you tomorrow. 💙")

        if pull_btn and not no_tickets:
            # Compute pull server-side (no spinner — engine handles visuals)
            st.session_state.state, item = do_pull(st.session_state.state, data)
            save_state(st.session_state.state)
            pulled_rarity = st.session_state.state["inventory"][-1]["rarity"]
            st.session_state.last_pull = (item, pulled_rarity)
            st.session_state.fresh_pull = True   # signals the engine to autoplay
            st.rerun()

        if st.session_state.last_pull:
            import streamlit.components.v1 as components
            item, rarity = st.session_state.last_pull
            # Build and render the full-viewport animation engine
            warp_html = build_warp_engine(item, rarity)
            # Height: tall enough for the card, short enough to not overflow Streamlit
            height = {3: 480, 4: 700, 5: 580}[rarity]
            components.html(warp_html, height=height, scrolling=False)
            st.session_state.fresh_pull = False

        with st.expander("ℹ️  How the warp system works"):
            st.markdown(f"""
            - **{TICKETS_PER_DAY} warp tickets per day**, refilling at midnight.
            - **3★ — Common Memories:** Daily affirmations.
            - **4★ — Precious Memories:** Photo fragments. (~5% base rate)
            - **5★ — Stellar Relics:** Date vouchers. (~0.6% base rate)
            - Soft pity at pull {SOFT_PITY}. Hard pity (guaranteed) at pull {HARD_PITY}.
            - 4★ guaranteed within every 10 pulls.
            """)

    with tabs[1]:
        st.markdown("<br>", unsafe_allow_html=True)
        if not state["inventory"]:
            st.markdown("<p style='text-align:center;color:#555;'>Nothing here yet. Go warp something.</p>", unsafe_allow_html=True)
        else:
            for entry in reversed(state["inventory"]):
                r     = entry["rarity"]
                color = {3: "#7aa2d4", 4: "#c39bd3", 5: "#C8A96E"}[r]
                ts    = entry["timestamp"][:10]
                st.markdown(f"""
                <div class="inv-item inv-item-{r}">
                    <span style="color:{color};font-size:0.8rem;">{"★" * r}</span>
                    <span style="color:#c8c8e0;margin-left:0.5rem;">{entry['title']}</span>
                    <span style="color:#444;float:right;font-size:0.75rem;">{ts}</span>
                </div>
                """, unsafe_allow_html=True)

    st.markdown("---")
    st.markdown(
        "<p style='text-align:center;color:#333;font-size:0.7rem;letter-spacing:0.1em;'>MADE WITH INTENT · NOT FROM A TEMPLATE</p>",
        unsafe_allow_html=True
    )


if __name__ == "__main__":
    main()
