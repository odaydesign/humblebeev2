"use client";

import * as React from "react";
import type { HeroSection } from "@/lib/content";
import { LINK_CARDS } from "@/lib/link-cards";

import { useTypingSound } from "./use-typing-sound";

type Role = "user" | "ai";
type OutLink = { label: string; href: string };
type Message = { id: number; role: Role; text: string; thinking?: boolean; streaming?: boolean; links?: OutLink[] };

/* Pull recommended links out of a reply — markdown links, bare internal
   paths, and the studio email all become cards; the rest is prose. */
function parseReply(raw: string): { text: string; links: OutLink[] } {
  const links: OutLink[] = [];
  let text = raw
    .replace(/\[([^\]]+)\]\(((?:\/|mailto:|https?:)[^)\s]+)\)/g, (_m, l: string, h: string) => {
      links.push({ label: l.trim(), href: h.trim() });
      return " ";
    })
    .replace(
      /(^|\s)(\/(?:programs|work|stories|events|contact|careers|hire-us|about-us|journeys|fast-track|hej)[\w/-]*)/g,
      (_m, sp: string, h: string) => {
        links.push({ label: h, href: h });
        return sp;
      }
    )
    .replace(/hello@humblebee\.se/g, () => {
      links.push({ label: "hello@humblebee.se", href: "mailto:hello@humblebee.se" });
      return " ";
    });
  const seen = new Set<string>();
  const deduped = links.filter((l) => !seen.has(l.href) && (seen.add(l.href), true)).slice(0, 3);
  const clean = text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/^- /gm, "· ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([.,!?])/g, "$1")
    .trim();
  return { text: clean, links: deduped };
}

function prettify(href: string) {
  const seg = href.split("/").filter(Boolean).pop() ?? href;
  return seg.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Simulated, on-brand replies — keyword routed, Humblebee voice (plainspoken,
// confident, anti-hype). No backend; this is a brand experience.
function replyFor(input: string): string {
  const q = input.toLowerCase();
  if (/(price|cost|budget|how much|expensive|rate)/.test(q))
    return "We scope to outcomes, not hours. Most partnerships start with a short, paid discovery so we both know it's the right fit before anyone commits. Want real numbers for your case? hello@humblebee.se.";
  if (/(fast|quick|time|how long|when|deadline|speed)/.test(q))
    return "Weeks, not quarters. We ship in slices — something real and usable lands early, then gets better every week you can watch.";
  if (/(\bai\b|intelligent|model|llm|machine learning|automat|agent)/.test(q))
    return "AI isn't a service we bolt on — it's how we build. We'll tell you honestly where it creates real value in your product, and just as honestly where it's a distraction dressed up as strategy.";
  if (/(design|brand|identity|\bux\b|\bui\b|interface)/.test(q))
    return "Design and engineering live in the same people here. No handoff, no lost intent — the detail that makes it great survives all the way to production.";
  if (/(build|product|\bapp\b|develop|engineer|software|code|platform)/.test(q))
    return "We design and build digital products end to end — research, design, engineering, launch. Real software running in your environment, doing the job.";
  if (/(who|about|you|humblebee|studio|where)/.test(q))
    return "We're Humblebee — a small, AI-native design and product studio in Gothenburg. We make intelligent products that respect the people using them.";
  if (/(contact|talk|human|email|reach|hire|start|work with|meet)/.test(q))
    return "Easiest is a real conversation: hello@humblebee.se. Tell us what you're building and we'll tell you honestly whether we're the right partner.";
  return "Good question. Short version: we're a studio that designs and builds intelligent products — fast, without dropping the craft. Ask about how we work, what we build, or how to start — or just say hello@humblebee.se.";
}

function usePrefersReducedMotion() {
  const [reduce, setReduce] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);
  return reduce;
}

const CARET_GLOW = { boxShadow: "0 0 10px color-mix(in oklch, var(--honey) 80%, transparent)" };

/* lucide icon equivalents — no dependency for three glyphs */
const IconEnter = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M9 10l-5 5 5 5" />
    <path d="M20 4v7a4 4 0 0 1-4 4H4" />
  </svg>
);
const IconVolume = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M11 5 6 9H2v6h4l5 4V5z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    <path d="M18.6 5.4a9 9 0 0 1 0 13.2" />
  </svg>
);
const IconMute = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M11 5 6 9H2v6h4l5 4V5z" />
    <path d="m22 9-6 6" />
    <path d="m16 9 6 6" />
  </svg>
);

