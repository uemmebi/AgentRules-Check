# Release operations

## One-time decisions

- Choose the project's license before calling it open source. Add the approved LICENSE and matching package metadata. No license choice is implicit in this change.
- In Settings → Pages, select GitHub Actions. Restrict the github-pages environment to main; enable HTTPS. The workflow also rejects other branches.
- GitHub Pages cannot apply arbitrary response headers. HTML embeds CSP and no-referrer, but full response-header enforcement requires a compatible static host or a configured proxy. `public/_headers` is a ready configuration for hosts supporting that format; Pages ignores it. Choose this hosting option explicitly before declaring full header enforcement.

## Publish and verify

1. Require the Checks workflow to pass on the intended commit. It includes lint, 33 unit tests, build, moderate-or-higher dependency audit, browser workflows and cache lifecycle tests.
2. Run Deploy Pages manually on main. Record its commit SHA and returned URL. Build checks run again before uploading dist.
3. The verify-deployment job tests the real URL, including its subpath, offline reload, offline export, accessibility scans and no external analysis requests. It stores its Playwright report and HTTP evidence as deployment-verification.
4. Review deployment-check.json. Missing response security headers and worker revalidation are explicit warnings on Pages, not silently reported as present. For a host required to supply all headers, run the strict check below. Test the root URL with its trailing slash and the canonical redirect without it.
5. Test a physical phone and screen reader before making corresponding accessibility claims. Automated Chromium/axe checks are not substitutes.
6. Update verification.md with the successful run, URL, SHA, timestamp and remaining limitations. A GitHub release/tag is useful for traceability but not required by Pages.

```sh
PLAYWRIGHT_BASE_URL=https://your-host.example/project/ npm run test:e2e
DEPLOYMENT_URL=https://your-host.example/project/ REQUIRE_SECURITY_HEADERS=1 node scripts/check-deployment.mjs
```

No local preview server is started when PLAYWRIGHT_BASE_URL is set. Never point these tests at an unrelated application.

## Cache and rollout

The generated worker precaches only index.html, favicon and hashed build assets. Cache names include the registration scope and exact build hash. It removes only older caches in that scope. Legacy unscoped caches are deliberately left alone to avoid deleting another installation's cache; clear site data manually to remove them.

No skipWaiting is used. Existing tabs keep their current build until closed; reopening uses the activated build. Before a launch, check a fresh online load, wait for service-worker readiness and control, then reload, analyze and export offline. Cache storage must contain only application assets, never input files or reports. A first visit while offline cannot install the app.

Run `npm run test:cache` after building. It serves two builds under /project/, keeps an independent /other/ installation, checks waiting-worker behavior, activates B after closing A, reloads both offline, and rolls back to A. Both fixtures use the actual app and generated worker.

On compatible hosts, HTML and sw.js revalidate; hashed assets are immutable. Preserve old hashed assets during rollout when possible. Do not apply an immutable cache policy to sw.js or HTML.

## Failed deployment verification and rollback

A post-deployment test failure marks the workflow failed but the site is already published. Do not announce that release. Inspect the saved artifacts, fix the cause and rerun. To restore a known-good version, revert the faulty changes on main through a reviewed commit, wait for Checks and manually deploy main again. Close old tabs and verify the restored build online and offline. A rollback must pass the same checks as an update; no forced activation should discard users' in-memory work.
