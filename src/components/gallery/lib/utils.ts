/** Minimal class join — replaces clsx + tailwind-merge (not used in this codebase). */
export type ClassValue = string | false | null | undefined;
export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(" ");
}
