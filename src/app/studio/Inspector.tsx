"use client";

import { useRef, useState } from "react";
import type { Field, SectionSchema } from "@/lib/section-schemas";
import { getPath, setPath } from "@/lib/section-schemas";

interface Props {
  section: any;
  schema: SectionSchema;
  assets: string[];
  slugs: string[];
  onChange: (next: any) => void;
}

/** Image field: text input w/ asset datalist + thumbnail + file upload
 *  (POST /api/cms/upload → /uploads/<file>). */
function ImgCtl({ v, onSet }: { v: any; onSet: (src: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const src = v?.src ?? v ?? "";
  const upload = async (file: File) => {
    setBusy(true);
    try {
      const data = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result));
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const res = await fetch("/api/cms/upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: file.name, data }),
      });
      const j = await res.json();
      if (res.ok && j.path) onSet(j.path);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="st-img">
      <div className="st-img-row">
        <input
          className="st-in"
          type="text"
          value={src}
          list="hb-assets"
          placeholder="/assets/images/…"
          onChange={(e) => onSet(e.target.value)}
        />
        <button
          type="button"
          className="st-upload"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          {busy ? "…" : "⬆"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = "";
          }}
        />
      </div>
      {src && <img className="st-thumb" src={src} alt="" />}
    </div>
  );
}

/** Schema-driven property editor — renders form controls for every field
 *  in the section schema and writes edits back through dot-paths. */
