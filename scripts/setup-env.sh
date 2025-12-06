#!/bin/bash
# Script to setup .env file from .env.example
# Usage: bash scripts/setup-env.sh

ENV_EXAMPLE=".env.example"
ENV_FILE=".env"

if [ -f "$ENV_FILE" ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " response
    if [ "$response" != "y" ] && [ "$response" != "Y" ]; then
        echo "❌ Aborted. Keeping existing .env file."
        exit 0
    fi
fi

if [ ! -f "$ENV_EXAMPLE" ]; then
    echo "⚠️  .env.example file not found!"
    echo "   Creating .env.example from template..."
    bash scripts/create-env-example.sh
    if [ ! -f "$ENV_EXAMPLE" ]; then
        echo "❌ Failed to create .env.example file!"
        exit 1
    fi
fi

cp "$ENV_EXAMPLE" "$ENV_FILE"
echo "✅ Created .env file from .env.example"
echo ""
echo "📝 Next steps:"
echo "   1. Edit .env file with your configuration"
echo "   2. Run: npm run get-marinade (to verify Marinade addresses)"
echo "   3. Run: npm run test:marinade (to test with Marinade)"

