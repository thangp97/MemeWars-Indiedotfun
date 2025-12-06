"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Trophy,
  Medal,
  Crown,
  TrendingUp,
  Users,
  Flame,
  Star,
  ChevronUp,
  ChevronDown,
  Minus,
} from "lucide-react";

// Mock leaderboard data
interface LeaderboardEntry {
  rank: number;
  previousRank: number;
  wallet: string;
  wins: number;
  totalBattles: number;
  totalRewards: number;
  winStreak: number;
  avatar: string;
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    previousRank: 1,
    wallet: "7xKX...YnHd",
    wins: 45,
    totalBattles: 52,
    totalRewards: 125_000_000_000,
    winStreak: 8,
    avatar: "🦁",
  },
  {
    rank: 2,
    previousRank: 3,
    wallet: "9aBC...dEfG",
    wins: 42,
    totalBattles: 55,
    totalRewards: 98_000_000_000,
    winStreak: 5,
    avatar: "🐺",
  },
  {
    rank: 3,
    previousRank: 2,
    wallet: "3HiJ...kLmN",
    wins: 38,
    totalBattles: 48,
    totalRewards: 87_500_000_000,
    winStreak: 3,
    avatar: "🦊",
  },
  {
    rank: 4,
    previousRank: 5,
    wallet: "5OpQ...rStU",
    wins: 35,
    totalBattles: 50,
    totalRewards: 72_000_000_000,
    winStreak: 4,
    avatar: "🐻",
  },
  {
    rank: 5,
    previousRank: 4,
    wallet: "1VwX...yZaB",
    wins: 33,
    totalBattles: 45,
    totalRewards: 68_500_000_000,
    winStreak: 2,
    avatar: "🦅",
  },
  {
    rank: 6,
    previousRank: 8,
    wallet: "2CdE...fGhI",
    wins: 30,
    totalBattles: 42,
    totalRewards: 55_000_000_000,
    winStreak: 6,
    avatar: "🐯",
  },
  {
    rank: 7,
    previousRank: 6,
    wallet: "4JkL...mNoP",
    wins: 28,
    totalBattles: 40,
    totalRewards: 48_000_000_000,
    winStreak: 1,
    avatar: "🦈",
  },
  {
    rank: 8,
    previousRank: 7,
    wallet: "6QrS...tUvW",
    wins: 26,
    totalBattles: 38,
    totalRewards: 42_500_000_000,
    winStreak: 0,
    avatar: "🐲",
  },
  {
    rank: 9,
    previousRank: 10,
    wallet: "8XyZ...aBcD",
    wins: 24,
    totalBattles: 35,
    totalRewards: 38_000_000_000,
    winStreak: 3,
    avatar: "🦄",
  },
  {
    rank: 10,
    previousRank: 9,
    wallet: "0EfG...hIjK",
    wins: 22,
    totalBattles: 33,
    totalRewards: 35_000_000_000,
    winStreak: 2,
    avatar: "🐸",
  },
];

type SortBy = "rewards" | "wins" | "winRate" | "streak";

