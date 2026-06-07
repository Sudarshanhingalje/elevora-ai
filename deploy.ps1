param (
    [string]$tenant_slug,
    [string]$docker_image,
    [string]$container_name
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrEmpty($tenant_slug) -or [string]::IsNullOrEmpty($docker_image) -or [string]::IsNullOrEmpty($container_name)) {
    Write-Error "Usage: deploy.ps1 <tenant_slug> <docker_image> <container_name>"
    exit 1
}

# Verify required environment variables
$required_env = @("DB_HOST", "DB_NAME", "DB_USERNAME", "DB_PASSWORD", "REDIS_HOST", "REDIS_PASSWORD")
foreach ($name in $required_env) {
    if ([string]::IsNullOrEmpty([System.Environment]::GetEnvironmentVariable($name))) {
        Write-Error "Missing environment variable: $name"
        exit 1
    }
}

$network_name = "elevora-${tenant_slug}-network"

# Create network if not exists
$network_exists = docker network ls --filter "name=^${network_name}$" --format "{{.Name}}"
if ([string]::IsNullOrEmpty($network_exists)) {
    docker network create --driver bridge $network_name >$null
}

# Pull image only if not present locally
$existing_image = docker images -q $docker_image 2>$null
if ([string]::IsNullOrEmpty($existing_image)) {
    Write-Host "Image $docker_image not found locally. Pulling from registry..."
    docker pull $docker_image
    if ($LastExitCode -ne 0) {
        Write-Error "Failed to pull image: $docker_image"
        exit 1
    }
} else {
    Write-Host "Image $docker_image found locally. Skipping pull."
}

# Remove existing container if any
$existing = docker ps -a --filter "name=^${container_name}$" --format "{{.Names}}"
if (![string]::IsNullOrEmpty($existing)) {
    docker rm -f $container_name >$null
}

# Run container
$container_id = docker run -d `
    --name $container_name `
    --network $network_name `
    --memory 512m `
    --cpus 0.5 `
    --restart unless-stopped `
    -e TENANT_SLUG=$tenant_slug `
    -e DB_HOST=$env:DB_HOST `
    -e DB_NAME=$env:DB_NAME `
    -e DB_USERNAME=$env:DB_USERNAME `
    -e DB_PASSWORD=$env:DB_PASSWORD `
    -e REDIS_HOST=$env:REDIS_HOST `
    -e REDIS_PASSWORD=$env:REDIS_PASSWORD `
    $docker_image

if ([string]::IsNullOrEmpty($container_id)) {
    Write-Error "container start failed"
    exit 1
}

Write-Output $container_id.Trim()
