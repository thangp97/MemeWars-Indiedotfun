# Script cai dat Solana CLI tren Windows
# Usage: .\scripts\install-solana.ps1

Write-Host "Installing Solana CLI on Windows..." -ForegroundColor Cyan

# Kiem tra xem Solana da cai chua
try {
    $version = solana --version 2>$null
    if ($version) {
        Write-Host "[OK] Solana CLI already installed: $version" -ForegroundColor Green
        exit 0
    }
} catch {
    Write-Host "[INFO] Solana CLI not found, proceeding with installation..." -ForegroundColor Yellow
}

# Tao thu muc tam
$tempDir = "$env:TEMP\solana-install"
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

# Tai installer
Write-Host "[DOWNLOAD] Downloading Solana installer..." -ForegroundColor Yellow
$installerUrl = "https://github.com/solana-labs/solana/releases/latest/download/solana-install-init-x86_64-pc-windows-msvc.exe"
$installerPath = "$tempDir\solana-installer.exe"

try {
    Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing
    Write-Host "[OK] Download complete" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to download installer" -ForegroundColor Red
    Write-Host "   Please download manually from: https://github.com/solana-labs/solana/releases" -ForegroundColor Yellow
    exit 1
}

# Chay installer
Write-Host "[INSTALL] Running installer..." -ForegroundColor Yellow
Write-Host "   This may take a few minutes..." -ForegroundColor Gray
Write-Host "   Note: Solana installer now requires a specific version" -ForegroundColor Gray

# Lay version moi nhat tu GitHub API
try {
    $releaseUrl = "https://api.github.com/repos/solana-labs/solana/releases/latest"
    $releaseInfo = Invoke-RestMethod -Uri $releaseUrl -UseBasicParsing
    $latestVersion = $releaseInfo.tag_name -replace 'v', ''
    Write-Host "   Latest version: $latestVersion" -ForegroundColor Gray
    
    # Chay installer voi version cu the
    Start-Process -FilePath $installerPath -ArgumentList $latestVersion -Wait -NoNewWindow
    Write-Host "[OK] Installation complete!" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Installation failed" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Alternative: Download binary directly from:" -ForegroundColor Yellow
    Write-Host "   https://github.com/solana-labs/solana/releases" -ForegroundColor Yellow
    Write-Host "   Look for: solana-release-x86_64-pc-windows-msvc.tar.bz2" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Or try manual installation:" -ForegroundColor Yellow
    Write-Host "   $installerPath v1.18.0" -ForegroundColor White
    exit 1
}

# Them vao PATH
$solanaBinPath = "$env:USERPROFILE\.local\share\solana\install\active_release\bin"
if (Test-Path $solanaBinPath) {
    Write-Host "[PATH] Adding Solana to PATH..." -ForegroundColor Yellow
    
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($currentPath -notlike "*$solanaBinPath*") {
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$solanaBinPath", "User")
        $env:Path += ";$solanaBinPath"
        Write-Host "[OK] Added to PATH" -ForegroundColor Green
    } else {
        Write-Host "[INFO] Already in PATH" -ForegroundColor Gray
    }
} else {
    Write-Host "[WARNING] Solana bin path not found: $solanaBinPath" -ForegroundColor Yellow
    Write-Host "   Please add manually to PATH" -ForegroundColor Yellow
}

# Verify
Write-Host ""
Write-Host "[VERIFY] Verifying installation..." -ForegroundColor Cyan
Start-Sleep -Seconds 2

try {
    $version = & "$solanaBinPath\solana.exe" --version 2>$null
    if ($version) {
        Write-Host "[OK] Solana CLI installed successfully!" -ForegroundColor Green
        Write-Host "   Version: $version" -ForegroundColor Gray
        Write-Host ""
        Write-Host "[NEXT STEPS]:" -ForegroundColor Cyan
        Write-Host "   1. Close and reopen PowerShell" -ForegroundColor White
        Write-Host "   2. Run: solana config set --url devnet" -ForegroundColor White
        Write-Host "   3. Run: solana airdrop 2" -ForegroundColor White
    } else {
        Write-Host "[WARNING] Installation may have succeeded, but verification failed" -ForegroundColor Yellow
        Write-Host "   Please close and reopen PowerShell, then run: solana --version" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[WARNING] Could not verify installation" -ForegroundColor Yellow
    Write-Host "   Please close and reopen PowerShell, then run: solana --version" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
