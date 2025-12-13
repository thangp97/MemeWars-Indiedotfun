/**
 * Script test Marinade trên mainnet với số vốn nhỏ
 * 
 * Setup:
 *   1. Tạo file .env với:
 *      WALLET_SECRET_KEY=[1,2,3,...]  # Your wallet secret key array
 *      ANCHOR_PROVIDER_URL=https://api.mainnet-beta.solana.com  # hoặc RPC khác
 *   
 *   2. Đảm bảo wallet có ít nhất 0.02 SOL (cho test + fees)
 * 
 * Usage:
 *   ts-node scripts/test-marinade-mainnet.ts
 */

import { 
  Connection, 
  Keypair, 
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  sendAndConfirmTransaction
} from '@solana/web3.js';
import { 
  getOrCreateAssociatedTokenAccount,
  getAccount,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';

// Marinade constants
const MARINADE_PROGRAM_ID = new PublicKey('MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD');
const MARINADE_STATE = new PublicKey('8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC');
const MSOL_MINT = new PublicKey('mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So');

async function testMarinadeMainnet() {
  console.log('🌐 Marinade Mainnet Testing Script\n');
  console.log('=' .repeat(60));
  
  // 1. Setup connection
  const rpcUrl = process.env.ANCHOR_PROVIDER_URL || 'https://api.mainnet-beta.solana.com';
  const connection = new Connection(rpcUrl, 'confirmed');
  console.log(`\n📡 Connecting to: ${rpcUrl}`);
  
  // 2. Load wallet
  let wallet: Keypair;
  
  try {
    // Try to load from environment variable
    if (process.env.WALLET_SECRET_KEY) {
      const secretKey = JSON.parse(process.env.WALLET_SECRET_KEY);
      wallet = Keypair.fromSecretKey(Uint8Array.from(secretKey));
    } 
    // Try to load from file system (like Solana CLI default)
    else {
      const keypairPath = path.join(
        process.env.HOME || process.env.USERPROFILE || '',
        '.config', 'solana', 'id.json'
      );
      
      if (fs.existsSync(keypairPath)) {
        const secretKey = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
        wallet = Keypair.fromSecretKey(Uint8Array.from(secretKey));
      } else {
        throw new Error('No wallet found');
      }
    }
  } catch (error) {
    console.error('❌ Could not load wallet!');
    console.log('\n💡 Please set WALLET_SECRET_KEY in .env file or use Solana CLI default wallet');
    console.log('   Example: WALLET_SECRET_KEY=[1,2,3,...]');
    process.exit(1);
  }
  
  console.log(`\n👛 Wallet: ${wallet.publicKey.toBase58()}`);
  
  // 3. Check SOL balance
  const balance = await connection.getBalance(wallet.publicKey);
  const solBalance = balance / LAMPORTS_PER_SOL;
  console.log(`💰 SOL Balance: ${solBalance.toFixed(4)} SOL`);
  
  if (solBalance < 0.02) {
    console.error('\n❌ Insufficient balance! Need at least 0.02 SOL for testing.');
    console.log('   Please fund your wallet and try again.');
    process.exit(1);
  }
  
  // 4. Check if Marinade SDK is available
  let Marinade: any, MarinadeConfig: any;
  try {
    const marinadeSdk = await import('@marinade.finance/marinade-ts-sdk');
    Marinade = marinadeSdk.Marinade;
    MarinadeConfig = marinadeSdk.MarinadeConfig;
    console.log('\n✅ Marinade SDK loaded successfully');
  } catch (error) {
    console.error('\n❌ Marinade SDK not found!');
    console.log('   Please install: npm install @marinade.finance/marinade-ts-sdk');
    process.exit(1);
  }
  
  // 5. Initialize Marinade
  console.log('\n📦 Initializing Marinade...');
  const config = new MarinadeConfig({
    connection,
    publicKey: wallet.publicKey,
  });
  const marinade = new Marinade(config);
  
  // 6. Get or create mSOL token account
  console.log('\n🎫 Getting/Creating mSOL token account...');
  const msolTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet,
    MSOL_MINT,
    wallet.publicKey
  );
  
  console.log(`   mSOL Account: ${msolTokenAccount.address.toBase58()}`);
  
  // 7. Check current mSOL balance
  try {
    const msolAccount = await getAccount(connection, msolTokenAccount.address);
    const msolBalance = Number(msolAccount.amount) / LAMPORTS_PER_SOL;
    console.log(`   Current mSOL Balance: ${msolBalance.toFixed(6)} mSOL`);
  } catch (error) {
    console.log(`   Current mSOL Balance: 0 mSOL (new account)`);
  }
  
  // 8. Ask user for confirmation
  console.log('\n' + '='.repeat(60));
  console.log('⚠️  Test Parameters:');
  console.log('   • Deposit Amount: 0.01 SOL');
  console.log('   • Network: Mainnet-beta');
  console.log('   • Estimated Cost: ~0.0021 SOL (including fees)');
  console.log('='.repeat(60));
  
  // For automation, check environment variable
  if (process.env.SKIP_CONFIRMATION !== 'true') {
    console.log('\n⏸️  Set SKIP_CONFIRMATION=true to auto-proceed');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  // 9. Test deposit
  console.log('\n🔄 Depositing 0.01 SOL to Marinade...');
  const depositAmount = 0.01 * LAMPORTS_PER_SOL;
  
  try {
    const depositResult = await marinade.deposit(depositAmount);
    
    // Get recent blockhash and sign
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    depositResult.transaction.recentBlockhash = blockhash;
    depositResult.transaction.lastValidBlockHeight = lastValidBlockHeight;
    depositResult.transaction.feePayer = wallet.publicKey;
    
    // Sign transaction
    depositResult.transaction.sign(wallet);
    
    // Send and confirm
    const depositSig = await connection.sendRawTransaction(
      depositResult.transaction.serialize(),
      { skipPreflight: false }
    );
    
    console.log(`   📝 Transaction: ${depositSig}`);
    console.log(`   🔗 View: https://solscan.io/tx/${depositSig}`);
    console.log(`   ⏳ Confirming...`);
    
    await connection.confirmTransaction({
      signature: depositSig,
      blockhash,
      lastValidBlockHeight
    });
    
    console.log(`   ✅ Deposit confirmed!`);
    
  } catch (error: any) {
    console.error(`\n❌ Deposit failed: ${error.message}`);
    if (error.logs) {
      console.log('\nTransaction logs:');
      error.logs.forEach((log: string) => console.log(`   ${log}`));
    }
    process.exit(1);
  }
  
  // 10. Check new mSOL balance
  console.log('\n💰 Checking new mSOL balance...');
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for account update
  
  try {
    const msolAccount = await getAccount(connection, msolTokenAccount.address);
    const msolBalance = Number(msolAccount.amount) / LAMPORTS_PER_SOL;
    console.log(`   ✅ New mSOL Balance: ${msolBalance.toFixed(6)} mSOL`);
    
    // Calculate exchange rate
    const exchangeRate = msolBalance / 0.01;
    console.log(`   📊 Exchange Rate: 1 SOL = ${exchangeRate.toFixed(4)} mSOL`);
    
  } catch (error) {
    console.error(`   ⚠️  Could not fetch mSOL balance (might need to wait)`);
  }
  
  // 11. Get Marinade state info
  console.log('\n📊 Marinade Protocol Info...');
  try {
    const state = await marinade.getMarinadeState();
    const totalStaked = Number(state.state.validatorSystem.totalActiveBalance) / LAMPORTS_PER_SOL;
    const msolPrice = state.mSolPrice;
    
    console.log(`   • Total Staked: ${totalStaked.toLocaleString()} SOL`);
    console.log(`   • mSOL Price: ${msolPrice.toFixed(6)} SOL`);
    console.log(`   • Your share: Very small but real! 🎉`);
  } catch (error) {
    console.log(`   ℹ️  Could not fetch protocol info`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Test Completed Successfully!');
  console.log('='.repeat(60));
  
  console.log('\n📝 What happened:');
  console.log('   1. ✅ Connected to Marinade mainnet');
  console.log('   2. ✅ Created/used your mSOL token account');
  console.log('   3. ✅ Deposited 0.01 SOL into Marinade');
  console.log('   4. ✅ Received mSOL (liquid staking token)');
  
  console.log('\n💡 What you can do now:');
  console.log('   • Your mSOL earns staking rewards automatically');
  console.log('   • You can liquid unstake anytime via the pool');
  console.log('   • Or wait for regular unstake (3-4 days)');
  console.log('   • Use mSOL in other DeFi protocols');
  
  console.log('\n🔗 Useful Links:');
  console.log(`   • Your wallet: https://solscan.io/account/${wallet.publicKey.toBase58()}`);
  console.log(`   • mSOL token: https://solscan.io/token/${MSOL_MINT.toBase58()}`);
  console.log(`   • Marinade App: https://marinade.finance/app/`);
  
  console.log('\n🎯 Next Steps:');
  console.log('   • Integrate this flow into your MemeWars program');
  console.log('   • Test liquid unstake if needed');
  console.log('   • See MARINADE_MAINNET_TESTING.md for full guide');
  
  console.log('\n✨ Happy Building! ✨\n');
}

// Run the test
testMarinadeMainnet().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

