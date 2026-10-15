import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// Be Vietnam Pro: designed for Vietnamese, so stacked marks (ặ, ể, ữ, ờ)
// sit cleanly even at the 64–88px tone-word sizes. Not a variable font —
// each weight the UI uses is listed.
const appSans = Be_Vietnam_Pro({
  variable: "--font-app-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Thanh Việt",
  description: "Vietnamese learning app",
  applicationName: "Thanh Việt",
  // iOS home-screen app: launches without Safari's chrome, with its own name.
  appleWebApp: {
    capable: true,
    title: "Thanh Việt",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  // Older iOS versions only honour Apple's own tag for home-screen launch.
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  themeColor: "#0e7f66",
  width: "device-width",
  initialScale: 1,
  // Lets the layout use env(safe-area-inset-*) around the notch and home
  // indicator when launched from the home screen.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${appSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
