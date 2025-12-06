"use client";

import { useCallback, useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  PROGRAM_ID,
  MARINADE_ADDRESSES,
  TEAM,
  findBattlePDA,
  findUserStatePDA,
  findVaultPDA,
  findTicketMintPDA,
  findTicketMintAuthorityPDA,
} from "@/lib/program";

export interface DepositParams {
  battleId: bigint;
  team: "A" | "B";
  amount: number; // in SOL
}

export interface ClaimParams {
  battleId: bigint;
}

export function useProgram() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signTransaction } = useWallet();

  const program = useMemo(() => {
    // In production, you would use Anchor's Program class here
    // For now, we'll build transactions manually
    return {
      programId: PROGRAM_ID,
    };
  }, []);

  const deposit = useCallback(
    async ({ battleId, team, amount }: DepositParams) => {
      if (!publicKey || !signTransaction) {
        throw new Error("Wallet not connected");
      }

      const teamNum = team === "A" ? TEAM.A : TEAM.B;
      const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

      // Derive PDAs
      const [battlePDA] = findBattlePDA(battleId);
      const [userStatePDA] = findUserStatePDA(publicKey, battleId);
      const [vaultPDA] = findVaultPDA(battleId, teamNum);
      const [ticketMintPDA] = findTicketMintPDA(battleId, teamNum);
      const [ticketMintAuthorityPDA] = findTicketMintAuthorityPDA(battleId, teamNum);

      // Build transaction
      // Note: In production, you would use the actual instruction data
      // This is a placeholder to show the structure
      const transaction = new Transaction();

      // Add deposit instruction
      // In production, use Anchor or manual instruction building
      // transaction.add(
      //   new TransactionInstruction({
      //     keys: [...],
      //     programId: PROGRAM_ID,
      //     data: Buffer.from([...]),
      //   })
      // );

      // For demo purposes, we'll simulate with a simple SOL transfer
      // Remove this in production and use actual program instruction
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: vaultPDA, // In production, this goes to the vault
          lamports,
        })
      );

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = publicKey;

      // Send transaction
      const signature = await sendTransaction(transaction, connection);

      // Confirm transaction
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      return {
        signature,
        userStatePDA,
        ticketMintPDA,
      };
    },
    [connection, publicKey, signTransaction, sendTransaction]
  );

  const claim = useCallback(
    async ({ battleId }: ClaimParams) => {
      if (!publicKey || !signTransaction) {
        throw new Error("Wallet not connected");
      }

      // Derive PDAs
      const [battlePDA] = findBattlePDA(battleId);
      const [userStatePDA] = findUserStatePDA(publicKey, battleId);

      // Build claim transaction
      const transaction = new Transaction();

      // Add claim instruction
      // In production, use actual program instruction

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = publicKey;

      // Send transaction
      const signature = await sendTransaction(transaction, connection);

      // Confirm transaction
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      return {
        signature,
      };
    },
    [connection, publicKey, signTransaction, sendTransaction]
  );

  const fetchBattle = useCallback(
    async (battleId: bigint) => {
      const [battlePDA] = findBattlePDA(battleId);
      const accountInfo = await connection.getAccountInfo(battlePDA);

      if (!accountInfo) {
        return null;
      }

      // In production, deserialize the account data
      // using Borsh or Anchor's account parsing
      return {
        publicKey: battlePDA,
        data: accountInfo.data,
      };
    },
    [connection]
  );

  const fetchUserState = useCallback(
    async (battleId: bigint, userPubkey?: PublicKey) => {
      const user = userPubkey || publicKey;
      if (!user) {
        return null;
      }

      const [userStatePDA] = findUserStatePDA(user, battleId);
      const accountInfo = await connection.getAccountInfo(userStatePDA);

      if (!accountInfo) {
        return null;
      }

      // In production, deserialize the account data
      return {
        publicKey: userStatePDA,
        data: accountInfo.data,
      };
    },
    [connection, publicKey]
  );

  return {
    program,
    deposit,
    claim,
    fetchBattle,
    fetchUserState,
    isReady: !!publicKey,
  };
}

// Hook for fetching active battles
export function useBattles() {
  const { connection } = useConnection();

  const fetchActiveBattles = useCallback(async () => {
    // In production, you would fetch all battle accounts
    // and filter for active ones
    // For now, return mock data
    return [];
  }, [connection]);

  return {
    fetchActiveBattles,
  };
}

