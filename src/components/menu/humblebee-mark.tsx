type Props = {
  className?: string;
  title?: string;
};

export function HumblebeeMark({ className, title }: Props) {
  const classes = ["hb-mark", className].filter(Boolean).join(" ");
  return (
    <span
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={classes}
    />
  );
}
