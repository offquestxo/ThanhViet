import type { MetadataRoute } from "next";

// Installable via "Add to Home Screen". `standalone` opens without browser
// chrome; iOS doesn't support `fullscreen` for home-screen apps, so this is
// the full-screen-equivalent setting there.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Thanh Việt",
    short_name: "Thanh Việt",
    description: "Learn Vietnamese — vocabulary and tones",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fdfbf6",
    theme_color: "#0e7f66",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
