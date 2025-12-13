"use client";

import { useCallback, useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import {
  PROGRAM_ID,
  TEAM,
  findBattlePDA,
  findUserStatePDA,
  findVaultPDA,
  findTicketMintPDA,
  findTicketMintAuthorityPDA,
} from "@/lib/program";

export interface CreateBattleParams {
  battleId: bigint;
  tokenA: PublicKey;
  tokenB: PublicKey;
  priceFeedA: PublicKey;
  priceFeedB: PublicKey;
  durationSeconds: number;
}

export interface DepositParams {
  battleId: bigint;
  team: "A" | "B";
  amount: number; // in SOL
}

export interface SettleParams {
  battleId: bigint;
  priceFeedA: PublicKey;
  priceFeedB: PublicKey;
}

export interface ClaimParams {
  battleId: bigint;
  team: "A" | "B";
}

export interface WithdrawParams {
  battleId: bigint;
  team: "A" | "B";
}

export function useProgram() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signTransaction } = useWallet();

  const program = useMemo(() => {
    return {
      programId: PROGRAM_ID,
    };
  }, []);

  // =========================================================================
  // CREATE BATTLE
  // =========================================================================
  const createBattle = useCallback(
    async ({
      battleId,
      tokenA,
      tokenB,
      priceFeedA,
      priceFeedB,
      durationSeconds,
    }: CreateBattleParams) => {
      if (!publicKey || !signTransaction) {
        throw new Error("Wallet not connected");
      }

      const [battlePDA] = findBattlePDA(battleId);

      // Build instruction data
      // In production, use Anchor's IDL-based instruction building
      const discriminator = Buffer.from([
        // create_battle discriminator (8 bytes)
        // You can get this from the IDL
        0, 0, 0, 0, 0, 0, 0, 0,
      ]);

      const battleIdBuffer = Buffer.alloc(8);
      battleIdBuffer.writeBigUInt64LE(battleId);

      const durationBuffer = Buffer.alloc(8);
      durationBuffer.writeBigInt64LE(BigInt(durationSeconds));

      const data = Buffer.concat([discriminator, battleIdBuffer, durationBuffer]);

      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: battlePDA, isSigner: false, isWritable: true },
          { pubkey: tokenA, isSigner: false, isWritable: false },
          { pubkey: tokenB, isSigner: false, isWritable: false },
          { pubkey: priceFeedA, isSigner: false, isWritable: false },
          { pubkey: priceFeedB, isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data,
      });

      const transaction = new Transaction().add(instruction);

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);

      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      return {
        signature,
        battlePDA,
      };
    },
    [connection, publicKey, signTransaction, sendTransaction]
  );

  // =========================================================================
  // DEPOSIT
  // =========================================================================
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

      // Get user's ticket token account
      const userTicketAccount = await getAssociatedTokenAddress(
        ticketMintPDA,
        publicKey
      );

      const transaction = new Transaction();

      // Create associated token account if needed
      try {
        await connection.getAccountInfo(userTicketAccount);
      } catch {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            userTicketAccount,
            publicKey,
            ticketMintPDA
          )
        );
      }

      // Build deposit instruction
      // In production, use Anchor's IDL
      const discriminator = Buffer.from([
        // deposit discriminator
        0, 0, 0, 0, 0, 0, 0, 0,
      ]);

      const amountBuffer = Buffer.alloc(8);
      amountBuffer.writeBigUInt64LE(BigInt(lamports));

      const teamBuffer = Buffer.alloc(1);
      teamBuffer.writeUInt8(teamNum);

      const data = Buffer.concat([discriminator, amountBuffer, teamBuffer]);

      const depositInstruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: battlePDA, isSigner: false, isWritable: true },
          { pubkey: userStatePDA, isSigner: false, isWritable: true },
          { pubkey: vaultPDA, isSigner: false, isWritable: true },
          { pubkey: ticketMintPDA, isSigner: false, isWritable: true },
          { pubkey: ticketMintAuthorityPDA, isSigner: false, isWritable: false },
          { pubkey: userTicketAccount, isSigner: false, isWritable: true },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data,
      });

      transaction.add(depositInstruction);

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);

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

  // =========================================================================
  // SETTLE
  // =========================================================================
  const settle = useCallback(
    async ({ battleId, priceFeedA, priceFeedB }: SettleParams) => {
      if (!publicKey || !signTransaction) {
        throw new Error("Wallet not connected");
      }

      const [battlePDA] = findBattlePDA(battleId);
      const [vaultAPDA] = findVaultPDA(battleId, TEAM.A);
      const [vaultBPDA] = findVaultPDA(battleId, TEAM.B);

      // Build settle instruction
      const discriminator = Buffer.from([
        // settle discriminator
        0, 0, 0, 0, 0, 0, 0, 0,
      ]);

      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: battlePDA, isSigner: false, isWritable: true },
          { pubkey: vaultAPDA, isSigner: false, isWritable: true },
          { pubkey: vaultBPDA, isSigner: false, isWritable: true },
          { pubkey: priceFeedA, isSigner: false, isWritable: false },
          { pubkey: priceFeedB, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: discriminator,
      });

      const transaction = new Transaction().add(instruction);

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);

      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      return { signature };
    },
    [connection, publicKey, signTransaction, sendTransaction]
  );

  // =========================================================================
  // CLAIM REWARD
  // =========================================================================
  const claimReward = useCallback(
    async ({ battleId, team }: ClaimParams) => {
      if (!publicKey || !signTransaction) {
        throw new Error("Wallet not connected");
      }

      const teamNum = team === "A" ? TEAM.A : TEAM.B;

      const [battlePDA] = findBattlePDA(battleId);
      const [userStatePDA] = findUserStatePDA(publicKey, battleId);
      const [vaultPDA] = findVaultPDA(battleId, teamNum);
      const [ticketMintPDA] = findTicketMintPDA(battleId, teamNum);

      const userTicketAccount = await getAssociatedTokenAddress(
        ticketMintPDA,
        publicKey
      );

      // Build claim_reward instruction
      const discriminator = Buffer.from([
        // claim_reward discriminator
        0, 0, 0, 0, 0, 0, 0, 0,
      ]);

      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: battlePDA, isSigner: false, isWritable: false },
          { pubkey: userStatePDA, isSigner: false, isWritable: true },
          { pubkey: vaultPDA, isSigner: false, isWritable: true },
          { pubkey: ticketMintPDA, isSigner: false, isWritable: true },
          { pubkey: userTicketAccount, isSigner: false, isWritable: true },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: discriminator,
      });

      const transaction = new Transaction().add(instruction);

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);

      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      return { signature };
    },
    [connection, publicKey, signTransaction, sendTransaction]
  );

  // =========================================================================
  // WITHDRAW
  // =========================================================================
  const withdraw = useCallback(
    async ({ battleId, team }: WithdrawParams) => {
      if (!publicKey || !signTransaction) {
        throw new Error("Wallet not connected");
      }

      const teamNum = team === "A" ? TEAM.A : TEAM.B;

      const [battlePDA] = findBattlePDA(battleId);
      const [userStatePDA] = findUserStatePDA(publicKey, battleId);
      const [vaultPDA] = findVaultPDA(battleId, teamNum);
      const [ticketMintPDA] = findTicketMintPDA(battleId, teamNum);

      const userTicketAccount = await getAssociatedTokenAddress(
        ticketMintPDA,
        publicKey
      );

      // Build withdraw instruction
      const discriminator = Buffer.from([
        // withdraw discriminator
        0, 0, 0, 0, 0, 0, 0, 0,
      ]);

      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: battlePDA, isSigner: false, isWritable: true },
          { pubkey: userStatePDA, isSigner: false, isWritable: true },
          { pubkey: vaultPDA, isSigner: false, isWritable: true },
          { pubkey: ticketMintPDA, isSigner: false, isWritable: true },
          { pubkey: userTicketAccount, isSigner: false, isWritable: true },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: discriminator,
      });

      const transaction = new Transaction().add(instruction);

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);

      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      return { signature };
    },
    [connection, publicKey, signTransaction, sendTransaction]
  );

  // =========================================================================
  // FETCH FUNCTIONS
  // =========================================================================
  const fetchBattle = useCallback(
    async (battleId: bigint) => {
      const [battlePDA] = findBattlePDA(battleId);
      const accountInfo = await connection.getAccountInfo(battlePDA);

      if (!accountInfo) {
        return null;
      }

      // In production, deserialize using Borsh/Anchor
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

      return {
        publicKey: userStatePDA,
        data: accountInfo.data,
      };
    },
    [connection, publicKey]
  );

  return {
    program,
    // Write functions
    createBattle,
    deposit,
    settle,
    claimReward,
    withdraw,
    // Read functions
    fetchBattle,
    fetchUserState,
    // Status
    isReady: !!publicKey,
  };
}

// ============================================================================
// PYTH ORACLE CONSTANTS
// ============================================================================

export const PYTH_PRICE_FEEDS = {
  // Mainnet price feed IDs
  SOL_USD: new PublicKey("H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG"),
  BONK_USD: new PublicKey("8ihFLu5FimgTQ1Unh4dVyEHUGodJ5gJQCrQf4KUVB9bN"),
  WIF_USD: new PublicKey("6ABgrEZk8urs6kJ1JNdC1sspH5zKXRqxy8sg3ZG2cQps"),
  POPCAT_USD: new PublicKey("5SLwNNEXzgUJ4qjNYFKYxVKJVdrmMPdrP3sxyAj8UHbJ"),
};

// Token mint addresses (mainnet)
export const TOKEN_MINTS = {
  BONK: new PublicKey("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"),
  WIF: new PublicKey("EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm"),
  POPCAT: new PublicKey("7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr"),
};
