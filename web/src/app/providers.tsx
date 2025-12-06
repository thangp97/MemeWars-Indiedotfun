"use client";

import { FC, ReactNode } from "react";
import { WalletProvider } from "@/components/WalletProvider";
import { Header } from "@/components/Header";

interface ProvidersProps {
  children: ReactNode;
}

export const Providers: FC<ProvidersProps> = ({ children }) => {
  return (
    <WalletProvider>
      <Header />
      <main className="pt-24 md:pt-28 min-h-screen">{children}</main>
      <Footer />
    </WalletProvider>
  );
};

const Footer: FC = () => (
  <footer className="border-t border-white/10 py-8 mt-20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚔️</span>
          <span className="font-bold text-gradient">MemeWars</span>
        </div>
        
        <p className="text-sm text-gray-500 text-center">
          No-Loss Prediction Market • Built on Solana • Powered by DeFi
        </p>

        <div className="flex items-center gap-4">
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-primary transition-colors"
          >
            Twitter
          </a>
          <a
            href="https://discord.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-secondary transition-colors"
          >
            Discord
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-white/5 text-center">
        <p className="text-xs text-gray-600">
          © 2024 MemeWars. All rights reserved. • Not financial advice.
        </p>
      </div>
    </div>
  </footer>
);

