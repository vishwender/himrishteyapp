# HimRishtey task checklist

### T1.1 bottom navigation transparency — 2026-10-24

- Undid the white-outline change per request, restoring purple-filled active footer icons and removing outlineColor. Targeted AppIcon/MainTabs ESLint and scoped whitespace check PASS.

- Active footer icons retain purple fill with white outlines through an opt-in outlineColor prop; inactive/default icons unchanged. Targeted AppIcon/MainTabs ESLint and scoped whitespace check PASS.

- Added opt-in fill to AppIcon and passed bottom-tab focused state so active navigation icons fill with the selected purple color while inactive icons retain outlines. Default shared icon appearance unchanged. Targeted component/navigation ESLint and scoped whitespace check PASS; device visual check not repeated.

- Corrected invisible transparency: bottom bar now overlays the scenes with 84% opaque white so scrolling content is actually visible behind it. Added measured bottom-tab-height padding to Discover, Search, Interests and Account scroll content so final items remain reachable; Discover card sizing subtracts the overlay height to preserve its initial fit.
- Targeted five-file ESLint, Babel parsing and scoped whitespace check PASS. Restarted OnePlus app and scrolled cards under navigation; device screenshot confirms the card photo/buttons show through while navigation icons/labels stay fully opaque. End-of-list reachability on every tab and large fonts not yet exercised. No API mutations/native rebuild.

- Set bottom navigation background to 90% opaque white; icons, labels and layout retain full opacity. Targeted MainTabs ESLint and scoped whitespace check PASS; device visual check not repeated.

### T4.1 / T4.2 Search result card consistency — 2026-10-24

- Replaced SearchScreen's horizontal result card with the shared HomeMemberCard portrait design (gradient/name/location/education and on-photo interest/shortlist controls). Removed obsolete result-card image/layout code; existing search fields/modes, validation, result count, pagination, loading/empty/error UI and profile navigation remain.
- Added SearchMemberCard action adapter using existing confirmed interest/shortlist APIs. Reads status before mutating because search responses may omit it, confirms mutation responses, blocks duplicate taps and subscribes to shared cross-screen status events. No speculative endpoints, fabricated match percentages or live mutations.
- `npm test -- --runInBand __tests__/SearchMemberCard.test.jsx`: PASS, 3 behavior tests for shared card/existing interest protection, existing shortlist removal, duplicate-tap prevention and synchronized acceptance. Targeted screen/adapter/test ESLint, Babel parsing and scoped whitespace check PASS. Existing test ignore rule unchanged. Device search-result/action smoke and native build NOT RUN; broader T4 acceptance remains open.

### T0.3 / T4.2 Near Me category — 2026-10-24

- Confirmed local Laravel routes/api.php and SearchController::nearby: authenticated GET /api/v1/search/nearby with existing Bearer token and X-App-Code header; query `{per_page:10,page:1}`. Returns `{success:true,data:{members:[{id,profile_id,full_name,photo,education,...}],pagination:{current_page:1,last_page:2,per_page:10,total:15}}}`. Requires profile city/state (422 with update-location message when missing); matches active, visible opposite-gender members by case-insensitive city/state and country when set. No GPS/distance contract or new permissions.
- Added Near Me location-icon category using this route, adapting page numbers to the existing next-page token interface; existing loading/empty/error/retry/refresh behavior reused. Response schema/pagination validated. Nearby cards omit interest/shortlist state, so actions fetch the respective status before mutation rather than assuming a new interest/shortlist. No backend edits or live mutations.
- Local nearby adapter regression: 4 tests PASS for pagination/final page, empty result, malformed/server failure and missing session. Targeted source/test ESLint, Babel parsing and scoped whitespace check PASS. Existing __tests__ ignore rule unchanged. Live authenticated Nearby and device pagination/action smoke NOT RUN; feature acceptance remains open.

### T4.1 Discover tab cleanup — 2026-10-24

- Fixed non-clickable categories after scrolling by moving the now-always-top category panel outside the virtualized member list. A sibling FlatList scrolls only profiles, preserving fixed category position, rounded container, state, refresh/pagination and card viewport sizing. Avoids translated sticky-header touch handling/clipping. Removed obsolete category-height measurement.
- Targeted HomeScreen ESLint, Babel parsing and scoped whitespace check PASS. Device smoke PASS on OnePlus: scrolled Matches member list, tapped Recent icon at its fixed position, verified selected purple Recent/underline and Recently Joined results. No interest/shortlist mutations or native rebuild.

