import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Subscription Manager — Teleprompter & Architecture",
    short_name: "Teleprompter",
    description:
      "Quick-glance interview teleprompter cards and architecture reference for the Bell Subscription Manager platform.",
    // Installed app opens straight to the teleprompter.
    start_url: "/teleprompter",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0f1117",
    theme_color: "#0f1117",
    categories: ["productivity", "reference", "education"],
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
