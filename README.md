# Shai Zaidenberg — Security Engineering & AI

[Live website](https://shaized.github.io/) · [Source repository](https://github.com/shaized/shaized.github.io)

A public, buildless website with 29 pages: eight fictional AI capability demonstrations, the full CISA KEV catalog, twelve response playbooks, a nine-tool Analyst Toolkit, animated architecture blueprints with short films, fieldnotes, learning paths, playbooks, a glossary, resources, and professional background.

## What lives where?

**GitHub contains the complete current website:** HTML, JavaScript, styles, fonts and licenses, conceptual images, video and poster, CISA fallback data, search index, navigation template, maintenance/check scripts, and documentation. GitHub Pages serves the site from `main` at the repository root. Visitors do not depend on a developer's computer or a local server.

**Local files are optional working copies and development artifacts:** screenshots, temporary previews, earlier design experiments, and personal source documents. They are not needed to run or maintain the published site. An unfinished CV and unrelated private information are not website assets.

**In the visitor's browser:** theme and accessibility preferences stay in local storage. Page search, glossary filtering, playbook checkboxes, and the Analyst Toolkit run in memory; no query or pasted text is sent to a server. There is no custom backend, account system, analytics, tracker, or private API key.

## Design and navigation

The editorial masthead separates identity and social profiles from navigation. Site-wide search opens with its button or Ctrl/Command + K. Inner pages include a Back link and breadcrumbs. Back uses a same-site referring page when appropriate; direct or external visits fall back to the parent section or Home. JavaScript is not required for the fallback link.

The Liquid Glass layer (`glass.css`, `glass.js`) adds translucent surfaces over a slow ambient backdrop, a floating navigation capsule, pointer-following light, staggered reveals, and page and theme transitions in both dark and light themes. It needs no external library and keeps the strict Content Security Policy unchanged.

Space Grotesk and Manrope are hosted here with their SIL Open Font License files. Decorative animation respects OS reduced motion and the shared motion control. The homepage directly links to every page. See [accessibility.html](accessibility.html), [privacy.html](privacy.html), and [security.html](security.html) for scope and limitations.

## Maintain the site

The committed HTML files are the source. There is no hidden build step or dependency installation.

1. Edit the relevant HTML, CSS, or JavaScript file.
2. For a shared navigation or footer change, edit `header-template.txt` or `footer-template.txt` and run `python3 maintain.py --header`.
3. For content changes, run `python3 maintain.py` to regenerate `site-index.json`.
4. Run the checks below, then commit the changed files to `main`.
5. Confirm the Pages deployment succeeded and inspect the live result.

```sh
python3 check_site.py
node test_navigation.cjs
node test_search_ui.cjs
node test_news.cjs
node test_tools.cjs
```

The `Website quality checks` workflow runs these checks and validates the search index after pushes and pull requests. It uses read-only repository permissions and does not deploy or change files. GitHub's Pages workflow performs deployment separately; quality checks are not a branch-protection gate.

To preview an optional local copy:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Then open `http://127.0.0.1:4173`. Stop the preview when finished.

## Analyst Toolkit and exploitation pulse

`tools.html` offers nine browser-only utilities: an indicator extractor with defanging, a check of CVE IDs against the bundled KEV snapshot, a CVSS 3.1 base calculator, a time converter, a layered decoder, a JWT reader, a CIDR calculator, a hash calculator, and an email header analyzer. The logic lives in `tools-core.js` and is covered by `test_tools.cjs`, including published CVSS example scores. The homepage pulse section reads `kev-summary.json`, a small set of counts that `python3 maintain.py` derives from `kev-catalog.json`; it contains no figures that are not in the catalog.

## Playbooks, blueprints, and films

`playbooks.html` holds twelve original checklists written from public guidance (NIST SP 800-61, CISA, RFC 3227, OWASP). They contain no private or organization-specific procedures. `blueprints.html` presents four generic reference architectures as inline SVG diagrams that `blueprints.js` steps through; every caption is also plain text on the page. The four `film-*.mp4` files are silent screen recordings of those diagrams with `film-*.webp` posters and written transcripts. They never autoplay.

The 404 page suggests the closest page to a mistyped address using `recover.js` and the tested `suggestPages` function in `navigation-core.js`.

## CISA data

`news.js` first reads `kev-catalog.json`, then requests CISA's official public mirror at `https://raw.githubusercontent.com/cisagov/kev-data/develop/known_exploited_vulnerabilities.json`. Responses are validated; the catalog date is displayed. Offline, malformed, and older responses keep the bundled snapshot. No background polling or credentials are used. CISA data is CC0. KEV is not a comprehensive news wire, and CISA due dates are not universal remediation deadlines.

To refresh the fallback, replace the complete JSON file with a validated official snapshot, run `python3 maintain.py` to rebuild `kev-summary.json`, and run the tests. Do not invent or selectively edit entries.

## Content and assets

Agent demos are handcrafted fictional explanations, not live executions. There is no private operational code or customer telemetry. Images are original AI-generated conceptual visuals; the silent workflow video is an original illustrative animation with a visible text description. The website includes font license files and an editorial/source statement.

Read [MAINTENANCE.md](MAINTENANCE.md), [SECURITY.md](SECURITY.md), and [VERIFICATION.md](VERIFICATION.md) for operational details.

© 2026 Shai Zaidenberg. Third-party names identify their respective services and do not imply endorsement.