export function Inspector({ section, schema, assets, slugs, onChange }: Props) {
  const set = (path: string, v: any) => onChange(setPath(section, path, v));
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (k: string, dflt: boolean) =>
    setOpen((o) => ({ ...o, [k]: !(o[k] ?? dflt) }));

  const ctl = (f: Field, path: string) => {
    const v = getPath(section, path);
    switch (f.t) {
      case "text":
      case "email":
        return (
          <input
            className="st-in"
            type="text"
            value={v ?? ""}
            onChange={(e) => set(path, e.target.value)}
          />
        );
      case "textarea":
        return (
          <textarea
            className="st-in st-ta"
            rows={f.k === "html" ? 8 : 3}
            value={v ?? ""}
            onChange={(e) => set(path, e.target.value)}
          />
        );
      case "image":
        return (
          <ImgCtl
            v={v}
            onSet={(src) =>
              set(v && typeof v === "object" ? path + ".src" : path, src)
            }
          />
        );
      case "href":
        return (
          <input
            className="st-in"
            type="text"
            value={v ?? ""}
            list="hb-slugs"
            placeholder="/slug or https://…"
            onChange={(e) => set(path, e.target.value)}
          />
        );
      case "select":
        return (
          <select
            className="st-in"
            value={v ?? ""}
            onChange={(e) => set(path, e.target.value)}
          >
            {f.options.map((o) => (
              <option key={o.v} value={o.v}>
                {o.l}
              </option>
            ))}
          </select>
        );
      case "switch":
        return (
          <label className="st-switch">
            <input
              type="checkbox"
              checked={!!v}
              onChange={(e) => set(path, e.target.checked)}
            />
            <span>{v ? "Yes" : "No"}</span>
          </label>
        );
      case "cta":
        return (
          <div className="st-cta">
            <label className="st-sub">
              Label
              <input
                className="st-in"
                value={v?.label ?? ""}
                onChange={(e) => set(path + ".label", e.target.value)}
              />
            </label>
            <label className="st-sub">
              Link
              <input
                className="st-in"
                value={v?.href ?? ""}
                list="hb-slugs"
                onChange={(e) => set(path + ".href", e.target.value)}
              />
            </label>
            <label className="st-sub st-row">
              <span>Variant</span>
              <select
                className="st-in"
                value={v?.variant ?? "solid"}
                onChange={(e) => set(path + ".variant", e.target.value)}
              >
                <option value="solid">Solid</option>
                <option value="ghost">Ghost</option>
                <option value="blue">Blue</option>
              </select>
            </label>
            <label className="st-sub st-row">
              <span>External</span>
              <input
                type="checkbox"
                checked={!!v?.external}
                onChange={(e) => set(path + ".external", e.target.checked)}
              />
            </label>
          </div>
        );
      case "group":
        return (
          <div className="st-cta">
            {f.fields.map((sf) => (
              <label className="st-field" key={sf.k}>
                <span className="st-lbl">{sf.l}</span>
                {ctl(sf, `${path}.${sf.k}`)}
              </label>
            ))}
          </div>
        );
      case "list": {
        const arr = (getPath(section, path) as any[]) ?? [];
        const scalar = f.fields.length === 1 && f.fields[0].k === "";
        const add = () => {
          set(path, [
            ...arr,
            f.newItem
              ? f.newItem()
              : arr.length
                ? structuredClone(arr[arr.length - 1])
                : scalar
                  ? ""
                  : {},
          ]);
          setOpen((o) => ({ ...o, [`${path}.${arr.length}`]: true }));
        };
        const move = (i: number, dir: -1 | 1) => {
          const j = i + dir;
          if (j < 0 || j >= arr.length) return;
          const next = [...arr];
          [next[i], next[j]] = [next[j], next[i]];
          set(path, next);
        };
        const many = arr.length > 4; // long lists start collapsed
        const summary = (v: any, i: number) =>
          f.summary?.(v, i) ??
          (v?.title ?? v?.id ?? v?.label ?? v?.name ?? `${f.item} ${i + 1}`);
        return (
          <div className="st-list">
            {arr.map((v, i) => {
              const ok = `${path}.${i}`;
              const isOpen = open[ok] ?? !many;
              return (
                <div className={`st-item${isOpen ? " open" : ""}`} key={i}>
                  <div
                    className="st-item-head st-item-toggle"
                    role="button"
                    onClick={() => toggle(ok, !many)}
                  >
                    <span className={`st-caret${isOpen ? " open" : ""}`}>▸</span>
                    <span className="st-item-name" title={String(summary(v, i))}>
                      {summary(v, i)}
                    </span>
                    <span
                      className="st-item-tools"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button title="Move up" onClick={() => move(i, -1)}>↑</button>
                      <button title="Move down" onClick={() => move(i, 1)}>↓</button>
                      <button
                        title="Duplicate"
                        onClick={() => {
                          const clone = structuredClone(v);
                          if (clone && typeof clone === "object" && clone.id)
                            clone.id = `${clone.id}-copy`;
                          set(path, [
                            ...arr.slice(0, i + 1),
                            clone,
                            ...arr.slice(i + 1),
                          ]);
                        }}
                      >
                        ⧉
                      </button>
                      <button
                        title="Remove"
                        className="st-del"
                        onClick={() => set(path, arr.filter((_, j) => j !== i))}
                      >
                        ✕
                      </button>
                    </span>
                  </div>
                  {isOpen &&
                    f.fields.map((sf) => (
                      <label className="st-field" key={sf.k || "value"}>
                        {!scalar && <span className="st-lbl">{sf.l}</span>}
                        {ctl(sf, scalar ? `${path}.${i}` : `${path}.${i}.${sf.k}`)}
                      </label>
                    ))}
                </div>
              );
            })}
            <button className="st-add" onClick={add}>
              + Add {f.item}
            </button>
          </div>
        );
      }
    }
  };

  return (
    <div className="st-inspector">
      <datalist id="hb-assets">
        {assets.map((a) => (
          <option key={a} value={a} />
        ))}
      </datalist>
      <datalist id="hb-slugs">
        {slugs.map((s) => (
          <option key={s} value={"/" + s} />
        ))}
      </datalist>
      {schema.fields.map((f) => (
        <label className="st-field" key={f.k} id={`f-${f.k.split(".")[0]}`}>
          <span className="st-lbl">{f.l}</span>
          {ctl(f, f.k)}
        </label>
      ))}
    </div>
  );
}
