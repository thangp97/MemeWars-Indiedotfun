#!/bin/bash

# Script để tạo program mới từ đầu
# Usage: bash scripts/create-new-program.sh

set -e

echo "🚀 Creating new program..."
echo ""

# Backup old keypair if exists
if [ -f "target/deploy/memewars-keypair.json" ]; then
    echo "📦 Backing up old keypair..."
    cp target/deploy/memewars-keypair.json target/deploy/memewars-keypair.json.backup
fi

# Generate new keypair (non-interactive)
echo "🔑 Generating new program keypair..."
solana-keygen new --outfile target/deploy/memewars-keypair.json --force --no-bip39-passphrase

# Get new program ID
NEW_PROGRAM_ID=$(solana address -k target/deploy/memewars-keypair.json)
echo ""
echo "✅ New Program ID: $NEW_PROGRAM_ID"
echo ""

# Update lib.rs
echo "📝 Updating lib.rs..."
sed -i "s/declare_id!(\".*\");/declare_id!(\"$NEW_PROGRAM_ID\");/" programs/memewars/src/lib.rs
echo "✅ Updated lib.rs"

# Update Anchor.toml
echo "📝 Updating Anchor.toml..."
sed -i "s/memewars = \".*\"/memewars = \"$NEW_PROGRAM_ID\"/" Anchor.toml
echo "✅ Updated Anchor.toml"

# Rebuild
echo ""
echo "🔨 Rebuilding program..."
anchor build

# Show summary
echo ""
echo "✅ New program created successfully!"
echo ""
echo "📋 Summary:"
echo "   Program ID: $NEW_PROGRAM_ID"
echo "   Keypair: target/deploy/memewars-keypair.json"
echo ""
echo "📤 Ready to deploy:"
echo "   anchor deploy --provider.cluster devnet"
echo ""

