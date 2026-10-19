# HimRishtey task checklist

Snapshot: 2026-10-16. `[x]` means the stated activity has evidence; `[ ]` means planned, unverified or blocked. Product work remains unchecked. Record command/device/environment, result and date when closing an implementation task. Phase acceptance and dependencies are in ROADMAP.md.

## Planning inspection

- [x] I.1 Inspect package.json, lockfile root metadata, local React/RN metadata and scripts; versions recorded in ARCHITECTURE.md.
- [x] I.2 Read app entry, starter screen/test, lint/Jest/Babel/Metro/TS configuration, README and Android native configuration; inventory iOS host and source files.
- [x] I.3 Search project source for API/auth/navigation implementation and contracts; none located outside starter references. No product features confirmed implemented.
- [x] I.4 Inspect Git status and available instructions; preserve existing App.tsx deletion/App.jsx addition. No prior planning files or ancestor AGENTS.md found in checked locations.
- [x] I.5 Create the four requested planning documents with explicit verification gates and unknowns.
- [x] I.6 User authorized implementation on 2026-10-19: “ok lets start building the project.”

## Phase 0 — Baseline and contracts

- [ ] T0.1 **Proposed first implementation task:** preserve App.jsx as entry; rename starter test to JavaScript, update stale App.tsx labels/references in starter UI and README, and assess/remove TS-only configuration/dev dependencies only after confirming no consumers. Keep product behavior unchanged. Acceptance: active app/test/docs use JavaScript consistently; lockfile matches any authorized manifest change. Verify lint, Jest and Android starter launch; document unavailable checks. No dependency installation in this planning pass.
- [x] T0.2 Record Node/npm/JDK/Android SDK availability and run `npm run lint`, `npm test -- --runInBand`, `cd android && ./gradlew assembleDebug`, then `npm run android` with Metro/device available. Capture failures before proposing fixes; do not mark baseline passed from an existing build directory.
- [ ] T0.3 Obtain backend specification or routes plus example payloads for every ARCHITECTURE.md contract row; record exact methods/paths/version, auth, error and pagination formats. Verify examples with authorized staging/test accounts; keep unavailable operations blocked.
- [ ] T0.4 Confirm login method, verification/recovery, registration fields/age/consent, profile privacy, interest transitions, entitlement rules and notification scope. Verify a written decision record against contracts.

## Phase 1 — Foundation

- [ ] T1.1 Review a compact design sample: theme tokens, button/input, member card and loading/empty/error states. Verify contrast, font scaling and Android touch/keyboard layout.
- [ ] T1.2 Review navigation/secure-storage options for current RN/new architecture and toolchain; add only required dependencies after implementation review. Verify Android build and native module smoke checks for additions.
- [ ] T1.3 Introduce theme/shared controls and root navigation incrementally. Verify Android back, safe areas, keyboard and signed-out route behavior.
- [ ] T1.4 Add public environment config and fetch adapter from confirmed contracts. Verify cancellation, timeout, malformed responses, field errors and auth failures without leaking secrets.

## Phase 2 — Authentication and registration

- [ ] T2.1 Implement login form and contract adapter. Verify valid/invalid credentials, field errors and repeated taps with fixtures and staging.
- [ ] T2.2 Implement secure credential persistence, bootstrap and guarded navigation. Verify cold start, offline restore, expiry and concurrent session failures.
- [ ] T2.3 Implement logout and account isolation. Verify revocation failure, local cleanup and late responses after logout/account switch.
- [ ] T2.4 Implement registration one confirmed step at a time, including consent/verification as required. Verify required fields, server errors, interruption and staging completion.
- [ ] T2.5 Implement recovery only if backend supports it. Verify invalid/expired challenges and completed recovery in staging; otherwise record explicit deferral.

## Phase 3 — Profiles

- [ ] T3.1 Implement read-only self/member profile adapters and screens. Verify missing fields, unavailable member and public/private permissions.
- [ ] T3.2 Add profile editing with confirmed lookups and validation. Verify failed save, successful refetch and keyboard/accessibility behavior.
- [ ] T3.3 Add contracted photo selection/upload/removal and moderation status. Verify denied permissions, interrupted upload and image privacy using test assets.

## Phase 4 — Discover/search

- [ ] T4.1 Build first-page member listing and detail navigation. Verify loading/empty/error/retry and staging data.
- [ ] T4.2 Add confirmed filters/sort and reset behavior. Verify rapid changes ignore stale results and request values match contracts.
- [ ] T4.3 Add pagination/refresh. Verify no duplicate members, final-page stop, failed-page retry and Android scroll behavior with representative data.

## Phase 5 — Interests/shortlist

- [ ] T5.1 Add shortlist list/add/remove. Verify repeated taps, failed changes and persistence after restart.
- [ ] T5.2 Add send interest and incoming/outgoing lists. Verify duplicate/limit/permission failures and cross-screen consistency.
- [ ] T5.3 Add supported accept/decline/cancel transitions individually. Verify state matrix and a two-account staging flow.

## Phase 6 — Memberships

