import type { Metadata } from "next";
import { StudioApp } from "./StudioApp";
import "./studio.css";

export const metadata: Metadata = {
  title: "Studio — Humblebee",
  robots: { index: false, follow: false },
};

export default function StudioPage() {
  return <StudioApp />;
}
