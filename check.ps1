# kids-music-app startup/check script
# Usage: place this file inside the kids-music-app folder, open a command
#        prompt in that folder (type cmd in the address bar), then run:
#        powershell -ExecutionPolicy Bypass -File .\check.ps1

$ErrorActionPreference = "Stop"

Set-Location -Path $PSScriptRoot

Write-Host "=== Working folder ===" -ForegroundColor Cyan
Get-Location

# --- 1. Stop anything already using port 8000 ---
Write-Host "`n=== Checking / stopping processes on port 8000 ===" -ForegroundColor Cyan
$conns = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($conns) {
    $conns | ForEach-Object {
        $procId = $_.OwningProcess
        Write-Host "Stopping PID $procId"
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 1
} else {
    Write-Host "No process was using port 8000"
}

# --- 2. Find an available python command ---
Write-Host "`n=== Looking for a python command ===" -ForegroundColor Cyan
$pythonCmd = $null
foreach ($cand in @("python", "python3", "py")) {
    if (Get-Command $cand -ErrorAction SilentlyContinue) {
        $pythonCmd = $cand
        break
    }
}
if (-not $pythonCmd) {
    Write-Host "python was not found. Please check your Python installation." -ForegroundColor Red
    exit 1
}
Write-Host "Using command: $pythonCmd"

# --- 3. Start the server as a background process ---
Write-Host "`n=== Starting server on port 8000 ===" -ForegroundColor Cyan
$argsList = @("-m", "http.server", "8000")
if ($pythonCmd -eq "py") { $argsList = @("-3") + $argsList }
$proc = Start-Process -FilePath $pythonCmd -ArgumentList $argsList -PassThru -WindowStyle Hidden `
    -RedirectStandardOutput "server_stdout.log" -RedirectStandardError "server_stderr.log"
Write-Host "Server PID: $($proc.Id)"
Start-Sleep -Seconds 2

# --- 4. Fetch app.js directly (bypasses browser cache entirely) ---
Write-Host "`n=== Fetching app.js directly (no browser involved) ===" -ForegroundColor Cyan
try {
    $resp = Invoke-WebRequest -Uri "http://localhost:8000/app.js" -UseBasicParsing
    $content = $resp.Content
    if ($content -match "TEST1") {
        Write-Host "RESULT: TEST1 was found. The server IS returning your edited file." -ForegroundColor Green
        Write-Host "-> If the browser still does not show it, the cause is the browser cache."
    } else {
        Write-Host "RESULT: TEST1 was NOT found." -ForegroundColor Red
        Write-Host "-> The server is reading a different app.js than the one you edited."
        Write-Host "--- First 300 characters actually returned ---"
        Write-Host $content.Substring(0, [Math]::Min(300, $content.Length))
    }
} catch {
    Write-Host "Failed to fetch app.js: $_" -ForegroundColor Red
}

Write-Host "`n=== Done ===" -ForegroundColor Cyan
Write-Host "Server (PID $($proc.Id)) is still running."
Write-Host "To stop it, run: Stop-Process -Id $($proc.Id) -Force"
