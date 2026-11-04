# Shai Zaidenberg — personal portfolio

A responsive, dependency-free personal portfolio based on Shai’s supplied CV.

## Live site
https://shaized.github.io/

## Features
- Dark/light themes with browser-local preferences
- Finite animation and reduced-motion support
- Filterable projects, keyboard-accessible dialogs, and expandable skills
- Career timeline, credentials, and printable text résumé
- Privacy and accessibility statements
- Self-hosted assets, no analytics, no third-party scripts, no contact-form backend

## Preview
From this directory run `python3 -m http.server 4173 --bind 127.0.0.1`, then open http://127.0.0.1:4173.

## Publish for free
Use a public repository named `shaized.github.io` owned by `shaized`. In Settings → Pages, select Deploy from a branch, `main`, and `/(root)`. Save and enable Enforce HTTPS when available. No paid plan or custom domain is needed.

## Edit
Content: index.html; presentation: style.css; interactions: app.js. The résumé and policy pages are standalone HTML. Keep the profile, project claims, dates, and qualifications aligned with the owner’s current résumé. The supplied PDF and its phone number are intentionally not included.

## Accessibility and privacy
WCAG 2.2 AA is the implementation target, not a certification. Automated and visual checks do not establish full conformance or legal compliance. A formal audit, assistive-technology testing, and jurisdiction-specific legal review may identify additional requirements. The site has no application cookies, tracking, or data submission. GitHub may process network metadata as host. Browser-local theme and motion values are documented in privacy.html.

## Security
No dependencies, third-party scripts, secrets, APIs, or user-generated HTML. A restrictive meta Content Security Policy applies to the pages. GitHub Pages controls response headers; this site cannot set server-side frame-ancestors or other custom headers. HTTPS is configured in the repository’s Pages settings.

## Rights
Personal content and original design © 2026 Shai Zaidenberg. Product and company names identify professional experience and do not imply endorsement. No employer logos, screenshots, source code, operational data, or third-party artwork are included.
