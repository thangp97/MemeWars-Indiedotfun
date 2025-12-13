#!/bin/bash

# Script để close program cũ và deploy lại
# Usage: bash scripts/close-and-redeploy.sh

set -e

PROGRAM_ID="6HEDaUCumwgNxMat19UqGNdJmBrsHeaJnmF3XvTyaBvb"
CLUSTER="devnet"

echo "🔧 Fixing authority mismatch by closing old program..."
echo ""

# Check current wallet
CURRENT_WALLET=$(solana address --url $CLUSTER)
echo "💰 Current wallet: $CURRENT_WALLET"
echo ""

# Check if program exists
echo "🔍 Checking program status..."
if solana program show $PROGRAM_ID --url $CLUSTER > /dev/null 2>&1; then
    echo "⚠️  Program exists on-chain"
    echo ""
    
    # Get program authority
    PROGRAM_INFO=$(solana program show $PROGRAM_ID --url $CLUSTER)
    PROGRAM_AUTHORITY=$(echo "$PROGRAM_INFO" | grep "Authority" | awk '{print $2}' || echo "Unknown")
    
    echo "📋 Program authority: $PROGRAM_AUTHORITY"
    echo "📋 Current wallet: $CURRENT_WALLET"
    echo ""
    
    if [ "$PROGRAM_AUTHORITY" != "$CURRENT_WALLET" ]; then
        echo "⚠️  Authority mismatch detected!"
        echo ""
        echo "🔒 Closing old program..."
        solana program close $PROGRAM_ID --url $CLUSTER || {
            echo "❌ Failed to close program. You may need to close it manually:"
            echo "   solana program close $PROGRAM_ID --url $CLUSTER"
            echo ""
            echo "   Or use the authority that deployed it: $PROGRAM_AUTHORITY"
            exit 1
        }
        echo "✅ Program closed successfully"
        echo ""
    else
        echo "✅ Authority matches, no need to close"
        echo ""
    fi
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

echo ""
echo "✅ Deployment complete!"

