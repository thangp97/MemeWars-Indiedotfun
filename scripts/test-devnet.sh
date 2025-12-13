#!/bin/bash

# Script để chạy test trên devnet
# Usage: bash scripts/test-devnet.sh [test-file]

set -e

# Set environment variables
export ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
export ANCHOR_WALLET=~/.config/solana/id.json
export ANCHOR_PROVIDER_CLUSTER=devnet

# Build first
echo "🔨 Building program..."
anchor build

# Run test
if [ -z "$1" ]; then
    echo "🧪 Running all tests on devnet..."
    anchor test --skip-local-validator --provider.cluster devnet
else
    echo "🧪 Running test file: $1"
    ts-mocha -p ./tsconfig.json -t 1000000 "$1"
fi
