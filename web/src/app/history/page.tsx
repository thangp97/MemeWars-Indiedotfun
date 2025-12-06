"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Clock,
  Trophy,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Gift,
  ExternalLink,
  Filter,
  Search,
} from "lucide-react";

// Mock data for battle history
interface BattleHistory {
  id: string;
  tokenA: { symbol: string; icon: string };
  tokenB: { symbol: string; icon: string };
  userTeam: "A" | "B";
  userStake: number;
  winner: "A" | "B";
  reward: number;
  endedAt: Date;
  claimed: boolean;
  txSignature?: string;
}

const MOCK_HISTORY: BattleHistory[] = [
  {
    id: "hist-1",
    tokenA: { symbol: "BONK", icon: "🐕" },
    tokenB: { symbol: "WIF", icon: "🐶" },
    userTeam: "A",
    userStake: 5_000_000_000,
    winner: "A",
    reward: 150_000_000,
    endedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    claimed: true,
    txSignature: "abc123...",
  },
  {
    id: "hist-2",
    tokenA: { symbol: "POPCAT", icon: "🐱" },
    tokenB: { symbol: "MEW", icon: "😺" },
    userTeam: "B",
    userStake: 2_000_000_000,
    winner: "A",
    reward: 0,
    endedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    claimed: true,
  },
  {
    id: "hist-3",
    tokenA: { symbol: "TRUMP", icon: "🇺🇸" },
    tokenB: { symbol: "FARTCOIN", icon: "💨" },
    userTeam: "A",
    userStake: 10_000_000_000,
    winner: "A",
    reward: 450_000_000,
    endedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    claimed: false,
  },
];

export default function HistoryPage() {
  const { connected } = useWallet();
  const [filter, setFilter] = useState<"all" | "won" | "lost" | "unclaimed">("all");

  const filteredHistory = MOCK_HISTORY.filter((battle) => {
    if (filter === "all") return true;
    if (filter === "won") return battle.userTeam === battle.winner;
    if (filter === "lost") return battle.userTeam !== battle.winner;
    if (filter === "unclaimed") return !battle.claimed && battle.userTeam === battle.winner;
    return true;
  });

  const stats = {
    totalBattles: MOCK_HISTORY.length,
    wins: MOCK_HISTORY.filter((b) => b.userTeam === b.winner).length,
    totalStaked: MOCK_HISTORY.reduce((acc, b) => acc + b.userStake, 0),
    totalRewards: MOCK_HISTORY.reduce((acc, b) => acc + b.reward, 0),
    unclaimed: MOCK_HISTORY.filter((b) => !b.claimed && b.userTeam === b.winner).length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      {/* Header */}
      <section className="py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Battle History
          </h1>
          <p className="text-gray-400">
            Track your past battles and claim any pending rewards
          </p>
        </motion.div>
      </section>

      {!connected ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-gray-400">
            Connect your wallet to view your battle history
          </p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <section className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <StatCard
              label="Total Battles"
              value={stats.totalBattles.toString()}
              icon={<Clock className="w-5 h-5" />}
              color="gray"
            />
            <StatCard
              label="Wins"
              value={`${stats.wins}/${stats.totalBattles}`}
              icon={<Trophy className="w-5 h-5" />}
              color="accent"
            />
            <StatCard
              label="Win Rate"
              value={`${((stats.wins / stats.totalBattles) * 100).toFixed(0)}%`}
              icon={<TrendingUp className="w-5 h-5" />}
              color="green"
            />
            <StatCard
              label="Total Rewards"
              value={`${(stats.totalRewards / 1e9).toFixed(2)} SOL`}
              icon={<Gift className="w-5 h-5" />}
              color="primary"
            />
            <StatCard
              label="Unclaimed"
              value={stats.unclaimed.toString()}
              icon={<CheckCircle className="w-5 h-5" />}
              color="secondary"
              highlight={stats.unclaimed > 0}
            />
          </section>

          {/* Filter Tabs */}
          <div className="flex items-center gap-4 mb-6 overflow-x-auto pb-2">
            <div className="flex items-center gap-2 glass rounded-lg p-1">
              {["all", "won", "lost", "unclaimed"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as typeof filter)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    filter === f
                      ? "bg-primary text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* History List */}
          <div className="space-y-4">
            {filteredHistory.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center">
                <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No battles found for this filter</p>
              </div>
            ) : (
              filteredHistory.map((battle, index) => (
                <motion.div
                  key={battle.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <HistoryCard battle={battle} />
                </motion.div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: "primary" | "secondary" | "accent" | "green" | "gray";
  highlight?: boolean;
}

const StatCard = ({ label, value, icon, color, highlight }: StatCardProps) => {
  const colorClasses = {
    primary: "text-primary border-primary/30",
    secondary: "text-secondary border-secondary/30",
    accent: "text-accent border-accent/30",
    green: "text-green-400 border-green-400/30",
    gray: "text-gray-400 border-gray-400/30",
  };

  return (
    <div
      className={`glass rounded-xl p-4 border ${colorClasses[color]} ${
        highlight ? "animate-pulse" : ""
      }`}
    >
      <div className={`${colorClasses[color].split(" ")[0]} mb-2`}>{icon}</div>
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
};

interface HistoryCardProps {
  battle: BattleHistory;
}

const HistoryCard = ({ battle }: HistoryCardProps) => {
  const isWinner = battle.userTeam === battle.winner;
  const userToken = battle.userTeam === "A" ? battle.tokenA : battle.tokenB;
  const opponentToken = battle.userTeam === "A" ? battle.tokenB : battle.tokenA;

  const handleClaim = async () => {
    // TODO: Implement actual claim logic
    console.log("Claiming reward for battle:", battle.id);
  };

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Battle Info */}
          <div className="flex items-center gap-4 flex-1">
            {/* Tokens */}
            <div className="flex items-center">
              <span className="text-3xl">{userToken.icon}</span>
              <span className="text-xl text-gray-500 mx-2">vs</span>
              <span className="text-3xl opacity-50">{opponentToken.icon}</span>
            </div>

            {/* Details */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">
                  ${userToken.symbol} vs ${opponentToken.symbol}
                </span>
                {isWinner ? (
                  <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Won
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">
                    <XCircle className="w-3 h-3" /> Lost
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Ended {formatDate(battle.endedAt)}
              </div>
            </div>
          </div>

          {/* Stakes & Rewards */}
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-xs text-gray-500">Your Stake</div>
              <div className="font-mono text-white">
                {(battle.userStake / 1e9).toFixed(2)} SOL
              </div>
            </div>

            {isWinner && (
              <div className="text-right">
                <div className="text-xs text-gray-500">Reward</div>
                <div className="font-mono text-green-400">
                  +{(battle.reward / 1e9).toFixed(4)} SOL
                </div>
              </div>
            )}

            {/* Action Button */}
            {isWinner && !battle.claimed ? (
              <button
                onClick={handleClaim}
                className="btn-accent flex items-center gap-2"
              >
                <Gift className="w-4 h-4" />
                <span>Claim</span>
              </button>
            ) : battle.claimed ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Claimed</span>
                {battle.txSignature && (
                  <a
                    href={`https://solscan.io/tx/${battle.txSignature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary hover:text-primary"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">No reward</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
}