function ThinkingDots() {
  return (
    <span className="hb-hero-think" aria-label="Thinking">
      {[0, 1, 2].map((i) => (
        <span key={i} className="think-dot" style={{ animationDelay: `${i * 0.16}s` }} />
      ))}
    </span>
  );
}

export function Hero({ section }: { section: HeroSection }) {
  const reduce = usePrefersReducedMotion();
  const { sound, muted, toggleMuted } = useTypingSound();
  const [value, setValue] = React.useState("");
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [responding, setResponding] = React.useState(false);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const threadRef = React.useRef<HTMLDivElement>(null);
  const dotRef = React.useRef<HTMLSpanElement>(null);
  const lineRef = React.useRef<HTMLSpanElement>(null);
  const timer = React.useRef<number | undefined>(undefined);
  const nextId = React.useRef(1);

  // Caret: a dot reveals + hovers, then the cursor line draws out of it.
  const [caretPhase, setCaretPhase] = React.useState<"intro" | "line">("intro");

  const chat = messages.length > 0;
  const greeting = section.heading || "What's your next move?";
  const inputLabel = section.subheading || greeting;
  const BOOT_MS = 1200; // honey glow circles, then the dot takes over

  // Keep the latest message in view.
  React.useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [messages, reduce]);

  // Ready for input from the first paint — the caret is "live".
  React.useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  // The dot reveals (fade + scale in) and hovers gently. Then the cursor LINE
  // draws itself out from the dot's centre (at its real 2px width, so nothing
  // distorts) while the dot dissolves into it. Clean, designed, no stretch.
  React.useEffect(() => {
    if (reduce) {
      setCaretPhase("line");
      return;
    }
    const dot = dotRef.current;
    const line = lineRef.current;
    if (!dot || !line) return;

    const REVEAL_MS = 460;
    const MIN_HOVER = 800; // always hover at least this long before forming
    const MAX_HOVER = 3200; // ...and form on its own by here if nothing happens
    const DRAW_MS = 460;
    const AMP = 5; // hover amplitude (px)
    const OMEGA = (2 * Math.PI) / 2.0; // a slow, calm float (~2s per cycle)

    const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
    const easeInOut = (p: number) =>
      p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

    const start = performance.now() + BOOT_MS; // hold the dot back during boot
    let raf = 0;
    let morphPlayed = false;
    let dotYAtMorph = 0;

    // The cursor "powers on" — strokes into the line and plays its startup
    // sound — on the first real interaction, which is also what unlocks audio
    // (so the sound is actually audible). Forms on its own after MAX_HOVER.
    let morphAt = REVEAL_MS + MAX_HOVER;
    let gestured = false;
    const evs = ["pointerdown", "keydown", "touchstart"];
    const onGesture = () => {
      if (gestured) return;
      gestured = true;
      // +130ms so the just-unlocked audio context is running when morph plays.
      morphAt = Math.max(REVEAL_MS + MIN_HOVER, performance.now() - start + 130);
      evs.forEach((e) => window.removeEventListener(e, onGesture));
    };
    evs.forEach((e) => window.addEventListener(e, onGesture, { passive: true }));

    const C = "translate(-50%, -50%)"; // keeps the dot + line centred on one point

    dot.style.opacity = "0";
    dot.style.transform = `${C} scale(0.5)`;
    line.style.transformOrigin = "center";
    line.style.transform = `${C} scaleY(0)`;

    const tick = (now: number) => {
      const t = now - start;

      if (t < 0) {
        // boot delay — keep the dot hidden until the power-on finishes
        dot.style.opacity = "0";
        raf = requestAnimationFrame(tick);
        return;
      }

      if (t < REVEAL_MS) {
        // reveal — fade and scale in
        const e = easeOut(t / REVEAL_MS);
        dot.style.opacity = e.toFixed(3);
        dot.style.transform = `${C} scale(${(0.5 + 0.5 * e).toFixed(3)})`;
      } else if (t < morphAt) {
        // hover — gentle float until asked to form
        const ht = (t - REVEAL_MS) / 1000;
        dot.style.opacity = "1";
        dot.style.transform = `${C} translateY(${(-AMP * Math.sin(ht * OMEGA)).toFixed(2)}px)`;
      } else {
        // power on — line strokes out as the dot eases to centre + dissolves
        if (!morphPlayed) {
          // first audible moment (audio just unlocked): a boot swell into the
          // cursor's power-on glide.
          sound.boot();
          sound.morph();
          morphPlayed = true;
          dotYAtMorph = -AMP * Math.sin(((morphAt - REVEAL_MS) / 1000) * OMEGA);
        }
        const p = clamp01((t - morphAt) / DRAW_MS);
        line.style.transform = `${C} scaleY(${easeInOut(p).toFixed(3)})`;
        const fade = clamp01(p / 0.55); // dot is gone before the line finishes
        const dy = dotYAtMorph * (1 - easeOut(fade));
        dot.style.opacity = (1 - fade).toFixed(3);
        dot.style.transform = `${C} translateY(${dy.toFixed(2)}px) scale(${(1 - 0.5 * fade).toFixed(3)})`;
        if (p >= 1) {
          line.style.transform = C;
          dot.style.opacity = "0";
          setCaretPhase("line");
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      evs.forEach((e) => window.removeEventListener(e, onGesture));
    };
  }, [reduce, sound, BOOT_MS]);

  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  // One soft note as the greeting sharpens into focus (silent until audio is
  // unlocked by a gesture — see useTypingSound).
  React.useEffect(() => {
    if (reduce) return;
    const id = window.setTimeout(() => sound.word(4), BOOT_MS + 300);
    return () => window.clearTimeout(id);
  }, [sound, reduce, BOOT_MS]);

  function patchLastAI(text: string, streaming: boolean, links?: OutLink[]) {
    setMessages((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      if (last && last.role === "ai")
        copy[copy.length - 1] = { ...last, text, streaming, thinking: false, links };
      return copy;
    });
  }

  function stream(reply: string) {
    const { text: body, links } = parseReply(reply);
    if (reduce) {
      patchLastAI(body, false, links);
      setResponding(false);
      return;
    }
    sound.aiStart();
    let i = 0;
    let lastTickAt = 0;
    const step = () => {
      i += 1;
      patchLastAI(body.slice(0, i), i < body.length);
      const ch = body[i - 1];
      if (ch && ch !== " " && performance.now() - lastTickAt > 90) {
        sound.aiType();
        lastTickAt = performance.now();
      }
      if (i < body.length) {
        timer.current = window.setTimeout(step, 16 + Math.random() * 24);
      } else {
        patchLastAI(body, false, links);
        setResponding(false);
      }
    };
    step();
  }

  // Real reply via /api/site-chat; the keyword replyFor stays as the silent
  // offline/failure fallback so visitors never see an error.
  function respond(userText: string, history: { role: string; content: string }[]) {
    setResponding(true);
    setMessages((prev) => [...prev, { id: nextId.current++, role: "ai", text: "", thinking: true }]);

    const replyP = (async () => {
      try {
        const r = await fetch("/api/site-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });
        const j = await r.json();
        if (r.ok && typeof j.reply === "string" && j.reply) return j.reply as string;
      } catch { /* fall through to keyword reply */ }
      return replyFor(userText);
    })();

    const minThink = new Promise<void>((res) => {
      timer.current = window.setTimeout(res, reduce ? 0 : 620);
    });

    void Promise.all([replyP, minThink]).then(([reply]) => stream(reply));
  }

  function send() {
    const text = value.trim();
    if (!text || responding) return;
    sound.enter();
    const history = [
      ...messages
        .filter((m) => !m.thinking && m.text)
        .map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text })),
      { role: "user", content: text },
    ];
    setMessages((prev) => [...prev, { id: nextId.current++, role: "user", text }]);
    setValue("");
    respond(text, history);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
      return;
    }
    if (e.key === "Backspace" || e.key === "Delete") {
      sound.del();
      return;
    }
    if (e.key.length === 1) sound.key(); // printable character
  }

  return (
    <section
      id="hero"
      data-section="hero"
      data-page-tone="white"
      className="hb-hero"
      aria-labelledby="hero-headline"
    >
      <div className={`hb-hero-col ${chat ? "" : "hb-hero-idle"}`}>
        {/* Greeting — collapses + fades on first send. */}
        <h1 id="hero-headline" className={`hb-hero-h1 ${chat ? "is-chat" : ""}`}>
          {/* Inner span carries the entrance (the h1's own transition handles
              the chat collapse — an animation fill there would override it). */}
          <span
            className="focus-reveal hb-hero-h1-in"
            style={{ animationDelay: `${BOOT_MS}ms` }}
            data-hb-f="heading"
          >
            {greeting}
          </span>
        </h1>

        {/* Conversation */}
        <div
          ref={threadRef}
          aria-live="polite"
          className={`hb-hero-thread ${chat ? "is-chat" : ""}`}
        >
          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="msg-in hb-hero-userrow">
                <div className="hb-hero-userbubble">{m.text}</div>
              </div>
            ) : (
              <div key={m.id} className="msg-in">
                <div className="hb-hero-ailabel">
                  <span className="hb-hero-aidot" />
                  <span className="hb-hero-ainame">Humblebee</span>
                </div>
                {m.thinking ? (
                  <ThinkingDots />
                ) : (
                  <>
                    <p className="hb-hero-lede">
                      {m.text}
                      {m.streaming && (
                        <span aria-hidden className="caret-blink hb-hero-streamcaret" style={CARET_GLOW} />
                      )}
                    </p>
                    {!m.streaming && m.links && m.links.length > 0 && (
                      <div className="hb-hero-cards">
                        {m.links.map((l) => {
                          const meta = LINK_CARDS[l.href];
                          return (
                            <a key={l.href} href={l.href} className="hb-hero-card msg-in">
                              {meta?.image && (
                                <img src={meta.image} alt="" className="hb-hero-cardimg" loading="lazy" />
                              )}
                              <span className="hb-hero-cardbody">
                                <span className="hb-hero-cardkind">{meta?.kind ?? "Link"}</span>
                                <span className="hb-hero-cardtitle">
                                  {meta?.title ?? (l.label === l.href ? prettify(l.href) : l.label)}
                                </span>
                                {meta?.blurb && <span className="hb-hero-cardblurb">{meta.blurb}</span>}
                              </span>
                              <span className="hb-hero-cardarrow" aria-hidden>↗</span>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          )}
        </div>

        {/* Composer — centered text with the dot→line caret. Always mounted. */}
        <div className={`hb-hero-composer ${chat ? "is-chat" : ""}`}>
          <div
            className="hb-hero-inputrow"
            onClick={() => inputRef.current?.focus({ preventScroll: true })}
          >
            <div className="hb-hero-echoline">
              <span>{value}</span>
              <span className="hb-hero-caret">
                {/* boot — a honey glow circles the centre, then spirals into the dot */}
                {caretPhase !== "line" && (
                  <span aria-hidden className="orbit-wrapper hb-hero-orbitwrap">
                    <span
                      className="orbit-glow hb-hero-orbitglow"
                      style={{ boxShadow: "0 0 8px color-mix(in oklch, var(--honey) 70%, transparent)" }}
                    />
                  </span>
                )}
                {/* the cursor line — strokes out from the dot's centre */}
                <span
                  ref={lineRef}
                  aria-hidden
                  className={`hb-hero-caretline ${caretPhase === "line" ? "caret-blink" : ""}`}
                  style={
                    caretPhase === "line"
                      ? { transform: "translate(-50%, -50%)" }
                      : { transform: "translate(-50%, -50%) scaleY(0)", transformOrigin: "center" }
                  }
                />
                {/* the hovering dot — reveals, floats, then dissolves into the line */}
                <span
                  ref={dotRef}
                  aria-hidden
                  className="hb-hero-caretdot"
                  style={{ opacity: 0, transform: "translate(-50%, -50%)" }}
                />
              </span>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKeyDown}
              aria-label={inputLabel}
              autoComplete="off"
              className="hb-hero-input"
            />
          </div>

          {/* Enter affordance — appears once there's something to send. */}
          <button
            type="button"
            onClick={send}
            aria-label="Send"
            className={`hb-hero-enter ${value.trim() && !responding ? "" : "is-hidden"}`}
          >
            <IconEnter />
            Enter
          </button>
        </div>
      </div>

      {/* Typing-sound toggle */}
      <button
        type="button"
        onClick={toggleMuted}
        aria-label={muted ? "Turn typing sound on" : "Turn typing sound off"}
        title={muted ? "Sound off" : "Sound on"}
        className="hb-hero-mute"
      >
        {muted ? <IconMute /> : <IconVolume />}
      </button>
    </section>
  );
}
