# Verification scope — 15 November 2026

The current release includes portable checks for:

- Local page and asset references, unique IDs, headings/landmarks, image alternatives, controlled video playback, and absence of inline scripts/event handlers.
- Direct homepage links and search-index coverage for all 29 pages.
- Inner-page Back links; safe same-origin targets and fallbacks for external/direct/self-referred visits.
- Ranked page search, case handling, empty queries, and no-match results; closest-page suggestions for mistyped addresses.
- CISA catalog loading, pagination, filtering, data validation, unsafe-link rejection, credential-free requests, and offline/malformed/stale-response fallbacks.
- Analyst Toolkit logic: CVSS 3.1 base scores against published examples, indicator extraction, defang/refang, time parsing, KEV matching, layered decoding, JWT reading, IPv4 network arithmetic, and email header parsing.
- Agreement between the homepage summary and the catalog it is derived from.
- JavaScript syntax and a reproducible public search index.

These checks are committed and run locally or in GitHub Actions. They are not a vulnerability certification, a comprehensive browser/device matrix, or a full assistive-technology audit.

For this release, automated browser checks in headless Chrome covered all 29 pages at 1440px and 320px (and the four busiest pages at seven further widths) with no horizontal overflow and no console or Content Security Policy errors. Screenshots were reviewed for representative pages in both themes, on desktop and mobile widths, in higher-contrast mode, and with motion paused. Each toolkit utility, the diagram step controls, the playbook switcher, video metadata loading, and the 404 suggestions were exercised on the published site. External links were requested and returned successfully on the release date.

Not covered: Safari on macOS or iOS, including video playback there; how animations feel in real time, since review used still captures; Firefox beyond static layout renders of the homepage and toolkit; and assistive-technology testing.

See the repository's Actions history for results tied to each commit. Always distinguish a successful quality check from a successful Pages deployment, and verify the public result after changes.
