$ErrorActionPreference = "SilentlyContinue"
Write-Host "========================================="
Write-Host "    KVR Motors ERP - Git Auto-Push Watcher"
Write-Host "========================================="
Write-Host "Polling repository for changes every 10 seconds..."
Write-Host "Press Ctrl+C or kill the task to stop."

while ($true) {
    # Check if there are any changes (modified, deleted, or untracked files)
    $status = git status --porcelain
    if ($status) {
        Write-Host ""
        Write-Host "--- Change detected! ---"
        Write-Host $status
        
        Write-Host "Staging changes (git add .)..."
        git add .
        
        $date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Write-Host "Committing changes..."
        git commit -m "Auto-commit: ERP codebase updates at $date"
        
        Write-Host "Pushing to remote origin main..."
        git push origin main
        Write-Host "Push completed successfully."
        Write-Host "========================================="
    }
    Start-Sleep -Seconds 10
}
