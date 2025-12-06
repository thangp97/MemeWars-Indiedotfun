#!/bin/bash
# Script to build Anchor program
# Usage: bash scripts/build.sh

# Set HOME if not set (for Solana SDK)
if [ -z "$HOME" ]; then
    export HOME="$HOME"
fi

echo "🔨 Building Anchor program..."
anchor build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    if [ -f "target/deploy/memewars.so" ]; then
        echo "   Program: target/deploy/memewars.so"
    fi
else
    echo "❌ Build failed!"
    exit 1
fi

