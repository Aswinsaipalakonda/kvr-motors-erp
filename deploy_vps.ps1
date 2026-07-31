# VPS Deployment Script for KVR Motors ERP
# Automates packaging, transferring, and restarting services in Docker containers

$VPS_IP = "145.223.18.5"
$VPS_PATH = "/root/kvr-motors-erp"

Write-Host "=========================================" -ForegroundColor Green
Write-Host "Starting KVR Motors ERP VPS Deployment" -ForegroundColor Green
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

# 3. Extract and Deploy Remote Containers
Write-Host "Step 3: Extracting archives and restarting containers on VPS..." -ForegroundColor Cyan

ssh "root@$VPS_IP" "
    cd $VPS_PATH
    
    echo 'Cleaning up old files (preserving user uploads)...'
    # Delete backend files except media and staticfiles directories
    find $VPS_PATH/backend -mindepth 1 -maxdepth 1 ! -name 'media' ! -name 'staticfiles' -exec rm -rf {} +
    
    # Delete dashboard files
    rm -rf $VPS_PATH/dashboards/*
    
    echo 'Extracting archives...'
    tar -xzf backend.tar.gz -C backend && rm backend.tar.gz
    tar -xzf dashboards.tar.gz -C dashboards && rm dashboards.tar.gz
    
    echo 'Shutting down current containers...'
    docker compose down --remove-orphans
    
    echo 'Building and launching updated containers...'
    docker compose build --no-cache
    docker compose up -d

    echo 'Waiting for services to initialize...'
    sleep 5

    echo 'Running database migrations...'
    docker compose exec -T backend python manage.py migrate --noinput
    
    echo 'Pruning unused docker images to free space...'
    docker image prune -f
"

# 4. Clean up Local Archives
Write-Host "Step 4: Cleaning up local archives..." -ForegroundColor Cyan
Remove-Item backend.tar.gz
Remove-Item dashboards.tar.gz

Write-Host "=========================================" -ForegroundColor Green
Write-Host "Deployment Completed Successfully!" -ForegroundColor Green
Write-Host "Web URL: https://kvr.thehps.in/" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
