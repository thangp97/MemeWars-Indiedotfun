"use client";

import { FC } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Swords, Wallet, Trophy, Clock } from "lucide-react";
import Link from "next/link";

export const Header: FC = () => {
  const { connected, publicKey } = useWallet();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-primary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <Swords className="w-8 h-8 md:w-10 md:h-10 text-primary group-hover:text-secondary transition-colors duration-300" />
              <div className="absolute inset-0 blur-lg bg-primary/50 group-hover:bg-secondary/50 transition-colors duration-300" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl md:text-2xl font-bold text-gradient">
                MemeWars
              </span>
              <span className="text-[10px] md:text-xs text-gray-400 -mt-1">
                No-Loss Prediction Market
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink href="/" icon={<Swords className="w-4 h-4" />}>
              Battles
            </NavLink>
            <NavLink href="/history" icon={<Clock className="w-4 h-4" />}>
              History
            </NavLink>
            <NavLink href="/leaderboard" icon={<Trophy className="w-4 h-4" />}>
              Leaderboard
            </NavLink>
          </nav>

          {/* Wallet */}
          <div className="flex items-center gap-4">
            {connected && publicKey && (
              <div className="hidden sm:flex items-center gap-2 glass px-3 py-2 rounded-lg">
                <Wallet className="w-4 h-4 text-secondary" />
                <span className="text-sm font-mono text-gray-300">
                  {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
                </span>
              </div>
            )}
            <WalletMultiButton />
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="md:hidden flex items-center justify-around py-2 border-t border-primary/10">
        <MobileNavLink href="/" icon={<Swords className="w-5 h-5" />}>
          Battles
        </MobileNavLink>
        <MobileNavLink href="/history" icon={<Clock className="w-5 h-5" />}>
          History
        </MobileNavLink>
        <MobileNavLink href="/leaderboard" icon={<Trophy className="w-5 h-5" />}>
          Top
        </MobileNavLink>
      </nav>
    </header>
  );
};

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const NavLink: FC<NavLinkProps> = ({ href, icon, children }) => (
  <Link
    href={href}
    className="flex items-center gap-2 text-gray-300 hover:text-primary transition-colors duration-200 group"
  >
    <span className="group-hover:scale-110 transition-transform duration-200">
      {icon}
    </span>
    <span className="font-medium">{children}</span>
  </Link>
);

const MobileNavLink: FC<NavLinkProps> = ({ href, icon, children }) => (
  <Link
    href={href}
    className="flex flex-col items-center gap-1 text-gray-400 hover:text-primary transition-colors duration-200"
  >
    {icon}
    <span className="text-xs">{children}</span>
  </Link>
);

