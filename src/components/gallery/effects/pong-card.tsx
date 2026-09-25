"use client";

import * as React from "react";
import type { DataConnection, Peer } from "peerjs";

import { cn } from "../lib/utils";

type Mode = "cpu" | "searching" | "online";
type Role = "host" | "guest";

type StateMsg = {
  t: "state";
  ballX: number;
  ballY: number;
  ballVX: number;
  ballVY: number;
  hostY: number;
  guestY: number;
  scoreH: number;
  scoreG: number;
};

type NetMsg =
  | { t: "hello" }
  | { t: "paddle"; y: number }
  | StateMsg
  | { t: "score"; scoreH: number; scoreG: number };

const W = 300;
const H = 340;
const PADDLE_W = 6;
const PADDLE_H = 48;
const BALL = 7;
const LOBBY_SLOTS = 8;

/**
 * Minimal Pong — CPU by default. “Find player” matchmakes via PeerJS so two
 * people on the site at once can play head-to-head (WebRTC data channel).
 */
export function PongCard({ focused }: { focused?: boolean }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const playAreaRef = React.useRef<HTMLDivElement>(null);
  const focusedRef = React.useRef(!!focused);
  const modeRef = React.useRef<Mode>("cpu");
  const roleRef = React.useRef<Role | null>(null);
  const connRef = React.useRef<DataConnection | null>(null);
  const peerRef = React.useRef<Peer | null>(null);
  const remoteYRef = React.useRef(H / 2);
  const localYRef = React.useRef(H / 2);
  const keysRef = React.useRef({ up: false, down: false });
  const hostStateRef = React.useRef<StateMsg | null>(null);
  const pointerYRef = React.useRef<number | null>(null);
  const pointerInsideRef = React.useRef(false);

  const [mode, setMode] = React.useState<Mode>("cpu");
  const [status, setStatus] = React.useState("vs CPU · hover + mouse/↑↓");
  const [score, setScore] = React.useState({ h: 0, g: 0 });

  focusedRef.current = !!focused;

  React.useEffect(() => {
    if (!focused) {
      keysRef.current.up = false;
      keysRef.current.down = false;
    }
  }, [focused]);

  React.useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const cleanupNet = React.useCallback(() => {
    try {
      connRef.current?.close();
    } catch {
      /* ignore */
    }
    try {
      peerRef.current?.destroy();
    } catch {
      /* ignore */
    }
    connRef.current = null;
    peerRef.current = null;
    roleRef.current = null;
    hostStateRef.current = null;
  }, []);

  const startCpu = React.useCallback(() => {
    cleanupNet();
    setMode("cpu");
    setStatus("vs CPU · hover + mouse/↑↓");
  }, [cleanupNet]);

  const attachConn = React.useCallback(
    (conn: DataConnection, role: Role) => {
      connRef.current = conn;
      roleRef.current = role;

      conn.on("data", (raw) => {
        const msg = raw as NetMsg;
        if (msg.t === "paddle") remoteYRef.current = msg.y;
        if (msg.t === "state" && role === "guest") hostStateRef.current = msg;
        if (msg.t === "score") setScore({ h: msg.scoreH, g: msg.scoreG });
      });

      conn.on("close", () => {
        setStatus("opponent left · CPU");
        startCpu();
      });
      conn.on("error", () => {
        setStatus("link dropped · CPU");
        startCpu();
      });
    },
    [startCpu],
  );

  const findPlayer = React.useCallback(async () => {
    cleanupNet();
    setMode("searching");
    setStatus("searching lobby…");
    setScore({ h: 0, g: 0 });

    const { default: PeerCtor } = await import("peerjs");

    for (let slot = 0; slot < LOBBY_SLOTS; slot += 1) {
      const roomId = `hb-pong-v1-${slot}`;

      const hosted = await new Promise<boolean>((resolve) => {
        const peer = new PeerCtor(roomId, { debug: 0 });
        let done = false;

        const finish = (ok: boolean) => {
          if (done) return;
          done = true;
          window.clearTimeout(timer);
          if (!ok) {
            try {
              peer.destroy();
            } catch {
              /* ignore */
            }
          }
          resolve(ok);
        };

        const timer = window.setTimeout(() => finish(false), 2200);

        peer.on("open", () => {
          peerRef.current = peer;
          roleRef.current = "host";
          setStatus("hosting · waiting…");
          peer.on("connection", (conn) => {
            attachConn(conn, "host");
            setMode("online");
            setStatus("linked · you are LEFT");
          });
          finish(true);
        });

        peer.on("error", (err) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const type = (err as any)?.type as string | undefined;
          if (type === "unavailable-id") finish(false);
        });
      });

      if (hosted) return;

      // Room taken — try joining as guest.
      const joined = await new Promise<boolean>((resolve) => {
        const guest = new PeerCtor({ debug: 0 });
        let done = false;
        const finish = (ok: boolean) => {
          if (done) return;
          done = true;
          window.clearTimeout(timer);
          if (!ok) {
            try {
              guest.destroy();
            } catch {
              /* ignore */
            }
          }
          resolve(ok);
        };
        const timer = window.setTimeout(() => finish(false), 2500);

        guest.on("open", () => {
          peerRef.current = guest;
          const conn = guest.connect(roomId, { reliable: true });
          conn.on("open", () => {
            attachConn(conn, "guest");
            conn.send({ t: "hello" } satisfies NetMsg);
            setMode("online");
            setStatus("linked · you are RIGHT");
            finish(true);
          });
          conn.on("error", () => finish(false));
        });
        guest.on("error", () => finish(false));
      });

      if (joined) return;
    }

    setStatus("no one free · CPU");
    startCpu();
  }, [attachConn, cleanupNet, startCpu]);

  // Canvas game loop
  React.useEffect(() => {
    const canvas = canvasRef.current;
    const playArea = playAreaRef.current;
    if (!canvas || !playArea) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = W;
    canvas.height = H;

    let ballX = W / 2;
    let ballY = H / 2;
    let ballVX = 125;
    let ballVY = 70;
    let hostY = H / 2;
    let guestY = H / 2;
    let scoreH = 0;
    let scoreG = 0;
    let raf = 0;
    let last = performance.now();
    let netAcc = 0;

    const mapPointerY = (clientY: number) => {
      const rect = playArea.getBoundingClientRect();
      if (rect.height <= 0) return localYRef.current;
      return ((clientY - rect.top) / rect.height) * H;
    };

    const onKey = (e: KeyboardEvent, down: boolean) => {
      if (!focusedRef.current && !pointerInsideRef.current) return;
      let used = false;
      if (e.key === "ArrowUp" || e.key === "w") {
        keysRef.current.up = down;
        used = true;
      }
      if (e.key === "ArrowDown" || e.key === "s") {
        keysRef.current.down = down;
        used = true;
      }
      if (used) {
        // Keyboard takes over until the pointer moves again.
        pointerYRef.current = null;
        e.preventDefault();
      }
    };
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);

    const onPointerMove = (e: PointerEvent) => {
      pointerInsideRef.current = true;
      pointerYRef.current = mapPointerY(e.clientY);
    };
    const onPointerEnter = (e: PointerEvent) => {
      pointerInsideRef.current = true;
      pointerYRef.current = mapPointerY(e.clientY);
    };
    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      pointerInsideRef.current = true;
      pointerYRef.current = mapPointerY(e.clientY);
      try {
        playArea.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      try {
        if (playArea.hasPointerCapture(e.pointerId)) {
          playArea.releasePointerCapture(e.pointerId);
        }
      } catch {
        /* ignore */
      }
    };
    const onPointerLeave = () => {
      pointerInsideRef.current = false;
      pointerYRef.current = null;
    };

    playArea.addEventListener("pointerenter", onPointerEnter);
    playArea.addEventListener("pointermove", onPointerMove);
    playArea.addEventListener("pointerdown", onPointerDown);
    playArea.addEventListener("pointerup", onPointerUp);
    playArea.addEventListener("pointercancel", onPointerUp);
    playArea.addEventListener("pointerleave", onPointerLeave);

    const resetBall = (toRight: boolean) => {
      ballX = W / 2;
      ballY = H / 2;
      ballVX = (toRight ? 1 : -1) * (115 + Math.random() * 35);
      ballVY = (Math.random() * 2 - 1) * 95;
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const modeNow = modeRef.current;
      const role = roleRef.current;
      const open = !!connRef.current?.open;

      if (focusedRef.current || pointerInsideRef.current) {
        if (pointerInsideRef.current && pointerYRef.current != null) {
          localYRef.current = pointerYRef.current;
        } else {
          if (keysRef.current.up) localYRef.current -= 250 * dt;
          if (keysRef.current.down) localYRef.current += 250 * dt;
        }
      } else {
        pointerYRef.current = null;
      }
      localYRef.current = Math.max(
        PADDLE_H / 2,
        Math.min(H - PADDLE_H / 2, localYRef.current),
      );

      if (modeNow === "online" && role === "guest") {
        guestY = localYRef.current;
        netAcc += dt;
        if (open && netAcc > 1 / 30) {
          netAcc = 0;
          connRef.current?.send({ t: "paddle", y: guestY } satisfies NetMsg);
        }
        const remote = hostStateRef.current;
        if (remote) {
          ballX = remote.ballX;
          ballY = remote.ballY;
          hostY = remote.hostY;
          guestY = remote.guestY;
          if (remote.scoreH !== scoreH || remote.scoreG !== scoreG) {
            scoreH = remote.scoreH;
            scoreG = remote.scoreG;
            setScore({ h: scoreH, g: scoreG });
          }
        }
      } else if (modeNow === "online" && role === "host") {
        hostY = localYRef.current;
        guestY = remoteYRef.current;
      } else {
        // CPU / searching — local is left paddle
        hostY = localYRef.current;
        const aim = ballY + (Math.random() - 0.5) * 8;
        guestY += Math.max(-180, Math.min(180, aim - guestY)) * dt * 3.4;
        guestY = Math.max(PADDLE_H / 2, Math.min(H - PADDLE_H / 2, guestY));
      }

      const authority =
        modeNow === "cpu" ||
        modeNow === "searching" ||
        (modeNow === "online" && role === "host");

      if (authority) {
        const scale = modeNow === "searching" ? 0.45 : 1;
        ballX += ballVX * dt * scale;
        ballY += ballVY * dt * scale;

        if (ballY < BALL || ballY > H - BALL) ballVY *= -1;

        if (
          ballX - BALL < 18 + PADDLE_W &&
          ballX > 16 &&
          Math.abs(ballY - hostY) < PADDLE_H / 2 + BALL
        ) {
          ballX = 18 + PADDLE_W + BALL;
          ballVX = Math.abs(ballVX) * 1.03;
          ballVY += (ballY - hostY) * 4;
        }
        if (
          ballX + BALL > W - 18 - PADDLE_W &&
          ballX < W - 16 &&
          Math.abs(ballY - guestY) < PADDLE_H / 2 + BALL
        ) {
          ballX = W - 18 - PADDLE_W - BALL;
          ballVX = -Math.abs(ballVX) * 1.03;
          ballVY += (ballY - guestY) * 4;
        }

        if (modeNow !== "searching") {
          if (ballX < -24) {
            scoreG += 1;
            setScore({ h: scoreH, g: scoreG });
            resetBall(true);
            if (modeNow === "online") {
              connRef.current?.send({ t: "score", scoreH, scoreG } satisfies NetMsg);
            }
          } else if (ballX > W + 24) {
            scoreH += 1;
            setScore({ h: scoreH, g: scoreG });
            resetBall(false);
            if (modeNow === "online") {
              connRef.current?.send({ t: "score", scoreH, scoreG } satisfies NetMsg);
            }
          }
        } else if (ballX < 36 || ballX > W - 36) {
          ballVX *= -1;
        }

        if (modeNow === "online" && role === "host" && open) {
          netAcc += dt;
          if (netAcc > 1 / 30) {
            netAcc = 0;
            connRef.current?.send({
              t: "state",
              ballX,
              ballY,
              ballVX,
              ballVY,
              hostY,
              guestY,
              scoreH,
              scoreG,
            } satisfies NetMsg);
          }
        }
      }

      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.moveTo(W / 2, 8);
      ctx.lineTo(W / 2, H - 8);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(18, hostY - PADDLE_H / 2, PADDLE_W, PADDLE_H);
      ctx.fillRect(W - 18 - PADDLE_W, guestY - PADDLE_H / 2, PADDLE_W, PADDLE_H);

      ctx.fillStyle = "#f7e731";
      ctx.beginPath();
      ctx.arc(ballX, ballY, BALL, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      playArea.removeEventListener("pointerenter", onPointerEnter);
      playArea.removeEventListener("pointermove", onPointerMove);
      playArea.removeEventListener("pointerdown", onPointerDown);
      playArea.removeEventListener("pointerup", onPointerUp);
      playArea.removeEventListener("pointercancel", onPointerUp);
      playArea.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  React.useEffect(() => () => cleanupNet(), [cleanupNet]);

  return (
    <div className="flex h-full w-full min-h-0 flex-col overflow-hidden bg-ink text-background">
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-3 py-2 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-white/45">
        <span className="flex gap-1" aria-hidden>
          <i className="size-1.5 rounded-full bg-[#ff5f57]" />
          <i className="size-1.5 rounded-full bg-[#febc2e]" />
          <i className="size-1.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="truncate">arcade · pong</span>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-1.5 font-mono text-[0.625rem] uppercase tracking-[0.14em]">
        <span className="text-white/55">{score.h}</span>
        <span className="text-white/35">
          {mode === "online" ? "linked" : mode === "searching" ? "lobby" : "vs cpu"}
        </span>
        <span className="text-white/55">{score.g}</span>
      </div>

      <div
        ref={playAreaRef}
        className="relative flex min-h-0 flex-1 touch-none items-center justify-center overflow-hidden bg-[#0a0a0a]"
      >
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="hb-gallery-live-canvas pointer-events-none"
        />
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-white/10 px-3 py-2">
        <p className="min-w-0 truncate font-mono text-[0.6rem] uppercase tracking-[0.12em] text-white/40">
          {status}
        </p>
        {mode === "searching" ? (
          <button
            type="button"
            className="shrink-0 rounded-full border border-white/20 px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.1em] text-white/70 transition hover:border-white/40"
            onClick={(e) => {
              e.stopPropagation();
              startCpu();
            }}
          >
            Cancel
          </button>
        ) : (
          <button
            type="button"
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.1em] transition",
              mode === "online"
                ? "border border-white/20 text-white/70 hover:border-white/40"
                : "bg-[#f7e731] text-ink hover:opacity-90",
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (mode === "online") startCpu();
              else void findPlayer();
            }}
          >
            {mode === "online" ? "Leave" : "Find player"}
          </button>
        )}
      </div>
    </div>
  );
}
