# Shai Zaidenberg — Security Engineering & AI

[Live website](https://shaized.github.io/) · [Source repository](https://github.com/shaized/shaized.github.io)

A public, buildless website with 27 pages: eight fictional AI capability demonstrations, the full CISA KEV catalog, fieldnotes, learning paths, playbooks, a glossary, resources, and professional background.

## What lives where?

**GitHub contains the complete current website:** HTML, JavaScript, styles, fonts and licenses, conceptual images, video and poster, CISA fallback data, search index, navigation template, maintenance/check scripts, and documentation. GitHub Pages serves the site from `main` at the repository root. Visitors do not depend on a developer's computer or a local server.

**Local files are optional working copies and development artifacts:** screenshots, temporary previews, earlier design experiments, and personal source documents. They are not needed to run or maintain the published site. An unfinished CV and unrelated private information are not website assets.

**In the visitor's browser:** theme and accessibility preferences stay in local storage. Page search, glossary filtering, and playbook checkboxes run in memory; no query text is sent to a server. There is no custom backend, account system, analytics, tracker, or private API key.

## Design and navigation

The editorial masthead separates identity and social profiles from navigation. Site-wide search opens with its button or Ctrl/Command + K. Inner pages include a Back link and breadcrumbs. Back uses a same-site referring page when appropriate; direct or external visits fall back to the parent section or Home. JavaScript is not required for the fallback link.

Space Grotesk and Manrope are hosted here with their SIL Open Font License files. Decorative animation respects OS reduced motion and the shared motion control. The homepage directly links to every page. See [accessibility.html](accessibility.html), [privacy.html](privacy.html), and [security.html](security.html) for scope and limitations.

## Maintain the site

The committed HTML files are the source. There is no hidden build step or dependency installation.

1. Edit the relevant HTML, CSS, or JavaScript file.
2. For a shared navigation change, edit `header-template.txt` and run `python3 maintain.py --header`.
3. For content changes, run `python3 maintain.py` to regenerate `site-index.json`.
4. Run the checks below, then commit the changed files to `main`.
5. Confirm the Pages deployment succeeded and inspect the live result.

```sh
python3 check_site.py
node test_navigation.cjs
node test_search_ui.cjs
node test_news.cjs
```

The `Website quality checks` workflow runs these checks and validates the search index after pushes and pull requests. It uses read-only repository permissions and does not deploy or change files. GitHub's Pages workflow performs deployment separately; quality checks are not a branch-protection gate.

To preview an optional local copy:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Then open `http://127.0.0.1:4173`. Stop the preview when finished.

## CISA data

`news.js` first reads `kev-catalog.json`, then requests CISA's official public mirror at `https://raw.githubusercontent.com/cisagov/kev-data/develop/known_exploited_vulnerabilities.json`. Responses are validated; the catalog date is displayed. Offline, malformed, and older responses keep the bundled snapshot. No background polling or credentials are used. CISA data is CC0. KEV is not a comprehensive news wire, and CISA due dates are not universal remediation deadlines.

To refresh the fallback, replace the complete JSON file with a validated official snapshot and run the tests. Do not invent or selectively edit entries.

## Content and assets

Agent demos are handcrafted fictional explanations, not live executions. There is no private operational code or customer telemetry. Images are original AI-generated conceptual visuals; the silent workflow video is an original illustrative animation with a visible text description. The website includes font license files and an editorial/source statement.

Read [MAINTENANCE.md](MAINTENANCE.md), [SECURITY.md](SECURITY.md), and [VERIFICATION.md](VERIFICATION.md) for operational details.

© 2026 Shai Zaidenberg. Third-party names identify their respective services and do not imply endorsement.