- Removed the right-side Filter button and full search bar above categories per request, including unused rendering/styles/measurement state. Categories now start immediately beneath the purple app header; rounded list top, sticky behavior and remaining layout preserved. Updated card sizing to use the newly available viewport without subtracting the removed search area. Targeted HomeScreen ESLint, Babel parsing and scoped whitespace check PASS; device visual check not repeated.

- Improved member-card visibility: compacted brand/search/category spacing, reduced category circles to 48 points and sized tab cells so all five fit on the connected phone. Card height now uses measured list viewport minus category/search heights and spacing, retaining a minimum and extra font-scale allowance. Preserved sticky categories, over-photo details/actions and pagination.
- Verified on OnePlus after restart/loading: all five categories and the complete first card (photo, name/location/education, Send Interest and Shortlist) are visible above bottom navigation. Header/nearby regression suites PASS, 5 tests. Targeted ESLint, Babel parsing and scoped whitespace check PASS. Large-font/smaller-device layout checks remain pending; no API mutations or native rebuild.

- Made category/results panel a sticky SectionList header: greeting scrolls away, panel stays beneath the fixed brand header, and member rows scroll underneath. Preserved category state, pagination, refresh and member actions. Empty/loading/error content is rendered in the section footer when no members exist because an empty section still contributes its sticky header. Targeted HomeScreen ESLint, Babel parsing and scoped whitespace check PASS. Device sticky-scroll/empty-state checks not yet run; no native dependencies or API changes.

- Rounded the shared white category/results panel's top corners to 24 points with content clipping. Targeted HomeScreen ESLint and scoped whitespace check PASS.

- Extended the white results panel to include Matches/Recent/Verified/Shortlisted tabs and results heading, with shared outer dividers and spacing before member cards. Targeted HomeScreen ESLint, Babel parsing and scoped whitespace check PASS; device visual check not repeated.

- Added a full-width white results-heading strip, subtle top divider and extra spacing above member cards to distinguish header/category controls from results. Targeted HomeScreen ESLint and scoped whitespace check PASS; device visual check not repeated.

- Made category icon tiles circular (60×60, radius 30); labels and selection underline preserved. Targeted HomeScreen ESLint and scoped whitespace check PASS.

- Updated only category tab presentation to supplied mockup: rounded icon tiles, labels below (Matches/Recent/Verified/Shortlisted), purple selected tile/text and underline; added selected tab accessibility state. Existing category IDs, section headings, loading/actions and removed Viewed You remain unchanged. Targeted HomeScreen ESLint, Babel parsing and scoped whitespace check PASS; visual device check not repeated.

- Removed Viewed You from the active Discover category configuration; existing backup file preserved. Targeted HomeScreen ESLint and scoped whitespace check PASS. Device check not repeated.

### T3.1 dedicated My Profile screen — 2026-10-24

- Added authenticated MyProfile stack route and routed both Account “View My Profile” buttons to it rather than searching for the signed-in member through the member-discovery endpoint. Uses existing context-owned GET /profile (+ existing activation lookup when required); no new endpoint or account mutation.
- Screen includes photo with fallback, name/ID/location, completion, Edit My Profile and editable sections for About, Personal, Religion, Education/Career, Location, Family, Lifestyle and Partner Preferences. Uses existing field names/edit routes. Missing sections have explicit empty copy; cached data remains visible on failed refresh with Retry. Focus refresh and pull-to-refresh share a duplicate-request guard; inactive screen does not set local request state. No send-interest/shortlist controls on own profile.
- `npm test -- --runInBand __tests__/MyProfileScreen.test.jsx`: PASS, 2 tests covering own-profile data, zero-valued fields, missing sections, edit routing and failed-refresh/retry with cached data. Tests are local: existing .gitignore ignores __tests__; no files staged or ignore rules changed.
- Targeted ESLint on new screen, Account, navigator and test: PASS with 2 pre-existing navigator warnings. Prettier on new screen/test and scoped whitespace check PASS. Existing full-suite ESM parsing and unrelated full-lint errors remain separate. Native build/device own-profile smoke NOT RUN; no dependencies added. T3.1 remains open for complete backend/device acceptance.

