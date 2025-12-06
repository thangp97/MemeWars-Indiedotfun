# Script to build Anchor program with proper environment variables
# Usage: .\scripts\build.ps1

# Set HOME environment variable (Anchor needs this on Windows)
$env:HOME = $env:USERPROFILE

Write-Host "Building Anchor program..." -ForegroundColor Cyan
Write-Host "HOME set to: $env:HOME" -ForegroundColor Gray

# Build
anchor build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful!" -ForegroundColor Green
} else {
    Write-Host "Build failed!" -ForegroundColor Red
    exit $LASTEXITCODE
}

