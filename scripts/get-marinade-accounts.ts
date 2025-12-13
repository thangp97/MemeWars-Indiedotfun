/**
 * Script để lấy Marinade account addresses từ blockchain
 * Hỗ trợ cả mainnet và devnet
 * 
 * Usage:
 *   - Mainnet (default): npm run get-marinade
 *   - Devnet: NETWORK=devnet npm run get-marinade
 *   - Custom RPC: ANCHOR_PROVIDER_URL=https://your-rpc.com npm run get-marinade
 * 
 * Mainnet testing:
 *   - Marinade hoạt động bình thường với số vốn nhỏ (0.01 SOL trở lên)
 *   - Minimum deposit: ~0.001 SOL
 *   - Sử dụng RPC nhanh hơn để test tốt hơn (Helius, QuickNode, etc.)
 */

import { Connection, PublicKey } from "@solana/web3.js";

async function getMarinadeAccounts() {
  // Determine network: mainnet-beta for production, devnet for testing
  // Use NETWORK environment variable: mainnet-beta or devnet
  const network = process.env.NETWORK || "mainnet-beta";
  const isMainnet = network === "mainnet-beta";
  
  // Use custom RPC or default
  const defaultRpc = isMainnet 
    ? "https://api.mainnet-beta.solana.com" 
    : "https://api.devnet.solana.com";
  const rpcUrl = process.env.ANCHOR_PROVIDER_URL || defaultRpc;
  
  const connection = new Connection(rpcUrl, "confirmed");
  console.log(`🌐 Network: ${network}`);
  console.log(`🔗 Connecting to: ${rpcUrl}`);
  
  console.log(`\n🔍 Fetching Marinade accounts on ${network}...\n`);

  try {
    // Try to import Marinade SDK (optional dependency)
    let Marinade, MarinadeConfig;
    try {
      const marinadeSdk = await import("@marinade.finance/marinade-ts-sdk");
      Marinade = marinadeSdk.Marinade;
      MarinadeConfig = marinadeSdk.MarinadeConfig;
    } catch (e) {
      console.log("⚠️  Marinade SDK not installed. Using known addresses instead.\n");
      console.log("   To install: npm install @marinade.finance/marinade-ts-sdk\n");
      printKnownAddresses();
      return;
    }

    // Initialize Marinade with just the connection
    const config = new MarinadeConfig({
      connection: connection,
    });

    const marinade = new Marinade(config);

    // Get Marinade state (it's a method that returns a Promise)
    console.log("⏳ Loading Marinade state from blockchain...");
    const state = await marinade.getMarinadeState();
    
    // Get the state address
    const marinadeStateAddress = state.marinadeStateAddress;
    console.log("📋 Marinade State:", marinadeStateAddress.toBase58());

    // Get mSOL mint
    const msolMint = state.mSolMintAddress;
    console.log("🪙 mSOL Mint:", msolMint.toBase58());

    // Get liquidity pool accounts
    const liqPoolSol = await state.solLeg();
    const liqPoolMsol = state.mSolLeg;
    const liqPoolAuthority = await state.mSolLegAuthority();
    
    console.log("💧 Liquidity Pool SOL:", liqPoolSol.toBase58());
    console.log("💧 Liquidity Pool mSOL:", liqPoolMsol.toBase58());
    console.log("🔐 Liquidity Pool Authority:", liqPoolAuthority.toBase58());

    // Get reserve
    const reserve = await state.reserveAddress();
    console.log("🏦 Reserve:", reserve.toBase58());

    // Get mSOL mint authority
    const msolMintAuthority = await state.mSolMintAuthority();
    console.log("🔐 mSOL Mint Authority:", msolMintAuthority.toBase58());

    // Program ID
    const programId = state.marinadeFinanceProgramId;
    console.log("📦 Program ID:", programId.toBase58());

    console.log("\n✅ Marinade accounts fetched successfully!");
    console.log("\n📝 Copy these addresses to your test/config files:");

    console.log(`
const MARINADE_ACCOUNTS = {
  program: "${programId.toBase58()}",
  state: "${marinadeStateAddress.toBase58()}",
  msolMint: "${msolMint.toBase58()}",
  liqPoolSol: "${liqPoolSol.toBase58()}",
  liqPoolMsol: "${liqPoolMsol.toBase58()}",
  liqPoolAuthority: "${liqPoolAuthority.toBase58()}",
  reserve: "${reserve.toBase58()}",
  msolMintAuthority: "${msolMintAuthority.toBase58()}",
};
    `);

    if (isMainnet) {
      console.log("\n💡 Mainnet Testing Tips:");
      console.log("   • Bạn có thể test với số lượng nhỏ (ví dụ: 0.01 SOL)");
      console.log("   • Marinade mainnet hoạt động bình thường với mọi số lượng");
      console.log("   • Minimum deposit: ~0.001 SOL");
      console.log("   • Sử dụng mainnet RPC: https://api.mainnet-beta.solana.com");
      console.log("   • Hoặc RPC nhanh hơn từ Helius, QuickNode, etc.");
    }

  } catch (error) {
    console.error("❌ Error fetching Marinade accounts:", error);
    console.log("\n⚠️  Note: Error fetching from blockchain.");
    console.log("   Using known addresses instead:\n");
    printKnownAddresses();
  }
}

