$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$exe = Join-Path $root "bin\Release\HeatTransfer.exe"

if (-not (Test-Path $exe)) {
    Write-Host "Release build was not found. Building it now..."
    & (Join-Path $PSScriptRoot "build.ps1")
}

if (-not (Test-Path $exe)) {
    Write-Host "The app could not be built. See the messages above for the missing dependency."
    exit 1
}

Write-Host "Starting Heat Transfer..."
Start-Process $exe
