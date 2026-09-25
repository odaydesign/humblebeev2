"use client";

import * as React from "react";

import { cn } from "../lib/utils";

/** Humblebee HQ — from site contact copy (`Kvarnbergsgatan 2, Gothenburg`). */
const OFFICE = {
  label: "HQ · Studio",
  street: "Kvarnbergsgatan 2",
  city: "Gothenburg",
  region: "SE",
  timezone: "Europe/Stockholm",
  /** Approx. coords for Kvarnbergsgatan 2 */
  lat: 57.7004,
  lon: 11.9591,
} as const;

const YELLOW = "#f7e731";
const CACHE_KEY = "hb-studio-wx-v1";
const CACHE_TTL_MS = 20 * 60 * 1000;

const mono =
  "font-mono text-[0.625rem] uppercase tracking-[0.14em] text-white/45";

type WeatherSnapshot = {
  tempC: number;
  humidity: number;
  windKmh: number;
  code: number;
  fetchedAt: number;
};

type ClockParts = {
  h: number;
  m: number;
  s: number;
  ms: number;
  date: Date;
};

function dayOfYear(d: Date, timeZone: string): number {
  const y = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone, year: "numeric" }).format(d),
  );
  const start = new Date(Date.UTC(y, 0, 1));
  const localYmd = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  const [yy, mm, dd] = localYmd.split("-").map(Number);
  const local = Date.UTC(yy!, mm! - 1, dd!);
  return Math.floor((local - start.getTime()) / 86_400_000) + 1;
}

function utcOffsetLabel(d: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  }).formatToParts(d);
  const raw = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  // Normalize "GMT+2" → "UTC+02"
  const m = raw.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!m) return raw.replace("GMT", "UTC");
  const sign = m[1]!;
  const hh = m[2]!.padStart(2, "0");
  const mm = m[3] ?? "00";
  return mm === "00" ? `UTC${sign}${hh}` : `UTC${sign}${hh}:${mm}`;
}

function readClock(now: number, timeZone: string): ClockParts {
  const date = new Date(now);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const n = (t: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === t)?.value ?? 0);
  return {
    h: n("hour"),
    m: n("minute"),
    s: n("second"),
    ms: date.getMilliseconds(),
    date,
  };
}

/** WMO weather interpretation codes → compact TE-style glyph + label. */
function weatherMeta(code: number): { glyph: string; label: string } {
  if (code === 0) return { glyph: "○", label: "Clear" };
  if (code <= 3) return { glyph: "◐", label: "Cloud" };
  if (code <= 48) return { glyph: "≡", label: "Fog" };
  if (code <= 57) return { glyph: "∴", label: "Drizzle" };
  if (code <= 67) return { glyph: "⋮", label: "Rain" };
  if (code <= 77) return { glyph: "∗", label: "Snow" };
  if (code <= 82) return { glyph: "⋮", label: "Shower" };
  if (code <= 86) return { glyph: "∗", label: "Squall" };
  if (code <= 99) return { glyph: "※", label: "Storm" };
  return { glyph: "·", label: "—" };
}

function loadCachedWeather(): WeatherSnapshot | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WeatherSnapshot;
    if (
      typeof parsed.tempC !== "number" ||
      typeof parsed.fetchedAt !== "number"
    ) {
      return null;
    }
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCachedWeather(wx: WeatherSnapshot) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(wx));
  } catch {
    /* ignore quota */
  }
}

async function fetchOfficeWeather(): Promise<WeatherSnapshot> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${OFFICE.lat}&longitude=${OFFICE.lon}` +
    `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m` +
    `&timezone=${encodeURIComponent(OFFICE.timezone)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`weather ${res.status}`);
  const data = (await res.json()) as {
    current?: {
      temperature_2m?: number;
      relative_humidity_2m?: number;
      weather_code?: number;
      wind_speed_10m?: number;
    };
  };
  const c = data.current;
  if (!c || typeof c.temperature_2m !== "number") {
    throw new Error("weather malformed");
  }
  return {
    tempC: Math.round(c.temperature_2m),
    humidity: Math.round(c.relative_humidity_2m ?? 0),
    windKmh: Math.round(c.wind_speed_10m ?? 0),
    code: c.weather_code ?? 0,
    fetchedAt: Date.now(),
  };
}

