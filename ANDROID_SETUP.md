# Android Setup Guide

## Quick Fix: Use Expo Go (Recommended for Quick Testing)

You don't need Android SDK to test on Android! Use Expo Go app instead:

1. **Install Expo Go on your Android phone:**
   - Download from [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Start Expo:**
   ```bash
   npx expo start
   ```

3. **Connect your phone:**
   - Scan the QR code with Expo Go app
   - Or press `a` in the terminal to open on connected device

## Option 2: Install Android SDK for Emulator

If you want to use Android Emulator, follow these steps:

### Step 1: Install Android Studio

1. Download Android Studio from: https://developer.android.com/studio
2. Install it with default settings
3. Open Android Studio and go through the setup wizard

### Step 2: Install Android SDK

1. Open Android Studio
2. Go to **Tools → SDK Manager**
3. Install:
   - Android SDK Platform-Tools
   - Android SDK Build-Tools
   - At least one Android SDK Platform (API 33 or higher recommended)

### Step 3: Set Environment Variables (Windows)

1. Find your Android SDK location (usually: `C:\Users\YourName\AppData\Local\Android\Sdk`)

2. **Set ANDROID_HOME:**
   - Open PowerShell as Administrator
   - Run:
   ```powershell
   [System.Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Users\YourName\AppData\Local\Android\Sdk', 'User')
   ```

3. **Add to PATH:**
   - Add these to your PATH environment variable:
     - `%ANDROID_HOME%\platform-tools`
     - `%ANDROID_HOME%\tools`
     - `%ANDROID_HOME%\tools\bin`

4. **Restart your terminal/IDE** after setting environment variables

### Step 4: Create Android Virtual Device (AVD)

1. Open Android Studio
2. Go to **Tools → Device Manager**
3. Click **Create Device**
4. Choose a device (e.g., Pixel 5)
5. Download a system image (e.g., Android 13)
6. Finish setup

### Step 5: Start Emulator

1. Start the emulator from Android Studio Device Manager
2. Then run:
   ```bash
   npx expo start
   ```
3. Press `a` to open on Android emulator

## Verify Installation

Run this command to check if Android SDK is found:
```bash
npx expo-doctor
```

## Troubleshooting

- **"adb not found"**: Make sure `platform-tools` is in your PATH
- **"SDK not found"**: Check ANDROID_HOME points to correct location
- **Still not working**: Restart your computer after setting environment variables

