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

### T3.1 / T5.1 member profile error fix — 2026-10-21

- Cause: empty `src/api/shortlistApi.js` exported none of the functions called by the profile screen. The synchronous undefined-function error escaped status loading and replaced the loaded profile with an error.
- Added explicit unavailable shortlist operations pending a confirmed backend contract; no endpoints or successful mutations invented. Wrapped status calls in independent promise callbacks so synchronous failures also remain local to the affected action.
- Acceptance verified by `__tests__/MemberProfileScreen.test.jsx`: a loaded member and send-interest action remain visible when the real shortlist adapter rejects as unavailable; interest status still loads for the member ID.
- `npm run lint`: PASS, 0 errors / 11 existing warnings. `npm test -- --runInBand`: profile regression PASS; full run FAIL because the starter App test cannot parse React Navigation's ESM export. Unrelated Jest setup left unchanged.
- `cd android && ./gradlew assembleDebug`: PASS after authorized retry for sandbox Gradle-cache restrictions; existing native deprecation warnings remain. `git diff --check`: PASS.
- ADB detected emulator-5554, but the current UI snapshot was not on Member Profile; live profile smoke and backend verification remain unverified. T3.1 and T5.1 remain open, including the missing shortlist contract.

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

### T1.1 / T1.3 icon consistency — 2026-10-23

- Replaced decorative text/emoji icons with the existing Lucide library in tabs, Discover, member profile, account menus, profile edit menu, photo placeholder, wallet transactions, membership expansion and visibility controls. Added shared AppIcon sizing/stroke/color handling; shortlist consistently uses bookmarks and accessible labels describe the action.
- Acceptance: shared outline icons and consistent shortlist meaning in source. No dependencies added; existing feature work preserved.
- Babel parsing: PASS for all 49 source JS/JSX files. Targeted ESLint checked edited icon components/screens; full `npm run lint` FAIL with 9 existing non-icon errors (duplicate wallet keys and hook dependencies), 2 warnings.
- `npm test -- --runInBand`: FAIL at dependency parsing: existing React Navigation ESM issue and Lucide ESM now reached by MemberProfileScreen. Jest dependency transform configuration remains unresolved; no passing test claim.
- `git diff --check`: reports a pre-existing trailing blank line in src/api/homeApi.js, outside icon edits. Android build and emulator visual/safe-area checks NOT RUN; T1.1/T1.3 remain open pending visual verification.

### T2.2 / T5.2 logged-in activation lookup — 2026-10-23

- Normalize direct/member/user/data session envelopes in AuthContext. Home and Member Profile now consume one context-owned canSendInterest value.
- Preserve login active only when /profile omits that field and both responses identify the same member; explicit No/null overrides previous activation. Refresh uses the same normalization. No status copied between accounts, no endpoint/config changes, no new credential persistence.
- `npm test -- --runInBand __tests__/sessionMember.test.js`: PASS, 11 tests covering response envelopes, missing activation, explicit denial and account isolation.
- Targeted ESLint for session helper/context, Member Profile and new tests: PASS. Babel parsing of context and both screens: PASS.
- Live account activation and Android smoke NOT RUN. Cold restore still requires /profile to return active; no login member metadata is persisted. Existing full-suite ESM and unrelated lint blockers remain; tasks stay open pending live verification.

### T0.3 / T2.2 activation contract correction — 2026-10-23

- Located the actual local API: Docker ddev-production-web maps host 32769 to /home/himrishtey/Documents/production/gallpakki.com. Read source only; no backend/database edits.
- Verified ProfileController::memberData and AuthController login response omit active. The prior client fallback cannot fix an absent field in both responses.
- Confirmed existing authenticated GET /api/v1/profile/visibility route and ProfileVisibilityController::visibilityData return `{success:true,data:{active:"Yes",is_active:true,is_hidden:false,...}}`; active comes directly from the authenticated member, independent of profile hiding. Uses existing Bearer token and X-App-Code header. No mutation is required.
- getMyProfile now obtains active from GET /profile/visibility when absent from GET /profile, on login, restore and refresh. Explicit profile active takes precedence. Missing/failed activation retrieval rejects instead of silently labeling the account inactive.
- Added profile adapter regression checks for active/inactive values, visibility independence, explicit profile status, malformed response and network failure. Live authenticated account smoke remains unverified; refresh Account to fetch the corrected session status.

### T5.2 / T5.3 interest lifecycle and cross-screen verification — 2026-10-23

