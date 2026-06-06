import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EVPulse - EV Battery Calculators",
    short_name: "EVPulse",
    description: "Professional EV battery design calculators and tools",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#22c55e",
    icons: [
      {
        src: "/icon.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
    ],
  };
}