/** Pre-rounded tick geometry — avoids Node/browser float hydration mismatches. */
const ANALOG_FACE_TICKS = Array.from({ length: 60 }, (_, i) => {
  const major = i % 5 === 0;
  const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
  const r0 = major ? 38 : 41.5;
  const r1 = 46;
  const q = (n: number) => Math.round(n * 1000) / 1000;
  return {
    i,
    major,
    x1: q(50 + Math.cos(a) * r0),
    y1: q(50 + Math.sin(a) * r0),
    x2: q(50 + Math.cos(a) * r1),
    y2: q(50 + Math.sin(a) * r1),
  };
});

function AnalogFace({
  h,
  m,
  s,
  ms,
  reduceMotion,
}: {
  h: number;
  m: number;
  s: number;
  ms: number;
  reduceMotion: boolean;
}) {
  const sec = reduceMotion ? s : s + ms / 1000;
  const min = m + sec / 60;
  const hour = (h % 12) + min / 60;

  // Fixed precision — Node vs browser Math.sin/cos can disagree by ulps and break hydration.
  const r = (n: number) => Math.round(n * 1000) / 1000;
  const hourDeg = r(hour * 30);
  const minDeg = r(min * 6);
  const secDeg = r(sec * 6);

  return (
    <svg
      viewBox="0 0 100 100"
      className="size-full"
      aria-hidden
    >
      {/* Outer bezel */}
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="none"
        stroke="rgba(255,255,255,0.14)"
        strokeWidth="0.75"
      />
      <circle
        cx="50"
        cy="50"
        r="46.5"
        fill="#0c0c0c"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="0.5"
      />
      {/* Inner measurement ring */}
      <circle
        cx="50"
        cy="50"
        r="36"
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="0.5"
        strokeDasharray="1.5 2.5"
      />
      {ANALOG_FACE_TICKS.map((t) => (
        <line
          key={t.i}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke={t.major ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.22)"}
          strokeWidth={t.major ? 1.1 : 0.6}
          strokeLinecap="square"
        />
      ))}
      {/* 12 o'clock index — yellow */}
      <rect x="48.6" y="5.5" width="2.8" height="6" fill={YELLOW} />
      {/* Hour */}
      <line
        x1="50"
        y1="50"
        x2="50"
        y2="28"
        stroke="rgba(255,255,255,0.92)"
        strokeWidth="2.2"
        strokeLinecap="square"
        transform={`rotate(${hourDeg} 50 50)`}
      />
      {/* Minute */}
      <line
        x1="50"
        y1="50"
        x2="50"
        y2="18"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="1.35"
        strokeLinecap="square"
        transform={`rotate(${minDeg} 50 50)`}
      />
      {/* Second — yellow */}
      <line
        x1="50"
        y1="58"
        x2="50"
        y2="12"
        stroke={YELLOW}
        strokeWidth="0.7"
        strokeLinecap="square"
        transform={`rotate(${secDeg} 50 50)`}
      />
      <circle cx="50" cy="50" r="2.2" fill={YELLOW} />
      <circle cx="50" cy="50" r="1" fill="#0a0a0a" />
    </svg>
  );
}

function StatCell({
  k,
  v,
  accent,
}: {
  k: string;
  v: string;
  accent?: boolean;
}) {
  return (
    <div className="min-w-0 border border-white/10 bg-white/[0.02] px-2 py-1.5">
      <div className="truncate font-mono text-[0.55rem] uppercase tracking-[0.16em] text-white/35">
        {k}
      </div>
      <div
        className={cn(
          "mt-0.5 truncate font-mono text-[0.72rem] tracking-[0.04em]",
          accent ? "text-[#f7e731]" : "text-white/80",
        )}
      >
        {v}
      </div>
    </div>
  );
}

