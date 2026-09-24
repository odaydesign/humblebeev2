"use client";

import type { Field, SectionSchema } from "@/lib/section-schemas";
import { getPath, setPath } from "@/lib/section-schemas";

interface Props {
  section: any;
  schema: SectionSchema;
  assets: string[];
  slugs: string[];
  onChange: (next: any) => void;
}

/** Schema-driven property editor — renders form controls for every field
 *  in the section schema and writes edits back through dot-paths. */
export function Inspector({ section, schema, assets, slugs, onChange }: Props) {
  const set = (path: string, v: any) => onChange(setPath(section, path, v));

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
          <div className="st-img">
            <input
              className="st-in"
              type="text"
              value={v?.src ?? v ?? ""}
              list="hb-assets"
              placeholder="/assets/images/…"
              onChange={(e) => set(path + ".src", e.target.value)}
            />
            {(v?.src || v) && (
              <img className="st-thumb" src={v?.src ?? v} alt="" />
            )}
          </div>
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
        const add = () =>
          set(path, [...arr, arr.length ? structuredClone(arr[arr.length - 1]) : scalar ? "" : {}]);
        const move = (i: number, dir: -1 | 1) => {
          const j = i + dir;
          if (j < 0 || j >= arr.length) return;
          const next = [...arr];
          [next[i], next[j]] = [next[j], next[i]];
          set(path, next);
        };
        return (
          <div className="st-list">
            {arr.map((_, i) => (
              <div className="st-item" key={i}>
                <div className="st-item-head">
                  <span>
                    {f.item} {i + 1}
                  </span>
                  <span className="st-item-tools">
                    <button title="Move up" onClick={() => move(i, -1)}>↑</button>
                    <button title="Move down" onClick={() => move(i, 1)}>↓</button>
                    <button
                      title="Remove"
                      className="st-del"
                      onClick={() => set(path, arr.filter((_, j) => j !== i))}
                    >
                      ✕
                    </button>
                  </span>
                </div>
                {f.fields.map((sf) => (
                  <label className="st-field" key={sf.k || "value"}>
                    {!scalar && <span className="st-lbl">{sf.l}</span>}
                    {ctl(sf, scalar ? `${path}.${i}` : `${path}.${i}.${sf.k}`)}
                  </label>
                ))}
              </div>
            ))}
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
