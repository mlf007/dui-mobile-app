# Android SDK Setup Script for Windows
# Run this script as Administrator if Android Studio is installed

Write-Host "Checking for Android SDK..." -ForegroundColor Cyan

$sdkPath = "$env:LOCALAPPDATA\Android\Sdk"

if (Test-Path "$sdkPath\platform-tools\adb.exe") {
    Write-Host "✓ Android SDK found at: $sdkPath" -ForegroundColor Green
    
    # Set ANDROID_HOME for current session
    $env:ANDROID_HOME = $sdkPath
    $env:PATH += ";$sdkPath\platform-tools;$sdkPath\tools;$sdkPath\tools\bin"
    
    Write-Host "`nSetting ANDROID_HOME permanently..." -ForegroundColor Yellow
    
    # Set ANDROID_HOME permanently
    [System.Environment]::SetEnvironmentVariable('ANDROID_HOME', $sdkPath, 'User')
    
    # Add to PATH
    $currentPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')
    $pathsToAdd = @(
        "$sdkPath\platform-tools",
        "$sdkPath\tools",
        "$sdkPath\tools\bin"
    )
    
    foreach ($pathToAdd in $pathsToAdd) {
        if ($currentPath -notlike "*$pathToAdd*") {
            $currentPath += ";$pathToAdd"
        }
    }
    
    [System.Environment]::SetEnvironmentVariable('Path', $currentPath, 'User')
    
    Write-Host "✓ ANDROID_HOME set to: $sdkPath" -ForegroundColor Green
    Write-Host "✓ Added Android SDK tools to PATH" -ForegroundColor Green
    Write-Host "`n⚠ IMPORTANT: Restart your terminal/IDE for changes to take effect!" -ForegroundColor Yellow
    Write-Host "`nAfter restarting, run: npx expo start" -ForegroundColor Cyan
    
} else {
    Write-Host "✗ Android SDK not found at: $sdkPath" -ForegroundColor Red
    Write-Host "`nYou have two options:" -ForegroundColor Yellow
    Write-Host "`n1. EASIEST: Use Expo Go app (no SDK needed):" -ForegroundColor Green
    Write-Host "   - Install Expo Go from Play Store"
    Write-Host "   - Run: npx expo start"
    Write-Host "   - Scan QR code with Expo Go"
    Write-Host "`n2. Install Android Studio for emulator:" -ForegroundColor Green
    Write-Host "   - Download: https://developer.android.com/studio"
    Write-Host "   - Install with default settings"
    Write-Host "   - Then run this script again"
}

