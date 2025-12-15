# Android SDK Setup Script for Windows
# Run this script as Administrator if Android Studio is installed

Write-Host "`n=== Android SDK Setup ===" -ForegroundColor Cyan
Write-Host "Searching for Android SDK..." -ForegroundColor Cyan

# Common Android SDK locations to check
$possiblePaths = @(
    "$env:LOCALAPPDATA\Android\Sdk",
    "$env:USERPROFILE\AppData\Local\Android\Sdk",
    "$env:ProgramFiles\Android\Android Studio\sdk",
    "$env:ProgramFiles(x86)\Android\android-sdk",
    "$env:ANDROID_HOME",
    "$env:ANDROID_SDK_ROOT"
)

# Also check Android Studio's local.properties if it exists
$studioPaths = @(
    "$env:LOCALAPPDATA\Google\AndroidStudio*",
    "$env:USERPROFILE\.AndroidStudio*"
)

foreach ($studioPathPattern in $studioPaths) {
    $studioDirs = Get-ChildItem -Path $studioPathPattern -ErrorAction SilentlyContinue -Directory
    foreach ($studioDir in $studioDirs) {
        $localProperties = Join-Path $studioDir.FullName "config\options\project.default.xml"
        if (Test-Path $localProperties) {
            $content = Get-Content $localProperties -Raw
            if ($content -match 'SDK_PATH.*value="([^"]+)"') {
                $possiblePaths += $matches[1]
            }
        }
    }
}

$sdkPath = $null

# Search for SDK
foreach ($path in $possiblePaths) {
    if ($path -and (Test-Path "$path\platform-tools\adb.exe")) {
        $sdkPath = $path
        Write-Host "✓ Android SDK found at: $sdkPath" -ForegroundColor Green
        break
    }
}

if ($sdkPath) {
    # Set ANDROID_HOME for current session
    $env:ANDROID_HOME = $sdkPath
    $env:ANDROID_SDK_ROOT = $sdkPath
    $env:PATH = "$sdkPath\platform-tools;$sdkPath\tools;$sdkPath\tools\bin;" + $env:PATH
    
    Write-Host "`nSetting environment variables permanently..." -ForegroundColor Yellow
    
    # Set ANDROID_HOME permanently
    [System.Environment]::SetEnvironmentVariable('ANDROID_HOME', $sdkPath, 'User')
    [System.Environment]::SetEnvironmentVariable('ANDROID_SDK_ROOT', $sdkPath, 'User')
    
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
            Write-Host "  Adding to PATH: $pathToAdd" -ForegroundColor Gray
        }
    }
    
    [System.Environment]::SetEnvironmentVariable('Path', $currentPath, 'User')
    
    Write-Host "`n✓ ANDROID_HOME set to: $sdkPath" -ForegroundColor Green
    Write-Host "✓ ANDROID_SDK_ROOT set to: $sdkPath" -ForegroundColor Green
    Write-Host "✓ Added Android SDK tools to PATH" -ForegroundColor Green
    
    # Verify adb is accessible
    try {
        $adbVersion = & "$sdkPath\platform-tools\adb.exe" version 2>&1
        Write-Host "✓ ADB is working: $($adbVersion[0])" -ForegroundColor Green
    } catch {
        Write-Host "⚠ ADB found but may not be working correctly" -ForegroundColor Yellow
    }
    
    Write-Host "`n⚠ IMPORTANT: Restart your terminal/IDE for changes to take effect!" -ForegroundColor Yellow
    Write-Host "`nAfter restarting, run: npx expo start --android" -ForegroundColor Cyan
    
} else {
    Write-Host "✗ Android SDK not found in common locations" -ForegroundColor Red
    Write-Host "`nSearched locations:" -ForegroundColor Yellow
    foreach ($path in $possiblePaths) {
        if ($path) {
            Write-Host "  - $path" -ForegroundColor Gray
        }
    }
    
    Write-Host "`nYou have two options:" -ForegroundColor Yellow
    Write-Host "`n1. EASIEST: Use Expo Go app (no SDK needed):" -ForegroundColor Green
    Write-Host "   - Install Expo Go from Play Store on your Android phone"
    Write-Host "   - Run: npx expo start"
    Write-Host "   - Scan the QR code with Expo Go app"
    Write-Host "   - Or press 'a' in terminal if phone is connected via USB"
    
    Write-Host "`n2. Install Android Studio for emulator:" -ForegroundColor Green
    Write-Host "   - Download: https://developer.android.com/studio"
    Write-Host "   - Install with default settings"
    Write-Host "   - Open Android Studio and complete setup wizard"
    Write-Host "   - Go to Tools → SDK Manager and install:"
    Write-Host "     • Android SDK Platform-Tools"
    Write-Host "     • Android SDK Build-Tools"
    Write-Host "     • At least one Android SDK Platform (API 33+ recommended)"
    Write-Host "   - Then run this script again"
    
    Write-Host "`n3. If SDK is installed elsewhere:" -ForegroundColor Green
    Write-Host "   - Find your SDK path (should contain 'platform-tools\adb.exe')"
    Write-Host "   - Set it manually:"
    Write-Host "     [System.Environment]::SetEnvironmentVariable('ANDROID_HOME', 'YOUR_SDK_PATH', 'User')" -ForegroundColor Gray
}

