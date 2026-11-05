# Shai Zaidenberg — Security, engineered

Public website: https://shaized.github.io/

A multi-page security engineering portfolio: home, eight general AI capability walkthroughs, a searchable CISA KEV news desk, insights, learning paths, interactive playbooks, a searchable glossary, resources, about, and contact.

## News data
The news page loads `kev-catalog.json` first, then requests the official CISA mirror at `https://raw.githubusercontent.com/cisagov/kev-data/develop/known_exploited_vulnerabilities.json`. It validates the response, identifies the source and catalog release, and retains the snapshot if the remote request fails. The complete catalog is searchable and paginated. There is no background polling or private API key. CISA data is CC0. KEV is not a comprehensive cyber news wire.

To update the fallback, replace `kev-catalog.json` with the full validated official dataset. Never edit individual entries to imply CISA endorsement. Displayed CISA due dates are source data, not universal deadlines.

## Fictional demos
All eight walkthroughs are handcrafted illustrative scenarios, not live agent executions. They contain no internal code, customer data, or operational telemetry. Public descriptive names are used throughout.

## Visuals and accessibility
Original AI-generated conceptual imagery; original silent workflow animation with native controls and a visible transcript. No video autoplay. Keyboard navigation, native dialog, visible focus, responsive layouts, dark/light themes, and reduced motion. The accessibility panel also offers text size, contrast, spacing, link underlining, and reset. These features do not certify legal compliance or WCAG conformance.

## Learning tools
Three learning paths connect the articles, demos, and practice checklists. Playbook checkmarks and glossary filters stay in page memory and are never transmitted. Theme and accessibility preferences are validated and applied before CSS renders. GitHub and LinkedIn profile links appear in the shared desktop and mobile header.

## Privacy and maintenance
No analytics, trackers, third-party embeds, forms, or package dependencies. Preferences stay in local storage. GitHub serves the website and CISA feed; see privacy.html. Edit HTML/CSS/JS files directly. All public assets sit at the repository root for simple GitHub Pages hosting.

Preview: `python3 -m http.server 4173 --bind 127.0.0.1`.

Deploy: public GitHub Pages, main branch, root directory. No paid domain or hosting plan is required.

© 2026 Shai Zaidenberg. External names identify their respective services and do not imply endorsement.
