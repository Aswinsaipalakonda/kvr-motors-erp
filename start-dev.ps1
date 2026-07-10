# KVR Motors ERP - Dev Environment Launcher
# Opens distinct PowerShell consoles for backend, web-dashboard, and mobile-app.

$ROOT_DIR = $PSScriptRoot
if ([string]::IsNullOrEmpty($ROOT_DIR)) {
    $ROOT_DIR = Get-Location
}

Clear-Host

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "             ⚡ KVR Motors ERP Startup Utility ⚡" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""

# Check Docker Status
Write-Host "Checking Docker status..." -ForegroundColor Cyan
docker info >$null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARNING] Docker is not running. Database and Redis container might not start." -ForegroundColor Yellow
    Write-Host "Please start Docker Desktop if you plan to use containerized dependencies." -ForegroundColor Yellow
} else {
    Write-Host "[OK] Docker is running." -ForegroundColor Green
}
Write-Host ""

Write-Host "Select a launching mode:" -ForegroundColor Cyan
Write-Host " [1] Local Dev Stack (Recommended - opens separate windows)" -ForegroundColor White
Write-Host "     * Runs Docker containers for DB & Redis" -ForegroundColor DarkGray
Write-Host "     * Runs Django Backend (python manage.py runserver) locally" -ForegroundColor DarkGray
Write-Host "     * Runs Web Dashboard (Next.js) locally" -ForegroundColor DarkGray
Write-Host "     * Runs Mobile App (Expo) locally" -ForegroundColor DarkGray
Write-Host " [2] Docker Compose Full Stack" -ForegroundColor White
Write-Host "     * Runs all services (db, redis, backend, frontend) inside Docker" -ForegroundColor DarkGray
Write-Host " [3] Spin Up Database & Redis Only (in background)" -ForegroundColor White
Write-Host " [4] Stop all Docker containers" -ForegroundColor White
Write-Host " [5] Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter choice (1-5)"

switch ($choice) {
    "1" {
        Write-Host "`nStarting Database & Redis containers..." -ForegroundColor Cyan
        docker compose up -d db redis
        
        Write-Host "Launching local Django Backend (Port 8000)..." -ForegroundColor Cyan
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "Host.UI.RawUI.WindowTitle = 'Django Backend API'; Set-Location -Path '$ROOT_DIR\backend'; if (Test-Path 'venv\Scripts\Activate.ps1') { . venv\Scripts\Activate.ps1 } else { Write-Warning 'Virtual environment not found! Running native python...' }; python manage.py runserver"

        Write-Host "Launching local Web Dashboard (Port 3000)..." -ForegroundColor Cyan
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "Host.UI.RawUI.WindowTitle = 'Next.js Web Dashboard'; Set-Location -Path '$ROOT_DIR\dashboards'; npm run dev"

        Write-Host "Launching local Mobile App (Expo)..." -ForegroundColor Cyan
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "Host.UI.RawUI.WindowTitle = 'Expo Mobile App'; Set-Location -Path '$ROOT_DIR\mobile-app'; npx expo start"

        Write-Host "`nAll development servers launched! Check the new windows." -ForegroundColor Green
    }
    "2" {
        Write-Host "`nStarting full stack in Docker Compose (Ctrl+C to stop)..." -ForegroundColor Cyan
        docker compose up
    }
    "3" {
        Write-Host "`nSpinning up Postgres & Redis in the background..." -ForegroundColor Cyan
        docker compose up -d db redis
        Write-Host "Containers started! Database exposed on port 5433." -ForegroundColor Green
    }
    "4" {
        Write-Host "`nStopping all containers..." -ForegroundColor Cyan
        docker compose down
        Write-Host "Containers stopped." -ForegroundColor Green
    }
    "5" {
        Write-Host "`nGoodbye!" -ForegroundColor Yellow
        exit
    }
    Default {
        Write-Host "`nInvalid choice. Exiting." -ForegroundColor Red
    }
}
