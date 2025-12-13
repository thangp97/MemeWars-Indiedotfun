# Script để lấy Marinade accounts từ devnet
# Usage: powershell -ExecutionPolicy Bypass -File scripts/get-marinade-devnet.ps1

$env:NETWORK = "devnet"
Write-Host "Setting NETWORK=devnet" -ForegroundColor Green
npx ts-node scripts/get-marinade-accounts.ts

