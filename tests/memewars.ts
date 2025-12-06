import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MemeWars } from "../target/types/memewars";
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import { expect } from "chai";

describe("MemeWars", () => {
  // Configure the client to use devnet
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.MemeWars as Program<MemeWars>;
  
  // Test accounts
  const user = Keypair.generate();
  const battleId = new anchor.BN(1);
  const team = 1; // TEAM_A
  const depositAmount = new anchor.BN(1_000_000_000); // 1 SOL

  // Marinade devnet addresses (from official Marinade documentation)
  // Source: https://docs.marinade.finance/
  const MARINADE_PROGRAM_DEVNET = new PublicKey("MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD");
  // Note: Main state account - verify on devnet (mainnet: 8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC)
  // Use Marinade SDK or fetch from chain to get devnet state address
  const MARINADE_STATE_DEVNET = new PublicKey("8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC"); // TODO: Verify on devnet
  const MSOL_MINT_DEVNET = new PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So");
  const MSOL_AUTH_DEVNET = new PublicKey("3JLPCS1qM2zRw3Dp6V4hZnYHd4toMNPkNesXdX9tg6KM");
  const MARINADE_RESERVE_DEVNET = new PublicKey("Du3Ysj1wKbxPKkuPPnvzQLQh8oMSVifs3jGZjJWXFmHN");
  const LIQ_POOL_MSOL_LEG_DEVNET = new PublicKey("7GgPYjS5Dza89wV6FpZ23kUJRG5vbQ1GM25ezspYFSoE");
  const LIQ_POOL_SOL_LEG_DEVNET = new PublicKey("UefNb6z6yvArqe4cJHTXCqStRsKmWhGxnZzuHbikP5Q");
  const LIQ_POOL_AUTH_DEVNET = new PublicKey("HZsepB79dnpvH6qfVgvMpS738EndHw3qSHo4Gv5WX1KA");
  const TREASURY_MSOL_DEVNET = new PublicKey("8ZUcztoAEhpAeC2ixWewJKQJsSUGYSGPVAjkhDJYf5Gd");

  before(async () => {
    // Airdrop SOL cho user
    const signature = await provider.connection.requestAirdrop(
      user.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);
  });

  it("Initializes program", async () => {
    const tx = await program.methods
      .initialize()
      .rpc();
    console.log("Initialize transaction:", tx);
  });

  it("Deposits SOL without lending (skip lending step)", async () => {
    // Derive PDAs
    const [battlePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("battle"),
        battleId.toArrayLike(Buffer, "le", 8),
      ],
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

    try {
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
          // Không cung cấp lending accounts để skip lending step
          lendingProgram: null,
          marinadeState: null,
          lendingMintAccount: null,
          lendingTokenAccount: null,
          marinadeLiqPoolSol: null,
          marinadeLiqPoolMsol: null,
          marinadeLiqPoolAuthority: null,
          marinadeReserve: null,
          marinadeMsolMintAuthority: null,
          lendingGroupAccount: null,
          lendingUserAccount: null,
          lendingPoolAccount: null,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([user])
        .rpc();

      console.log("Deposit transaction:", tx);
      
      // Verify user state
      const userState = await program.account.userState.fetch(userStatePda);
      expect(userState.amountStaked.toNumber()).to.equal(depositAmount.toNumber());
      expect(userState.team).to.equal(team);
      
      console.log("✅ Deposit successful without lending!");
    } catch (error) {
      console.error("❌ Deposit failed:", error);
      throw error;
    }
  });

  it("Deposits SOL with Marinade (if accounts available)", async () => {
    // TODO: Implement full Marinade integration test
    // Requirements:
    // 1. Verify Marinade state account on devnet (may differ from mainnet)
    // 2. Create mSOL token account owned by vault PDA
    // 3. Provide all required Marinade accounts
    
    console.log("⚠️  Skipping Marinade test - need to verify state account on devnet");
    console.log("   To test with Marinade:");
    console.log("   1. Run: npm run get-marinade");
    console.log("   2. Verify Marinade state account address on devnet");
    console.log("   3. Create mSOL token account owned by vault PDA");
    console.log("   4. Update test with verified addresses from MARINADE_DEVNET_ADDRESSES.md");
    console.log("\n   Known devnet addresses (from official docs):");
    console.log("   - Program:", MARINADE_PROGRAM_DEVNET.toBase58());
    console.log("   - State (verify):", MARINADE_STATE_DEVNET.toBase58());
    console.log("   - mSOL Mint:", MSOL_MINT_DEVNET.toBase58());
    console.log("   - mSOL Auth:", MSOL_AUTH_DEVNET.toBase58());
    console.log("   - Reserve:", MARINADE_RESERVE_DEVNET.toBase58());
    console.log("   - Treasury mSOL:", TREASURY_MSOL_DEVNET.toBase58());
    console.log("   - LP mSOL Leg:", LIQ_POOL_MSOL_LEG_DEVNET.toBase58());
    console.log("   - LP SOL Leg:", LIQ_POOL_SOL_LEG_DEVNET.toBase58());
    console.log("   - LP Auth:", LIQ_POOL_AUTH_DEVNET.toBase58());
  });
});

