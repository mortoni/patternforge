import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { SettingsProvider } from "@/features/settings/context/settings-context";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://chessforge.app";

/**
 * PWA / install surfaces (e.g. chessforge.app in Safari → Add to Home Screen):
 *
 * - Browser tab icon: `src/app/favicon.ico` + `metadata.icons.icon` → `/icon.png`
 * - iPhone home screen icon: `src/app/apple-icon.png` + `appleWebApp` + manifest icons
 * - Standalone (no Safari URL bar): `public/manifest.json` display "standalone" +
 *   `appleWebApp.capable` + theme-color / viewport-fit
 *
 * Regenerate raster icons: `pnpm run generate:icons`
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "Pattern Forge",
  title: "Pattern Forge",
  description: "Chess training through repeated pattern cycles",
  icons: {
    icon: [{ url: "/icon.png", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: [{ url: "/favicon.ico", type: "image/x-icon" }],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Pattern Forge",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Pattern Forge",
    title: "Pattern Forge",
    description: "Chess training through repeated pattern cycles",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0f" },
  ],
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

/** Matches SettingsProvider: explicit theme, else system preference (before Dexie hydrates). */
const THEME_BOOTSTRAP = `(function(){try{var t=localStorage.getItem("patternforge-theme");if(t==="dark"){document.documentElement.classList.add("dark");return;}if(t==="light"){document.documentElement.classList.remove("dark");return;}if(typeof matchMedia==="function"&&matchMedia("(prefers-color-scheme: dark)").matches)document.documentElement.classList.add("dark");}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_BOOTSTRAP,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased`}
      >
        <SettingsProvider>{children}</SettingsProvider>
        <Analytics />
      </body>
    </html>
  );
}
