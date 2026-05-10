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
def render_result_card(item: dict, rarity: int):
    import base64
    import streamlit.components.v1 as components

    star_str     = "★" * rarity + "☆" * (5 - rarity)
    rarity_label = {3: "Common Memory", 4: "Precious Memory", 5: "⭐ Stellar Relic ⭐"}[rarity]

    border_grad = {
        3: "linear-gradient(135deg,#4a6fa5,#7aa2d4)",
        4: "linear-gradient(135deg,#9b59b6,#c39bd3)",
        5: "linear-gradient(135deg,#f39c12,#C8A96E,#f1c40f)",
    }[rarity]
    bg_grad = {
        3: "linear-gradient(160deg,#13131F,#1a1a2a)",
        4: "linear-gradient(160deg,#1a1230,#221840)",
        5: "linear-gradient(160deg,#2a1800,#3d2200)",
    }[rarity]
    label_color = {3: "#7aa2d4", 4: "#c39bd3", 5: "#C8A96E"}[rarity]
    star_color  = {3: "#7aa2d4", 4: "#c39bd3", 5: "#C8A96E"}[rarity]
    glow        = "0 0 60px rgba(200,169,110,0.35)" if rarity == 5 else "none"

    if rarity == 3:
        content = item.get("content", "")
        body_html = (
            f'<p style="font-size:0.72rem;color:{label_color};text-transform:uppercase;'
            f'letter-spacing:0.14em;margin:0 0 1rem 0;">{rarity_label}</p>'
            f'<p style="font-size:1rem;color:#c8c8e0;line-height:1.75;font-style:italic;'
            f'font-family:Georgia,serif;margin:0;">&ldquo;{content}&rdquo;</p>'
        )

    elif rarity == 4:
        caption    = item.get("caption", "")
        photo_file = item.get("photo_file", "")
        photo_path = os.path.join(PHOTOS_DIR, photo_file)
        if os.path.exists(photo_path):
            with open(photo_path, "rb") as f:
                img_b64 = base64.b64encode(f.read()).decode()
            ext      = photo_file.rsplit(".", 1)[-1].lower()
            img_html = (
                f'<img src="data:image/{ext};base64,{img_b64}" '
                f'style="max-width:100%;border-radius:10px;margin:1rem 0 0.75rem 0;display:block;" />'
            )
        else:
            img_html = (
                '<div style="height:140px;background:#1a1a2a;border-radius:10px;'
                'display:flex;align-items:center;justify-content:center;'
                'color:#555;font-size:0.8rem;margin:1rem 0;">'
                '[ Add photo to assets/photos/ ]</div>'
            )
        body_html = (
            f'<p style="font-size:0.72rem;color:{label_color};text-transform:uppercase;'
            f'letter-spacing:0.14em;margin:0 0 0.5rem 0;">{rarity_label}</p>'
            f'{img_html}'
            f'<p style="font-size:0.9rem;color:#c8c8e0;font-style:italic;'
            f'font-family:Georgia,serif;margin:0;">&ldquo;{caption}&rdquo;</p>'
        )

    else:
        destination = item.get("destination", "")
        description = item.get("description", "")
        validity    = item.get("validity", "")
        terms       = item.get("terms", "")
        body_html = (
            f'<p style="font-size:0.72rem;color:{label_color};text-transform:uppercase;'
            f'letter-spacing:0.14em;margin:0 0 0.5rem 0;">{rarity_label}</p>'
            f'<p style="font-family:Georgia,serif;font-size:1.35rem;color:#f1c40f;'
            f'margin:0.4rem 0 1rem 0;font-weight:bold;">{destination}</p>'
            f'<div style="background:rgba(200,169,110,0.08);border:1px solid rgba(200,169,110,0.25);'
            f'border-radius:10px;padding:1rem 1.1rem;">'
            f'<p style="color:#e8d9b0;font-size:0.95rem;line-height:1.7;margin:0 0 0.6rem 0;">{description}</p>'
            f'<p style="color:#888;font-size:0.75rem;margin:0 0 0.3rem 0;">&#128197; {validity}</p>'
            f'<p style="color:#666;font-size:0.7rem;font-style:italic;margin:0;">*{terms}*</p>'
            f'</div>'
        )

    glow_css = "text-shadow: 0 0 12px rgba(200,169,110,0.9);" if rarity == 5 else ""
    card_html = f"""<!DOCTYPE html>
<html><head>
<style>
  body {{ margin:0; padding:0; background:transparent; }}
  @keyframes fadeIn {{ from {{ opacity:0; transform:translateY(16px); }} to {{ opacity:1; transform:translateY(0); }} }}
  .wrap {{ border-radius:17px; padding:1.5px; background:{border_grad}; animation:fadeIn 0.55s ease; }}
  .card {{ background:{bg_grad}; border-radius:16px; padding:1.8rem 2rem; text-align:center; box-shadow:{glow}; }}
  .stars {{ font-size:1.15rem; color:{star_color}; {glow_css} display:block; margin-bottom:0.9rem; letter-spacing:0.1em; }}
</style></head>
<body>
  <div class="wrap"><div class="card">
    <span class="stars">{star_str}</span>
    {body_html}
  </div></div>
</body></html>"""

    height = {3: 210, 4: 480, 5: 310}[rarity]
    components.html(card_html, height=height, scrolling=False)



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
            with st.spinner("Initiating warp sequence..."):
                time.sleep(0.8)
            st.session_state.state, item = do_pull(st.session_state.state, data)
            save_state(st.session_state.state)          # ← writes to Supabase
            st.session_state.last_pull = (item, st.session_state.state["inventory"][-1]["rarity"])
            st.rerun()

        if st.session_state.last_pull:
            item, rarity = st.session_state.last_pull
            flavor = {
                3: "A signal from the past drifts in...",
                4: "A memory crystallizes from the void.",
                5: "The stars align. Something extraordinary emerges."
            }[rarity]
            st.markdown(
                f"<p style='text-align:center;color:#9090b0;font-style:italic;font-size:0.85rem;'>{flavor}</p>",
                unsafe_allow_html=True
            )
            render_result_card(item, rarity)

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
