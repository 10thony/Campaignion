# Convex Development Server Status Check
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Convex Development Server Status" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if port 3210 is in use
Write-Host "Checking port 3210..." -ForegroundColor Yellow
$port3210 = netstat -ano | findstr ":3210"

if ($port3210) {
    Write-Host "✓ Port 3210 is in use (Convex server is running)" -ForegroundColor Green
    Write-Host $port3210
} else {
    Write-Host "✗ Port 3210 is not in use (Convex server is NOT running)" -ForegroundColor Red
    Write-Host ""
    Write-Host "To start Convex server, run one of these commands:" -ForegroundColor Yellow
    Write-Host "  1. npm run dev           (starts both frontend + Convex)" -ForegroundColor White
    Write-Host "  2. npm run dev:convex    (starts Convex only)" -ForegroundColor White
    Write-Host "  3. npx convex dev        (starts Convex directly)" -ForegroundColor White
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan

# Check environment file
Write-Host "Checking .env.local configuration..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "✓ .env.local file exists" -ForegroundColor Green
    
    $convexUrl = Select-String -Path ".env.local" -Pattern "^VITE_CONVEX_URL=" | Select-Object -First 1
    if ($convexUrl) {
        Write-Host "  $($convexUrl.Line)" -ForegroundColor White
        
        if ($convexUrl.Line -match "127.0.0.1:3210") {
            Write-Host "  → Configured for LOCAL Convex development server" -ForegroundColor Cyan
        } elseif ($convexUrl.Line -match "convex.cloud") {
            Write-Host "  → Configured for CLOUD Convex deployment" -ForegroundColor Cyan
        }
    } else {
        Write-Host "✗ VITE_CONVEX_URL not found in .env.local" -ForegroundColor Red
    }
} else {
    Write-Host "✗ .env.local file not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan

# Check if Convex is configured
Write-Host "Checking Convex configuration..." -ForegroundColor Yellow
if (Test-Path "convex/_generated/api.d.ts") {
    Write-Host "✓ Convex is configured (generated files exist)" -ForegroundColor Green
} else {
    Write-Host "✗ Convex is not configured" -ForegroundColor Red
    Write-Host "  Run 'npx convex dev' to initialize" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Status Check Complete" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

