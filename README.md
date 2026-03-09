# Backdroply Mobile

Expo app for iOS/Android that connects to Backdroply backend APIs.

## Scope

- Google sign-in via Expo Auth Session
- Secure token storage via Expo Secure Store
- Session restore on app start
- User profile/token balance retrieval
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

- `apiBaseUrl` (example: `http://localhost:8080/api/v1`)
- `googleWebClientId`
- `googleAndroidClientId`
- `googleIosClientId`

## Notes

- Mobile login calls backend endpoint: `POST /api/v1/auth/google/mobile`
- Access token is stored under secure key: `backdroply_access_token`
- Project uses Expo prebuild for native folders; run `npm run prebuild:android` before release build to sync `app.json` fields (app name, icon, package identifiers).