function printKnownAddresses() {
  console.log("📝 Known Marinade addresses (from official documentation):");
  console.log("\n🌐 Devnet:");
  console.log(`
const MARINADE_ACCOUNTS_DEVNET = {
  program: "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD",
  // Note: State account may need verification on devnet
  // Mainnet state: 8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC
  state: "8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC", // TODO: Verify on devnet
  msolMint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
  msolAuth: "3JLPCS1qM2zRw3Dp6V4hZnYHd4toMNPkNesXdX9tg6KM",
  reserve: "Du3Ysj1wKbxPKkuPPnvzQLQh8oMSVifs3jGZjJWXFmHN",
  treasuryMsol: "8ZUcztoAEhpAeC2ixWewJKQJsSUGYSGPVAjkhDJYf5Gd",
  liqPoolMsolLeg: "7GgPYjS5Dza89wV6FpZ23kUJRG5vbQ1GM25ezspYFSoE",
  liqPoolSolLeg: "UefNb6z6yvArqe4cJHTXCqStRsKmWhGxnZzuHbikP5Q",
  liqPoolAuth: "HZsepB79dnpvH6qfVgvMpS738EndHw3qSHo4Gv5WX1KA",
  liqPoolMint: "LPmSozJJ8Jh69ut2WP3XmVohTjL4ipR18yiCzxrUmVj",
  stakeWithdrawAuthority: "9eG63CdHjsfhHmobHgLtESGC8GabbmRcaSpHAZrtmhco",
};
  `);
  
  console.log("\n🌐 Mainnet:");
  console.log(`
const MARINADE_ACCOUNTS_MAINNET = {
  program: "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD",
  state: "8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC",
  msolMint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
  msolAuth: "3JLPCS1qM2zRw3Dp6V4hZnYHd4toMNPkNesXdX9tg6KM",
  reserve: "Du3Ysj1wKbxPKkuPPnvzQLQh8oMSVifs3jGZjJWXFmHN",
  treasuryMsol: "B1aLzaNMeFVAyQ6f3XbbUyKcH2YPHu2fqiEagmiF23VR",
  liqPoolMsolLeg: "7GgPYjS5Dza89wV6FpZ23kUJRG5vbQ1GM25ezspYFSoE",
  liqPoolSolLeg: "UefNb6z6yvArqe4cJHTXCqStRsKmWhGxnZzuHbikP5Q",
  liqPoolAuth: "HZsepB79dnpvH6qfVgvMpS738EndHw3qSHo4Gv5WX1KA",
  liqPoolMint: "LPmSozJJ8Jh69ut2WP3XmVohTjL4ipR18yiCzxrUmVj",
  stakeWithdrawAuthority: "9eG63CdHjsfhHmobHgLtESGC8GabbmRcaSpHAZrtmhco",
};
  `);
  
  console.log("\n💡 For devnet testing:");
  console.log("   1. Use the devnet addresses above (from official docs)");
  console.log("   2. Verify state account on devnet using Marinade SDK");
  console.log("   3. Install Marinade SDK: npm install @marinade.finance/marinade-ts-sdk@^0.6.0");
  console.log("   4. Or test without lending (skip lending accounts) - Recommended for initial testing");
  console.log("   5. See MARINADE_DEVNET_ADDRESSES.md for full address list");
}

getMarinadeAccounts();