### T1.1 / T2.1 login illustration — 2026-10-24

- Fixed oversized login artwork from supplied phone screenshot: replaced percentage-width/aspect-ratio sizing with explicit viewport-based width (window minus hero padding) and matching 3:2 height. Image can no longer retain its intrinsic width and overflow the hero. Targeted LoginScreen ESLint and scoped whitespace check PASS. Restarted the phone app after adding the sizing hook; screenshot was still on session bootstrap, so final signed-out visual verification remains pending. No session data cleared.

- Generated an original illustration of an adult couple in Himalayan scenery using imagegen; bundled it at src/assets/images/login-couple.png and added a responsive 3:2 rounded hero image on Login. Adjusted hero spacing/type to accommodate it. Decorative image is excluded from accessibility focus and requires no network access. No auth behavior changes.
- Targeted LoginScreen ESLint, Babel parsing and scoped whitespace check PASS. Inspected generated illustration; signed-out device/keyboard layout not exercised to preserve the current signed-in session. Native build not repeated.

### T2.2 / T3.1 Account refresh loop — 2026-10-24

- Root cause: AuthProvider recreated refreshUser after every setUser. Account's useFocusEffect depends on refreshProfile, which depends on refreshUser, so each completed fetch immediately started another refresh while focused. Stabilized refreshUser with useCallback and a functional user update.
- `npm test -- --runInBand __tests__/AuthContext.test.jsx`: PASS, one behavior regression verifies a focus-like effect runs once after session refresh and manual refresh remains available without restarting it. Targeted ESLint of context, Account screen and regression test plus scoped whitespace check PASS.
- Adding the hook during Fast Refresh temporarily triggered a retained hook-order error; fully restarted the development app. Opened Account on the connected OnePlus: profile, completion and menus loaded, with no persistent spinner. No API mutations or native rebuild. Existing full-suite Jest dependency parsing blocker remains separate.

### T1.1 / T1.3 Discover app header — 2026-10-24

- Cross-checked latest header against supplied reference and actual phone screenshots. Added diagonal purple gradient accents, search/bell/avatar layout, rounded search area immediately below branding, profile avatar in dropdown identity row, Settings label and Filter shortcut. Removed the large greeting block to match reference composition. Retained requested circular tabs, excluded Viewed You and preserved existing member cards/sticky behavior. Bell reports notifications unavailable; no unread badge or backend feed invented. Filter/search use existing Search screen.
- Verified revised header and open dropdown visually on connected OnePlus. Local header navigation regression PASS after mocking decorative Bell ESM import; targeted ESLint, Babel parsing and scoped whitespace check PASS. No member/account mutations, logout or native rebuild performed.

- Updated header to the supplied purple reference: white wordmark/tagline, search shortcut and circular actual account photo (icon fallback) with dropdown indicator. Profile dropdown shows signed-in name/ID and routes to My Profile, Membership, Account & Settings; Logout uses confirmation and existing signOut. Outside tap/Android back dismiss the modal. Menu placement follows measured header height and safe-area inset. Sticky categories and member cards preserved. No notification badge/feed invented; none is currently integrated.
- Added local `__tests__/DiscoverHeader.test.jsx`: PASS, verifies search route, dropdown expanded state and MyProfile stack route/dismissal. Targeted header/Home/test ESLint, Babel parsing and scoped whitespace check PASS. Existing ignore rule excludes local tests from Git. Restarted development app for preview; final header/menu device visual check and logout not exercised. No native dependencies/API changes.

- Greeting refinement: smaller personalized purple welcome line, prominent wrapping headline “Your next chapter starts here.” and supporting “Find someone who feels like home.” copy with consistent vertical spacing. Targeted HomeScreen ESLint, Babel parsing and scoped whitespace check PASS; device visual check not repeated.