/**
 * Teenage-Engineering-inspired studio instrument panel:
 * live analog clock (Europe/Stockholm), office location, Open-Meteo weather.
 */
export function StudioPanelCard({ active }: { active?: boolean }) {
  const [mounted, setMounted] = React.useState(false);
  const [now, setNow] = React.useState(0);
  const [reduceMotion, setReduceMotion] = React.useState(false);
  const [weather, setWeather] = React.useState<WeatherSnapshot | null>(null);
  const [wxStatus, setWxStatus] = React.useState<"loading" | "live" | "offline">(
    "loading",
  );

  React.useEffect(() => {
    setMounted(true);
    setNow(Date.now());
  }, []);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;

    let raf = 0;
    let interval = 0;

    if (reduceMotion) {
      interval = window.setInterval(() => setNow(Date.now()), 1000);
      return () => window.clearInterval(interval);
    }

    // Smooth second hand when card is near/hovered; 1Hz otherwise to save work.
    if (active) {
      const tick = () => {
        setNow(Date.now());
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }

    interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [active, mounted, reduceMotion]);

  React.useEffect(() => {
    let cancelled = false;
    const cached = loadCachedWeather();
    if (cached) {
      setWeather(cached);
      setWxStatus("live");
    }

    void (async () => {
      try {
        const wx = await fetchOfficeWeather();
        if (cancelled) return;
        saveCachedWeather(wx);
        setWeather(wx);
        setWxStatus("live");
      } catch {
        if (cancelled) return;
        if (!cached) setWxStatus("offline");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const clock = mounted ? readClock(now, OFFICE.timezone) : null;
  const pad = (n: number) => n.toString().padStart(2, "0");
  const digital = clock
    ? `${pad(clock.h)}:${pad(clock.m)}:${pad(clock.s)}`
    : "--:--:--";
  const offset = clock ? utcOffsetLabel(clock.date, OFFICE.timezone) : "—";
  const doy = clock ? String(dayOfYear(clock.date, OFFICE.timezone)).padStart(3, "0") : "---";
  const wx = weather ? weatherMeta(weather.code) : null;

  const latStr = `${OFFICE.lat.toFixed(2)}°N`;
  const lonStr = `${OFFICE.lon.toFixed(2)}°E`;

  const ariaLabel = clock
    ? `Humblebee studio panel — ${OFFICE.city}. Local time ${new Intl.DateTimeFormat(
        "en-GB",
        {
          timeZone: OFFICE.timezone,
          weekday: "long",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hourCycle: "h23",
        },
      ).format(clock.date)}.`
    : `Humblebee studio panel — ${OFFICE.city}.`;

  return (
    <div
      className="flex h-full w-full min-h-0 flex-col overflow-hidden bg-ink text-background"
      role="region"
      aria-label={ariaLabel}
    >
      {/* Title chrome */}
      <div className={cn("flex shrink-0 items-center gap-2 border-b border-white/10 px-3 py-2", mono)}>
        <span className="flex gap-1" aria-hidden>
          <i className="size-1.5 rounded-full bg-[#ff5f57]" />
          <i className="size-1.5 rounded-full bg-[#febc2e]" />
          <i className="size-1.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="truncate">studio · instrument</span>
        <span className="ml-auto text-white/25">HB-01</span>
      </div>

      {/* Top instrument strip */}
      <div className={cn("flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-1.5", mono)}>
        <span className="text-white/55">{OFFICE.city}</span>
        <span className="text-[#f7e731]">{digital}</span>
        <span className="text-white/35">{offset}</span>
      </div>

      {/* Body grid */}
      <div className="relative flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden p-3 md:gap-3 md:p-3.5">
        {/* Hairline grid backdrop */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          aria-hidden
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "12px 12px",
            maskImage:
              "radial-gradient(ellipse at 50% 40%, black 35%, transparent 75%)",
          }}
        />

        <div className="relative grid min-h-0 flex-1 grid-cols-[1.05fr_0.95fr] gap-2.5 md:gap-3">
          {/* Clock column */}
          <div className="flex min-h-0 flex-col items-center justify-center">
            <div className="aspect-square w-full max-w-[11.5rem]">
              <AnalogFace
                h={clock?.h ?? 0}
                m={clock?.m ?? 0}
                s={clock?.s ?? 0}
                ms={clock?.ms ?? 0}
                reduceMotion={reduceMotion || !active}
              />
            </div>
            <p className="mt-1.5 font-mono text-[0.55rem] uppercase tracking-[0.16em] text-white/30">
              Local · {OFFICE.timezone.split("/")[1]}
            </p>
          </div>

          {/* Right stack: location + weather */}
          <div className="flex min-h-0 flex-col justify-between gap-2">
            <div className="border border-white/10 bg-white/[0.02] p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[0.55rem] uppercase tracking-[0.16em] text-white/35">
                  Loc
                </span>
                <span className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-[#f7e731]">{OFFICE.label}</span>
              </div>
              <p className="mt-2 font-sans text-[0.95rem] font-medium leading-tight tracking-[-0.02em] text-white">
                {OFFICE.city}
              </p>
              <p className="mt-1 font-mono text-[0.6rem] leading-snug tracking-[0.04em] text-white/45">
                {OFFICE.street}
                <br />
                {OFFICE.region} · {latStr} {lonStr}
              </p>
            </div>

            <div className="border border-white/10 bg-white/[0.02] p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[0.55rem] uppercase tracking-[0.16em] text-white/35">
                  Wx
                </span>
                <span
                  className={cn(
                    "font-mono text-[0.55rem] uppercase tracking-[0.12em]",
                    wxStatus === "live"
                      ? "text-white/40"
                      : wxStatus === "loading"
                        ? "text-white/25"
                        : "text-white/25",
                  )}
                >
                  {wxStatus === "live"
                    ? "Open-Meteo"
                    : wxStatus === "loading"
                      ? "Sync…"
                      : "Offline"}
                </span>
              </div>
              <div className="mt-2 flex items-end justify-between gap-2">
                <div>
                  <p className="font-mono text-[1.55rem] leading-none tracking-[-0.03em] text-white">
                    {weather ? (
                      <>
                        {weather.tempC}
                        <span className="text-[0.85rem] text-white/45">°C</span>
                      </>
                    ) : (
                      <span className="text-white/30">—°</span>
                    )}
                  </p>
                  <p className="mt-1.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-white/40">
                    {wx?.label ?? "—"}
                  </p>
                </div>
                <span
                  className="mb-0.5 font-mono text-[1.35rem] leading-none text-[#f7e731]"
                  aria-hidden
                >
                  {wx?.glyph ?? "·"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Datapoint row */}
        <div className="relative grid shrink-0 grid-cols-4 gap-1.5">
          <StatCell k="Tz" v="Stockholm" />
          <StatCell k="Utc" v={offset} accent />
          <StatCell k="Doy" v={doy} />
          <StatCell
            k="Rh"
            v={weather ? `${weather.humidity}%` : "—"}
          />
        </div>
        <div className="relative grid shrink-0 grid-cols-2 gap-1.5">
          <StatCell
            k="Wind"
            v={weather ? `${weather.windKmh} km/h` : "—"}
          />
          <StatCell k="Grid" v={`${OFFICE.lat.toFixed(2)} · ${OFFICE.lon.toFixed(2)}`} />
        </div>
      </div>

      {/* Bottom chrome */}
      <div className={cn("flex shrink-0 items-center justify-between gap-2 border-t border-white/10 px-3 py-1.5", mono)}>
        <span className="text-white/35">Field recorder</span>
        <span className="text-white/25">ch · office</span>
      </div>
    </div>
  );
}
