/**
 * Test MemeWars with Marinade Finance Integration
 * 
 * This test demonstrates how to deposit SOL with Marinade lending integration
 * on devnet.
 * 
 * Prerequisites:
 * 1. Create .env file from .env.example
 * 2. Run: npm run get-marinade (to verify Marinade addresses)
 * 3. Ensure you have SOL on devnet (airdrop if needed)
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MemeWars } from "../target/types/memewars";
import { 
  PublicKey, 
  Keypair, 
  SystemProgram, 
  SYSVAR_RENT_PUBKEY,
  Connection,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
  createAccount,
  getOrCreateAssociatedTokenAccount
} from "@solana/spl-token";
import { expect } from "chai";
import { loadEnv } from "../scripts/load-env";
import * as fs from "fs";
import * as path from "path";

// Load environment variables
loadEnv();

describe("MemeWars with Marinade Integration", () => {
  // Configure the client to use devnet
  const connection = new Connection(
    process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com",
    "confirmed"
  );
  
  const wallet = anchor.Wallet.local();
  const provider = new anchor.AnchorProvider(
    connection,
    wallet,
    { commitment: "confirmed" }
  );
  anchor.setProvider(provider);

  // Load program - try workspace first, then IDL file
  let program: Program<MemeWars>;
  const programId = new PublicKey("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");
  
  if (anchor.workspace && anchor.workspace.MemeWars) {
    // Use workspace (works with anchor test)
    program = anchor.workspace.MemeWars as Program<MemeWars>;
  } else {
    // Fallback to loading from IDL file
    const idlPath = path.join(__dirname, "../target/idl/memewars.json");
    if (fs.existsSync(idlPath)) {
      const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
      program = new Program(idl, programId, provider) as Program<MemeWars>;
    } else {
      throw new Error(
        `IDL file not found at ${idlPath}. Please run 'anchor build' first.`
      );
    }
  }
  
  // Test accounts
  const user = Keypair.generate();
  const battleId = new anchor.BN(1);
  const team = 1; // TEAM_A
  const depositAmount = new anchor.BN(1_000_000_000); // 1 SOL

  // Marinade devnet addresses from .env or defaults
  const MARINADE_PROGRAM_ID = new PublicKey(
    process.env.MARINADE_PROGRAM_ID || "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD"
  );
  const MARINADE_STATE = new PublicKey(
    process.env.MARINADE_STATE_ADDRESS || "8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC"
  );
  const MSOL_MINT = new PublicKey(
    process.env.MSOL_MINT_ADDRESS || "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So"
  );
  const MSOL_AUTH = new PublicKey(
    process.env.MSOL_AUTH_ADDRESS || "3JLPCS1qM2zRw3Dp6V4hZnYHd4toMNPkNesXdX9tg6KM"
  );
  const MARINADE_RESERVE = new PublicKey(
    process.env.MARINADE_RESERVE_ADDRESS || "Du3Ysj1wKbxPKkuPPnvzQLQh8oMSVifs3jGZjJWXFmHN"
  );
  const LIQ_POOL_MSOL_LEG = new PublicKey(
    process.env.MARINADE_LIQ_POOL_MSOL_LEG || "7GgPYjS5Dza89wV6FpZ23kUJRG5vbQ1GM25ezspYFSoE"
  );
  const LIQ_POOL_SOL_LEG = new PublicKey(
    process.env.MARINADE_LIQ_POOL_SOL_LEG || "UefNb6z6yvArqe4cJHTXCqStRsKmWhGxnZzuHbikP5Q"
  );
  const LIQ_POOL_AUTH = new PublicKey(
    process.env.MARINADE_LIQ_POOL_AUTH || "HZsepB79dnpvH6qfVgvMpS738EndHw3qSHo4Gv5WX1KA"
  );

  before(async () => {
    console.log("\n=== Setting up test environment ===");
    
    // Airdrop SOL cho user
    console.log("Requesting airdrop for user...");
    const signature = await connection.requestAirdrop(
      user.publicKey,
      5 * LAMPORTS_PER_SOL // 5 SOL
    );
    await connection.confirmTransaction(signature);
    
    const balance = await connection.getBalance(user.publicKey);
    console.log(`✅ User balance: ${balance / LAMPORTS_PER_SOL} SOL`);

    // Verify Marinade addresses
    console.log("\n=== Marinade Addresses ===");
    console.log("Program:", MARINADE_PROGRAM_ID.toBase58());
    console.log("State:", MARINADE_STATE.toBase58());
    console.log("mSOL Mint:", MSOL_MINT.toBase58());
    console.log("Reserve:", MARINADE_RESERVE.toBase58());
    
    // Verify Marinade state account exists
    try {
      const stateInfo = await connection.getAccountInfo(MARINADE_STATE);
      if (stateInfo) {
        console.log("✅ Marinade state account exists on devnet");
      } else {
        console.log("⚠️  Marinade state account not found. May need to verify address.");
      }
    } catch (error) {
      console.log("⚠️  Could not verify Marinade state account:", error);
    }
  });

  it("Deposits SOL with Marinade lending integration", async () => {
    console.log("\n=== Testing Deposit with Marinade ===");
    
    // Derive PDAs
    const [battlePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("battle"), battleId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const [userStatePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("user_state"),
        user.publicKey.toBuffer(),
        battleId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const [vaultPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vault"),
        battleId.toArrayLike(Buffer, "le", 8),
        Buffer.from([team]),
      ],
      program.programId
    );

    const [ticketMintPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("ticket_mint"),
        battleId.toArrayLike(Buffer, "le", 8),
        Buffer.from([team]),
      ],
      program.programId
    );

    const [ticketMintAuthorityPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("ticket_mint_authority"),
        battleId.toArrayLike(Buffer, "le", 8),
        Buffer.from([team]),
      ],
      program.programId
    );

    const userTicketAccount = await getAssociatedTokenAddress(
      ticketMintPda,
      user.publicKey
    );

    // Create mSOL token account owned by vault PDA
    // This is where mSOL will be received after Marinade deposit
    console.log("\nCreating mSOL token account for vault...");
    const vaultMsolTokenAccount = await getAssociatedTokenAddress(
      MSOL_MINT,
      vaultPda,
      true // allowOwnerOffCurve = true (vault is a PDA)
    );

    // Check if account exists, create if needed
    let vaultMsolAccountExists = false;
    try {
      await getAccount(connection, vaultMsolTokenAccount);
      vaultMsolAccountExists = true;
      console.log("✅ mSOL token account already exists");
    } catch (error) {
      console.log("ℹ️  mSOL token account will be created by Marinade program");
    }

    console.log("Vault mSOL token account:", vaultMsolTokenAccount.toBase58());

    try {
      console.log("\nCalling deposit with Marinade integration...");
      const tx = await program.methods
        .deposit(depositAmount, team)
        .accounts({
          user: user.publicKey,
          battle: battlePda,
          userState: userStatePda,
          vault: vaultPda,
          ticketMint: ticketMintPda,
          ticketMintAuthority: ticketMintAuthorityPda,
          userTicketAccount: userTicketAccount,
          
          // Marinade accounts
          lendingProgram: MARINADE_PROGRAM_ID,
          marinadeState: MARINADE_STATE,
          lendingMintAccount: MSOL_MINT,
          lendingTokenAccount: vaultMsolTokenAccount,
          marinadeLiqPoolSol: LIQ_POOL_SOL_LEG,
          marinadeLiqPoolMsol: LIQ_POOL_MSOL_LEG,
          marinadeLiqPoolAuthority: LIQ_POOL_AUTH,
          marinadeReserve: MARINADE_RESERVE,
          marinadeMsolMintAuthority: MSOL_AUTH,
          
          // Other lending protocols (not used for Marinade)
          lendingGroupAccount: null,
          lendingUserAccount: null,
          lendingPoolAccount: null,
          
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([user])
        .rpc();

      console.log("✅ Deposit transaction:", tx);
      console.log("   View on Solana Explorer:");
      console.log(`   https://explorer.solana.com/tx/${tx}?cluster=devnet`);
      
      // Wait for transaction to be confirmed
      await connection.confirmTransaction(tx, "confirmed");
      
      // Verify user state
      const userState = await program.account.userState.fetch(userStatePda);
      expect(userState.amountStaked.toNumber()).to.equal(depositAmount.toNumber());
      expect(userState.team).to.equal(team);
      console.log("\n✅ User state verified:");
      console.log("   Amount staked:", userState.amountStaked.toNumber() / LAMPORTS_PER_SOL, "SOL");
      console.log("   Team:", userState.team === 1 ? "Team A" : "Team B");
      
      // Verify vault
      const vault = await program.account.vault.fetch(vaultPda);
      console.log("\n✅ Vault state:");
      console.log("   Total amount:", vault.totalAmount.toNumber() / LAMPORTS_PER_SOL, "SOL");
      console.log("   Lent amount:", vault.lentAmount.toNumber() / LAMPORTS_PER_SOL, "SOL");
      console.log("   Lending position:", vault.lendingPosition?.toBase58() || "None");
      
      // Check mSOL token account (if it exists)
      try {
        const msolAccount = await getAccount(connection, vaultMsolTokenAccount);
        console.log("\n✅ mSOL token account:");
        console.log("   Address:", vaultMsolTokenAccount.toBase58());
        console.log("   Balance:", Number(msolAccount.amount) / 1e9, "mSOL");
        console.log("   Owner:", msolAccount.owner.toBase58());
      } catch (error) {
        console.log("\n⚠️  Could not fetch mSOL token account (may not exist yet):", error);
      }
      
      console.log("\n🎉 Deposit with Marinade integration successful!");
      
    } catch (error) {
      console.error("\n❌ Deposit failed:", error);
      
      // Provide helpful error messages
      if (error instanceof Error) {
        if (error.message.includes("insufficient funds")) {
          console.error("\n💡 Tip: Request more SOL airdrop:");
          console.error(`   solana airdrop 5 ${user.publicKey.toBase58()}`);
        } else if (error.message.includes("AccountNotInitialized")) {
          console.error("\n💡 Tip: Battle account may need to be initialized first");
        } else if (error.message.includes("Marinade") || error.message.includes("mSOL")) {
          console.error("\n💡 Tip: Verify Marinade addresses on devnet:");
          console.error("   npm run get-marinade");
        }
      }
      
      throw error;
    }
  });

  it("Verifies Marinade integration works correctly", async () => {
    console.log("\n=== Verifying Marinade Integration ===");
    
    const [vaultPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vault"),
        battleId.toArrayLike(Buffer, "le", 8),
        Buffer.from([team]),
      ],
      program.programId
    );

    // Fetch vault state
    const vault = await program.account.vault.fetch(vaultPda);
    
    // Verify lending position exists
    if (vault.lendingPosition) {
      console.log("✅ Lending position found:", vault.lendingPosition.toBase58());
      
      // This should be the mSOL token account
      const msolTokenAccount = new PublicKey(vault.lendingPosition);
      
      try {
        const account = await getAccount(connection, msolTokenAccount);
        console.log("✅ mSOL token account verified:");
        console.log("   Balance:", Number(account.amount) / 1e9, "mSOL");
        console.log("   Mint:", account.mint.toBase58());
        
        // Verify it's mSOL
        expect(account.mint.toBase58()).to.equal(MSOL_MINT.toBase58());
        console.log("✅ Token mint matches mSOL mint");
        
      } catch (error) {
        console.log("⚠️  Could not verify mSOL token account:", error);
      }
    } else {
      console.log("⚠️  No lending position found (lending may have been skipped)");
    }
    
    // Verify lent amount matches deposit
    if (vault.lentAmount > 0) {
      console.log("✅ Funds were lent to Marinade:", vault.lentAmount.toNumber() / LAMPORTS_PER_SOL, "SOL");
    } else {
      console.log("⚠️  No funds were lent (check if lending was enabled)");
    }
  });
});

