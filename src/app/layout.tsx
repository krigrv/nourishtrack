import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "NourishTrack",
  description: "Log your breastfeeding and pumping sessions with ease.",
  manifest: "/manifest.json",
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
  themeColor: "#7B2CBF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="application-name" content="NourishTrack" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="NourishTrack" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#7B2CBF" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#7B2CBF" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className={`${geist.variable} font-sans antialiased light`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
