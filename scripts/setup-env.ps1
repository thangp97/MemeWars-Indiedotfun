# PowerShell script to setup .env file from .env.example
# Usage: powershell -ExecutionPolicy Bypass -File scripts/setup-env.ps1

$envExample = ".env.example"
$envFile = ".env"

if (Test-Path $envFile) {
    Write-Host "⚠️  .env file already exists!" -ForegroundColor Yellow
    $response = Read-Host "Do you want to overwrite it? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "❌ Aborted. Keeping existing .env file." -ForegroundColor Red
        exit 0
    }
}

if (-not (Test-Path $envExample)) {
    Write-Host "❌ .env.example file not found!" -ForegroundColor Red
    exit 1
}

Copy-Item $envExample $envFile
Write-Host "✅ Created .env file from .env.example" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Edit .env file with your configuration" -ForegroundColor White
Write-Host "   2. Run: npm run get-marinade (to verify Marinade addresses)" -ForegroundColor White
Write-Host "   3. Run: npm run test:marinade (to test with Marinade)" -ForegroundColor White

