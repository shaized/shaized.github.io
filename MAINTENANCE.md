# Website maintenance

The repository is the complete, portable source of the current website. You can download or clone it and maintain it using Python 3 and Node.js without installing packages. GitHub Pages hosting is independent of any local computer.

## File map

| Files | Purpose |
| --- | --- |
| `*.html` | Published page source; directly editable |
| `style.css`, `design.css`, `navigation.css` | Base styles, typography/motion, editorial navigation |
| `theme-init.js`, `app.js`, `motion.js` | Validated preferences, accessibility, menus, demos, motion |
| `navigation-core.js`, `navigation.js` | Tested search/back-link logic and browser interface |
| `explore.js`, `news.js` | Learning tools and CISA catalog |
| `site-index.json` | Generated page search data; no user data |
| `header-template.txt`, `maintain.py` | Shared header and index maintenance |
| `check_site.py`, `test_navigation.cjs`, `test_search_ui.cjs`, `test_news.cjs` | Portable local and GitHub quality checks |
| `.github/workflows/quality.yml` | Automated checks with read-only access |
| `*.ttf`, `*-OFL.txt` | Fonts and redistribution licenses |
| `*.webp`, `*.png`, `*.svg`, `*.mp4` | Public visual assets |
| `kev-catalog.json` | Full dated fallback from official CISA data |

## Add or edit a page

Use a related HTML page as the starting point. Set a unique title, description, canonical URL, heading, and breadcrumb. Add a homepage link to the new page. Update `sitemap.xml` and regenerate the search index with `python3 maintain.py`. Run the checks. The coverage check fails when a page is missing from the homepage or search index.

## Navigation updates

Edit `header-template.txt`, then run `python3 maintain.py --header`. This applies the header to all pages and sets the primary navigation's active state. The homepage is not a hidden master template for other content. Edit page bodies directly.

## Publishing and rollback

The site uses GitHub Pages from `main` and the repository root. Commit the prepared files, inspect both `Website quality checks` and `pages-build-deployment` in Actions, and verify the public site. These are separate workflows; a passing quality run is not proof of a successful deployment.

For a regression, revert the relevant commit using GitHub's normal version-control process, redeploy, and recheck the live page. Preserve later unrelated changes.

## Review checklist

- Desktop and narrow mobile layout; both themes; keyboard focus and Escape.
- Motion pause/resume and system reduced motion; increased text settings.
- Header links, back-link fallback, search match/no-match/failure states.
- A representative agent demo and playbook; CISA source/date and fallback.
- No private documents, credentials, telemetry, or unsupported career/performance claims.

## Boundaries

The repository intentionally contains the maintainable current release, not obsolete local experiments, raw CV drafts, browser screenshots with unrelated tabs, or private source material. None of those is necessary to run the site. Saved local working copies can be discarded without taking the site offline.