- [ ] T6.1 Display confirmed plans, current membership and server entitlements. Verify currency/expiry and forbidden actions against backend.
- [ ] T6.2 Confirm purchase channel/provider, distribution requirements and backend verification/restore contract. Verify written integration decision before payment implementation.
- [ ] T6.3 Implement purchase lifecycle with sandbox accounts. Verify success, failure, cancellation, pending, duplicate callback and restart; never grant entitlement locally.
- [ ] T6.4 Implement restore/reconciliation. Verify entitlement against server after reinstall/account change using permitted sandbox flows.

## Phase 7 — Notifications/settings

- [ ] T7.1 Add notification feed/read state/count. Verify pagination, retry and count consistency against staging.
- [ ] T7.2 Add contracted privacy/preferences and supported account controls individually. Verify failed saves, persistence, reauthentication and deletion confirmation where applicable.
- [ ] T7.3 If push is in scope, configure provider/device registration and permission flow. Verify denied permission, token rotation and logout cleanup on Android.
- [ ] T7.4 Route notification destinations through auth/authorization. Verify foreground/background/cold start and missing/forbidden member destinations.

## Phase 8 — Release

- [ ] T8.1 Replace debug release signing through approved secret handling and configure release environments. Verify signed release installation and absence of embedded secrets; do not commit keys.
- [ ] T8.2 Audit private data/logs, transport, cache cleanup and permissions. Verify with test accounts and representative failure paths.
- [ ] T8.3 Run accessibility, slow/offline network and large-list performance checks on representative Android devices; record issues and resolution evidence.
- [ ] T8.4 Run final lint/Jest, release build and cross-feature staging smoke. Record device/API versions, results, deferred scope and release approval. iOS execution is deferred unless separately scoped.

## Verification ledger

| Activity | Result on 2026-10-16 |
| --- | --- |
| Static repository/package/configuration inspection | Completed; evidence summarized in ARCHITECTURE.md |
| Planning-document consistency and change scope | Completed: four files exist, phase 0–8 task sections present, no implementation tasks checked complete; Git status shows only these new documents plus the pre-existing App replacement; tracked diff whitespace check passed |
| Lint / Jest | Not run; pass/fail unknown |
| Android build / device launch | Not run; pass/fail unknown |
| Laravel/API integration | Not run; contracts/base URL unavailable in inspected repository |
| Product feature acceptance | Not verified; all implementation tasks open |

## Implementation evidence — 2026-10-19

- T0.1 in progress: preserved App.jsx unchanged; renamed starter test to `__tests__/App.test.jsx`; updated README entry reference and npm instructions. Added explicit Jest `test` import for JavaScript linting and a JSX Babel transform because the installed RN Jest preset only transforms js/ts/tsx. No dependencies installed or manifest/lockfile changes. TS-only tooling retained for a separate cleanup; no application TS source remains. Starter render test establishes mounting only.
- T0.2 environment: Node v22.22.1, npm 9.2.0, OpenJDK 17.0.20.1; ANDROID_HOME=/home/himrishtey/Android/Sdk, ADB 37.0.1, Gradle wrapper 9.4.1.
- `npm run lint`: PASS after explicit Jest global import.
- `npm test -- --runInBand`: PASS, 1 suite / 1 starter test after JSX transform fix. Initial failures were lint undefined `test` and Jest skipping JSX transformation.
- `cd android && ./gradlew assembleDebug`: PASS, BUILD SUCCESSFUL, 93 tasks (14 executed). First sandbox attempt could not write Gradle cache; authorized retry succeeded. Existing AGP/Gradle deprecation warnings remain.
- `adb devices -l` using SDK platform-tools: no connected devices. Sandbox daemon startup failed; authorized retry succeeded. `npm run android` and interactive starter smoke NOT RUN without a device/emulator; T0.1/T0.2 remain open pending launch verification and tooling cleanup assessment.
- `git diff --check`: PASS. Existing App.tsx deletion and App.jsx addition preserved; nothing staged or committed.
- T0.3/T0.4 remain blocked by absent backend contracts and product decisions. Next local increment: T1.1 compact design sample; no live API or auth behavior can be claimed.

### Emulator follow-up — 2026-10-19

- T0.2 complete: SDK `adb devices -l` found emulator-5554, sdk_gphone64_x86_64; CLI install identified Medium_Phone_API_37.0 (Android 17).
- `npm run android -- --no-packager`: PASS; BUILD SUCCESSFUL, installed on one emulator and launched com.himrishteyapp/.MainActivity.
- `npm start -- --no-interactive`: Metro started on port 8081 and bundled index.js. App restarted through ADB after starting Metro.
- `adb shell uiautomator dump` confirmed the foreground app renders “Welcome to React Native”, version 0.87.1, Hermes and “Open App.jsx to get started”. Starter launch smoke PASS; product functionality and accessibility remain unverified.
- Metro reports a dependency import fallback warning for ReactNativeFeatureFlags; bundling and rendering succeeded. Existing native build deprecation warnings remain.
- T0.1 launch gate is now satisfied; optional TS tooling cleanup remains deferred. Metro left running for development.
