param(
  [Parameter(Mandatory = $true)]
  [int] $Port
)

$connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue

if (-not $connections) {
  Write-Host "No hay ningun proceso escuchando en el puerto $Port."
  exit 0
}

$processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique

foreach ($processId in $processIds) {
  $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
  if ($process) {
    Write-Host "Parando $($process.ProcessName) con PID $processId en el puerto $Port..."
    Stop-Process -Id $processId -Force
  }
}
