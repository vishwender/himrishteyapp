# HimRishtey architecture plan

Planning snapshot: 2026-10-16. All future structure and library choices below are proposals pending review.

## Confirmed repository state

| Evidence | Finding |
| --- | --- |
| package.json / package-lock.json | React 19.2.3, RN 0.87.1, CLI 20.2.0; npm scripts for start/android/ios/lint/test; no Expo dependency |
| App.jsx / index.js | Registered starter screen, safe area provider and status bar; no product screens |
| __tests__/App.test.tsx / jest.config.js | One render test using react-test-renderer and RN Jest preset; execution unverified |
| Source inventory and API text search | No src directory, navigation, API client, backend source, OpenAPI/Postman contract or backend base URL found |
| Dependencies | Only React, RN, new-app-screen and safe-area-context at runtime; no declared navigation, secure storage, payment, push or server-cache library |
| Android configuration | min SDK 24, compile SDK 37, target SDK 36, build tools 37.0.0, Kotlin 2.2.0, Gradle wrapper 9.4.1; Hermes/new architecture/edge-to-edge enabled in properties |
| android/app/build.gradle | Release build points to debug signing; production signing unresolved |
| Native folders | Android Kotlin and iOS Swift hosts exist; build/run success is unknown |
| Git status | Existing deleted App.tsx and untracked App.jsx; preserved |

Authentication, registration, member profiles, discover/search, interests, shortlist, memberships, notifications and settings have no implementation located in inspected source. The README is starter documentation and still references App.tsx. Laravel REST APIs and premium matrimonial design are user requirements, not repository-confirmed implementations. Toolchain compatibility, installed SDKs, baseline test results and backend readiness remain unknown.

## Proposed source structure

Create folders only when their first behavior is implemented:

```text
App.jsx                         # small composition root
src/
  app/                          # providers and session bootstrap
  navigation/                   # root, auth and member navigators
  config/                       # public environment configuration
  theme/                        # colors, typography, spacing, radii
  components/                   # accessible shared UI and state views
  services/api/                 # transport, error normalization, contract adapters
  services/storage/             # secure credential adapter
  features/
    auth/                       # screens, hooks, services, validation
    registration/
    profiles/
    discover/
    interests/
    shortlist/
    memberships/
    notifications/
    settings/
  assets/                       # reviewed local assets
__tests__/                      # integration behavior; unit tests may be colocated
```

Use JavaScript/JSDoc where useful. Dependency direction: screens → feature hooks/services → shared transport/storage. Shared UI and transport must not import feature screens. Feature adapters translate confirmed backend representations into UI models; do not expose raw response envelopes throughout components.

## Navigation and state

Propose React Navigation with native stack and bottom tabs, subject to a focused compatibility review and later installation authorization. No navigation package is currently declared.

- Root shows session bootstrap until credential restoration and session validation resolve.
- Signed-out stack: welcome/login, registration steps and recovery/verification screens only if supported by the contract.
- Signed-in shell proposal: Discover, Interests, Shortlist and My Profile tabs. Member details, membership, notifications and settings open in a stack. Exact labels and registration gating require product review.
- Keep protected screens inaccessible after logout; reset navigation and account-specific caches. Queue deep-link destinations until authentication and authorization resolve; accept validated member IDs rather than full private profile objects in route params.
- Local hooks own transient screen/form state. Context plus reducer owns session state. Introduce a server-state library only when cache/pagination needs justify it; define ownership before adding it.

## Laravel integration: verification register

No route is confirmed. This table lists required operations, not invented endpoint paths. Every row is blocked for live integration until method/path, version/base URL, auth, examples, error schema and permissions are supplied or verified from backend contracts.

