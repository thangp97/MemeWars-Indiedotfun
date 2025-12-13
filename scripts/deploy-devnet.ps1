# Script để deploy MemeWars lên devnet (PowerShell)
# Usage: powershell -ExecutionPolicy Bypass -File scripts/deploy-devnet.ps1

Write-Host "🚀 Deploying MemeWars to Devnet..." -ForegroundColor Green
Write-Host ""

# Check balance
$balanceOutput = solana balance --url devnet
$balance = [double]($balanceOutput -replace '[^0-9.]', '' -split ' ' | Where-Object { $_ -match '^\d+\.?\d*$' } | Select-Object -First 1)
Write-Host "💰 Current balance: $balance SOL" -ForegroundColor Cyan

# Check if we need more SOL
if ($balance -lt 2.5) {
    Write-Host "⚠️  Balance is low. Requesting airdrop..." -ForegroundColor Yellow
    solana airdrop 2 --url devnet
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Airdrop failed (rate limit). Please wait and try again." -ForegroundColor Yellow
    } else {
        Start-Sleep -Seconds 5
        $balanceOutput = solana balance --url devnet
        $balance = [double]($balanceOutput -replace '[^0-9.]', '' -split ' ' | Where-Object { $_ -match '^\d+\.?\d*$' } | Select-Object -First 1)
        Write-Host "💰 New balance: $balance SOL" -ForegroundColor Cyan
    }
}

# Build
Write-Host ""
Write-Host "🔨 Building program..." -ForegroundColor Yellow
anchor build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Deploy
Write-Host ""
Write-Host "📤 Deploying to devnet..." -ForegroundColor Yellow
anchor deploy --provider.cluster devnet

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment complete!" -ForegroundColor Green
    Write-Host ""
    
    $programId = (anchor keys list | Select-String "memewars" | ForEach-Object { ($_ -split '\s+')[1] })
    Write-Host "📝 Program ID: $programId" -ForegroundColor Cyan
    Write-Host "🔗 View on Solscan: https://solscan.io/account/$programId?cluster=devnet" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Check balance: solana balance --url devnet"
    Write-Host "   2. Airdrop more SOL: solana airdrop 2 --url devnet"
    Write-Host "   3. Check program ID: anchor keys list"
    Write-Host "   4. Try closing old program: solana program close <PROGRAM_ID> --url devnet"
    exit 1
}

