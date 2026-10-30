# Photo blur privacy implementation scope

Requested behaviour: a member enables Blur Photos in My Photos; other members receive blurred images, while the owner can view originals. Originals must be preserved.

## Confirmed constraints

- Profile and gallery uploads use Laravel's `profile_photos` disk, rooted at `public/photos/photo` with public visibility.
- Existing app images use direct `/photos/photo/{filename}` URLs. DDEV nginx currently serves existing files before Laravel.
- `member_photos.photo_privacy` is set to `1` on gallery upload, but no verified read/update/blur contract exists. It must not be repurposed without establishing its meaning.
- Both mobile API and website upload paths write to the same photo disk; approval and ownership rules must remain authoritative.

## Required server behaviour

1. Store the account preference server-side, scoped to the application and member. Return its authoritative value after saving; never report success for a client-only visual effect.
2. Protect original photo delivery, including existing static URLs, gallery images, primary photos, alternate upload paths and thumbnail variants. Direct requests must not bypass the privacy rule.
3. Authorize original delivery for the owner. Other clients receive server-generated blurred derivatives without original bytes or an unrestricted original URL. Use private/no-store responses for owner images and invalidate public caches when preferences change.
4. Preserve original files and existing approval checks. New uploads must inherit the account preference. Fail closed if blur generation or authorization fails.
5. Add the My Photos control only against an implemented, documented backend contract. Include loading, error/retry, save confirmation, duplicate-submit protection and stale-response handling.

## Acceptance checks

Use synthetic images and isolated fixtures. Verify owner original versus another member and unauthenticated access, direct URL access, gallery and primary photos, uploads while blurred, preference restore, enable/disable, cache behaviour, tenant isolation and failed saves. Do not use real member photos or change real account settings as test fixtures.

The feature must remain inactive until protected delivery is implemented and verified. No original files, account settings, storage permissions or server configuration have been changed during inspection.