export default function LeaderboardPage() {
  const { publicKey, connected } = useWallet();
  const [sortBy, setSortBy] = useState<SortBy>("rewards");

  // Find user's rank
  const userRank = connected && publicKey 
    ? MOCK_LEADERBOARD.findIndex((e) => e.wallet.includes(publicKey.toBase58().slice(0, 4)))
    : -1;

  const sortedLeaderboard = [...MOCK_LEADERBOARD].sort((a, b) => {
    switch (sortBy) {
      case "rewards":
        return b.totalRewards - a.totalRewards;
      case "wins":
        return b.wins - a.wins;
      case "winRate":
        return (b.wins / b.totalBattles) - (a.wins / a.totalBattles);
      case "streak":
        return b.winStreak - a.winStreak;
      default:
        return 0;
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      {/* Header */}
      <section className="py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 glass-primary px-4 py-2 rounded-full mb-4">
            <Trophy className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-primary">
              Hall of Champions
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Leaderboard
          </h1>
          <p className="text-gray-400">
            Top warriors of the MemeWars arena
          </p>
        </motion.div>
      </section>

      {/* Top 3 Podium */}
      <section className="mb-12">
        <div className="flex items-end justify-center gap-4">
          {/* 2nd Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 max-w-[200px]"
          >
            <PodiumCard entry={sortedLeaderboard[1]} position={2} />
          </motion.div>

          {/* 1st Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 max-w-[240px]"
          >
            <PodiumCard entry={sortedLeaderboard[0]} position={1} />
          </motion.div>

          {/* 3rd Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1 max-w-[200px]"
          >
            <PodiumCard entry={sortedLeaderboard[2]} position={3} />
          </motion.div>
        </div>
      </section>

      {/* Sort Options */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Full Rankings</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="input-field py-2 px-3 text-sm w-auto"
          >
            <option value="rewards">Total Rewards</option>
            <option value="wins">Wins</option>
            <option value="winRate">Win Rate</option>
            <option value="streak">Win Streak</option>
          </select>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Wins
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Win Rate
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Streak
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Total Rewards
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedLeaderboard.map((entry, index) => (
                <motion.tr
                  key={entry.wallet}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-white/5 transition-colors"
                >
                  {/* Rank */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${getRankColor(index + 1)}`}>
                        #{index + 1}
                      </span>
                      <RankChange current={index + 1} previous={entry.previousRank} />
                    </div>
                  </td>

                  {/* Player */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{entry.avatar}</span>
                      <span className="font-mono text-white">{entry.wallet}</span>
                    </div>
                  </td>

                  {/* Wins */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="font-bold text-white">
                      {entry.wins}/{entry.totalBattles}
                    </span>
                  </td>

                  {/* Win Rate */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`font-bold ${getWinRateColor(entry.wins / entry.totalBattles)}`}>
                      {((entry.wins / entry.totalBattles) * 100).toFixed(1)}%
                    </span>
                  </td>

                  {/* Streak */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {entry.winStreak > 0 ? (
                      <span className="inline-flex items-center gap-1 text-accent">
                        <Flame className="w-4 h-4" />
                        <span className="font-bold">{entry.winStreak}</span>
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>

                  {/* Rewards */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="font-mono font-bold text-gradient">
                      {(entry.totalRewards / 1e9).toFixed(2)} SOL
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User's Position (if not in top 10) */}
      {connected && userRank === -1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 glass-primary rounded-xl p-6 text-center"
        >
          <p className="text-gray-400 mb-2">Your current position</p>
          <p className="text-4xl font-bold text-white mb-2">#247</p>
          <p className="text-sm text-gray-500">
            Win more battles to climb the ranks!
          </p>
        </motion.div>
      )}
    </div>
  );
}

interface PodiumCardProps {
  entry: LeaderboardEntry;
  position: 1 | 2 | 3;
}

const PodiumCard = ({ entry, position }: PodiumCardProps) => {
  const heights = { 1: "h-40", 2: "h-32", 3: "h-28" };
  const colors = {
    1: "from-accent to-accent-400 border-accent/50",
    2: "from-gray-400 to-gray-500 border-gray-400/50",
    3: "from-orange-600 to-orange-400 border-orange-500/50",
  };
  const icons = {
    1: <Crown className="w-8 h-8 text-accent" />,
    2: <Medal className="w-6 h-6 text-gray-300" />,
    3: <Medal className="w-6 h-6 text-orange-400" />,
  };

  return (
    <div className="text-center">
      {/* Avatar & Name */}
      <div className="relative inline-block mb-4">
        <div className="w-20 h-20 rounded-full glass flex items-center justify-center text-4xl border-2 border-white/20">
          {entry.avatar}
        </div>
        <div className="absolute -top-2 -right-2">
          {icons[position]}
        </div>
      </div>
      <p className="font-mono text-sm text-white mb-1">{entry.wallet}</p>
      <p className="text-xs text-gray-400 mb-4">
        {entry.wins} wins • {((entry.wins / entry.totalBattles) * 100).toFixed(0)}% rate
      </p>

      {/* Podium */}
      <div
        className={`${heights[position]} bg-gradient-to-t ${colors[position]} rounded-t-xl flex items-center justify-center border-t-2 border-l-2 border-r-2`}
      >
        <div className="text-center">
          <div className="text-3xl font-black text-white">#{position}</div>
          <div className="text-xs font-bold text-white/80 mt-1">
            {(entry.totalRewards / 1e9).toFixed(1)} SOL
          </div>
        </div>
      </div>
    </div>
  );
};

const RankChange = ({ current, previous }: { current: number; previous: number }) => {
  const diff = previous - current;
  
  if (diff > 0) {
    return (
      <span className="flex items-center text-green-400 text-xs">
        <ChevronUp className="w-4 h-4" />
        {diff}
      </span>
    );
  }
  if (diff < 0) {
    return (
      <span className="flex items-center text-red-400 text-xs">
        <ChevronDown className="w-4 h-4" />
        {Math.abs(diff)}
      </span>
    );
  }
  return (
    <span className="text-gray-500 text-xs">
      <Minus className="w-4 h-4" />
    </span>
  );
};

function getRankColor(rank: number): string {
  if (rank === 1) return "text-accent";
  if (rank === 2) return "text-gray-300";
  if (rank === 3) return "text-orange-400";
  return "text-gray-400";
}

function getWinRateColor(rate: number): string {
  if (rate >= 0.7) return "text-green-400";
  if (rate >= 0.5) return "text-secondary";
  return "text-gray-400";
}

