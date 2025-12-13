/**
 * Marinade Finance Constants
 * 
 * This file contains all Marinade Finance addresses for both devnet and mainnet.
 * Source: https://docs.marinade.finance/
 */

import { PublicKey } from "@solana/web3.js";

// Marinade Program ID (same for devnet and mainnet)
export const MARINADE_PROGRAM_ID = new PublicKey("MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD");

// Devnet addresses
export const MARINADE_DEVNET = {
  program: MARINADE_PROGRAM_ID,
  // Note: State account may need to be verified on devnet
  // Mainnet state: 8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC
  state: new PublicKey("8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC"), // TODO: Verify on devnet
  msolMint: new PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So"),
  msolAuth: new PublicKey("3JLPCS1qM2zRw3Dp6V4hZnYHd4toMNPkNesXdX9tg6KM"),
  reserve: new PublicKey("Du3Ysj1wKbxPKkuPPnvzQLQh8oMSVifs3jGZjJWXFmHN"),
  treasuryMsol: new PublicKey("8ZUcztoAEhpAeC2ixWewJKQJsSUGYSGPVAjkhDJYf5Gd"),
  liqPoolMsolLeg: new PublicKey("7GgPYjS5Dza89wV6FpZ23kUJRG5vbQ1GM25ezspYFSoE"),
  liqPoolSolLeg: new PublicKey("UefNb6z6yvArqe4cJHTXCqStRsKmWhGxnZzuHbikP5Q"),
  liqPoolAuth: new PublicKey("HZsepB79dnpvH6qfVgvMpS738EndHw3qSHo4Gv5WX1KA"),
  liqPoolMint: new PublicKey("LPmSozJJ8Jh69ut2WP3XmVohTjL4ipR18yiCzxrUmVj"),
  stakeWithdrawAuthority: new PublicKey("9eG63CdHjsfhHmobHgLtESGC8GabbmRcaSpHAZrtmhco"),
};

// Mainnet addresses
export const MARINADE_MAINNET = {
  program: MARINADE_PROGRAM_ID,
  state: new PublicKey("8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC"),
  msolMint: new PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So"),
  msolAuth: new PublicKey("3JLPCS1qM2zRw3Dp6V4hZnYHd4toMNPkNesXdX9tg6KM"),
  reserve: new PublicKey("Du3Ysj1wKbxPKkuPPnvzQLQh8oMSVifs3jGZjJWXFmHN"),
  treasuryMsol: new PublicKey("B1aLzaNMeFVAyQ6f3XbbUyKcH2YPHu2fqiEagmiF23VR"),
  liqPoolMsolLeg: new PublicKey("7GgPYjS5Dza89wV6FpZ23kUJRG5vbQ1GM25ezspYFSoE"),
  liqPoolSolLeg: new PublicKey("UefNb6z6yvArqe4cJHTXCqStRsKmWhGxnZzuHbikP5Q"),
  liqPoolAuth: new PublicKey("HZsepB79dnpvH6qfVgvMpS738EndHw3qSHo4Gv5WX1KA"),
  liqPoolMint: new PublicKey("LPmSozJJ8Jh69ut2WP3XmVohTjL4ipR18yiCzxrUmVj"),
  stakeWithdrawAuthority: new PublicKey("9eG63CdHjsfhHmobHgLtESGC8GabbmRcaSpHAZrtmhco"),
};

/**
 * Get Marinade addresses based on cluster
 */
export function getMarinadeAddresses(cluster: "devnet" | "mainnet-beta" = "devnet") {
  return cluster === "devnet" ? MARINADE_DEVNET : MARINADE_MAINNET;
}

