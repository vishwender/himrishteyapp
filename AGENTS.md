# HimRishtey contributor instructions

## Scope and authority

- React Native CLI, JavaScript, Android first; no Expo or TypeScript for new application code or tests. Existing Kotlin/Swift native hosts remain valid.
- Implementation authorized by the user on 2026-10-19. Proceed incrementally through TASKS.md with evidence; the earlier planning-only pass is complete. Preserve the safety and verification boundaries below.
- Preserve existing instructions and user work. At inspection on 2026-10-16, Git showed deleted tracked `App.tsx` and untracked `App.jsx`. Do not restore, overwrite, stage or commit that replacement without task authorization.
- No existing AGENTS.md was found in the repository file inventory or checked ancestor locations. Keep these instructions additive when future instructions are discovered.

## Confirmed baseline

- `index.js` registers `./App`; `App.jsx` renders the React Native NewAppScreen with SafeAreaProvider and a theme-aware status bar.
- package.json declares React 19.2.3, React Native 0.87.1, CLI 20.2.0, safe-area-context ^5.5.2 and Node >=22.11.0. npm lockfile v3 exists; local React/RN package metadata matches declared versions. This does not establish build compatibility.
- No product feature, navigation, API integration or Laravel contract was found. See ARCHITECTURE.md for evidence and open decisions.
- `__tests__/App.test.tsx`, tsconfig.json and TypeScript development dependencies remain from the starter. Their cleanup is planned, not completed.
- No lint, test, native build, emulator or API verification was performed during planning.

## Implementation conventions after review

- Use `.js` for logic and `.jsx` for JSX, function components and hooks. Follow existing ESLint and Prettier configuration: single quotes, trailing commas, arrow parentheses as needed. Do not migrate native source languages.
- Use the feature-oriented structure proposed in ARCHITECTURE.md incrementally; avoid empty scaffolding for future features.
- Keep screens focused on presentation; feature services own domain operations; shared API code owns transport. Keep transient form state local and session state centralized. Do not add a global state library without a concrete need.
- Reuse theme tokens and accessible shared components. Support safe areas, keyboard interaction, font scaling, readable contrast and Android back behavior. Treat premium styling as a design proposal until reviewed.
- Use npm and preserve package-lock.json. Validate native-library compatibility with this project's RN version, architecture and Android toolchain before adding packages. No speculative upgrades or dependency bundles.
- Follow actual Laravel contracts. Record method/path, request and response examples, validation, auth and pagination before integration. Do not invent routes, assume Sanctum/JWT, or treat mocks as backend verification.
- Every network screen needs loading, empty, error, retry and success behavior. Handle cancellation, duplicate submission and stale responses. Server permissions and entitlement checks remain authoritative.

## Safety boundaries

- Never commit credentials, signing keys, tokens, production member data or private photos. Client configuration cannot contain server secrets. Redact sensitive logs and test fixtures.
- Persist credentials only using a reviewed platform-backed secure storage solution; never store tokens/passwords in plain preferences or general-purpose async storage. Clear session-specific data on logout/account changes.
- Do not weaken TLS, broaden cleartext traffic, change permissions, alter signing, or make production API/payment mutations as incidental fixes. Use authorized test accounts and staging.
- Do not delete existing code/configuration, reset Git, publish, deploy or release without relevant authorization. Release currently uses debug signing and must not be considered production ready.

## Verification and reporting

- Use TASKS.md IDs; implement small reviewable changes with explicit acceptance criteria. Record command, result and blockers before checking an item complete.
- Baseline commands after review: `npm run lint`, `npm test -- --runInBand`, then an Android debug build and device/emulator smoke check when the environment is available. Do not silently install missing tooling to make checks pass.
- Test meaningful behavior: session transitions, API failures, validation, pagination, mutations and entitlements. A render-only test is not evidence of product correctness.
- Run relevant checks after each change; report unrun checks separately from failures. Update planning status from evidence, never from code presence alone.
