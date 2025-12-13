# Script to fix missing Rust directory in Solana SDK
# Run this script with Administrator privileges if needed
# Usage: powershell -ExecutionPolicy Bypass -File scripts/fix-solana-rust.ps1

$ErrorActionPreference = "Stop"

Write-Host "=== Fixing Solana SDK Rust Directory ===" -ForegroundColor Cyan

# Paths
$tarFile = "$env:USERPROFILE\.local\share\solana\install\releases\1.18.26\solana-release\bin\sdk\sbf\dependencies\platform-tools\platform-tools-windows-x86_64.tar.bz2"
$targetDir = "$env:USERPROFILE\.local\share\solana\install\releases\1.18.26\solana-release\bin\sdk\sbf\dependencies\platform-tools"
$extractDir = "$env:TEMP\solana-rust-extract-$(Get-Date -Format 'yyyyMMddHHmmss')"

# Check if tar file exists
if (-not (Test-Path $tarFile)) {
    Write-Host "ERROR: Tar file not found: $tarFile" -ForegroundColor Red
    Write-Host "Please reinstall Solana or check the installation." -ForegroundColor Yellow
    exit 1
}

Write-Host "Found tar file: $tarFile" -ForegroundColor Green

# Create extract directory
Write-Host "Creating temporary extract directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $extractDir | Out-Null

try {
    # Extract tar file (this may take a few minutes)
    Write-Host "Extracting tar file (this may take a few minutes)..." -ForegroundColor Yellow
    tar -xjf $tarFile -C $extractDir
    
    # Check if rust directory exists in extract
    $rustSource = Join-Path $extractDir "rust"
    if (-not (Test-Path $rustSource)) {
        Write-Host "ERROR: Rust directory not found in extracted files" -ForegroundColor Red
        Write-Host "Contents of extract directory:" -ForegroundColor Yellow
        Get-ChildItem $extractDir | Select-Object Name
        exit 1
    }
    
    Write-Host "Found rust directory in extract" -ForegroundColor Green
    
    # Copy rust directory to target
    $rustTarget = Join-Path $targetDir "rust"
    Write-Host "Copying rust directory to: $rustTarget" -ForegroundColor Yellow
    
    if (Test-Path $rustTarget) {
        Write-Host "Removing existing rust directory..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force $rustTarget
    }
    
    Copy-Item -Path $rustSource -Destination $rustTarget -Recurse -Force
    
    # Verify
    $libPath = Join-Path $rustTarget "lib"
    if (Test-Path $libPath) {
        Write-Host "SUCCESS: Rust lib directory created!" -ForegroundColor Green
        Write-Host "Path: $libPath" -ForegroundColor Gray
    } else {
        Write-Host "WARNING: Rust lib directory not found after copy" -ForegroundColor Yellow
    }
    
} finally {
    # Cleanup
    Write-Host "Cleaning up temporary files..." -ForegroundColor Yellow
    if (Test-Path $extractDir) {
        Remove-Item -Recurse -Force $extractDir -ErrorAction SilentlyContinue
    }
}

Write-Host "`nDone! Try running 'anchor build' now." -ForegroundColor Green

