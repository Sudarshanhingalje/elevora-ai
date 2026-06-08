$CertsDir = Join-Path $PSScriptRoot "certs"
if (!(Test-Path $CertsDir)) {
    New-Item -ItemType Directory -Path $CertsDir | Out-Null
}

$OpenSSL = "C:\Program Files\Git\usr\bin\openssl.exe"
if (!(Test-Path $OpenSSL)) {
    Write-Error "OpenSSL not found at $OpenSSL. Please make sure Git is installed."
    exit 1
}

$KeyPath = Join-Path $CertsDir "localhost.key"
$CertPath = Join-Path $CertsDir "localhost.crt"

Write-Host "Generating self-signed SSL certificate for localhost..."

# Generate self-signed certificate with SAN (Subject Alternative Name) for localhost
& $OpenSSL req -x509 -nodes -days 365 -newkey rsa:2048 `
  -keyout $KeyPath `
  -out $CertPath `
  -subj "/CN=localhost" `
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Self-signed SSL certificates generated successfully at:" -ForegroundColor Green
    Write-Host "  Key:  $KeyPath" -ForegroundColor Green
    Write-Host "  Cert: $CertPath" -ForegroundColor Green
} else {
    Write-Error "Failed to generate certificates using OpenSSL."
}
