# Deploy SWIVV MATCH to the VPS (swivvmatch.com). Vercel is not used.
# Usage: bun run deploy        (or: powershell -ExecutionPolicy Bypass -File scripts/deploy-vps.ps1)
param(
  [string]$SshHost = "root@92.242.188.41",
  [string]$KeyPath = "$env:USERPROFILE\.ssh\id_ed25519",
  [string]$RemoteDir = "/opt/swivv",
  [string]$Service = "swivv"
)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)
$sshArgs = @("-i", $KeyPath, "-o", "BatchMode=yes", "-o", "ConnectTimeout=15")

# Build with the server's public VITE_* values (the bundle is compiled, not read at runtime)
$vite = & ssh @sshArgs $SshHost "grep -E '^VITE_[A-Z0-9_]+=' $RemoteDir/.env"
if ($LASTEXITCODE -ne 0) { throw "cannot read $RemoteDir/.env" }
foreach ($line in $vite) {
  if ($line -match '^([A-Z0-9_]+)=(.*)$') { Set-Item "env:$($matches[1])" $matches[2].Trim('"') }
}

Write-Host "Building..." -ForegroundColor Cyan
# node-server, not the Cloudflare worker preset Nitro sometimes auto-picks: the VPS runs node .output/server/index.mjs
$env:NITRO_PRESET = "node-server"
& bun run build
if ($LASTEXITCODE -ne 0) { throw "build failed" }

Write-Host "Uploading .output..." -ForegroundColor Cyan
& ssh @sshArgs $SshHost "rm -rf $RemoteDir/.output.new"
if ($LASTEXITCODE -ne 0) { throw "cannot clear staging dir" }
& scp -r -q -i $KeyPath -o BatchMode=yes .output "${SshHost}:$RemoteDir/.output.new"
if ($LASTEXITCODE -ne 0) { throw "upload failed" }

Write-Host "Swapping and restarting $Service..." -ForegroundColor Cyan
& ssh @sshArgs $SshHost "set -e; rm -rf $RemoteDir/.output.old; mv $RemoteDir/.output $RemoteDir/.output.old; mv $RemoteDir/.output.new $RemoteDir/.output; chown -R swivv:swivv $RemoteDir/.output; systemctl restart $Service; for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do systemctl is-active --quiet $Service && exit 0; sleep 1; done; journalctl -u $Service -n 20 --no-pager; exit 1"
if ($LASTEXITCODE -ne 0) { throw "restart failed" }

for ($i = 0; $i -lt 10; $i++) {
  try {
    $r = Invoke-WebRequest "https://swivvmatch.com/" -UseBasicParsing -TimeoutSec 15
    Write-Host "Live: $($r.StatusCode)" -ForegroundColor Green
    exit 0
  } catch { Start-Sleep 2 }
}
throw "site did not come back up"
