"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  Swords,
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
  Trophy,
  Users,
  Clock,
  ArrowRight,
} from "lucide-react";
import { BattleCard, Battle } from "@/components/BattleCard";
import { DepositModal } from "@/components/DepositModal";

// Mock data for battles
const MOCK_BATTLES: Battle[] = [
  {
    id: "battle-1",
    tokenA: {
      symbol: "BONK",
      name: "Bonk",
      icon: "🐕",
      color: "bonk",
    },
    tokenB: {
      symbol: "WIF",
      name: "dogwifhat",
      icon: "🐶",
      color: "wif",
    },
    tvlA: 125_000_000_000, // 125 SOL
    tvlB: 98_000_000_000, // 98 SOL
    playersA: 156,
    playersB: 123,
    apyEstimate: 8.5,
    endsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
    status: "active",
  },
  {
    id: "battle-2",
    tokenA: {
      symbol: "POPCAT",
      name: "Popcat",
      icon: "🐱",
      color: "bonk",
    },
    tokenB: {
      symbol: "MEW",
      name: "cat in a dogs world",
      icon: "😺",
      color: "wif",
    },
    tvlA: 45_000_000_000,
    tvlB: 62_000_000_000,
    playersA: 78,
    playersB: 95,
    apyEstimate: 12.3,
    endsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    status: "active",
  },
  {
    id: "battle-3",
    tokenA: {
      symbol: "TRUMP",
      name: "OFFICIAL TRUMP",
      icon: "🇺🇸",
      color: "bonk",
    },
    tokenB: {
      symbol: "FARTCOIN",
      name: "Fartcoin",
      icon: "💨",
      color: "wif",
    },
    tvlA: 200_000_000_000,
    tvlB: 180_000_000_000,
    playersA: 312,
    playersB: 287,
    apyEstimate: 6.8,
    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    status: "active",
  },
];

export default function Home() {
  const { connected } = useWallet();
  const [selectedBattle, setSelectedBattle] = useState<Battle | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<"A" | "B" | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectTeam = (battleId: string, team: "A" | "B") => {
    const battle = MOCK_BATTLES.find((b) => b.id === battleId);
    if (battle) {
      setSelectedBattle(battle);
      setSelectedTeam(team);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBattle(null);
    setSelectedTeam(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      {/* Hero Section */}
      <section className="text-center py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass-primary px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-primary">
              No-Loss Prediction Market
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6">
            <span className="text-white">Bet on </span>
            <span className="text-gradient">Memes</span>
            <br />
            <span className="text-white">Without </span>
            <span className="text-secondary">Losing</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Stake your SOL, pick your favorite memecoin, and compete for yields.
            Your principal is always safe - only interest goes to the winners!
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {!connected ? (
              <WalletMultiButton />
            ) : (
              <a
                href="#battles"
                className="btn-primary flex items-center gap-2"
              >
                <Swords className="w-5 h-5" />
                <span>Enter the Arena</span>
              </a>
            )}
            <a href="#how-it-works" className="btn-outline flex items-center gap-2">
              <span>How it Works</span>
              <ArrowRight className="w-4 h-4" />
          </a>
        </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16"
        >
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Total Value Locked"
            value="710+ SOL"
            color="primary"
          />
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="Active Players"
            value="1,051"
            color="secondary"
          />
          <StatCard
            icon={<Swords className="w-5 h-5" />}
            label="Active Battles"
            value="3"
            color="accent"
          />
          <StatCard
            icon={<Trophy className="w-5 h-5" />}
            label="Total Rewards"
            value="42+ SOL"
            color="green"
          />
        </motion.div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            A simple 4-step process to bet on your favorite memecoins without
            risking your principal.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-6">
          {[
            {
              step: 1,
              icon: <Swords className="w-8 h-8" />,
              title: "Choose Your Side",
              description:
                "Pick between two competing memecoins. Which one will grow more?",
            },
            {
              step: 2,
              icon: <Zap className="w-8 h-8" />,
              title: "Stake SOL",
              description:
                "Deposit your SOL. It automatically earns yield through DeFi protocols.",
            },
            {
              step: 3,
              icon: <Clock className="w-8 h-8" />,
              title: "Wait & Shill",
              description:
                "Promote your coin, watch the battle unfold, and add more stake anytime.",
            },
            {
              step: 4,
              icon: <Trophy className="w-8 h-8" />,
              title: "Claim Rewards",
              description:
                "Winners get all the yield! Losers still get their full principal back.",
            },
          ].map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass rounded-2xl p-6 text-center card-hover"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary">
                {item.icon}
              </div>
              <div className="text-xs font-bold text-accent mb-2">
                STEP {item.step}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-gray-400">{item.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Safety Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 glass-secondary rounded-2xl p-6 flex flex-col md:flex-row items-center gap-4"
        >
          <Shield className="w-12 h-12 text-secondary flex-shrink-0" />
          <div>
            <h3 className="text-lg font-bold text-white mb-1">
              Your Principal is Always Safe
            </h3>
            <p className="text-sm text-gray-400">
              Unlike traditional betting, you never lose your initial stake. Your
              SOL is deposited into battle-tested DeFi protocols (like Marinade)
              where it earns staking rewards. The interest generated is what gets
              distributed to winners.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Active Battles */}
      <section id="battles" className="py-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              🔥 Active Battles
            </h2>
            <p className="text-gray-400">
              Choose your side and stake your claim!
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span>Live</span>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          {MOCK_BATTLES.map((battle, index) => (
            <motion.div
              key={battle.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <BattleCard battle={battle} onSelectTeam={handleSelectTeam} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Deposit Modal */}
      <DepositModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        battle={selectedBattle}
        selectedTeam={selectedTeam}
      />
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "primary" | "secondary" | "accent" | "green";
}

const StatCard = ({ icon, label, value, color }: StatCardProps) => {
  const colorClasses = {
    primary: "text-primary border-primary/30",
    secondary: "text-secondary border-secondary/30",
    accent: "text-accent border-accent/30",
    green: "text-green-400 border-green-400/30",
  };

  return (
    <div className={`glass rounded-xl p-4 border ${colorClasses[color]}`}>
      <div className={`${colorClasses[color].split(" ")[0]} mb-2`}>{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
};
