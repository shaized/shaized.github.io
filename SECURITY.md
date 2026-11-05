# Security and responsible reporting

For a suspected security issue, email shaizaidenberg@gmail.com with the affected page and a concise description. Do not include passwords, tokens, private records, or operational telemetry. Avoid publishing exploitable details in a public issue before coordinating a fix.

This is a static educational website. Its demos do not query or modify real infrastructure. Browser safeguards include a narrow HTML-delivered Content Security Policy, local scripts/styles/fonts, text rendering of feed/search results, and validation of fetched public data. Site-wide search does not send search text to a server. Back links accept only the same origin and page directory, with a local fallback.

GitHub Pages manages hosting, HTTPS, and server headers. The site does not claim control over all response headers or certification of security, accessibility, or legal conformity. Repository/account access and future changes still need appropriate review.

Quality automation uses `contents: read`, does not retain checkout credentials, and runs on pushes, pull requests, or manual dispatch. It does not use `pull_request_target`, external scan services, or deployment credentials. Visual and assistive-technology checks remain separate from code checks.
