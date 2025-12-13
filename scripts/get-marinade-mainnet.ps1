# Script để lấy Marinade accounts từ mainnet
# Usage: powershell -ExecutionPolicy Bypass -File scripts/get-marinade-mainnet.ps1

$env:NETWORK = "mainnet-beta"
Write-Host "Setting NETWORK=mainnet-beta" -ForegroundColor Green
npx ts-node scripts/get-marinade-accounts.ts

