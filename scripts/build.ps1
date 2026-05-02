$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$solution = Join-Path $root "HeatTransfer.sln"

function Find-MSBuild {
    $vswhere = Join-Path ${env:ProgramFiles(x86)} "Microsoft Visual Studio\Installer\vswhere.exe"

    if (Test-Path $vswhere) {
        $installPath = & $vswhere -latest -products * -requires Microsoft.Component.MSBuild -property installationPath
        if ($installPath) {
            $candidate = Join-Path $installPath "MSBuild\Current\Bin\MSBuild.exe"
            if (Test-Path $candidate) {
                return $candidate
            }
        }
    }

    $command = Get-Command msbuild.exe -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }

    return $null
}

$msbuild = Find-MSBuild
if (-not $msbuild) {
    Write-Host ""
    Write-Host "MSBuild was not found."
    Write-Host "Install Visual Studio Community with the '.NET desktop development' workload, then run this file again."
    Write-Host "Download Visual Studio: https://visualstudio.microsoft.com/vs/community/"
    Write-Host ""
    exit 1
}

Write-Host "Building HeatTransfer with:"
Write-Host $msbuild
& $msbuild $solution /restore /p:Configuration=Release /p:Platform="Any CPU"

Write-Host ""
Write-Host "Build complete."
Write-Host "App location: $(Join-Path $root 'bin\Release\HeatTransfer.exe')"