- Added `__tests__/interestFlow.test.jsx`: 17 behavior tests render real Home/Member Profile/card components with mocked API/auth/navigation/icons and the real interest event service. No live requests or SMS notifications.
- Initial tests reproduced missing Home-to-mounted-Profile synchronization, unconfirmed send success, and permanent local Home overrides masking server acceptance. Fixed these gaps: Profile subscribes by member ID, successful status rechecks publish updates, Home refresh reconciles authoritative results while retaining events newer than the request, and Profile only reports send success for sent=true. Fresh profile status reads also update Home.
- Added a synchronous Profile mutation lock against duplicate taps. Status-loading responses cannot overwrite a newer event. Removed an unused Home hook dependency flagged by targeted lint.
- Covered Profile send -> pending on Home; confirmed pending cancellation -> Send Interest on both; Home send -> mounted Profile; pending/accepted/rejected events; accepted/rejected cancellation controls disabled; unrelated-member isolation; every cached Home tab; server acceptance after refresh; in-flight refresh vs cancellation; in-flight status load vs acceptance; failed/unconfirmed mutations; duplicate send; cancellation confirmation Keep; and status recovery after timeout.
- Updated the older MemberProfileScreen regression to mock auth/icons and explicitly reject shortlist status; it still verifies the member and interest action remain usable when shortlist fails.
- Final targeted command: `npm test -- --runInBand __tests__/interestFlow.test.jsx __tests__/MemberProfileScreen.test.jsx __tests__/profileApi.test.js __tests__/sessionMember.test.js`: PASS, 4 suites / 34 tests.
- Targeted ESLint of both screens and both screen-test files: PASS. Scoped `git diff --check` on the edited tracked screens/test: PASS.
- Full `npm test -- --runInBand`: 4 suites passed / 32 tests passed at that run; starter App.test.jsx fails on existing @react-navigation/native ESM parsing. Two additional lifecycle tests subsequently passed in the final targeted run. Full `npm run lint`: FAIL, 8 unrelated errors in wallet duplicate styles and account-edit hook dependencies, 2 navigation warnings.
- `cd android && ./gradlew assembleDebug`: PASS after approved Gradle-cache access, BUILD SUCCESSFUL, 231 tasks (38 executed / 193 up-to-date), existing deprecation warnings.
- Read confirmed Laravel routes/controller in the local backend: numeric recipient ID for send/status, interest record ID for DELETE /interests/{id}/cancel; cancel requires pending and returns data.cancelled=true. No backend edits or account/database mutations.
- Live two-account Android smoke remains NOT RUN: with authorized staging accounts, send from Home and inspect pending/cancel in Profile; send from Profile and check Home; accept then reject separate interests from recipient account and refresh sender Home; verify both terminal statuses prevent cancellation; verify a failed request followed by status retry. T5.2/T5.3 remain open pending staging/device evidence.

### T1.3 / T5.3 Interests hook-order error — 2026-10-23

- Screenshot reports "Rendered fewer hooks than expected" in InterestsScreen during development. Current on-disk screen calls all hooks before its sole component return; targeted hook lint finds no conditional-hook violation. Stale Fast Refresh hook state after source edits is the supported diagnosis, not a confirmed conditional-return bug in this version.
- Added React Native `// @refresh reset` to remount InterestsScreen when edited and discard retained development hook state. Preserved the current list/action implementation.
- Added two regression tests using the actual screen with mocked API/navigation focus: deferred loading -> loaded list -> Sent/Accepted/Rejected/Received -> refresh/empty, and initial request error -> Retry -> successful list. Both pass without hook-order exceptions. Targeted screen/test ESLint passes.
- ADB found emulator-5554; force-stopped and relaunched com.himrishteyapp to reset the running JS session. Initial UI dump after relaunch contains no hook error. Interactive Interests smoke remains pending until the app finishes loading.
- Follow-up live smoke: opened Interests on emulator-5554 after full relaunch. UI dump confirms "My Interests" and Received/Sent/Accepted/Rejected tabs, with no rendered-more/fewer-hooks or render error text. Interests navigation/render smoke PASS; no interest mutation performed.

### T5.3 interest-card status copy — 2026-10-23

- Corrected the line below location in InterestsScreen: status 1 shows "Interest accepted", status 2 "Interest rejected"; pending retains "Interest sent" / "Interest received" according to direction. Unknown statuses no longer claim sent/received. This applies across all tabs without changing API actions.
- Targeted `npx eslint src/screens/interests/InterestsScreen.jsx` and existing InterestsScreen regression suite run for this presentation change; device visual check not repeated.
