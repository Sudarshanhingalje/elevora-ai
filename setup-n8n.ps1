#!/usr/bin/env pwsh
# =============================================================
# Elevora AI — Full Setup Script
# Run from: D:\elevora_projects\elevora-ai\elevora-ai-main
# =============================================================

$ErrorActionPreference = "Continue"
$projectDir = "D:\elevora_projects\elevora-ai\elevora-ai-main"
Set-Location $projectDir

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " STEP 1: Restart n8n with new env vars" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

docker compose down elevora-n8n
Start-Sleep -Seconds 3
docker compose --env-file .env up -d elevora-n8n
Write-Host "Waiting 20s for n8n to boot..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " STEP 2: Create MinIO bucket 'elevora-assets'" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Install mc alias inside minio container and create bucket
docker exec elevora-minio sh -c "mc alias set local http://localhost:9000 elevora_admin 'Sudu@1308' --insecure 2>&1 || true"
docker exec elevora-minio sh -c "mc mb local/elevora-assets --ignore-existing 2>&1"
docker exec elevora-minio sh -c "mc anonymous set public local/elevora-assets/campaign-images 2>&1"

Write-Host "Bucket 'elevora-assets' created and campaign-images folder set to public-read" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " STEP 3: Verify n8n env vars" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

docker exec elevora-n8n sh -c "echo MINIO_ENDPOINT=\$MINIO_ENDPOINT && echo MINIO_ACCESS_KEY=\$MINIO_ACCESS_KEY && echo INSTAGRAM_BUSINESS_ACCOUNT_ID=\$INSTAGRAM_BUSINESS_ACCOUNT_ID && echo COMFYUI_BASE_URL=\$COMFYUI_BASE_URL && echo N8N_CAMPAIGN_SECRET=\$N8N_CAMPAIGN_SECRET"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " STEP 4: Import n8n workflow" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Copy workflow JSON into container and import it
docker cp "$projectDir\n8n-workflows\elevora_campaign_publisher.json" elevora-n8n:/tmp/workflow.json
docker exec elevora-n8n sh -c "n8n import:workflow --input=/tmp/workflow.json 2>&1"

Write-Host "`n========================================" -ForegroundColor Green
Write-Host " ALL DONE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Open n8n at http://localhost:5678" -ForegroundColor White
Write-Host "     Username: admin  Password: Sudu@1308" -ForegroundColor White
Write-Host "  2. Find 'Elevora Campaign Publisher' workflow → ACTIVATE it (toggle top-right)" -ForegroundColor White
Write-Host "  3. Go to Admin Dashboard → Social Campaigns tab → Schedule a test post" -ForegroundColor White
Write-Host "  4. Check n8n Executions tab for live status" -ForegroundColor White
Write-Host ""
Write-Host "MinIO console: http://localhost:9001" -ForegroundColor White
Write-Host "  User: elevora_admin  Password: Sudu@1308" -ForegroundColor White
Write-Host ""
