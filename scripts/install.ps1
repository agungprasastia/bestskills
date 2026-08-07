# bestskills installer for Windows (PowerShell)
# Usage: irm https://raw.githubusercontent.com/agungprasastia/bestskills/main/scripts/install.ps1 | iex

$ErrorActionPreference = "Stop"

$App = "bestskills"
$Repo = "agungprasastia/bestskills"
$Target = "windows-x64"
$Asset = "${App}-${Target}.zip"
$InstallDir = "$env:LOCALAPPDATA\Programs\bestskills"

Write-Host "Installing $App ($Target)..." -ForegroundColor Cyan

# Download
$url = "https://github.com/$Repo/releases/latest/download/$Asset"
$tmpDir = New-TemporaryFile | ForEach-Object { Remove-Item $_; New-Item -ItemType Directory -Path $_ }
$zipPath = Join-Path $tmpDir $Asset

Write-Host "  Downloading $url..."
Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing

# Extract
Write-Host "  Extracting..."
Expand-Archive -Path $zipPath -DestinationPath $tmpDir -Force

# Install
New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
$exeFile = Get-ChildItem -Path $tmpDir -Filter "$App.exe" -Recurse | Select-Object -First 1
if (-not $exeFile) {
    throw "$App.exe not found in downloaded archive"
}
Copy-Item -Path $exeFile.FullName -Destination (Join-Path $InstallDir "$App.exe") -Force

# Clean up
Remove-Item -Recurse -Force $tmpDir

Write-Host ""
Write-Host "  ✔ Installed to $InstallDir\$App.exe" -ForegroundColor Green

# Add to PATH
$userPath = [Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::User)
if ($userPath -notlike "*$InstallDir*") {
    $newPath = "$InstallDir;$userPath"
    [Environment]::SetEnvironmentVariable("Path", $newPath, [System.EnvironmentVariableTarget]::User)
    Write-Host "  ✔ Added $InstallDir to user PATH" -ForegroundColor Green
    Write-Host "  ⚠ Restart your terminal for PATH changes to take effect." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "  Run '$App' to get started." -ForegroundColor Cyan