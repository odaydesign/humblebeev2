"use client";

import * as React from "react";

// Every sound is a note from one C-major pentatonic scale, so they're always
// in harmony with each other (a pentatonic has no dissonant intervals).
// C3 D3 E3 G3 A3 C4 D4 E4 G4
const SCALE = [130.81, 146.83, 164.81, 196.0, 220.0, 261.63, 293.66, 329.63, 392.0];
const note = (i: number) => SCALE[Math.max(0, Math.min(SCALE.length - 1, i))];
const pick = (lo: number, hi: number) => note(lo + Math.floor(Math.random() * (hi - lo + 1)));

type Blip = {
  freq: number;
  to?: number; // optional pitch glide target
  gain?: number;
  attack?: number;
  decay?: number;
  delay?: number; // schedule ahead, for small motifs
};

// Synthesised with Web Audio so there's no asset to download. Browsers block
// audio until a user gesture, so the context is unlocked on the first
// pointer/keydown; anything scheduled before that stays silent.
export function useTypingSound() {
  const ctxRef = React.useRef<AudioContext | null>(null);
  const mutedRef = React.useRef(false);
  const [muted, setMuted] = React.useState(false);

  React.useEffect(() => {
    try {
      if (localStorage.getItem("hb-typing-muted") === "1") {
        setMuted(true);
        mutedRef.current = true;
      }
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    // Create the context at mount — it stays suspended until a gesture, but
    // having it built means the first note only pays resume(), not the
    // constructor roundtrip. "interactive" trims the output buffer.
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (AC && !ctxRef.current) {
      try {
        ctxRef.current = new AC({ latencyHint: "interactive" });
      } catch {
        ctxRef.current = new AC();
      }
    }
    const unlock = () => void ctxRef.current?.resume();
    window.addEventListener("pointerdown", unlock);
    // capture phase: resume starts before the input's own keydown handler
    // plays its note, so the first keystroke isn't silent
    window.addEventListener("keydown", unlock, { capture: true });
    window.addEventListener("touchstart", unlock);
    const onVis = () => {
      if (document.visibilityState === "visible") unlock();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock, { capture: true });
      window.removeEventListener("touchstart", unlock);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const blip = React.useCallback((o: Blip) => {
    if (mutedRef.current) return;
    let c = ctxRef.current;
    if (!c) {
      // create lazily so the note that triggered the gesture isn't dropped
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return;
      try {
        c = ctxRef.current = new AC({ latencyHint: "interactive" });
      } catch {
        c = ctxRef.current = new AC();
      }
    }
    // Suspended (gesture just happened, resume still in flight): schedule
    // anyway — currentTime is frozen while suspended, so the note lands the
    // moment the context resumes instead of being silently dropped.
    if (c.state !== "running") void c.resume();
    const { freq, to, gain = 0.03, attack = 0.012, decay = 0.11, delay = 0 } = o;
    const t = c.currentTime + delay;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "sine"; // pure + smooth
    osc.frequency.setValueAtTime(freq, t);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, t + decay * 0.85);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    osc.connect(g).connect(c.destination);
    osc.start(t);
    osc.stop(t + decay + 0.03);
  }, []);

  const sound = React.useMemo(
    () => ({
      // user typing — low, soft pips
      key: () => blip({ freq: pick(0, 4), gain: 0.024, decay: 0.1 }),
      // delete — a soft downward step
      del: () => blip({ freq: note(2), to: note(0), gain: 0.024, decay: 0.1 }),
      // submit — a gentle two-note rise (G3 → C4)
      enter: () => {
        blip({ freq: note(3), gain: 0.03, decay: 0.12 });
        blip({ freq: note(5), gain: 0.03, decay: 0.16, delay: 0.075 });
      },
      // AI starts answering — one soft, longer note
      aiStart: () => blip({ freq: note(5), gain: 0.026, decay: 0.22 }),
      // AI typing — mid register, distinct from the user but in key
      aiType: () => blip({ freq: pick(4, 6), gain: 0.02, decay: 0.1 }),
      // boot — a soft low power-on swell as the hero wakes (C3 → G3)
      boot: () => blip({ freq: note(0), to: note(3), gain: 0.022, attack: 0.05, decay: 0.55 }),
      // dot → line — a short rising "power-on" glide (C3 → C4 octave)
      morph: () => blip({ freq: note(0), to: note(5), gain: 0.03, attack: 0.014, decay: 0.34 }),
      // greeting words — a small ascending melody
      word: (i: number) => blip({ freq: note(i % 7), gain: 0.022, decay: 0.14 }),
    }),
    [blip]
  );

  const toggleMuted = React.useCallback(() => {
    setMuted((m) => {
      const next = !m;
      mutedRef.current = next;
      try {
        localStorage.setItem("hb-typing-muted", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { sound, muted, toggleMuted };
}
