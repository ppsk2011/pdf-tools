# Android App Deployment Guide

PDFTools can be deployed as a native Android app using **Capacitor** — the same toolchain used for iOS. The React web app runs inside an Android `WebView`, and Capacitor plugins give access to native APIs (filesystem, share sheet, notifications).

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Architecture overview](#2-architecture-overview)
3. [Step 1 — Install Capacitor](#3-step-1--install-capacitor)
4. [Step 2 — Build the web app](#4-step-2--build-the-web-app)
5. [Step 3 — Add Android platform](#5-step-3--add-android-platform)
6. [Step 4 — Open in Android Studio](#6-step-4--open-in-android-studio)
7. [Step 5 — Configure the app](#7-step-5--configure-the-app)
8. [Step 6 — Run on a device / emulator](#8-step-6--run-on-a-device--emulator)
9. [Step 7 — Generate a signed APK / AAB](#9-step-7--generate-a-signed-apk--aab)
10. [Step 8 — Publish to Google Play](#10-step-8--publish-to-google-play)
11. [Alternative — Sideload APK (no Play Store)](#11-alternative--sideload-apk)
12. [Automated builds with GitHub Actions](#12-automated-builds-with-github-actions)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Prerequisites

| Requirement | Notes |
|---|---|
| **Android Studio Hedgehog** (2023.1+) | Free at [developer.android.com/studio](https://developer.android.com/studio) |
| **JDK 17+** | Bundled with Android Studio |
| **Android SDK API 34** | Install via Android Studio SDK Manager |
| **Node.js 20+** | For Capacitor CLI |
| **Google Play Developer account** | One-time $25 USD registration fee |

Android Studio runs on **Windows, macOS, and Linux** — no Mac required!

---

## 2. Architecture Overview

```
React + TypeScript (web app)
         │
         │  npm run build  →  frontend/dist/
         │
    Capacitor CLI
         │
         │  npx cap add android
         │  npx cap sync
         │
    android/ folder (Gradle project)
         │
         │  Android Studio → Build → Generate Signed Bundle/APK
         │
    .aab file → Google Play Console
         │
    Google Play → Users
```

---

## 3. Step 1 — Install Capacitor

If not already done from the iOS guide:

```bash
# From repository root
npm install @capacitor/core @capacitor/cli

npm install @capacitor/android \
            @capacitor/browser \
            @capacitor/share \
            @capacitor/filesystem \
            @capacitor/local-notifications
```

---

## 4. Step 2 — Build the Web App

```bash
cd frontend
VITE_API_URL=https://api.yourdomain.com npm run build
cd ..
```

Run this every time you update the frontend before syncing.

---

## 5. Step 3 — Add Android Platform

```bash
# Add Android project (run once)
npx cap add android

# Copy web assets + install plugins into Android project
npx cap sync android
```

This creates an `android/` directory — a standard Gradle/Android Studio project.

---

## 6. Step 4 — Open in Android Studio

```bash
npx cap open android
```

Android Studio opens. Gradle will sync (takes 1–3 minutes on first open).

---

## 7. Step 5 — Configure the App

### Application ID & display name

Edit `android/app/build.gradle`:

```groovy
android {
    defaultConfig {
        applicationId "com.yourcompany.pdftools"   // ← change this
        minSdkVersion 24
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
}
```

Edit `android/app/src/main/res/values/strings.xml`:

```xml
<resources>
    <string name="app_name">PDFTools</string>
    <string name="title_activity_main">PDFTools</string>
    <string name="package_name">com.yourcompany.pdftools</string>
    <string name="custom_url_scheme">com.yourcompany.pdftools</string>
</resources>
```

### App icon

1. In Android Studio, right-click `app/src/main/res` → **New → Image Asset**.
2. Icon type: **Launcher Icons (Adaptive and Legacy)**.
3. Source: your 1024×1024 icon PNG.
4. Click **Next → Finish**.

This generates all required densities (`mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`).

### Permissions

Edit `android/app/src/main/AndroidManifest.xml` to add any needed permissions:

```xml
<!-- Internet (required) -->
<uses-permission android:name="android.permission.INTERNET" />

<!-- Save files to Downloads -->
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
    android:maxSdkVersion="28" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
    android:maxSdkVersion="32" />

<!-- Post notifications (Android 13+) -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### Splash screen

Edit `android/app/src/main/res/values/styles.xml`:

```xml
<style name="AppTheme.NoActionBarLaunch" parent="AppTheme.NoActionBar">
    <item name="android:background">@drawable/splash</item>
</style>
```

Place your `splash.png` in `android/app/src/main/res/drawable/`.

---

## 8. Step 6 — Run on a Device / Emulator

### Physical device

1. Enable **Developer Options** on your Android phone:
   Settings → About Phone → tap **Build Number** 7 times.
2. Enable **USB Debugging** in Developer Options.
3. Connect via USB.
4. In Android Studio, select your device from the toolbar and press **Run ▶**.

### Emulator

1. Android Studio → **Device Manager → Create Virtual Device**.
2. Choose a Pixel device profile (e.g., Pixel 7).
3. System image: **API 34 (Android 14)**.
4. Run.

### Via CLI

```bash
npx cap run android                           # first connected device
npx cap run android --target emulator-5554   # specific emulator
```

---

## 9. Step 7 — Generate a Signed APK / AAB

Google Play requires an **Android App Bundle (.aab)** — it's smaller than an APK because Play generates optimised APKs per device.

### Create a keystore (one time)

```bash
keytool -genkey -v \
  -keystore pdftools-release.keystore \
  -alias pdftools \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# You'll be prompted for: keystore password, name, org, location
```

> **⚠️ Store this keystore file and passwords safely.** You cannot update your app on Google Play without the same keystore. Keep a backup in a password manager and secure cloud storage.

### Configure signing in Gradle

Edit `android/app/build.gradle`:

```groovy
android {
    signingConfigs {
        release {
            storeFile file('../pdftools-release.keystore')
            storePassword System.getenv("KEYSTORE_PASSWORD") ?: "yourpassword"
            keyAlias "pdftools"
            keyPassword System.getenv("KEY_PASSWORD") ?: "yourpassword"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'),
                          'proguard-rules.pro'
        }
    }
}
```

### Build the AAB

In Android Studio:
1. **Build → Generate Signed Bundle / APK**
2. Select **Android App Bundle**
3. Choose your keystore, enter passwords
4. Select **release** build variant
5. Finish — find your `.aab` at `android/app/release/app-release.aab`

Or via command line:

```bash
cd android
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

---

## 10. Step 8 — Publish to Google Play

### 10a. Create your app in Play Console

1. Go to [play.google.com/console](https://play.google.com/console).
2. **Create app → App name**: PDFTools.
3. App type: **App**, category: **Productivity**.
4. Complete the setup checklist.

### 10b. Upload your AAB

1. **Testing → Internal testing → Create new release**.
2. Upload `app-release.aab`.
3. Release notes (What's new): "Initial release".
4. Save.

### 10c. Required store listing assets

| Asset | Size |
|---|---|
| App icon | 512×512 px PNG (no transparency) |
| Feature graphic | 1024×500 px |
| Phone screenshots | Min 2, max 8 (320–3840 px, 16:9 or 9:16) |
| 7" tablet screenshots | Optional but recommended |
| Short description | Max 80 characters |
| Full description | Max 4000 characters |

### 10d. Content rating

Complete the questionnaire in **Policy → App content → Content rating**. PDFTools is rated **Everyone**.

### 10e. Data safety form

In **Policy → App content → Data safety**:
- Data collected: **None** (files are processed server-side and deleted)
- Data shared: **None**
- Security practices: check "Data is encrypted in transit"

### 10f. Submit for review

1. **Production → Create new release** (after internal/closed testing).
2. Upload the same AAB.
3. Submit — review takes **1–3 business days** for new apps.

---

## 11. Alternative — Sideload APK

If you don't want to use Google Play, you can distribute a plain APK directly:

```bash
cd android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

Host the `.apk` file on your website and link to it. Users must enable **"Install from Unknown Sources"** in their device settings.

> **Note**: This bypasses Play Store protections. Use only for internal / enterprise distribution.

---

## 12. Automated Builds with GitHub Actions

Add this workflow to build a signed AAB on every push to `main`:

```yaml
# .github/workflows/android-build.yml
name: Android Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Build frontend
        run: |
          cd frontend
          npm ci
          VITE_API_URL=${{ secrets.VITE_API_URL }} npm run build

      - name: Install Capacitor
        run: npm ci

      - name: Sync Android
        run: npx cap sync android

      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Decode keystore
        run: |
          echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 --decode \
            > android/pdftools-release.keystore

      - name: Build AAB
        env:
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
        run: |
          cd android
          ./gradlew bundleRelease

      - name: Upload AAB artifact
        uses: actions/upload-artifact@v4
        with:
          name: app-release
          path: android/app/build/outputs/bundle/release/app-release.aab
```

Required **GitHub Secrets**:
| Secret | Value |
|---|---|
| `KEYSTORE_BASE64` | `base64 pdftools-release.keystore` |
| `KEYSTORE_PASSWORD` | Your keystore password |
| `KEY_PASSWORD` | Your key password |
| `VITE_API_URL` | `https://api.yourdomain.com` |

---

## 13. Troubleshooting

| Problem | Fix |
|---|---|
| **Gradle sync failed** | File → Invalidate Caches / Restart, then sync again |
| **"INSTALL_FAILED_UPDATE_INCOMPATIBLE"** | Uninstall the old version from the device first |
| **White screen** | Check Logcat — usually a CORS error or wrong `VITE_API_URL` |
| **Mixed content error** | API must be HTTPS; check `android:usesCleartextTraffic` in manifest |
| **App crashes on launch** | Enable WebView debugging: `WebView.setWebContentsDebuggingEnabled(true)`, inspect via `chrome://inspect` |
| **Keystore lost** | Cannot recover — you'd need a new app listing. Store it in 3+ places! |
| **Play Store rejects update** | Ensure `versionCode` is incremented in `build.gradle` |
