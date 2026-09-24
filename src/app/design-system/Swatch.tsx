"use client";

import { useState } from "react";

/** Colour swatch — click copies the hex value. */
export function Swatch({
  name,
  token,
  value,
  use,
}: {
  name: string;
  token: string;
  value: string;
  use: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="ds-swatch"
      title="Click to copy"
      onClick={() => {
        navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        });
      }}
    >
      <div
        className="ds-swatch-color"
        style={{ background: value === "#fffc" ? "#fff" : value }}
      >
        {copied && <span className="ds-swatch-copied">Copied</span>}
      </div>
      <div className="ds-swatch-info">
        <b>{name}</b>
        <code>
          {token} · {value}
        </code>
        <span>{use}</span>
      </div>
    </button>
  );
}
