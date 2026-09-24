"use client";

import { useEffect, useRef, useState } from "react";
import { Md } from "./md";
import { SECTION_SCHEMAS } from "@/lib/section-schemas";

interface Pending {
  id: string;
  op: "publish" | "delete" | "remove_component";
  slug: string;
  label: string;
}

interface Attached {
  name: string;
  kind: "image" | "text" | "file";
  path?: string; // uploaded → /uploads/x (images + binaries)
  content?: string; // text files, inlined for the agent
  size?: number;
}

interface Msg {
  role: "user" | "assistant" | "status";
  content: string;
  actions?: { tool: string; summary: string }[];
  confirmations?: Pending[];
  touched?: string[];
  components?: string[];
  files?: Attached[];
}

interface Thread {
  id: string;
  title: string;
  updatedAt?: string;
}

const SUGGESTIONS = [
  "Create a landing page for a summer campaign",
  "Rewrite the hero heading on this page",
  "What components can I use?",
  "List all pages with unpublished drafts",
];

const titleFrom = (msgs: Msg[]) =>
  msgs.find((m) => m.role === "user")?.content.slice(0, 48) || "New chat";

export function AgentChat({
  currentSlug,
  onTouched,
  onOpenPage,
}: {
  currentSlug?: string;
  onTouched: (slugs: string[]) => void;
  onOpenPage: (slug: string) => void;
}) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [files, setFiles] = useState<Attached[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState<{ doing: string; done: string[] } | null>(null);
  const [err, setErr] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stick = useRef(true); // autoscroll only when pinned to bottom

  useEffect(() => {
    if (stick.current) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, live]);

  const onLogScroll = () => {
    const el = logRef.current;
    if (!el) return;
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const autosize = () => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  };

  /* ── thread persistence ────────────────────────────────── */
  const refreshThreads = async () => {
    const j = await fetch("/api/agent/chats").then((r) => r.json());
    setThreads(j.chats ?? []);
    return j.chats ?? [];
  };

  useEffect(() => {
    refreshThreads().then(async (list) => {
      if (list.length) {
        const t = await fetch(`/api/agent/chats?id=${list[0].id}`).then((r) => r.json());
        setThreadId(t.id);
        setMsgs(t.messages ?? []);
      }
    });
  }, []);

  const persist = (id: string | null, messages: Msg[]) => {
    const clean = messages.map(({ role, content, actions, confirmations, touched, files }) => ({
      role, content, actions, confirmations, touched, files,
    }));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const t = await fetch("/api/agent/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, title: titleFrom(clean), messages: clean }),
      }).then((r) => r.json());
      if (t.id && t.id !== id) setThreadId(t.id);
      refreshThreads();
    }, 400);
  };

  const openThread = async (id: string) => {
    const t = await fetch(`/api/agent/chats?id=${id}`).then((r) => r.json());
    setThreadId(t.id);
    setMsgs(t.messages ?? []);
    setErr("");
    stick.current = true;
  };

  const newChat = () => {
    setThreadId(null);
    setMsgs([]);
    setErr("");
    stick.current = true;
  };

  const removeThread = async () => {
    if (!threadId) return;
    if (!window.confirm("Delete this chat thread?")) return;
    await fetch(`/api/agent/chats?id=${threadId}`, { method: "DELETE" });
    newChat();
    refreshThreads();
  };

  /* ── file attachments ──────────────────────────────────── */
  const TEXT_MAX = 24_000;
  const readAs = (f: File, mode: "text" | "dataURL") =>
    new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      mode === "text" ? r.readAsText(f) : r.readAsDataURL(f);
    });

  const upload = async (f: File): Promise<Attached> => {
    const dataURL = await readAs(f, "dataURL");
    const j = await fetch("/api/cms/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: f.name, data: dataURL }),
    }).then((r) => r.json());
    if (!j.ok) throw new Error(j.error ?? `upload failed: ${f.name}`);
    return {
      name: j.name,
      kind: f.type.startsWith("image/") ? "image" : "file",
      path: j.path,
      size: f.size,
    };
  };

  const attachFiles = async (list: FileList | File[]) => {
    for (const f of [...list]) {
      try {
        if (f.type.startsWith("image/") || f.size > TEXT_MAX * 4) {
          setFiles((x) => [...x, { name: f.name, kind: "file", size: f.size }]);
          const up = await upload(f);
          setFiles((x) => x.map((a) => (a.name === f.name && !a.path ? up : a)));
        } else {
          const text = await readAs(f, "text");
          setFiles((x) => [
            ...x,
            {
              name: f.name,
              kind: "text",
              content: text.slice(0, TEXT_MAX),
              size: f.size,
            },
          ]);
        }
      } catch (e: any) {
        setErr(e.message ?? "attach failed");
      }
    }
  };

  /* ── send (streaming) ──────────────────────────────────── */
  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if ((!content && !files.length) || busy) return;
    setInput("");
    if (taRef.current) taRef.current.style.height = "";
    setErr("");
    const comps = picked;
    const atts = files;
    setPicked([]);
    setFiles([]);
    setPickerOpen(false);
    const next: Msg[] = [
      ...msgs,
      {
        role: "user",
        content: content || "(attached files)",
        components: comps.length ? comps : undefined,
        files: atts.length ? atts : undefined,
      },
    ];
    setMsgs(next);
    persist(threadId, next);
    setBusy(true);
    setLive({ doing: "Thinking", done: [] });
    stick.current = true;

    try {
      const r = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next
            .filter((m) => m.role !== "status")
            .map((m) => ({ role: m.role, content: m.content })),
          currentSlug,
          components: comps.length ? comps : undefined,
          files: atts.length ? atts : undefined,
        }),
      });
      if (!r.ok || !r.body) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error ?? `request failed (${r.status})`);
      }

      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let final: any = null;
      const doneActions: string[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const e = JSON.parse(line);
          if (e.type === "tool_call") {
            setLive({ doing: e.summary, done: [...doneActions] });
          } else if (e.type === "tool_result") {
            doneActions.push(e.summary);
            setLive({ doing: "", done: [...doneActions] });
          } else if (e.type === "done") {
            final = e;
          } else if (e.type === "error") {
            throw new Error(e.error);
          }
        }
      }

      if (final) {
        const reply: Msg = {
          role: "assistant",
          content: final.reply,
          actions: final.actions,
          confirmations: final.confirmations,
          touched: final.touched,
        };
        const withReply = [...next, reply];
        setMsgs(withReply);
        persist(threadId, withReply);
        if (final.touched?.length) {
          onTouched(final.touched);
          const openable = final.touched.filter((s: string) => !s.startsWith("__"));
          if (openable.length) onOpenPage(openable[openable.length - 1]);
        }
      }
    } catch (e: any) {
      setErr(e.message ?? "request failed");
    }
    setLive(null);
    setBusy(false);
  };

  const confirmAction = async (c: Pending, approve: boolean) => {
    if (!approve) {
      setMsgs((m) => [...m, { role: "status", content: `Declined: ${c.label}` }]);
      return;
    }
    setMsgs((m) => [...m, { role: "status", content: `${c.label}…` }]);
    const r = await fetch("/api/agent/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: c.op, slug: c.slug }),
    });
    const j = await r.json();
    setMsgs((m) => [
      ...m,
      { role: "status", content: j.ok ? `✓ ${c.label} — done` : `✗ ${c.label} failed: ${j.error}` },
    ]);
    if (j.ok) {
      onTouched([c.slug]);
      if (!c.slug.startsWith("__")) onOpenPage(c.slug);
    }
  };

  /* ── render ────────────────────────────────────────────── */
  return (
    <div className="st-chat">
      <div className="st-chat-head">
        <select
          className="st-in st-threadsel"
          value={threadId ?? ""}
          onChange={(e) => (e.target.value ? openThread(e.target.value) : newChat())}
          title="Chat threads"
        >
          <option value="">New chat</option>
          {threads.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
        <div className="st-chat-tools">
          <button className="st-icbtn" title="New chat" onClick={newChat}>＋</button>
          {threadId && (
            <button className="st-icbtn" title="Delete thread" onClick={removeThread}>✕</button>
          )}
        </div>
      </div>

      <div className="st-chat-log" ref={logRef} onScroll={onLogScroll}>
        {msgs.length === 0 && (
          <div className="st-chat-empty">
            <p>Ask me to build, edit or organise pages. I work in drafts — nothing goes live without your approval.</p>
            {SUGGESTIONS.map((s) => (
              <button key={s} className="st-chip" onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`st-msg ${m.role}`}>
            {m.role === "status" ? (
              <em className="st-status">{m.content}</em>
            ) : (
              <>
                <div className="st-msg-body">
                  {m.role === "assistant" ? <Md>{m.content}</Md> : m.content}
                </div>
                {m.components?.map((t) => (
                  <span key={t} className="st-comp-chip">
                    {SCHEMA_BY_TYPE_ICON(t)} {SCHEMA_BY_TYPE_NAME(t)}
                  </span>
                ))}
                {m.files?.map((f, j) => (
                  <span key={j} className="st-file-chip" title={f.path ?? f.name}>
                    {f.kind === "image" ? "🖼" : f.kind === "text" ? "≣" : "📄"} {f.name}
                  </span>
                ))}
                {m.actions?.map((a, j) => (
                  <div key={j} className="st-action" style={{ animationDelay: `${j * 40}ms` }}>
                    <span className="st-action-dot" />
                    {a.summary}
                  </div>
                ))}
                {m.touched?.filter((s) => !s.startsWith("__")).map((s) => (
                  <div key={s} className="st-pagelink">
                    <button className="st-pagelink-open" onClick={() => onOpenPage(s)} title="Open in Studio canvas">
                      <span className="st-pagelink-slug">/{s}</span>
                      <span className="st-pagelink-cta">Open in canvas →</span>
                    </button>
                    <a
                      className="st-pagelink-live"
                      href={`/${s}`}
                      target="_blank"
                      rel="noreferrer"
                      title="View live page (drafts 404 until published)"
                    >
                      ↗
                    </a>
                  </div>
                ))}
                {m.confirmations?.map((c) => (
                  <div key={c.id} className={`st-confirm ${c.op}`}>
                    <span>{c.label}?</span>
                    <button className="st-btn st-publish" onClick={() => confirmAction(c, true)}>
                      Approve
                    </button>
                    <button className="st-btn st-ghost" onClick={() => confirmAction(c, false)}>
                      Deny
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        ))}
        {live && (
          <div className="st-msg assistant">
            <div className="st-msg-body st-thinking">
              {live.done.map((s, i) => (
                <div key={i} className="st-action st-action-done">
                  <span className="st-action-dot" />
                  {s}
                </div>
              ))}
              {live.doing ? (
                <div className="st-action st-action-live">
                  <span className="st-spin" />
                  {live.doing}…
                </div>
              ) : (
                <div className="st-action st-action-live">
                  <span className="st-spin" />
                  Composing reply…
                </div>
              )}
            </div>
          </div>
        )}
        {err && <div className="st-msg status"><em className="st-status err">⚠ {err}</em></div>}
        <div ref={endRef} />
      </div>

      <div className="st-chat-in">
        {(picked.length > 0 || files.length > 0 || pickerOpen) && (
          <div className="st-chat-attach">
            {picked.map((t) => (
              <span key={t} className="st-comp-chip on">
                {SCHEMA_BY_TYPE_ICON(t)} {SCHEMA_BY_TYPE_NAME(t)}
                <button onClick={() => setPicked((p) => p.filter((x) => x !== t))}>✕</button>
              </span>
            ))}
            {files.map((f, i) => (
              <span key={f.name + i} className={`st-file-chip ${f.path ? "" : "pending"}`} title={f.path ?? f.name}>
                {f.kind === "image" ? "🖼" : f.kind === "text" ? "≣" : "📄"} {f.name}
                <button onClick={() => setFiles((x) => x.filter((_, j) => j !== i))}>✕</button>
              </span>
            ))}
          </div>
        )}
        <div className="st-chat-inrow">
          <textarea
          ref={taRef}
          className="st-in"
          placeholder={currentSlug ? `Ask about /${currentSlug}, or anything…` : "Ask the agent…"}
          value={input}
          rows={2}
          onChange={(e) => {
            setInput(e.target.value);
            autosize();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          onPaste={(e) => {
            const fs = [...e.clipboardData.files];
            if (fs.length) {
              e.preventDefault();
              attachFiles(fs);
            }
          }}
        />
          <div className="st-chat-bar">
            <div className="st-cpicker-wrap">
              <button
                className={`st-attach ${pickerOpen ? "on" : ""}`}
                title="Attach components — the agent will use these"
                onClick={() => setPickerOpen((v) => !v)}
              >
                ▦
              </button>
              {pickerOpen && (
                <div className="st-cpicker">
                  <div className="st-cpicker-h">Use these components</div>
                  {SECTION_SCHEMAS.map((s) => (
                    <button
                      key={s.type}
                      className={`st-cpicker-row ${picked.includes(s.type) ? "on" : ""}`}
                      onClick={() =>
                        setPicked((p) => (p.includes(s.type) ? p.filter((x) => x !== s.type) : [...p, s.type]))
                      }
                    >
                      <span className="st-cpicker-ic">{s.icon}</span>
                      <span className="st-cpicker-name">{s.name}</span>
                      <code>{s.type}</code>
                      {picked.includes(s.type) && <span className="st-cpicker-check">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              multiple
              hidden
              accept="image/*,.txt,.md,.js,.jsx,.ts,.tsx,.css,.scss,.html,.json,.csv,.svg,.py,.sh,.yml,.yaml,.xml,.sql,.pdf,.zip"
              onChange={(e) => {
                if (e.target.files?.length) attachFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              className="st-attach"
              title="Attach files — images upload for use on pages, code/text is read by the agent"
              onClick={() => fileRef.current?.click()}
            >
              📎
            </button>
            <button className="st-btn st-save" disabled={busy || (!input.trim() && !files.length)} onClick={() => send()}>
              {busy ? "…" : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const SCHEMA_BY_TYPE_ICON = (t: string) => SECTION_SCHEMAS.find((s) => s.type === t)?.icon ?? "▢";
const SCHEMA_BY_TYPE_NAME = (t: string) => SECTION_SCHEMAS.find((s) => s.type === t)?.name ?? t;
