#!/bin/bash
# Script to create .env.example file
# Usage: bash scripts/create-env-example.sh

cat > .env.example << 'EOF'
# MemeWars Environment Variables
# Copy this file to .env and fill in your values

# ============================================
# Solana Configuration
# ============================================
# Cluster: localnet, devnet, mainnet-beta
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
ANCHOR_WALLET=~/.config/solana/id.json

# ============================================
# Marinade Finance - Devnet Addresses
# ============================================
# Get these addresses by running: npm run get-marinade
# Or use the known addresses from MARINADE_DEVNET_ADDRESSES.md

MARINADE_PROGRAM_ID=MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD
MARINADE_STATE_ADDRESS=8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC
MSOL_MINT_ADDRESS=mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So
MSOL_AUTH_ADDRESS=3JLPCS1qM2zRw3Dp6V4hZnYHd4toMNPkNesXdX9tg6KM
MARINADE_RESERVE_ADDRESS=Du3Ysj1wKbxPKkuPPnvzQLQh8oMSVifs3jGZjJWXFmHN
MARINADE_LIQ_POOL_MSOL_LEG=7GgPYjS5Dza89wV6FpZ23kUJRG5vbQ1GM25ezspYFSoE
MARINADE_LIQ_POOL_SOL_LEG=UefNb6z6yvArqe4cJHTXCqStRsKmWhGxnZzuHbikP5Q
MARINADE_LIQ_POOL_AUTH=HZsepB79dnpvH6qfVgvMpS738EndHw3qSHo4Gv5WX1KA
MARINADE_TREASURY_MSOL=8ZUcztoAEhpAeC2ixWewJKQJsSUGYSGPVAjkhDJYf5Gd

# ============================================
# Program Configuration
# ============================================
# Your deployed program ID (update after deployment)
MEMEWARS_PROGRAM_ID=Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS

# ============================================
# Testing Configuration
# ============================================
# Enable/disable lending integration in tests
ENABLE_LENDING=true

# ============================================
# Optional: RPC Endpoint
# ============================================
# Use custom RPC endpoint (optional, defaults to public)
# ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
# Or use private RPC:
# ANCHOR_PROVIDER_URL=https://your-rpc-endpoint.com
EOF

echo "✅ Created .env.example file"
ls -lh .env.example

