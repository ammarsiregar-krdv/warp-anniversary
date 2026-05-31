"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  /** Set to true after the first confirmed user interaction (e.g. modal dismissed).
   *  Browsers allow audio autoplay once a user gesture has occurred on the page. */
  autoStart?: boolean;
}

const VIDEO_ID = "vBy7FaapGRo";
const YT_ORIGIN = "https://www.youtube.com";

export default function MusicPlayer({ autoStart = false }: Props) {
  const iframeRef   = useRef<HTMLIFrameElement>(null);
  const [playing, setPlaying]   = useState(false);
  const [visible, setVisible]   = useState(false);
  const [expanded, setExpanded] = useState(false);
  const started = useRef(false);

  // ── postMessage bridge to YouTube IFrame API ──────────────────
  function ytCmd(func: string) {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args: "" }),
      YT_ORIGIN
    );
  }

  // ── Reveal the pill after 1.2s so it doesn't flash immediately ─
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, []);

  // ── Auto-start after first user gesture (e.g. modal dismissed) ─
  useEffect(() => {
    if (!autoStart || started.current) return;
    started.current = true;
    // Brief delay to let the iframe finish loading
    const t = setTimeout(() => {
      ytCmd("playVideo");
      setPlaying(true);
    }, 700);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  function toggle() {
    if (playing) {
      ytCmd("pauseVideo");
      setPlaying(false);
    } else {
      ytCmd("playVideo");
      setPlaying(true);
    }
    // mark started so autoStart effect doesn't double-fire
    started.current = true;
  }

  const barHeights = [
    [3, 12, 6, 14, 3],
    [8, 4, 13, 5, 8],
    [5, 11, 4, 10, 5],
  ];

  return (
    <>
      {/* ── Hidden YouTube iframe (1×1 px, offscreen) ─────────── */}
      <iframe
        ref={iframeRef}
        src={`${YT_ORIGIN}/embed/${VIDEO_ID}?enablejsapi=1&loop=1&playlist=${VIDEO_ID}&controls=0&disablekb=1&modestbranding=1`}
        allow="autoplay"
        style={{
          position: "fixed",
          top:      -2,
          left:     -2,
          width:    1,
          height:   1,
          opacity:  0,
          pointerEvents: "none",
        }}
        title="Background Music"
      />

      {/* ── Floating music pill ────────────────────────────────── */}
      <AnimatePresence>
        {visible && (
          <motion.div
            className="fixed z-40"
            style={{ bottom: 20, x: "-50%", left: "50%" }}
            initial={{ y: 32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 32, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 160, delay: 0 }}
          >
            <motion.div
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-full cursor-pointer select-none"
              style={{
                background:    "rgba(7,5,20,0.88)",
                border:        "1px solid rgba(200,169,110,0.2)",
                backdropFilter:"blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
              }}
              onClick={toggle}
              onMouseEnter={() => setExpanded(true)}
              onMouseLeave={() => setExpanded(false)}
              whileHover={{
                borderColor: "rgba(200,169,110,0.45)",
                boxShadow:   "0 0 28px rgba(200,169,110,0.08)",
              }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.2 }}
            >
              {/* ── Animated bars ── */}
              <div className="flex items-end gap-[2.5px]" style={{ height: 14 }}>
                {barHeights.map((frames, i) => (
                  <motion.div
                    key={i}
                    style={{
                      width:      2.5,
                      borderRadius: 1,
                      background: "#C8A96E",
                      originY:    1,
                    }}
                    animate={
                      playing
                        ? { height: frames.map(h => `${h}px`) }
                        : { height: "3px" }
                    }
                    transition={
                      playing
                        ? {
                            duration:    0.55 + i * 0.1,
                            delay:       i * 0.13,
                            repeat:      Infinity,
                            ease:        "easeInOut",
                            repeatType:  "mirror",
                          }
                        : { duration: 0.25, ease: "easeOut" }
                    }
                  />
                ))}
              </div>

              {/* ── Song info ── */}
              <motion.div
                style={{ overflow: "hidden" }}
                animate={{ width: expanded || playing ? "auto" : "auto" }}
              >
                <p
                  className="text-[10px] font-semibold leading-none mb-0.5 whitespace-nowrap"
                  style={{ color: "#C8A96E" }}
                >
                  Best Part
                </p>
                <p
                  className="text-[8px] leading-none whitespace-nowrap"
                  style={{ color: "#4a3820" }}
                >
                  Daniel Caesar ft. H.E.R.
                </p>
              </motion.div>

              {/* ── Play / pause icon ── */}
              <motion.span
                key={playing ? "pause" : "play"}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15 }}
                style={{ color: "#C8A96E", fontSize: 8, lineHeight: 1 }}
              >
                {playing ? "⏸" : "▶"}
              </motion.span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
