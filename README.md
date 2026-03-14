# Backdroply Mobile

Expo app for iOS/Android that connects to Backdroply backend APIs.

## Scope

- Google sign-in via Expo Auth Session
- Secure token storage via Expo Secure Store
- Session restore on app start
- Studio flow: pick image/video, choose quality, process via backend
- Token cost visibility on action button
- Billing catalog + purchase intent start
- Processing history + My Media listing
- Legal page shortcuts with language preservation (`tr/en`)
- Output download/share from mobile
- Sign out and account deletion actions

## Local Development

Requirements:

- Node.js 20+
- Expo CLI (via `npx expo`)

Run:

```bash
npm install
npx expo start
```

Health check:

```bash
npm run doctor
```

Android release build:

```bash
npm run build:android:release
```

APK output:

`android/app/build/outputs/apk/release/app-release.apk`

## Runtime Config (app.json -> expo.extra)

- `apiBaseUrl` (production, HTTPS required in release builds)
- `webBaseUrl` (production, HTTPS required in release builds)
- `apiBaseUrlDev` (development fallback, e.g. `http://localhost:8080/api/v1`)
- `webBaseUrlDev` (development fallback, e.g. `http://localhost:5173`)
- `googleWebClientId`
- `googleAndroidClientId`
- `googleIosClientId`
- `supportEmail` (store support contact)
- `kvkkEmail` (data subject request channel)
- `supportPhone` (optional)
- `supportKep` (optional)
- `dataDeletionUrl` (public deletion/privacy endpoint)

In release builds, app startup enforces HTTPS for `apiBaseUrl` and `webBaseUrl`. If HTTP is configured, sign-in/processing is blocked.

## Notes

- Mobile login calls backend endpoint: `POST /api/v1/auth/google/mobile`
- Access token is stored under secure key: `backdroply_access_token`
- For real device tests, do not use `localhost`. Use your LAN IP for `apiBaseUrl` and `webBaseUrl` (for example `http://192.168.1.10:8080/api/v1`).
- Project uses Expo prebuild for native folders; run `npm run prebuild:android` before release build to sync `app.json` fields (app name, icon, package identifiers).
- For Google Play / App Store listing compliance, keep `supportEmail` and `dataDeletionUrl` aligned with your published store metadata.

## Store Compliance Checklist

Before submitting to Google Play / App Store:

1. Set support email in store listing exactly as `supportEmail`.
2. Set data deletion URL in store listing exactly as `dataDeletionUrl`.
3. Verify in-app legal/help screen shows support + KVKK emails and deletion link.
4. Verify account deletion flow exists and is reachable from app UI.