- Added a fixed white brand header above the Discover list: purple heart mark, HimRishtey wordmark, short tagline and accessible 48-point Account shortcut. Personalized greeting stays in scroll content; Search remains in the bottom tab. Added top SafeAreaView and dark status-bar text for readable system icons and proper header inset. No dependencies/API changes.
- Targeted HomeScreen ESLint, Babel parsing and scoped whitespace check PASS. Reloaded connected OnePlus A5000 and inspected a screenshot: header, safe-area/status icons, greeting, category tabs and cards render correctly. Account shortcut navigation and larger font-scale checks not exercised; no native rebuild. Broader T1.1/T1.3 acceptance remains open.

### T1.3 / T4.2 simplify search entry — 2026-10-24

- Removed both duplicate Discover header search controls (round icon and search/filter bar) and their unused styles. The persistent bottom Search tab is now the single search entry; Discover retains greeting, category tabs and profiles. Search screen and its existing filters are unchanged.
- Targeted HomeScreen ESLint, Babel parsing and scoped `git diff --check`: PASS. Device visual check not repeated; no API or native changes.

### T1.1 / T4.1 portrait member card — 2026-10-24

- Removed occupation and its icon per latest request; education remains. Targeted component ESLint and scoped whitespace check PASS.

- Education and occupation now sit side by side with their existing icons, flexible equal-width cells and wrapping text. Targeted component ESLint, Prettier and scoped whitespace check PASS; device visual check not repeated.

- Removed the height detail and its ruler icon per latest request; education and occupation remain. Targeted component ESLint and scoped whitespace check PASS.

- Increased portrait height to 1.55 times available width (480–640 points before font-scale allowance). Added available height, education and occupation below location using existing ruler, graduation-cap and briefcase AppIcon mappings, explicit accessibility labels and wrapping text; missing fields are omitted. Actions remain inside the image. Targeted ESLint, Prettier, Babel parsing and scoped whitespace check PASS. Device visual/large-font checks not repeated.

- Moved Send Interest and Shortlist into the portrait's bottom information overlay below location, removing the separate white footer. Kept primary interest styling and made shortlist translucent with white text/icons. Profile navigation and action buttons are sibling press targets to avoid nested button activation; existing callbacks/status/busy behavior retained. Targeted ESLint, Prettier, Babel parsing and scoped whitespace check PASS. Issued phone reload; action mutations and large-font interaction not exercised.

- Replaced the flat name-panel tint with the portrait's continuous gradient, fading from transparent at 35% through progressively darker stops to 65% opacity at the bottom. Removed unused tint overlay/styles to avoid a visible panel boundary. Targeted ESLint, Prettier and scoped whitespace check PASS; device visual check not repeated.

- Removed the white top border from the translucent name panel per request. Targeted component ESLint and scoped whitespace check PASS; device visual check not repeated.

- Removed the duplicate blurred portrait after the user reported full-image blur. The card now renders one unblurred photo and a full-width translucent name panel with subtle border, retaining the gradient for white text legibility. Removed blur-specific measurement state/styles. Targeted ESLint, Prettier and scoped whitespace check PASS; device visual check not repeated.

- Expanded the frosted name overlay edge-to-edge at the portrait bottom per request; removed inset/radius, retained a subtle top border, and realigned its blurred portrait layer to full width. Targeted ESLint and scoped whitespace check PASS; visual check not repeated.

- Reference-based frosted name panel: inset rounded overlay with a clipped, blurred copy of the existing portrait, translucent dark tint and subtle white border; retains ID/name/age/location and existing actions. Uses React Native Image blurRadius with no new native dependency. Aligns the blurred image to the underlying portrait using measured panel width. Targeted ESLint, Prettier and scoped whitespace check PASS; issued device reload for preview. Broader font-scale/device acceptance remains open.

- Corrected the separate band below photos: removed portrait top padding, assigned the photo the explicit portrait height, and absolutely positioned the transparent profile information at the bottom of the photo. Preserved the subtle gradient behind text. Verified on connected OnePlus after reload: the image now extends behind profile ID/name/location with no separate name panel, and action buttons remain below. Targeted ESLint and scoped whitespace check PASS. No API mutation or native rebuild.

- Name-overlay transparency adjustment: reduced gradient opacity at 72% from 0.48 to 0.28 and at the bottom from 0.94 to 0.68 so the portrait remains visible behind white profile text. Targeted component ESLint and scoped whitespace check PASS; device visual check not repeated.

