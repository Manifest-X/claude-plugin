---
name: manifest-native
description: "Manifest framework projects only: SKIP unless the project has a Manifest manifest.json (registering components or data) or a manifest.theme.css, or the user asked to build with Manifest. Use when the contributor wants their Manifest project as an app in a store or as a native app: iOS/iPadOS, Android, Mac, Windows, ChromeOS, or a desktop app. Triggers on \"make this an iOS app\", \"make this an Android app\", \"put it on the App Store\", \"Play Store\", \"Microsoft Store\", \"wrap as native\", \"package it as an app\", \"Capacitor\", \"PWABuilder\", \"TestFlight\", \"Guideline 4.2\", \"app got rejected\". Decides installable-PWA vs store packaging with the user, scaffolds Capacitor beside the web codebase, and runs the App Store review checklist. SKIP when the user only wants the site installable from the browser (home screen or dock icon, no store): that's manifest-deploy's \"PWA installability\"."
---

# Packaging a Manifest project as a native app

One codebase serves the website, the installed PWA and the packaged app. Native is a packaging layer **beside** the project, never a fork of it: no iOS-only copy, no second set of pages. Plugins already degrade to the web, and the [Device plugin](https://manifestx.dev/docs/framework/core-plugins/device) switches to Capacitor inside the app.

**Manifest configures the app; the user runs the native toolchain.** No Manifest tool builds, signs or submits an app, and you can't operate Xcode, Android Studio or the store consoles for the user.

## 1. Decide: installable PWA or store package

Ask the user these in one message, then recommend a path:

1. **What do they want?** An icon on phones and computers, or a listing in a store?
2. **Which stores?** App Store (iOS/iPadOS, Mac), Google Play (Android, ChromeOS), Microsoft Store.
3. **Do they have the accounts and the hardware?** An Apple Developer Program account and a Mac with Xcode for anything Apple. A Google Play Console account and Android Studio. A Microsoft Partner Center account. Each store may charge a developer fee; point them at its current terms and don't quote an amount.

| Want | Path |
|---|---|
| Icon on home screen or dock, no store | **Installable PWA.** No accounts, no review, and every publish updates it. Use **manifest-deploy** → "PWA installability" and stop here. |
| App Store (iPhone, iPad) | **Capacitor.** Required in practice: Apple rejects website wrappers under Guideline 4.2. |
| Google Play | **Capacitor** if you're also building for iOS or the app needs device features. Otherwise a **PWABuilder/Bubblewrap TWA**, packaged from the live URL. |
| Microsoft Store | **PWABuilder** MSIX from the live URL. |
| Mac App Store | The iOS Capacitor build, run on Mac through Mac Catalyst. The user sets this up in Xcode. Manifest hasn't tested it. |
| ChromeOS | The Android package. Play runs on Chromebooks. |
| Linux store, or a Mac/Windows/Linux app outside any store | No Manifest path. An installed PWA covers desktops. Snap, Flatpak and AppImage need a desktop runtime that Manifest doesn't provide, so don't scaffold one. |

PWABuilder can also produce an iOS package. Only offer it if the user insists, and warn them that it's the wrapper Guideline 4.2 rejects.

## 2. Who does what

| Claude | The user |
|---|---|
| Writes `capacitor.config.json`, the npm scripts, and the `.gitignore` and `.manifestignore` lines | Creates and pays for the developer accounts |
| Runs `npm install`, `npx --no-install cap add`, and `npm run app:build`, once the user agrees | Opens Xcode or Android Studio, sets the signing team or keystore, runs on a device |
| Adds device capabilities to the markup (`$share`, `$biometric`, `$push` …) | Turns on capabilities in Xcode: Push, Associated Domains, Background Modes |
| Edits `Info.plist` usage strings and `AndroidManifest.xml` | Creates the APNs key, and the Firebase project (`google-services.json`) for Android push |
| Drafts the privacy-manifest entries and the review notes | Adds `PrivacyInfo.xcprivacy` to the App target, archives, uploads to TestFlight or Play, writes the store listing |
| Runs the 4.2 checklist below | Submits for review and answers the reviewer |

For PWABuilder, all you do is make sure the PWA is install-ready and published (**manifest-deploy**). The user runs pwabuilder.com against the live URL.

## 3. Scaffold Capacitor (iOS and Android)

Run this from the project root. Node 22+ is needed (the Capacitor 8 CLI requires it), and for iOS also macOS with the latest Xcode. iOS uses Swift Package Manager by default, so CocoaPods isn't needed.

Before installing anything, list the packages for the user and ask. Installs download software onto their machine, and `cap add` / `cap sync` fetch CocoaPods or Swift packages and Gradle dependencies from the network.

**Check what already exists first.** If the project has a `capacitor.config.*`, an `ios/` or an `android/` folder, it's already wrapped: merge your changes into the existing files and never overwrite or re-add them. Skip `cap add` for a platform whose folder exists.

Run Capacitor's CLI as `npx --no-install cap …` and the assets tool as `npx --no-install @capacitor/assets …`. `--no-install` uses the project's own copy and never downloads a different package that happens to share the name.

1. **Install the runtime, the platforms the user chose, and the build tools:**
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android @capacitor/splash-screen @capacitor/status-bar
   npm install -D mnfst-render@^0.5.56 @capacitor/assets
   ```
   Drop `@capacitor/ios` or `@capacitor/android` for a platform they don't ship. This creates `package.json` and `node_modules/` if the project had neither. That's expected.
2. **Install the plugins for the capabilities you use.** Magics no-op when their plugin is missing:

   | Magic | Install |
   |---|---|
   | `$share` | `@capacitor/share` |
   | `$haptics` | `@capacitor/haptics` |
   | `$app`, `$links` | `@capacitor/app` |
   | `$device.online` | `@capacitor/network` |
   | `$camera` | `@capacitor/camera` |
   | `$push` | `@capacitor/push-notifications` |
   | `$secure` | `@aparajita/capacitor-secure-storage` |
   | `$biometric` | `@aparajita/capacitor-biometric-auth` or `@capgo/capacitor-native-biometric` |

   These are the plugins the magics speak to directly. No adapter or setup script is needed. They're used only inside the native app: in a browser, `$secure` stays on unencrypted `localStorage` and `$biometric.available()` is `false`, so test them on a simulator or device. `$secure` stores values under the plugin's default `capacitor-storage_` prefix. For a different secure-storage plugin, hand an object with async `get`, `set`, `remove`, `keys` and `clear` to `$secure.use(adapter)`.

3. **Write `capacitor.config.json`.** Take `appName` from `manifest.json` `short_name`, and the splash colour from `background_color`. Ask the user for `appId`, a reverse-DNS bundle id they own (`com.acme.app`). It can't be changed after the first store upload. Add a `"PushNotifications": { "presentationOptions": ["badge", "sound", "alert"] }` entry under `plugins` only if the app uses `$push`.
   ```json
   {
     "appId": "com.acme.app",
     "appName": "Project",
     "webDir": ".app-www",
     "server": { "androidScheme": "https" },
     "ios": { "contentInset": "never" },
     "plugins": {
       "SplashScreen": { "launchShowDuration": 600, "backgroundColor": "#FFFFFF", "showSpinner": false },
       "StatusBar": { "style": "DEFAULT", "overlaysWebView": true }
     }
   }
   ```
4. **Merge the build scripts into `package.json`.** Keep any scripts already there:
   ```json
   "scripts": {
     "app:web": "mnfst-render --out .app-www",
     "app:build": "npm run app:web && npx --no-install cap sync"
   }
   ```
   - The app ships a prerendered copy of the site, so the shell paints without a network.
   - Render into the dot-folder `.app-www`, never `website/`. A `website/` folder switches an SPA project's publish into render mode. Non-dot folders also get copied into later renders.
   - With a `capacitor.config.*` at the root, `mnfst-render` leaves `ios/`, `android/` and the Capacitor config out of its output, and an `--out` render leaves out the regular `website/` output. Older versions nest the native projects inside the app on every sync. 0.5.56+ also copies a root `.well-known/`. Keep the version pin.
5. **Keep native files out of git noise and out of the website.** Append these lines.

   `.gitignore`:
   ```
   node_modules/
   .app-www*
   ```
   `.manifestignore` (create it if it doesn't exist):
   ```
   /ios/
   /android/
   /capacitor.config.*
   /.app-www*
   /.app-assets/
   /package.json
   /package-lock.json
   ```
   `.manifestignore` only applies to Manifest hosting. With **Own host via GitHub** (or an external host), the host deploys what its build outputs: keep `ios/`, `android/`, `.app-www`, `.app-assets` and the Capacitor config out of that output (for example by publishing only the host's build output folder), and tell the user what you changed.

   Commit `ios/` and `android/`. Capacitor writes its own `.gitignore` inside each one for build output.
6. **Build the web copy, then add the platforms:** `npm run app:web`, then `npx --no-install cap add ios` and/or `npx --no-install cap add android`, only for platforms without a folder yet. After that, `npm run app:build` on every change.
7. **Usage strings and permissions.** The app crashes on first use without them.
   - `ios/App/App/Info.plist`:
     - `NSCameraUsageDescription` for `$camera`
     - `NSPhotoLibraryUsageDescription` for `$camera.pick()`
     - `NSFaceIDUsageDescription` for `$biometric`
   - Android: check `android/app/src/main/AndroidManifest.xml` for the permissions each installed plugin's README lists.
8. **Icons and splash.** Put a 1024×1024 `icon-only.png`, plus `splash.png` and `splash-dark.png` at 2732×2732, in `.app-assets/`. Then run `npx --no-install @capacitor/assets generate --assetPath .app-assets`. It replaces the icons and splash screens already in `ios/` and `android/`, so if the project has custom ones, ask before running it.
9. **Hand over** with the exact next step for each platform:
   - iOS: `npx --no-install cap open ios`, set the signing team, then run on a simulator or device.
   - Android: `npx --no-install cap open android`, then run.

**Deep links and push** need files on the live domain:
- iOS: `/.well-known/apple-app-site-association`, plus the user enables the Associated Domains capability.
- Android: `/.well-known/assetlinks.json` and an intent filter. The same file is needed for TWA packages.

Put both files in a `.well-known/` folder at the project root. It publishes in SPA and render projects alike: `mnfst-render` 0.5.56+ copies `.well-known/`, and no other dot-folder. Publish, then check each file with `curl -s https://<domain>/.well-known/<file>`. It must print the file's JSON. An SPA project answers a missing file with its HTML page and a 200, so a status check alone proves nothing. If the file is missing from a render project, check the installed `mnfst-render` version. Don't hand-place it in `/website/`.

## 4. Verify the wrap (first run)

Manifest has not yet proven the Capacitor wrap end to end on a device. The user's first simulator run is that proof, so ask them to check:

- The app launches with the branded splash and no white flash.
- In-app navigation reaches every route.
- A deep link opens the right route.
- Airplane-mode launch still shows the shell.

If routes break or the shell is blank, report it as a framework gap. Don't patch framework files inside the project.

Know the limits:
- Framework scripts load from the Manifest CDN, so the baked HTML paints offline but interactivity needs a first connection.
- Data doesn't persist across restarts unless the app stores it itself (`$persist`, `$secure`).
- **Publishing the website doesn't update the Capacitor app.** Web changes ship in a new store build: run `npm run app:build`, then the user archives and uploads. TWA and MSIX packages load the live site, so publishing does update them.

## 5. App Store review checklist (Guideline 4.2)

A valid build isn't an approved one. Run this before the user submits, and report each item as pass or fail.

**Feel native**
- [ ] Edge content clears the notch and home indicator with the safe-area utilities (`p-safe`, `pb-safe`, `--safe-*`).
- [ ] The viewport meta has `viewport-fit=cover`, so backgrounds run edge to edge. The starter ships it.
- [ ] Primary navigation is a `<nav dock>` bottom bar, not a web hamburger menu.
- [ ] Tappable UI suppresses the web tells: `no-tap-zoom`, `no-callout`, `no-select`, `no-overscroll`. Apply them to controls and app chrome, never to reading content.
- [ ] The branded splash and a theme-matched status bar mean launch never flashes white.

**Do something native**
- [ ] At least one real device capability through the Device plugin: Face ID (`$biometric`), push (`$push`), haptics, share or camera. If there's none, propose the one that fits the app.
- [ ] That capability is named in the review notes so the reviewer finds it. Draft the notes for the user.

**Payments**
- [ ] Physical goods and services may sell in the app through the [Payments plugin](https://manifestx.dev/docs/framework/core-plugins/payments).
- [ ] Digital goods and subscriptions used in the app must go through Apple In-App Purchase. Manifest has no In-App Purchase integration and no native Apple Pay adapter. If the app sells digital content, raise it with the user before they submit.

**Compliance**
- [ ] The user has read [Guideline 4.2](https://developer.apple.com/app-store/review/guidelines/#minimum-functionality) in full.
- [ ] `PrivacyInfo.xcprivacy` declares the data the app and its Capacitor plugins collect. Draft the entries; the user adds the file in Xcode.

## What not to do

- **Don't fork the codebase.** Use one project, with `$device.native` and the `native-only` / `web-only` classes for the few places the app differs.
- **Don't point `server.url` at the live site.** That's the website-in-a-wrapper Apple rejects. The app ships `.app-www`.
- **Don't promise what doesn't exist.** None of these exist:
  - Manifest-run builds, signing, or store submission
  - In-App Purchase or a native Apple Pay adapter
  - Native push/pop screen transitions (the router swaps pages)
  - Persistent offline data
  - A tested Mac Catalyst or Linux path
- **Don't run store-facing steps for the user.** Uploading, submitting, accepting agreements and paying fees are theirs.
- **Don't edit `/website/` or `.app-www/` by hand.** Both are regenerated.

## Further reading

- Native apps (paths per OS, Passing review): https://manifestx.dev/docs/framework/publishing/native-apps
- Web apps (PWA fields, install, offline): https://manifestx.dev/docs/framework/publishing/web-apps
- Device plugin (magics, Capacitor plugin mapping): https://manifestx.dev/docs/framework/core-plugins/device
- Capacitor: https://capacitorjs.com/docs · PWABuilder: https://www.pwabuilder.com
