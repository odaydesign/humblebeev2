"use client";

import * as React from "react";

import {
  MARK_BAR,
  MARK_RING_INNER,
  MARK_RING_OUTER,
} from "../brand/mark-paths";
import { cn } from "../lib/utils";

const YELLOW = "#f7e731";
/** 33⅓ RPM → seconds per revolution. */
const REV_SEC = 60 / (100 / 3); // ≈ 1.8s
const TARGET_DEG_PER_MS = 360 / (REV_SEC * 1000);
const SPIN_UP_MS = 720;
const SPIN_DOWN_MS = 980;
const ARM_DROP_MS = 420;
const AUDIO_FADE_MS = 320;
const TARGET_VOLUME = 0.42;
const AUDIO_SRC = "/audio/vinyl-loop.mp3";

const mono =
  "font-mono text-[0.625rem] uppercase tracking-[0.14em] text-white/45";

/**
 * Tonearm angles (CSS clockwise) around transform-origin ≈ SVG pivot (86, 14).
 * Geometry: deck disc center (50%, 50%), radius ≈ 41%; tip length ≈ 46% of deck.
 * REST must clear the disc rim (tip + shaft outside circumference); PLAY lands
 * the stylus on mid–outer grooves. Positive = swing toward the right rest post.
 */
const ARM_REST = 50;
const ARM_PLAY = 20;

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function easeInCubic(t: number) {
  return t * t * t;
}

/** Soft mechanical settle — slight ease-in then settle. */
function armEase(t: number) {
  const c = Math.min(1, Math.max(0, t));
  // cubic-bezier-ish: ease-in then soft overshoot settle via dampened sin
  const base = c * c * (3 - 2 * c);
  const settle = Math.sin(c * Math.PI) * 0.04 * (1 - c);
  return Math.min(1, base + settle);
}

type VinylPlayerCardProps = {
  /** Gallery focus — when false, stop audio/spin so sound never surprises. */
  focused?: boolean;
};

/**
 * Super-minimal top-view turntable.
 * Play = click while hovered; leave the card (or click again) always
 * resets to idle — arm up, spin down, silent. Hover alone never starts audio.
 */
