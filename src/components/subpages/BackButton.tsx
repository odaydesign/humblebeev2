export function BackButton({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="button-back w-inline-block">
      <div className="icon-embed-xsmall is-reversed w-embed" aria-hidden="true">
        <svg
          width="34"
          height="16"
          viewBox="0 0 34 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0 8L33.0286 8" stroke="#000000" fill="none" />
          <path d="M26.2285 1L33.0285 8L26.2285 15" stroke="#000000" fill="none" />
        </svg>
      </div>
      <div>{label}</div>
    </a>
  );
}
