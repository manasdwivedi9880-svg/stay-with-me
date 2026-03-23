/**
 * StayWithMe.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * A modular, white-minimalist "Stay With Me" full-screen overlay component.
 *
 * ARCHITECTURE:
 *   • State 1 (isPlayerActive = false): Breathing Orb
 *     - Soft glowing circle with 8-second breathe animation.
 *     - Auto-transitions to State 2 after 3 000 ms.
 *
 *   • State 2 (isPlayerActive = true): Minimalist Player
 *     - SVG circular progress ring (static at 0% — socket ready for Howler.js).
 *     - Tap / drag on ring → audioSocket.onSeek(0–1).
 *     - Center play / pause toggle → audioSocket.onPlay() / onPause().
 *
 * AUDIO SOCKET (developer handoff):
 *   Replace the console.log bodies below with your Howler.js calls.
 *
 * UI NOTES:
 *   - State 1 → State 2 uses a 2-second cross-fade (opacity transition).
 *   - State 2 background: radial gradient + base64 grain texture + centered aura.
 *   - All visual changes are CSS-only; no logic has been modified.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useCallback, useEffect, useRef, useState } from "react";

// ─── Audio Socket ─────────────────────────────────────────────────────────────
// TODO (developer): replace these stubs with Howler.js integration.
const audioSocket = {
  onPlay: () => console.log("Audio Start Triggered"),
  onPause: () => console.log("Audio Pause Triggered"),
  onSeek: (value) => console.log(`Seeking to: ${value}`),
};

// ─── Constants ────────────────────────────────────────────────────────────────
const RING_RADIUS = 120; // SVG units
const RING_STROKE = 8; // px
const VIEWBOX_SIZE = 300; // SVG viewBox width & height
const CENTER = VIEWBOX_SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const PROGRESS_PERCENT = 0; // Static at 0% — wire this to Howler later

// ─── Base64-encoded inline SVG noise pattern (self-contained, no external assets)
//     feTurbulence fractalNoise creates a natural paper/grain texture.
const GRAIN_TEXTURE_B64 =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC42NSIgbnVtT2N0YXZlcz0iMyIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWx0ZXI9InVybCgjbikiIG9wYWNpdHk9IjEiLz48L3N2Zz4=";

// ─── Progress Ring ────────────────────────────────────────────────────────────
function ProgressRing({ onSeek }) {
  const svgRef = useRef(null);
  const isDragging = useRef(false);

  /** Convert a pointer/touch position to a 0–1 seek value. */
  const positionToProgress = useCallback((clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const x = clientX - rect.left - rect.width / 2;
    const y = clientY - rect.top - rect.height / 2;
    // Angle from top (12 o'clock), clockwise
    let angle = Math.atan2(x, -y); // radians, −π … π
    if (angle < 0) angle += 2 * Math.PI;
    return angle / (2 * Math.PI); // normalise to 0–1
  }, []);

  const handleSeek = useCallback(
    (clientX, clientY) => {
      const value = positionToProgress(clientX, clientY);
      if (value !== null) onSeek(value);
    },
    [positionToProgress, onSeek],
  );

  // ── Pointer events (mouse + stylus) ──
  const onPointerDown = (e) => {
    isDragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    handleSeek(e.clientX, e.clientY);
  };
  const onPointerMove = (e) => {
    if (!isDragging.current) return;
    handleSeek(e.clientX, e.clientY);
  };
  const onPointerUp = () => {
    isDragging.current = false;
  };

  // ── Touch events (mobile) ──
  const onTouchStart = (e) => {
    const t = e.touches[0];
    handleSeek(t.clientX, t.clientY);
  };
  const onTouchMove = (e) => {
    e.preventDefault(); // prevent scroll hijack
    const t = e.touches[0];
    handleSeek(t.clientX, t.clientY);
  };

  const dashOffset = CIRCUMFERENCE * (1 - PROGRESS_PERCENT / 100);

  return (
    <svg
      ref={svgRef}
      role="img"
      aria-label="Seek ring — drag to seek"
      viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
      width="300"
      height="300"
      style={{ touchAction: "none", cursor: "pointer" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      data-ocid="player.canvas_target"
    >
      {/* Track ring — soft white/translucent against the blue background */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={RING_RADIUS}
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth={RING_STROKE}
      />
      {/* Progress arc — starts at 12 o'clock */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={RING_RADIUS}
        fill="none"
        stroke="#3B82F6"
        strokeWidth={RING_STROKE}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${CENTER} ${CENTER})`}
        style={{ transition: "stroke-dashoffset 0.3s ease" }}
      />
    </svg>
  );
}

// ─── Play / Pause Icon ────────────────────────────────────────────────────────
// Fill updated to deep charcoal #0F172A for maximum contrast on the blue bg.
function PlayPauseIcon({ isPlaying }) {
  if (isPlaying) {
    return (
      <svg
        width="28"
        height="32"
        viewBox="0 0 28 32"
        fill="none"
        aria-hidden="true"
      >
        <rect x="2" y="2" width="9" height="28" rx="2" fill="#0F172A" />
        <rect x="17" y="2" width="9" height="28" rx="2" fill="#0F172A" />
      </svg>
    );
  }
  return (
    <svg
      width="28"
      height="32"
      viewBox="0 0 28 32"
      fill="none"
      aria-hidden="true"
    >
      <path d="M4 2L26 16L4 30V2Z" fill="#0F172A" />
    </svg>
  );
}

// ─── State 1: Breathing Orb ───────────────────────────────────────────────────
function BreathingOrb() {
  return (
    <div className="flex flex-col items-center gap-10" aria-live="polite">
      {/* Glowing orb — Solid Minimalist Blue */}
      <div
        className="animate-breathe"
        style={{
          width: "260px",
          height: "260px",
          borderRadius: "50%",
          background: "#3B82F6",
          boxShadow: "0 0 40px rgba(59, 130, 246, 0.5)",
        }}
        aria-hidden="true"
      />
      {/* Tagline */}
      <p
        className="animate-fade-in text-center px-6 text-xl leading-relaxed"
        style={{
          color: "#3B3B3B",
          animationDelay: "0.4s",
          maxWidth: "480px",
          fontWeight: 200,
          letterSpacing: "0.04em",
        }}
      >
        forget everything, just stay here for sometimes
      </p>
    </div>
  );
}

// ─── State 2: Minimalist Player ───────────────────────────────────────────────
function MinimalistPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayPause = () => {
    if (isPlaying) {
      audioSocket.onPause();
    } else {
      audioSocket.onPlay();
    }
    setIsPlaying((prev) => !prev);
  };

  return (
    <div className="flex items-center justify-center" aria-label="Audio player">
      {/*
       * Frosted glass ring wrapper.
       * backdrop-filter gives the glass feel against the blue gradient bg.
       * box-shadow creates the floating depth effect.
       */}
      <div
        style={{
          position: "relative",
          width: 300,
          height: 300,
          borderRadius: "50%",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          boxShadow:
            "0 8px 48px rgba(59, 130, 246, 0.18), 0 2px 12px rgba(0,0,0,0.06)",
        }}
      >
        <ProgressRing onSeek={audioSocket.onSeek} />

        {/* Centred play/pause button */}
        <button
          type="button"
          onClick={handlePlayPause}
          aria-label={isPlaying ? "Pause" : "Play"}
          data-ocid="player.toggle"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "opacity 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.65";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        >
          <PlayPauseIcon isPlaying={isPlaying} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StayWithMe() {
  const [isPlayerActive, setIsPlayerActive] = useState(false);

  /** Auto-transition from orb → player after 3 000 ms */
  useEffect(() => {
    if (isPlayerActive) return;
    const timer = setTimeout(() => setIsPlayerActive(true), 3000);
    return () => clearTimeout(timer);
  }, [isPlayerActive]);

  return (
    <div
      aria-label="Stay With Me — focus overlay"
      data-ocid="staywithme.modal"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        overflow: "hidden",
      }}
    >
      {/* ── Layer 1: White base (always present) ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "#FFFFFF",
        }}
      />

      {/* ── Layer 2: Blue radial gradient — fades in with player (2s) ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, #E0F2FE 0%, #BAE6FD 100%)",
          opacity: isPlayerActive ? 1 : 0,
          transition: "opacity 2s ease-in-out",
        }}
      />

      {/*
       * ── Layer 3: Paper/grain texture overlay ──
       * Base64-encoded inline SVG feTurbulence noise — 100% self-contained.
       * Opacity kept at 0.03 for a very subtle, paper-like organic feel.
       */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("${GRAIN_TEXTURE_B64}")`,
          backgroundRepeat: "repeat",
          backgroundSize: "200px 200px",
          opacity: isPlayerActive ? 0.03 : 0,
          transition: "opacity 2s ease-in-out",
        }}
      />

      {/*
       * ── Layer 4: Centered aura glow ──
       * Acts as a visual "atmosphere" anchor — does NOT follow the ring.
       * Pulses gently with sanctuaryPulse (12s, ease-in-out) for a deep-breath feel.
       */}
      <div
        aria-hidden="true"
        className="sanctuary-aura"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          // NOTE: transform is set by the CSS animation (sanctuaryPulse),
          // which starts at translate(-50%,-50%) scale(1) so it stays centered.
          width: "520px",
          height: "520px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.65) 0%, rgba(186,230,253,0.35) 55%, transparent 100%)",
          filter: "blur(56px)",
          opacity: isPlayerActive ? 0.4 : 0,
          transition: "opacity 2s ease-in-out",
          pointerEvents: "none",
        }}
      />

      {/* ── Content layer ── */}
      <main
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        {/*
         * Cross-fade between State 1 and State 2 via opacity + pointer-events.
         * Both are always mounted; the inactive state fades out over 2s.
         * This avoids a jarring snap between the white orb and the blue player.
         */}
        <div
          style={{
            position: "absolute",
            opacity: isPlayerActive ? 0 : 1,
            transition: "opacity 2s ease-in-out",
            pointerEvents: isPlayerActive ? "none" : "auto",
          }}
        >
          <BreathingOrb />
        </div>

        <div
          style={{
            position: "absolute",
            opacity: isPlayerActive ? 1 : 0,
            transition: "opacity 2s ease-in-out",
            pointerEvents: isPlayerActive ? "auto" : "none",
          }}
        >
          <MinimalistPlayer />
        </div>
      </main>
    </div>
  );
}
