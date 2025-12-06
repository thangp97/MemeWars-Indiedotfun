"use client";

import { FC, useState } from "react";
import { motion } from "framer-motion";
import { 
  Zap, 
  TrendingUp, 
  Users, 
  Clock, 
  ChevronRight,
  Flame,
  Sparkles
} from "lucide-react";

export interface Battle {
  id: string;
  tokenA: {
    symbol: string;
    name: string;
    icon: string;
    color: string;
  };
  tokenB: {
    symbol: string;
    name: string;
    icon: string;
    color: string;
  };
  tvlA: number;
  tvlB: number;
  playersA: number;
  playersB: number;
  apyEstimate: number;
  endsAt: Date;
  status: "active" | "settled" | "upcoming";
}

interface BattleCardProps {
  battle: Battle;
  onSelectTeam: (battleId: string, team: "A" | "B") => void;
}

export const BattleCard: FC<BattleCardProps> = ({ battle, onSelectTeam }) => {
  const [hoveredTeam, setHoveredTeam] = useState<"A" | "B" | null>(null);

  const totalTvl = battle.tvlA + battle.tvlB;
  const percentA = totalTvl > 0 ? (battle.tvlA / totalTvl) * 100 : 50;
  const percentB = totalTvl > 0 ? (battle.tvlB / totalTvl) * 100 : 50;

  const timeLeft = getTimeLeft(battle.endsAt);
  const isEnding = timeLeft.hours < 24;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl overflow-hidden card-hover"
    >
      {/* Header */}
      <div className="relative px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-accent animate-pulse" />
            <span className="text-sm font-medium text-accent">LIVE BATTLE</span>
          </div>
          <div className={`flex items-center gap-2 ${isEnding ? 'text-red-400' : 'text-gray-400'}`}>
            <Clock className="w-4 h-4" />
            <span className="text-sm font-mono">
              {timeLeft.days > 0 && `${timeLeft.days}d `}
              {timeLeft.hours}h {timeLeft.minutes}m
            </span>
          </div>
        </div>
        
        {/* APY Badge */}
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-accent to-accent-400 text-dark px-3 py-1 rounded-l-full text-sm font-bold shadow-neon-accent">
          ~{battle.apyEstimate}% APY
        </div>
      </div>

      {/* Battle Arena */}
      <div className="p-6">
        <div className="flex items-center justify-between gap-4">
          {/* Team A */}
          <TeamSide
            team="A"
            token={battle.tokenA}
            tvl={battle.tvlA}
            players={battle.playersA}
            percent={percentA}
            isHovered={hoveredTeam === "A"}
            onHover={() => setHoveredTeam("A")}
            onLeave={() => setHoveredTeam(null)}
            onClick={() => onSelectTeam(battle.id, "A")}
          />

          {/* VS Divider */}
          <div className="flex flex-col items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="relative"
            >
              <span className="text-3xl font-black text-gradient glow-text">VS</span>
              <div className="absolute inset-0 blur-xl bg-accent/30" />
            </motion.div>
            <div className="w-px h-16 bg-gradient-to-b from-transparent via-accent to-transparent" />
          </div>

          {/* Team B */}
          <TeamSide
            team="B"
            token={battle.tokenB}
            tvl={battle.tvlB}
            players={battle.playersB}
            percent={percentB}
            isHovered={hoveredTeam === "B"}
            onHover={() => setHoveredTeam("B")}
            onLeave={() => setHoveredTeam(null)}
            onClick={() => onSelectTeam(battle.id, "B")}
          />
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>{percentA.toFixed(1)}%</span>
            <span>{percentB.toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-dark-100 rounded-full overflow-hidden flex">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentA}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full bg-gradient-to-r from-bonk to-bonk-light`}
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentB}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full bg-gradient-to-r from-wif-dark to-wif`}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="glass-primary rounded-xl p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">Total Value Locked</div>
            <div className="text-lg font-bold text-gradient">
              {formatSol(totalTvl)} SOL
            </div>
          </div>
          <div className="glass-secondary rounded-xl p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">Total Players</div>
            <div className="text-lg font-bold text-secondary">
              {battle.playersA + battle.playersB}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface TeamSideProps {
  team: "A" | "B";
  token: Battle["tokenA"];
  tvl: number;
  players: number;
  percent: number;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}

const TeamSide: FC<TeamSideProps> = ({
  team,
  token,
  tvl,
  players,
  percent,
  isHovered,
  onHover,
  onLeave,
  onClick,
}) => {
  const isTeamA = team === "A";
  const colorClass = isTeamA ? "bonk" : "wif";
  const shadowClass = isTeamA ? "shadow-neon-bonk" : "shadow-neon-wif";
  const glowClass = isTeamA ? "from-bonk/20" : "from-wif/20";

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
      className={`flex-1 p-4 rounded-xl border-2 transition-all duration-300 ${
        isHovered
          ? `border-${colorClass} ${shadowClass}`
          : "border-white/10 hover:border-white/30"
      }`}
    >
      {/* Token Icon & Name */}
      <div className="flex flex-col items-center gap-3">
        <div className={`relative`}>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br ${glowClass} to-transparent flex items-center justify-center text-4xl">
            {token.icon}
          </div>
          {isHovered && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-accent rounded-full p-1"
            >
              <Sparkles className="w-4 h-4 text-dark" />
            </motion.div>
          )}
        </div>
        
        <div className="text-center">
          <div className={`text-xl font-bold text-${colorClass}`}>
            ${token.symbol}
          </div>
          <div className="text-xs text-gray-400">{token.name}</div>
        </div>

        {/* Stats */}
        <div className="flex flex-col items-center gap-1 w-full">
          <div className="flex items-center gap-1 text-sm">
            <TrendingUp className="w-3 h-3 text-green-400" />
            <span className="font-mono">{formatSol(tvl)} SOL</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Users className="w-3 h-3" />
            <span>{players} players</span>
          </div>
        </div>

        {/* Join Button */}
        <div className={`w-full py-2 rounded-lg bg-${colorClass}/20 text-${colorClass} font-bold text-sm flex items-center justify-center gap-1 group-hover:bg-${colorClass} group-hover:text-white transition-colors`}>
          Join Team <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </motion.button>
  );
};

// Utility functions
function getTimeLeft(endDate: Date): { days: number; hours: number; minutes: number } {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes };
}

function formatSol(lamports: number): string {
  const sol = lamports / 1_000_000_000;
  if (sol >= 1000) {
    return `${(sol / 1000).toFixed(1)}K`;
  }
  return sol.toFixed(2);
}

