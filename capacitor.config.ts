import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // ─── App identity ─────────────────────────────────────────────────────────
  // Change "com.yourcompany.pdftools" to your own reverse-domain bundle ID.
  // This value is used as:
  //   • iOS Bundle Identifier (Xcode → General → Bundle Identifier)
  //   • Android Application ID (build.gradle → applicationId)
  appId: 'com.yourcompany.pdftools',
  appName: 'PDFTools',

  // ─── Web source ───────────────────────────────────────────────────────────
  // Points to the Vite production build output.
  webDir: 'frontend/dist',

  // ─── Bundled JS server (Capacitor Live Updates / local server) ────────────
  server: {
    // During development with `npx cap run ios --livereload` this URL is used
    // so the app talks to your local Vite dev server instead of the bundle.
    // Remove / leave undefined for production builds.
    // url: 'http://192.168.1.X:3000',
    cleartext: false, // disallow plain HTTP in production
  },

  // ─── iOS-specific ─────────────────────────────────────────────────────────
  ios: {
    // Minimum iOS version (iOS 15 supports most modern WebKit APIs)
    minVersion: '15.0',
    // Scroll behaviour: native (default) gives rubber-band feel
    contentInset: 'automatic',
    // Prevent screenshots of sensitive PDF content in app-switcher
    // preventScreenCapture: true,  // uncomment if needed
  },

  // ─── Android-specific ─────────────────────────────────────────────────────
  android: {
    // Minimum Android SDK version (API 24 = Android 7.0)
    minSdkVersion: 24,
    // Target latest stable SDK
    targetSdkVersion: 34,
    // Allow cleartext traffic only in debug builds (handled by network-security-config)
    allowMixedContent: false,
    // Large files need adjusted WebView settings
    webContentsDebuggingEnabled: false, // set to true when debugging
  },

  // ─── Plugins ──────────────────────────────────────────────────────────────
  plugins: {
    // Browser plugin: used for opening Stripe payment links in-app
    Browser: {
      androidWindowName: 'PDFTools',
    },
    // Share plugin: lets users share the processed PDF via OS share sheet
    Share: {},
    // Local notifications: notify user when heavy job finishes in background
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#ef4444',
    },
    // Filesystem plugin: save processed PDFs to device Downloads folder
    Filesystem: {
      // Android: use DOCUMENTS directory
      // iOS: uses the app's Documents folder (accessible in Files.app)
    },
  },
};

export default config;
