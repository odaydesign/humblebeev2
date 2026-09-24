"use client";

import { useRef, useState } from "react";

interface Props {
  email: string;
  label: string;
  copiedLabel: string;
  className?: string;
}

export function EmailCopyButton({ email, label, copiedLabel, className = "" }: Props) {
  const [text, setText] = useState(label);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const swap = (next: string) => {
    setText(next);
  };

  return (
    <a
      href="#"
      className={`email-copy-btn ${copied ? "is-copied" : ""} ${className}`}
      onMouseEnter={() => !copied && swap(email)}
      onMouseLeave={() => !copied && swap(label)}
      onClick={(e) => {
        e.preventDefault();
        if (copied) return;
        navigator.clipboard.writeText(email).then(() => {
          setCopied(true);
          swap(copiedLabel);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => {
            setCopied(false);
            swap(label);
          }, 3000);
        });
      }}
    >
      <span className="email-copy-text">
        {text}
        {copied && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </span>
    </a>
  );
}
