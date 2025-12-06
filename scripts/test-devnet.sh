#!/bin/bash

# Script để test MemeWars trên devnet

echo "🚀 Starting MemeWars Devnet Testing..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo -e "${RED}❌ Solana CLI not found. Please install it first.${NC}"
    exit 1
fi

# Check if Anchor is installed
if ! command -v anchor &> /dev/null; then
    echo -e "${RED}❌ Anchor not found. Please install it first.${NC}"
    exit 1
fi

# Set to devnet
echo -e "${YELLOW}📡 Setting cluster to devnet...${NC}"
solana config set --url devnet

# Check balance
echo -e "${YELLOW}💰 Checking balance...${NC}"
BALANCE=$(solana balance --output json | jq -r '.balance')
echo "Current balance: $BALANCE SOL"

# Airdrop if balance is low
if (( $(echo "$BALANCE < 1" | bc -l) )); then
    echo -e "${YELLOW}💸 Airdropping SOL...${NC}"
    solana airdrop 2
    sleep 5
fi

# Build program
echo -e "${YELLOW}🔨 Building program...${NC}"
anchor build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful!${NC}"

# Deploy program
echo -e "${YELLOW}📤 Deploying program to devnet...${NC}"
anchor deploy --provider.cluster devnet

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deploy failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Deploy successful!${NC}"

# Run tests
echo -e "${YELLOW}🧪 Running tests...${NC}"
anchor test --skip-local-validator --provider.cluster devnet

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
else
    echo -e "${RED}❌ Tests failed!${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Devnet testing completed!${NC}"