| Capability | Contract questions to resolve |
| --- | --- |
| Login/current session/logout | Identifier/password or OTP flow; bearer vs cookie auth; expiry, refresh, revocation and current-member response |
| Registration/recovery | Steps, required fields, enums/lookups, age rules, consent, verification, resume and reset behavior |
| Member profiles | Self vs public fields, edit permissions, photo upload/removal, moderation, privacy and completion rules |
| Discover/search | Filters, lookup values, sorting, pagination envelope, visibility and blocked/deleted members |
| Interests | Send/list/accept/decline/cancel operations, state machine, duplicate rules and entitlement limits |
| Shortlist | List/add/remove, idempotency and pagination |
| Memberships | Plans/currency, entitlements, expiry, purchase channel, payment verification and restore/reconciliation |
| Notifications | Feed/read state/count, push provider, device registration/removal, preferences and deep-link payloads |
| Settings | Privacy/preferences, password/account deletion if supported, reauthentication and retention rules |

Start with built-in fetch behind a small adapter unless requirements justify another HTTP library. Centralize base URL, headers, timeout/cancellation, JSON/multipart handling and error mapping. Reject missing configuration explicitly. Treat Laravel 422 field errors and 401/403/429 as cases to confirm, not a guaranteed response format. Do not assume a `data` envelope, numeric IDs, Sanctum or refresh endpoint. Automatically retry only safe operations with a bounded policy; never blindly retry purchases or interest submissions.

Keep public environment configuration separate from secrets. Confirm Android emulator and device access to staging, and HTTPS behavior without loosening production transport policy. Mocks must be marked as fixtures derived from a versioned contract; staging smoke tests are a separate gate.

## Authentication and private data

Proposed states: bootstrapping, signedOut, authenticating, signedIn and recoverable bootstrap error. A transient network failure during restore must not silently appear as a verified session or unnecessarily delete credentials. Confirm the server's validity/expiry semantics before implementing this distinction.

If bearer tokens are confirmed, store them through a reviewed Android Keystore/iOS Keychain-backed library; keep active credentials in the session layer and inject them at transport time. If cookies are required, revisit cookie/CSRF and persistence architecture first. No secure-storage library is selected or installed.

On confirmed expiry, coordinate one refresh attempt only if the backend supports refresh; prevent concurrent refresh storms and stale responses restoring an old session. On logout, clear local credentials, navigation and private caches even if revocation fails, and explain any server-side failure. Account changes must isolate in-flight requests and cached data. Avoid persisting member photos, contact details and registration drafts by default. Backend privacy and membership checks are authoritative; UI gates only explain access.

## Design and delivery boundaries

Premium styling proposal: restrained palette, consistent spacing, clear typography, portrait-led member cards and calm hierarchy. Brand colors, fonts, imagery rights, supported languages and final layouts need review. Define tokens before feature screens; verify font scaling, contrast, touch targets, safe areas, keyboard and Android back navigation.

In-app notifications precede optional push infrastructure. Membership plan display precedes purchase implementation; payment provider and applicable distribution requirements must be verified at implementation time. Do not simulate a successful entitlement on the client.

Use feature-level tests plus Android smoke checks as detailed in ROADMAP.md. Release signing, environment separation, privacy review and a release-build test are release gates, not starter capabilities. Preserve the iOS host; iOS execution remains a separate deferred verification scope.

## Baseline update — 2026-10-19

Implementation is authorized. Starter test now uses `__tests__/App.test.jsx`; Jest configuration explicitly transforms JSX alongside JS/TS because the installed preset omits JSX. README references App.jsx and npm. App.jsx and native configuration remain unchanged. TypeScript configuration/dev dependencies remain pending a separate cleanup decision.

Lint and the single starter render test pass. Android `assembleDebug` passes with existing deprecation warnings; this is an incremental build, not proof of a clean environment or runtime behavior. Node v22.22.1, npm 9.2.0, JDK 17.0.20.1, Gradle 9.4.1 and SDK platform-tools 37.0.1 were observed. No device is connected, so Android launch/accessibility checks remain unverified. Backend contracts remain unavailable. See TASKS.md for command evidence.

Emulator follow-up on 2026-10-19: `npm run android -- --no-packager` installed and launched successfully on emulator-5554 (Medium_Phone_API_37.0, x86_64). Metro bundled index.js; UI inspection confirmed the RN 0.87.1 starter, App.jsx label and Hermes. T0.2 baseline is complete; this does not verify product features or accessibility. Metro remains running for development.
