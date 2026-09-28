import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // File-fallback stores (page JSONs, board positions, drafts, chats) are
  // read via fs at runtime — force them into the standalone trace.
  outputFileTracingIncludes: {
    "/": [
      "./src/lib/pages/**",
      "./src/lib/collections.json",
      "./src/lib/board-positions.json",
      "./src/lib/home-draft.json",
      "./src/lib/drafts/**",
      "./src/lib/chats/**",
      "./src/lib/custom-sections.json",
      "./agent/**",
      "./src/components/custom/**",
      "./src/app/custom.css",
    ],
  },
};

export default nextConfig;