- Blank-screen fix verified on OnePlus A5000: RN 0.87.1 StyleSheetExports exposes `absoluteFill` but no `absoluteFillObject`. Spreading the missing property left photo/placeholder/gradient in normal layout flow. Replaced all three card references with `StyleSheet.absoluteFill`; constrained portrait/SVG height explicitly, including font-scale allowance. Before screenshot reproduced the blank Discover area; after reload and scroll, device screenshot shows member photo, ID/name/age/location, match badge, placeholder and both action buttons. No API mutations performed. Targeted ESLint, Prettier and scoped whitespace check PASS. Native build not repeated for this JS change; broader accessibility/mutation acceptance remains open.

- Design refinement: replaced the hard rectangular name panel with a smooth SVG gradient using the existing react-native-svg dependency; unified portrait/card corners and removed the excess gap above actions. Larger action text wraps rather than truncates. Portrait uses minimum height and normal-flow information so font scaling can expand the card. Failed photo URLs fall back to the existing user placeholder. Preserved single-column layout, profile navigation, actual badges and interest/shortlist semantics; religion/caste/occupation remain removed.
- Refinement verification: component Prettier, ESLint, Babel parsing and scoped `git diff --check` PASS. Native/device visual checks NOT RUN; existing full-suite Jest dependency parsing blocker remains.

- Latest requested card revision: removed religion, caste and occupation, their icons and unused summary styles. Name/age/location, ID, badges and actions remain. Targeted component ESLint and scoped `git diff --check`: PASS. Device visual check not run.

- Follow-up: moved religion and caste into the name overlay directly below location, using BookOpen and Users outline icons and explicit accessible text labels. Occupation remains below the portrait. Targeted ESLint, Babel parsing and scoped whitespace check: PASS; device visual check not run.

- Follow-up: card summary displays religion and caste; removed height and education per user request, retaining occupation. Targeted component ESLint and scoped `git diff --check`: PASS. Device visual check not repeated.

- Updated the active Home/Discover HomeMemberCard to follow the supplied photo-led reference in a single-column list: full-width rounded portrait, match badge at top left, actual verification badge at top right, and name/age/location on a dark translucent bottom panel. Retained profile ID, secondary details, interest states, activation behavior and shortlist actions. No fabricated online/distance/match values or dependencies.
- Acceptance in source: one member per existing FlatList row; portrait height adapts to window width; action controls retain accessible labels and a minimum 48-point height.
- Targeted ESLint, Babel parsing and scoped `git diff --check`: PASS. Device visual/font-scaling checks and native build NOT RUN. Existing full-suite Jest dependency parsing blocker remains; product tasks remain open pending visual and behavioral verification.

### T1.4 USB API connectivity — 2026-10-24

- Connected device: OnePlus A5000 (`21cf0e18`). Device DNS resolves `himrishtey-production.ddev.site` to `127.0.0.1`, directing the original URL to the phone rather than the Mac.
- `docker port ddev-himrishtey-production-web`: HTTP is bound to Mac `127.0.0.1:51431`. Configured `adb -s 21cf0e18 reverse tcp:8082 tcp:51431` and changed development API base URL to `http://127.0.0.1:8082/api/v1`. No transport policy or backend changes.
- Device `curl` to `/api/v1/profile` with JSON accept and X-App-Code headers: PASS, HTTP 401 JSON `Unauthenticated.` as expected without credentials. This verifies phone-to-Laravel connectivity, not login or authenticated feature contracts.
- `./node_modules/.bin/eslint src/config/api.js` and `git diff --check -- src/config/api.js`: PASS. Issued React Native reload broadcast. Login UI verification remains pending; no credentials used or API mutations performed.
- USB forwarding must be restored after disconnect/device restart; if DDEV recreates the container, obtain the current HTTP host port with `docker port ddev-himrishtey-production-web` and repeat the reverse command. Port 8082 is the phone-side development port; Metro retains 8081.
- Full lint remains blocked by 8 existing errors; full Jest remains blocked by React Navigation ESM parsing (checked earlier today). Native build not repeated for this URL-only change. T1.4 remains open for broader adapter acceptance.

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
