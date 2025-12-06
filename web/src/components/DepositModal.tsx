"use client";

import { FC, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  X,
  Wallet,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Loader2,
  Zap,
  Shield,
  TrendingUp,
  Info,
} from "lucide-react";
import { Battle } from "./BattleCard";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  battle: Battle | null;
  selectedTeam: "A" | "B" | null;
}

export const DepositModal: FC<DepositModalProps> = ({
  isOpen,
  onClose,
  battle,
  selectedTeam,
}) => {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  // Fetch wallet balance
  useEffect(() => {
    async function fetchBalance() {
      if (publicKey && connection) {
        try {
          const bal = await connection.getBalance(publicKey);
          setBalance(bal);
        } catch (err) {
          console.error("Failed to fetch balance:", err);
        }
      }
    }
    fetchBalance();
  }, [publicKey, connection, isOpen]);

  if (!battle || !selectedTeam) return null;

  const token = selectedTeam === "A" ? battle.tokenA : battle.tokenB;
  const colorClass = selectedTeam === "A" ? "bonk" : "wif";
  const shadowClass = selectedTeam === "A" ? "shadow-neon-bonk" : "shadow-neon-wif";

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimals
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };

  const setMaxAmount = () => {
    if (balance) {
      // Leave 0.01 SOL for transaction fees
      const maxAmount = Math.max(0, (balance / LAMPORTS_PER_SOL) - 0.01);
      setAmount(maxAmount.toFixed(4));
    }
  };

  const handleDeposit = async () => {
    if (!connected || !publicKey) {
      setError("Please connect your wallet first");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (balance && amountNum * LAMPORTS_PER_SOL > balance) {
      setError("Insufficient balance");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Call the actual smart contract deposit function
      // For now, simulate a deposit
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Simulate successful transaction
      setSuccess(true);
      setTxSignature("simulated_tx_" + Date.now());
      
    } catch (err: any) {
      setError(err.message || "Transaction failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setAmount("");
    setError(null);
    setSuccess(false);
    setTxSignature(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className={`glass rounded-2xl max-w-md w-full overflow-hidden border-2 border-${colorClass}/30`}>
              {/* Header */}
              <div className={`bg-gradient-to-r from-${colorClass}/20 to-transparent p-6 border-b border-white/10`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{token.icon}</span>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Join Team ${token.symbol}
                      </h2>
                      <p className="text-sm text-gray-400">{token.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {success ? (
                  <SuccessState
                    amount={amount}
                    token={token}
                    txSignature={txSignature}
                    onClose={handleClose}
                  />
                ) : (
                  <>
                    {/* Info Banner */}
                    <div className="bg-secondary/10 border border-secondary/30 rounded-xl p-4 mb-6">
                      <div className="flex gap-3">
                        <Shield className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-secondary font-medium">
                            No-Loss Staking
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Your principal is always safe. Only the interest earned
                            goes to the winning team!
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Stake Amount (SOL)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={amount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          placeholder="0.00"
                          className={`input-field text-2xl font-mono pr-20 ${
                            error ? "border-red-500 focus:border-red-500" : ""
                          }`}
                          disabled={isLoading}
                        />
                        <button
                          onClick={setMaxAmount}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-primary hover:text-secondary transition-colors"
                        >
                          MAX
                        </button>
                      </div>

                      {/* Balance */}
                      <div className="flex items-center justify-between mt-2 text-sm">
                        <span className="text-gray-500">Available Balance:</span>
                        <span className="text-gray-300 font-mono">
                          {balance !== null
                            ? `${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`
                            : "Loading..."}
                        </span>
                      </div>

                      {/* Error */}
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 mt-3 text-red-400 text-sm"
                        >
                          <AlertCircle className="w-4 h-4" />
                          <span>{error}</span>
                        </motion.div>
                      )}
                    </div>

                    {/* Quick Amounts */}
                    <div className="grid grid-cols-4 gap-2 mb-6">
                      {[0.1, 0.5, 1, 5].map((val) => (
                        <button
                          key={val}
                          onClick={() => setAmount(val.toString())}
                          className="py-2 rounded-lg bg-dark-100 hover:bg-primary/20 text-sm font-medium transition-colors"
                        >
                          {val} SOL
                        </button>
                      ))}
                    </div>

                    {/* Estimated Returns */}
                    <div className="glass-primary rounded-xl p-4 mb-6">
                      <div className="flex items-center gap-2 text-sm text-gray-300 mb-3">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span>Estimated Returns (if you win)</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Your Stake</span>
                          <span className="font-mono">
                            {parseFloat(amount || "0").toFixed(2)} SOL
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Est. Interest (~7 days)</span>
                          <span className="font-mono text-green-400">
                            +{(parseFloat(amount || "0") * 0.001 * 7).toFixed(4)} SOL
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Winner Bonus</span>
                          <span className="font-mono text-accent">
                            + Loser&apos;s Interest
                          </span>
                        </div>
                        <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
                          <span>Total Return</span>
                          <span className="text-gradient">
                            {parseFloat(amount || "0").toFixed(2)} SOL + Rewards
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Deposit Button */}
                    <button
                      onClick={handleDeposit}
                      disabled={!connected || isLoading || !amount}
                      className={`w-full btn-primary flex items-center justify-center gap-2 bg-gradient-to-r from-${colorClass} to-${colorClass}-light hover:${shadowClass}`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : !connected ? (
                        <>
                          <Wallet className="w-5 h-5" />
                          <span>Connect Wallet</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5" />
                          <span>Stake {amount || "0"} SOL for ${token.symbol}</span>
                        </>
                      )}
                    </button>

                    {/* Info */}
                    <p className="text-xs text-gray-500 text-center mt-4 flex items-center justify-center gap-1">
                      <Info className="w-3 h-3" />
                      Funds are deposited into Marinade for yield generation
                    </p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

interface SuccessStateProps {
  amount: string;
  token: Battle["tokenA"];
  txSignature: string | null;
  onClose: () => void;
}

const SuccessState: FC<SuccessStateProps> = ({
  amount,
  token,
  txSignature,
  onClose,
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-6"
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", delay: 0.1 }}
      className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center"
    >
      <CheckCircle className="w-10 h-10 text-green-400" />
    </motion.div>

    <h3 className="text-2xl font-bold text-white mb-2">You&apos;re In! 🎉</h3>
    <p className="text-gray-400 mb-6">
      Successfully staked {amount} SOL for Team ${token.symbol}
    </p>

    <div className="glass rounded-xl p-4 mb-6">
      <div className="flex items-center justify-center gap-3">
        <span className="text-4xl">{token.icon}</span>
        <div className="text-left">
          <p className="text-sm text-gray-400">Your stake</p>
          <p className="text-xl font-bold text-gradient">{amount} SOL</p>
        </div>
      </div>
    </div>

    {txSignature && (
      <a
        href={`https://solscan.io/tx/${txSignature}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-secondary hover:text-primary transition-colors flex items-center justify-center gap-1 mb-6"
      >
        View Transaction <ArrowRight className="w-4 h-4" />
      </a>
    )}

    <button onClick={onClose} className="btn-outline w-full">
      Back to Battles
    </button>
  </motion.div>
);

