param(
  [switch]$Kill8081
)

Write-Output "== Dev Doctor =="

Write-Output "`n[1] IPv4 addresses"
ipconfig | findstr /R "IPv4"

Write-Output "`n[2] Supabase status"
npx supabase status

Write-Output "`n[3] Port 8081"
$connections = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue

if (-not $connections) {
  Write-Output "Port 8081 is free."
  exit 0
}

$processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique
Write-Output ("Port 8081 is used by PID(s): " + ($processIds -join ', '))

foreach ($processId in $processIds) {
  tasklist /FI "PID eq $processId" | Select-Object -Skip 3
}

if ($Kill8081) {
  Write-Output "`n[4] Releasing port 8081"
  foreach ($processId in $processIds) {
    try {
      Stop-Process -Id $processId -Force -ErrorAction Stop
      Write-Output "Stopped PID $processId"
    }
    catch {
      Write-Output ("Failed to stop PID " + $processId + ": " + $_.Exception.Message)
    }
  }

  Start-Sleep -Seconds 1
  $after = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue
  if ($after) {
    Write-Output "Port 8081 is still occupied."
    exit 1
  }
  else {
    Write-Output "Port 8081 is now free."
  }
}