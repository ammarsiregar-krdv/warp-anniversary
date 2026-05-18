"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DEFAULT_STATE, PLAYER_ID } from "@/lib/constants";
import { refillIfNewDay } from "@/lib/gacha";
import type { PlayerState } from "@/lib/types";

export function usePlayerState() {
  const [state, setState] = useState<PlayerState | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Load from Supabase on mount ──
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("warp_state")
        .select("*")
        .eq("player_id", PLAYER_ID)
        .single();

      if (error || !data) {
        // First visit — insert default row
        const fresh = { ...DEFAULT_STATE };
        await supabase.from("warp_state").insert(fresh);
        setState(fresh as PlayerState);
      } else {
        setState(refillIfNewDay(data as PlayerState));
      }
      setLoading(false);
    }
    load();
  }, []);

  // ── Persist state to Supabase ──
  const persist = useCallback(async (next: PlayerState) => {
    setState(next);
    await supabase.from("warp_state").upsert(next);
  }, []);

  return { state, loading, persist };
}