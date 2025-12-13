#!/bin/bash

# Script để fix authority mismatch khi deploy
# Usage: bash scripts/fix-authority.sh

set -e

PROGRAM_ID="6HEDaUCumwgNxMat19UqGNdJmBrsHeaJnmF3XvTyaBvb"
CLUSTER="devnet"

echo "🔧 Fixing authority mismatch..."
echo ""

# Check current wallet
CURRENT_WALLET=$(solana address --url $CLUSTER)
echo "💰 Current wallet: $CURRENT_WALLET"
echo ""

# Check if program exists
echo "🔍 Checking program status..."
PROGRAM_INFO=$(solana program show $PROGRAM_ID --url $CLUSTER 2>&1 || echo "NOT_FOUND")

if echo "$PROGRAM_INFO" | grep -q "Program Id"; then
    echo "⚠️  Program exists on-chain"
    echo "📋 Program authority:"
    echo "$PROGRAM_INFO" | grep "Authority" || echo "No authority found"
    echo ""
    
    # Ask to close (optional)
    echo "💡 To fix authority mismatch, you can:"
    echo "   1. Close the old program: solana program close $PROGRAM_ID --url $CLUSTER"
    echo "   2. Or deploy with the correct wallet"
    echo ""
else
    echo "✅ Program not found on-chain, ready to deploy"
    echo ""
fi

# Rebuild
echo "🔨 Rebuilding program..."
anchor build

# Deploy
echo ""
echo "📤 Deploying to $CLUSTER..."
anchor deploy --provider.cluster $CLUSTER

