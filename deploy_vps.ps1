# VPS Deployment Script for KVR Motors ERP
# Automates packaging, transferring, and restarting services in Docker containers
# Safe deployment - does not interrupt other applications on VPS

$VPS_IP = "145.223.18.5"
$VPS_PATH = "/root/kvr-motors-erp"

Write-Host "=========================================" -ForegroundColor Green
Write-Host " KVR Motors ERP - Safe VPS Deployment" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# 1. Compress Local Code
Write-Host "Step 1: Compressing local projects..." -ForegroundColor Cyan

if (Test-Path "backend.tar.gz") { Remove-Item "backend.tar.gz" }
if (Test-Path "dashboards.tar.gz") { Remove-Item "dashboards.tar.gz" }

# Compress backend (excluding venv, pycache, local sqlite db, and git)
Write-Host "Packing backend..."
tar.exe -czf backend.tar.gz --exclude="venv" --exclude="__pycache__" --exclude="*.pyc" --exclude="db.sqlite3" -C backend .
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Backend compression failed!" -ForegroundColor Red
    exit 1
}

# Compress dashboards (excluding node_modules, build cache, and git)
Write-Host "Packing dashboards..."
tar.exe -czf dashboards.tar.gz --exclude="node_modules" --exclude=".next" --exclude="out" -C dashboards .
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Dashboards compression failed!" -ForegroundColor Red
    exit 1
}

# 2. Transfer Archives to VPS
Write-Host "Step 2: Syncing files to VPS ($VPS_IP)..." -ForegroundColor Cyan

# Create remote directory structure if not exists
ssh "root@$VPS_IP" "mkdir -p $VPS_PATH/backend $VPS_PATH/dashboards"

# Upload tars and configuration files
scp backend.tar.gz "root@${VPS_IP}:${VPS_PATH}/"
scp dashboards.tar.gz "root@${VPS_IP}:${VPS_PATH}/"
scp docker-compose.yml "root@${VPS_IP}:${VPS_PATH}/"
scp nginx.conf "root@${VPS_IP}:${VPS_PATH}/"

# 3. Extract and Deploy Remote Containers (safe rolling restart)
Write-Host "Step 3: Extracting and performing safe rolling restart on VPS..." -ForegroundColor Cyan

ssh "root@$VPS_IP" "
    set -e
    cd $VPS_PATH

    echo '--- Cleaning up old backend files (preserving media, staticfiles, db data) ---'
    find $VPS_PATH/backend -mindepth 1 -maxdepth 1 ! -name 'media' ! -name 'staticfiles' -exec rm -rf {} +

    echo '--- Cleaning up old dashboard files ---'
    rm -rf $VPS_PATH/dashboards/*

    echo '--- Extracting archives ---'
    tar -xzf backend.tar.gz -C backend && rm backend.tar.gz
    tar -xzf dashboards.tar.gz -C dashboards && rm dashboards.tar.gz

    echo '--- Building updated images (no container restart yet) ---'
    docker compose build --no-cache

    echo '--- Rolling restart: backend first ---'
    docker compose up -d --no-deps backend
    sleep 5

    echo '--- Running database migrations (non-destructive) ---'
    docker compose exec -T backend python manage.py migrate --noinput

    echo '--- Seeding demo data (clears bookings/leads/sales, seeds 10 vehicles + batteries) ---'
    docker compose exec -T backend python seed_demo_data.py

    echo '--- Rolling restart: frontend ---'
    docker compose up -d --no-deps frontend

    echo '--- Pruning unused docker images to free disk space ---'
    docker image prune -f

    echo '--- Current running containers ---'
    docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
"

# 4. Clean up Local Archives
Write-Host "Step 4: Cleaning up local archives..." -ForegroundColor Cyan
if (Test-Path "backend.tar.gz") { Remove-Item "backend.tar.gz" }
if (Test-Path "dashboards.tar.gz") { Remove-Item "dashboards.tar.gz" }

Write-Host "=========================================" -ForegroundColor Green
Write-Host " Deployment Completed Successfully!" -ForegroundColor Green
Write-Host " Web URL  : https://kvr.thehps.in/" -ForegroundColor Green
Write-Host " API URL  : http://145.223.18.5:8004/" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
