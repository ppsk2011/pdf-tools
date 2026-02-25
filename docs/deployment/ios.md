# iOS App Deployment Guide

PDFTools can be deployed as a native iOS app using **Capacitor** — a cross-platform runtime that wraps the existing React web app in a native WebView. The result is a real `.ipa` file you can submit to the App Store.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Architecture overview](#2-architecture-overview)
3. [Step 1 — Install Capacitor](#3-step-1--install-capacitor)
4. [Step 2 — Build the web app](#4-step-2--build-the-web-app)
5. [Step 3 — Add iOS platform](#5-step-3--add-ios-platform)
6. [Step 4 — Open in Xcode](#6-step-4--open-in-xcode)
7. [Step 5 — Configure the app in Xcode](#7-step-5--configure-the-app-in-xcode)
8. [Step 6 — Run on a real device](#8-step-6--run-on-a-real-device)
9. [Step 7 — Archive and submit to App Store](#9-step-7--archive-and-submit-to-app-store)
10. [App Store review tips](#10-app-store-review-tips)
11. [Over-the-Air updates (no re-submission)](#11-over-the-air-updates)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Prerequisites

| Requirement | Notes |
|---|---|
| **Mac computer** | Xcode only runs on macOS |
| **Xcode 15+** | Download from Mac App Store (free) |
| **Apple Developer account** | $99 USD/year at [developer.apple.com](https://developer.apple.com) |
| **Node.js 20+** | Required for Capacitor CLI |
| **CocoaPods** | `sudo gem install cocoapods` |
| **iOS 15+ device** *(optional)* | For physical device testing |

> **No Mac?** Use [MacStadium](https://macstadium.com) (cloud Mac), [GitHub Actions macOS runners](https://docs.github.com/en/actions/using-github-hosted-runners), or [Codemagic CI/CD](https://codemagic.io) for building without owning a Mac.

---

## 2. Architecture Overview

```
React + TypeScript (web app)
         │
         │  npm run build  →  frontend/dist/
         │
    Capacitor CLI
         │
         │  npx cap add ios
         │  npx cap sync
         │
    ios/ folder (Xcode project)
         │
         │  Xcode → Archive → App Store Connect
         │
    App Store → TestFlight → Users
```

The React app runs inside a `WKWebView` and calls the same Node.js API (`https://api.yourdomain.com`). No code changes are needed for the app logic — only native wrappers for file saving, sharing, and notifications.

---

## 3. Step 1 — Install Capacitor

From the **repository root**:

```bash
# Install Capacitor core + CLI
npm install @capacitor/core @capacitor/cli

# Install native plugins you'll use
npm install @capacitor/ios \
            @capacitor/browser \
            @capacitor/share \
            @capacitor/filesystem \
            @capacitor/local-notifications

# Initialise Capacitor (if not already done — capacitor.config.ts exists)
# npx cap init "PDFTools" "com.yourcompany.pdftools" --web-dir frontend/dist
```

> `capacitor.config.ts` is already committed to this repo — just update `appId` to your own reverse-domain identifier.

---

## 4. Step 2 — Build the Web App

```bash
cd frontend
VITE_API_URL=https://api.yourdomain.com npm run build
cd ..
```

Every time you make frontend changes you must re-run this step before syncing.

---

## 5. Step 3 — Add iOS Platform

```bash
# Add the iOS native project (only run once)
npx cap add ios

# Sync web assets + plugins into the native project
npx cap sync ios
```

This creates an `ios/` directory containing a complete Xcode project.

---

## 6. Step 4 — Open in Xcode

```bash
npx cap open ios
```

Xcode opens with the `App` project. Wait for Swift Package Manager / CocoaPods to finish downloading dependencies.

---

## 7. Step 5 — Configure the App in Xcode

### Bundle Identifier & Display Name

1. In the Project Navigator, click **App** (the top-level project).
2. Select the **App** target → **General** tab.
3. Set **Bundle Identifier** → `com.yourcompany.pdftools`
4. Set **Display Name** → `PDFTools`
5. Set **Version** → `1.0.0` and **Build** → `1`

### App Icons

1. Select **Assets.xcassets → AppIcon**.
2. Drag your icon images into the slots (or use an online generator like [appicon.co](https://appicon.co) to generate all sizes from a 1024×1024 PNG).
3. Required sizes: 20pt, 29pt, 40pt, 60pt (all @1x/@2x/@3x), 1024pt @1x.

### Launch Screen

Customize `LaunchScreen.storyboard` or replace it with a simple branded screen.

### Capabilities (if needed)

| Feature | Capability to add |
|---|---|
| File saving to Photos | `NSPhotoLibraryAddUsageDescription` in `Info.plist` |
| Camera (for scanning) | `NSCameraUsageDescription` |
| iCloud Drive sync | iCloud Documents |

---

## 8. Step 6 — Run on a Real Device

1. Connect your iPhone via USB.
2. Select your device from the scheme selector at the top.
3. In **Signing & Capabilities**, add your Apple Developer team.
4. Press **⌘R** (or the Play button) to build and install.

### Run via CLI

```bash
npx cap run ios --target "iPhone 15 Pro"    # simulator
npx cap run ios                              # first connected device
```

---

## 9. Step 7 — Archive and Submit to App Store

### 9a. Create App Record in App Store Connect

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com).
2. **My Apps → + → New App**.
3. Platform: **iOS**
4. Bundle ID: `com.yourcompany.pdftools`
5. Fill in name, primary language, SKU.

### 9b. Archive in Xcode

1. Select **Any iOS Device (arm64)** as the build target.
2. **Product → Archive**.
3. Xcode builds a release archive and opens the Organizer window.

### 9c. Upload to App Store Connect

1. In Organizer, click **Distribute App**.
2. Choose **App Store Connect → Upload**.
3. Follow the wizard (App Thinning, Bitcode, etc.).
4. Submit.

### 9d. TestFlight (Beta Testing)

Before public release, distribute to testers via TestFlight:
1. In App Store Connect → TestFlight → Internal Testing → Add build.
2. Invite testers by email — they install TestFlight and receive a link.

### 9e. Submit for Review

1. App Store Connect → App → 1.0 Prepare for Submission.
2. Fill in screenshots (6.7" required), description, keywords, privacy policy URL.
3. Submit for review.
4. Review typically takes **1–3 business days**.

### Required assets

| Asset | Size |
|---|---|
| App icon | 1024×1024 px (no transparency) |
| iPhone 6.7" screenshot | 1290×2796 px |
| iPhone 6.1" screenshot | 1179×2556 px |
| iPad Pro 12.9" screenshot | 2048×2732 px *(required if iPad support on)* |

---

## 10. App Store Review Tips

- **Privacy Policy URL**: Required. Use a simple one-page policy (e.g., [app-privacy-policy-generator](https://app-privacy-policy-generator.nisrulz.com/)).
- **File handling**: Clearly describe in your app description that files are deleted after 30 minutes.
- **No login required**: Mention this — Apple reviewers appreciate privacy-respecting apps.
- **Age rating**: 4+ (no objectionable content).
- **In-app purchases**: The donation feature via Stripe Payment Links opens in Safari (not an in-app purchase), so Apple does **not** take a 30% cut. Make sure the donate button opens a browser and does **not** process payment inside the app — otherwise you must use StoreKit.

---

## 11. Over-the-Air Updates

With Capacitor, you can update the **web layer** (React JS/CSS) without re-submitting to the App Store, using [Capgo](https://capgo.app) or [Ionic AppFlow](https://ionic.io/appflow):

```bash
npm install @capgo/capacitor-updater

# In your CI pipeline after a frontend build:
npx @capgo/cli upload --apikey YOUR_KEY
```

Native code changes (new permissions, new plugins) still require App Store resubmission.

---

## 12. Troubleshooting

| Problem | Fix |
|---|---|
| **CocoaPods not found** | `sudo gem install cocoapods` then `npx cap sync ios` |
| **"No provisioning profile"** | Xcode → Signing & Capabilities → enable Automatically manage signing + select your team |
| **White screen on device** | Check that `VITE_API_URL` points to an HTTPS endpoint the device can reach |
| **App rejected: guideline 2.1** | Add a privacy policy URL in App Store Connect |
| **Large binary warning** | Enable bitcode and app thinning in Archive settings |
| **WebView not loading** | Check `Info.plist` for `NSAppTransportSecurity` — API must be HTTPS in production |
