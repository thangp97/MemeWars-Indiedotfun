import { PublicKey } from "@solana/web3.js";

// Program ID - Update this with your deployed program ID
// export const PROGRAM_ID = new PublicKey(
//   process.env.NEXT_PUBLIC_PROGRAM_ID || "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"
// );

// Update Program ID
export const PROGRAM_ID = new PublicKey(
  "71r5LdZhJUpLaNJvCeSxmRqzNmcJuiM8XQ7U8AQdKHGB"
);

// Update network
export const NETWORK = "devnet";

// Marinade Finance addresses (mainnet)
export const MARINADE_ADDRESSES = {
  program: new PublicKey("MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD"),
  state: new PublicKey("8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC"),
  msolMint: new PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So"),
  liqPoolSol: new PublicKey("UefNb6z6yvArqe4cJHTXCqStRsKmWhGxnZzuHbikP5Q"),
  liqPoolMsol: new PublicKey("7GgPYjS5Dza89wV6FpZ23kUJRG5vbQ1GM25ezspYFSoE"),
  liqPoolAuthority: new PublicKey("EyaSjUtSgo9aRD1f8LWXwdvkpDTmXAW54yoSHZRF14WL"),
  reserve: new PublicKey("Du3Ysj1wKbxPKkuPPnvzQLQh8oMSVifs3jGZjJWXFmHN"),
  msolMintAuthority: new PublicKey("3JLPCS1qM2zRw3Dp6V4hZnYHd4toMNPkNesXdX9tg6KM"),
};

// Team constants
export const TEAM = {
  A: 1,
  B: 2,
} as const;

// Battle status
export const BATTLE_STATUS = {
  ACTIVE: 0,
  SETTLED: 1,
  CANCELLED: 2,
} as const;

// Winner constants
export const WINNER = {
  NONE: 0,
  TEAM_A: 1,
  TEAM_B: 2,
} as const;

// PDA derivation functions
export function findBattlePDA(battleId: bigint): [PublicKey, number] {
  const battleIdBuffer = Buffer.alloc(8);
  battleIdBuffer.writeBigUInt64LE(battleId);
  
  return PublicKey.findProgramAddressSync(
    [Buffer.from("battle"), battleIdBuffer],
    PROGRAM_ID
  );
}

export function findUserStatePDA(
  userPubkey: PublicKey,
  battleId: bigint
): [PublicKey, number] {
  const battleIdBuffer = Buffer.alloc(8);
  battleIdBuffer.writeBigUInt64LE(battleId);
  
  return PublicKey.findProgramAddressSync(
    [Buffer.from("user_state"), userPubkey.toBuffer(), battleIdBuffer],
    PROGRAM_ID
  );
}

export function findVaultPDA(
  battleId: bigint,
  team: number
): [PublicKey, number] {
  const battleIdBuffer = Buffer.alloc(8);
  battleIdBuffer.writeBigUInt64LE(battleId);
  const teamBuffer = Buffer.alloc(1);
  teamBuffer.writeUInt8(team);
  
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), battleIdBuffer, teamBuffer],
    PROGRAM_ID
  );
}

export function findTicketMintPDA(
  battleId: bigint,
  team: number
): [PublicKey, number] {
  const battleIdBuffer = Buffer.alloc(8);
  battleIdBuffer.writeBigUInt64LE(battleId);
  const teamBuffer = Buffer.alloc(1);
  teamBuffer.writeUInt8(team);
  
  return PublicKey.findProgramAddressSync(
    [Buffer.from("ticket_mint"), battleIdBuffer, teamBuffer],
    PROGRAM_ID
  );
}

export function findTicketMintAuthorityPDA(
  battleId: bigint,
  team: number
): [PublicKey, number] {
  const battleIdBuffer = Buffer.alloc(8);
  battleIdBuffer.writeBigUInt64LE(battleId);
  const teamBuffer = Buffer.alloc(1);
  teamBuffer.writeUInt8(team);
  
  return PublicKey.findProgramAddressSync(
    [Buffer.from("ticket_mint_authority"), battleIdBuffer, teamBuffer],
    PROGRAM_ID
  );
}

// Types for accounts
export interface BattleState {
  battleId: bigint;
  tokenA: PublicKey;
  tokenB: PublicKey;
  initialPriceA: bigint;
  initialPriceB: bigint;
  finalPriceA: bigint | null;
  finalPriceB: bigint | null;
  startTime: bigint;
  endTime: bigint;
  totalStakedA: bigint;
  totalStakedB: bigint;
  status: number;
  winner: number;
  vaultA: PublicKey;
  vaultB: PublicKey;
  bump: number;
}

export interface UserState {
  user: PublicKey;
  battleId: bigint;
  team: number;
  amountStaked: bigint;
  stakeTime: bigint;
  claimed: boolean;
  bump: number;
}

export interface Vault {
  battleId: bigint;
  team: number;
  totalAmount: bigint;
  lentAmount: bigint;
  lendingPosition: PublicKey | null;
  bump: number;
}

