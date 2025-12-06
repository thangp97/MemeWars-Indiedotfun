import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "MemeWars | No-Loss Prediction Market on Solana",
  description:
    "Bet on your favorite memecoins without losing your principal. Stake your SOL, earn yield, and compete for rewards!",
  keywords: [
    "Solana",
    "DeFi",
    "Memecoin",
    "Prediction Market",
    "No-Loss",
    "Staking",
    "BONK",
    "WIF",
  ],
  authors: [{ name: "MemeWars Team" }],
  openGraph: {
    title: "MemeWars | No-Loss Prediction Market",
    description: "Bet on memecoins without losing your principal!",
    type: "website",
    locale: "en_US",
    siteName: "MemeWars",
  },
  twitter: {
    card: "summary_large_image",
    title: "MemeWars | No-Loss Prediction Market",
    description: "Bet on memecoins without losing your principal!",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
