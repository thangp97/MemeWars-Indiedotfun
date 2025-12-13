#!/bin/bash

# Script để deploy MemeWars lên devnet
# Usage: bash scripts/deploy-devnet.sh

set -e

echo "🚀 Deploying MemeWars to Devnet..."
echo ""

# Check if wallet has enough SOL
BALANCE=$(solana balance --url devnet | grep -o '[0-9.]* SOL' | grep -o '[0-9.]*')
echo "💰 Current balance: $BALANCE SOL"

# Check if we need more SOL (need at least 2.5 SOL for deployment)
if (( $(echo "$BALANCE < 2.5" | bc -l) )); then
    echo "⚠️  Balance is low. Requesting airdrop..."
    solana airdrop 2 --url devnet || echo "⚠️  Airdrop failed (rate limit). Please wait and try again."
    sleep 5
    BALANCE=$(solana balance --url devnet | grep -o '[0-9.]* SOL' | grep -o '[0-9.]*')
    echo "💰 New balance: $BALANCE SOL"
fi

# Build the program
echo ""
echo "🔨 Building program..."
anchor build

# Deploy to devnet
echo ""
echo "📤 Deploying to devnet..."
anchor deploy --provider.cluster devnet

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Program ID: $(anchor keys list | grep memewars | awk '{print $2}')"
echo "🔗 View on Solscan: https://solscan.io/account/$(anchor keys list | grep memewars | awk '{print $2}')?cluster=devnet"

