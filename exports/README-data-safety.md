# HimShaadi Data safety draft — 30 October 2026

The draft CSV preserves all 782 rows and the five original Google Play columns, IDs and question labels from `data_safety_export (2).csv`. It changes only Response value. It is a review draft, not a submission-ready certification. The original export is unchanged.

Files:
- `himshaadi-data-safety-draft.csv`: Google-format draft answers.
- `himshaadi-data-safety-review.csv`: evidence, assumptions and unresolved decisions.
- `himshaadi-data-safety-changes.csv`: original versus proposed answers.

Before importing/submitting:
1. Fix and verify the deletion webpage and actual request processing. The owner confirmed the existing page is nonfunctional; its URLs were removed. The data-deletion response is left unanswered pending verification of the actual supported deletion flow and the exact Console question.
2. Review third-party processing and any advertising/marketing transfers. The owner is unsure. The draft conservatively declares member-visible profile transfers as sharing for app functionality, rather than assuming Google's user-initiated-sharing exemption. This does not assert that there are no additional transfers or purposes.
3. Verify search-query retention. Searches leave the device and are declared collected; their ephemeral answer is intentionally blank until server/proxy/log behavior is established.
4. Confirm all data paths use encryption in the actual distributed release. The true answer is supported by the inspected HTTPS API/photo configuration, not by a complete production traffic/SDK audit.
5. Verify purchase-history collection in the distributed app. It was retained from the supplied export, but current purchase/contact-unlock app actions are not connected. Reading pre-existing history from a server alone does not prove collection by the app.
6. Review required/optional classification against every distributed version. Full registration currently requires location, religion and income. Optional manual profile fields, searches and photo upload are separately identified.
7. Confirm associated website account interoperability, caste/ethnicity classification and any device identifiers or telemetry collected by the release/hosting stack.

Other changes include declaring residential address, income, health information, search activity and other user-generated content; correcting email to required; and removing OTP-only account creation because SMS verification does not create an OTP-only account in the inspected app.

Unselected options and irrelevant conditional branches are left blank as permitted by the Google format. Blank unresolved answers are specifically identified in the review file. Do not replace them with guesses merely to make an import pass.

Validation: CSV round-trip passed; 782 original rows/IDs preserved; no conflicting selected single-choice responses; all 15 selected data categories have a collection purpose. This is structural validation, not verification of declarations or Google acceptance.

Google's definitions and CSV format: https://support.google.com/googleplay/android-developer/answer/10787469?hl=en . Collection means transmission off the device, including ephemeral processing; precise-GPS sharing and approximate location collection are different questions. The earlier IARC answer about not sharing current precise location does not mean this app collects no location data.
