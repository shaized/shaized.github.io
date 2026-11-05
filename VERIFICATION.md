# Verification scope — 5 November 2026

The current release includes portable checks for:

- Local page and asset references, unique IDs, headings/landmarks, image alternatives, controlled video playback, and absence of inline scripts/event handlers.
- Direct homepage links and search-index coverage for all 27 pages.
- Inner-page Back links; safe same-origin targets and fallbacks for external/direct/self-referred visits.
- Ranked page search, case handling, empty queries, and no-match results.
- CISA catalog loading, pagination, filtering, data validation, unsafe-link rejection, credential-free requests, and offline/malformed/stale-response fallbacks.
- JavaScript syntax and a reproducible public search index.

These checks are committed and can run locally or in GitHub Actions. They are not a vulnerability certification, a comprehensive browser/device matrix, or a full assistive-technology audit. For this release, local visual review in the in-app browser covered representative desktop/mobile layouts and both themes. DOM layout checks covered all 27 pages at 1440px and 320px viewport widths, with no horizontal overflow detected. Browser interaction checks covered search, mobile navigation, back navigation, and motion pause/resume. Firefox publication verification is still required after upload. No external Aikido scan is used, in accordance with the site owner's preference for local checks.

See the repository's Actions history for results tied to each commit. Always distinguish a successful quality check from a successful Pages deployment, and verify the public result after changes.