export function VinylPlayerCard({ focused }: VinylPlayerCardProps) {
  const uid = React.useId();
  const gradId = `hb-vinyl-disc-${uid.replace(/:/g, "")}`;
  const [playing, setPlaying] = React.useState(false);
  const [armDown, setArmDown] = React.useState(false);
  const [reduceMotion, setReduceMotion] = React.useState(false);

  const discRef = React.useRef<HTMLDivElement>(null);
  const armRef = React.useRef<HTMLDivElement>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const playingRef = React.useRef(false);
  const focusedRef = React.useRef(!!focused);
  const hoveredRef = React.useRef(false);
  const armAngleRef = React.useRef(ARM_REST);
  const angleRef = React.useRef(0);
  const speedRef = React.useRef(0); // deg/ms
  const speedTargetRef = React.useRef(0);
  const speedFromRef = React.useRef(0);
  const speedRampStartRef = React.useRef(0);
  const speedRampDurRef = React.useRef(SPIN_UP_MS);
  const fadeRafRef = React.useRef(0);
  const armRafRef = React.useRef(0);
  const spinRafRef = React.useRef(0);
  const spinUpTimerRef = React.useRef(0);

  focusedRef.current = !!focused;
  playingRef.current = playing;

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const ensureAudio = React.useCallback(() => {
    if (audioRef.current) return audioRef.current;
    const el = new Audio(AUDIO_SRC);
    el.loop = true;
    el.preload = "auto";
    el.volume = 0;
    audioRef.current = el;
    return el;
  }, []);

  const fadeVolume = React.useCallback((to: number, ms: number) => {
    const el = audioRef.current;
    if (!el) return Promise.resolve();
    cancelAnimationFrame(fadeRafRef.current);
    const from = el.volume;
    const start = performance.now();
    return new Promise<void>((resolve) => {
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / Math.max(1, ms));
        const eased = to > from ? easeInCubic(t) : easeOutCubic(t);
        el.volume = from + (to - from) * eased;
        if (t < 1) {
          fadeRafRef.current = requestAnimationFrame(tick);
        } else {
          el.volume = to;
          resolve();
        }
      };
      fadeRafRef.current = requestAnimationFrame(tick);
    });
  }, []);

  const setSpinTarget = React.useCallback((target: number, durMs: number) => {
    speedFromRef.current = speedRef.current;
    speedTargetRef.current = target;
    speedRampStartRef.current = performance.now();
    speedRampDurRef.current = Math.max(1, durMs);
  }, []);

  const animateArm = React.useCallback((down: boolean) => {
    const arm = armRef.current;
    const to = down ? ARM_PLAY : ARM_REST;
    if (!arm) {
      armAngleRef.current = to;
      setArmDown(down);
      return;
    }
    cancelAnimationFrame(armRafRef.current);
    const from = armAngleRef.current;
    const start = performance.now();
    const dur = ARM_DROP_MS;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const e = armEase(t);
      const deg = from + (to - from) * e;
      armAngleRef.current = deg;
      arm.style.transform = `rotate(${deg}deg)`;
      if (t < 1) {
        armRafRef.current = requestAnimationFrame(tick);
      } else {
        armAngleRef.current = to;
        setArmDown(down);
      }
    };
    armRafRef.current = requestAnimationFrame(tick);
  }, []);

  // Continuous spin loop — GPU-friendly translate3d/rotate on the disc.
  React.useEffect(() => {
    if (reduceMotion) {
      const disc = discRef.current;
      if (disc) disc.style.transform = "rotate(0deg)";
      return;
    }

    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(40, now - last);
      last = now;

      const rampT = Math.min(
        1,
        (now - speedRampStartRef.current) / speedRampDurRef.current,
      );
      const rampE =
        speedTargetRef.current > speedFromRef.current
          ? easeInCubic(rampT)
          : easeOutCubic(rampT);
      speedRef.current =
        speedFromRef.current +
        (speedTargetRef.current - speedFromRef.current) * rampE;

      if (Math.abs(speedRef.current) > 0.00001) {
        angleRef.current = (angleRef.current + speedRef.current * dt) % 360;
        const disc = discRef.current;
        if (disc) {
          disc.style.transform = `rotate(${angleRef.current}deg)`;
        }
      }

      spinRafRef.current = requestAnimationFrame(tick);
    };
    spinRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(spinRafRef.current);
  }, [reduceMotion]);

  const stopPlayback = React.useCallback(
    async (immediate = false) => {
      playingRef.current = false;
      setPlaying(false);
      window.clearTimeout(spinUpTimerRef.current);
      setSpinTarget(0, immediate || reduceMotion ? 80 : SPIN_DOWN_MS);
      animateArm(false);
      const el = audioRef.current;
      if (!el) return;
      if (immediate) {
        cancelAnimationFrame(fadeRafRef.current);
        el.pause();
        el.volume = 0;
        return;
      }
      await fadeVolume(0, AUDIO_FADE_MS);
      if (!playingRef.current) el.pause();
    },
    [animateArm, fadeVolume, reduceMotion, setSpinTarget],
  );

  const startPlayback = React.useCallback(async () => {
    // Playing requires click + continued presence over the card.
    if (!hoveredRef.current && !focusedRef.current) return;

    const el = ensureAudio();
    playingRef.current = true;
    setPlaying(true);
    animateArm(true);
    window.clearTimeout(spinUpTimerRef.current);
    // Needle settles, then platter ramps — small delay feels physical.
    spinUpTimerRef.current = window.setTimeout(() => {
      if (!playingRef.current) return;
      setSpinTarget(
        reduceMotion ? 0 : TARGET_DEG_PER_MS,
        reduceMotion ? 1 : SPIN_UP_MS,
      );
    }, reduceMotion ? 0 : 180);

    try {
      el.currentTime = el.currentTime || 0;
      await el.play();
      if (!playingRef.current) return;
      // Left the card while awaiting play() — abort into idle.
      if (!hoveredRef.current && !focusedRef.current) {
        void stopPlayback();
        return;
      }
      await fadeVolume(TARGET_VOLUME, AUDIO_FADE_MS);
    } catch {
      // Autoplay blocked or missing file — keep visual play state if user clicked.
    }
  }, [
    animateArm,
    ensureAudio,
    fadeVolume,
    reduceMotion,
    setSpinTarget,
    stopPlayback,
  ]);

  const toggle = React.useCallback(() => {
    if (playingRef.current) void stopPlayback();
    else void startPlayback();
  }, [startPlayback, stopPlayback]);

  /** Same idle reset as pause — used by pointer leave and marquee unfocus. */
  const resetToIdle = React.useCallback(() => {
    if (playingRef.current) void stopPlayback();
  }, [stopPlayback]);

  const onCardPointerEnter = React.useCallback(() => {
    hoveredRef.current = true;
  }, []);

  const onCardPointerLeave = React.useCallback(() => {
    hoveredRef.current = false;
    resetToIdle();
  }, [resetToIdle]);

  // Marquee strip resumed / card no longer "live" → silence + decelerate.
  React.useEffect(() => {
    if (!focused) resetToIdle();
  }, [focused, resetToIdle]);

  React.useEffect(() => {
    return () => {
      window.clearTimeout(spinUpTimerRef.current);
      cancelAnimationFrame(spinRafRef.current);
      cancelAnimationFrame(armRafRef.current);
      cancelAnimationFrame(fadeRafRef.current);
      const el = audioRef.current;
      if (el) {
        el.pause();
        el.src = "";
      }
      audioRef.current = null;
    };
  }, []);

  // Init arm pose
  React.useEffect(() => {
    const arm = armRef.current;
    if (arm) arm.style.transform = `rotate(${ARM_REST}deg)`;
  }, []);

  const grooves = React.useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const r = 18 + i * 2.35;
        return (
          <circle
            key={i}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={i % 3 === 0 ? 0.45 : 0.28}
          />
        );
      }),
    [],
  );

  return (
    <div
      className="flex h-full w-full min-h-0 flex-col overflow-hidden bg-ink text-background"
      onPointerEnter={onCardPointerEnter}
      onPointerLeave={onCardPointerLeave}
      onMouseLeave={onCardPointerLeave}
    >
      <div
        className={cn(
          "flex shrink-0 items-center gap-2 border-b border-white/10 px-3 py-2",
          mono,
        )}
      >
        <span className="flex gap-1" aria-hidden>
          <i className="size-1.5 rounded-full bg-[#ff5f57]" />
          <i className="size-1.5 rounded-full bg-[#febc2e]" />
          <i className="size-1.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="truncate">deck · vinyl</span>
        <span
          className={cn(
            "ml-auto size-1.5 rounded-full transition-colors duration-300",
            playing ? "bg-[#f7e731]" : "bg-white/15",
          )}
          aria-hidden
          title={playing ? "playing" : "stopped"}
        />
      </div>

      <div
        className={cn(
          "flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-1.5",
          mono,
        )}
      >
        <span className="text-white/55">33⅓</span>
        <span className="text-white/35">{playing ? "spin" : "cue"}</span>
        <span className="text-white/55">LP</span>
      </div>

      <button
        type="button"
        aria-pressed={playing}
        aria-label={playing ? "Pause record" : "Play record"}
        onClick={(e) => {
          e.stopPropagation();
          // Click implies the pointer is on the card (covers edge cases
          // where enter didn't fire before the press).
          hoveredRef.current = true;
          toggle();
        }}
        className="relative flex min-h-0 flex-1 cursor-pointer items-center justify-center overflow-hidden bg-[#0a0a0a] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#f7e731]/50"
      >
        {/* Deck plate */}
        <div
          className="relative aspect-square w-[82%] max-w-[16rem]"
          aria-hidden
        >
          {/* Platter shadow */}
          <div
            className="absolute inset-[6%] rounded-full"
            style={{
              background:
                "radial-gradient(circle at 42% 38%, rgba(255,255,255,0.06), transparent 55%), #111",
              boxShadow:
                "0 8px 28px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          />

          {/* Platter rim ring */}
          <div
            className="absolute inset-[5.5%] rounded-full border border-white/10"
            style={{ boxShadow: "inset 0 0 0 3px #0e0e0e" }}
          />

          {/* Spinning vinyl */}
          <div
            ref={discRef}
            className="absolute inset-[9%] will-change-transform"
            style={{ transform: "rotate(0deg)" }}
          >
            <svg viewBox="0 0 100 100" className="size-full">
              <defs>
                <radialGradient id={gradId} cx="42%" cy="38%" r="65%">
                  <stop offset="0%" stopColor="#2a2a2a" />
                  <stop offset="55%" stopColor="#121212" />
                  <stop offset="100%" stopColor="#080808" />
                </radialGradient>
              </defs>
              <circle cx="50" cy="50" r="49" fill={`url(#${gradId})`} />
              {/* Outer rim highlight */}
              <circle
                cx="50"
                cy="50"
                r="48.2"
                fill="none"
                stroke="rgba(255,255,255,0.14)"
                strokeWidth="0.7"
              />
              <circle
                cx="50"
                cy="50"
                r="47.2"
                fill="none"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="1.2"
              />
              {grooves}
              {/* Label — official Humblebee ring + bar (same geometry as footer mark) */}
              <circle cx="50" cy="50" r="14.5" fill={YELLOW} />
              <circle
                cx="50"
                cy="50"
                r="13.2"
                fill="none"
                stroke="rgba(0,0,0,0.18)"
                strokeWidth="0.5"
              />
              <g transform="translate(50 50) scale(0.168) translate(-33 -40)">
                <path
                  d={`${MARK_RING_OUTER}${MARK_RING_INNER}`}
                  fill="#0a0a0a"
                  fillRule="evenodd"
                />
                <path d={MARK_BAR} fill="#0a0a0a" />
              </g>
              {/* Spindle */}
              <circle cx="50" cy="50" r="1.6" fill="#0a0a0a" />
              <circle cx="50" cy="50" r="0.7" fill="rgba(255,255,255,0.35)" />
            </svg>
          </div>

          {/* Tonearm — pivot top-right of deck */}
          <div className="pointer-events-none absolute right-[8%] top-[10%] z-10 h-[58%] w-[42%]">
            <div
              ref={armRef}
              className="absolute inset-0 will-change-transform"
              style={{
                transformOrigin: "86% 14%",
                transform: `rotate(${ARM_REST}deg)`,
              }}
            >
              <svg viewBox="0 0 100 100" className="size-full overflow-visible">
                {/* Pivot base */}
                <circle
                  cx="86"
                  cy="14"
                  r="4.2"
                  fill="#1a1a1a"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="0.6"
                />
                <circle cx="86" cy="14" r="1.5" fill={YELLOW} opacity={playing ? 1 : 0.35} />
                {/* Arm */}
                <line
                  x1="86"
                  y1="14"
                  x2="28"
                  y2="72"
                  stroke="rgba(255,255,255,0.82)"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                />
                {/* Counterweight */}
                <rect
                  x="88"
                  y="10"
                  width="7"
                  height="8"
                  rx="1"
                  fill="rgba(255,255,255,0.55)"
                  transform="rotate(35 86 14)"
                />
                {/* Headshell + stylus */}
                <rect
                  x="22"
                  y="68"
                  width="10"
                  height="5"
                  rx="0.8"
                  fill="rgba(255,255,255,0.75)"
                  transform="rotate(-18 28 72)"
                />
                <line
                  x1="24"
                  y1="74"
                  x2="22"
                  y2="78"
                  stroke={armDown || playing ? YELLOW : "rgba(255,255,255,0.45)"}
                  strokeWidth="1.1"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Tiny cue LED under deck edge */}
          <div
            className={cn(
              "absolute bottom-[3%] left-1/2 size-1.5 -translate-x-1/2 rounded-full transition-all duration-300",
              playing
                ? "bg-[#f7e731] shadow-[0_0_8px_rgba(247,231,49,0.7)]"
                : "bg-white/15",
            )}
          />
        </div>
      </button>

      <div
        className={cn(
          "flex shrink-0 items-center justify-between gap-2 border-t border-white/10 px-3 py-1.5",
          mono,
        )}
      >
        <span className="text-white/35">
          {playing ? "click · stop · leave" : "click · play"}
        </span>
        <span className="text-white/25">turntable</span>
      </div>
    </div>
  );
}
