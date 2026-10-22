# Verification and reproducible manual review

## Current-instance evidence

Validated on 21 October 2026 with Node 24.19.0, npm 11.9.0 and the system Chromium available at `/usr/bin/chromium`.

- Clean frozen installation: `npm ci --cache /tmp/agent-rules-npm-cache --no-audit --no-fund`.
- `npm run lint`: strict TypeScript and Prettier checks pass.
- `npm test`: 33 tests pass across three files, including both success and edge cases for parsing, rule matching, bounds and export.
- `npm run build`: Vite production bundle and exact-build offline worker generated.
- `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e`: five real Chromium workflows pass against the production preview, including offline reload and clipboard failure.
- `npm audit --audit-level=moderate --cache /tmp/agent-rules-npm-cache`: zero known vulnerabilities in the resolved dependency graph at check time. This is not a security certification.
- axe automated WCAG A/AA checks pass on the analyzed demo at widths 360, 768 and 1280 in dark mode, and in light mode at desktop width. Horizontal overflow is checked at all three widths, plus mobile light mode. Automated screenshots of desktop dark and mobile light were inspected.

No claims of a physical phone, a screen reader, Firefox/Safari, remote CI success, public deployment or absolute heuristic precision are made. Those remain release checks where relevant. The Playwright browser CDN was denied by this environment's network policy; the tests use the already installed Chromium. No network access was broadened or certificate verification bypassed.

## Manual walkthrough (about three minutes)

1. Run `npm ci`, `npm run build`, then `npm run preview`. Open the address printed by Vite. This is the actual app; no public demo deployment is assumed.
2. Start with an empty editor: “Check instructions” is disabled. Click “Load demo example”; the fictional file is now editable. Click “Check instructions”. Expect **3 findings**, **1 repeat**, **4 sections** and **19 physical lines**. One final newline counts as an empty physical line.
3. Find “Possible conflict — review required”. Both statements and file/line references must be visible. Click `AGENTS.md : 13`; source context appears and keyboard focus moves to line 13. It must not claim that a contradiction has been proven. Close the preview.
4. Click “Copy report”; paste into a local text editor and confirm evidence, line numbers and an unchecked checklist. Click “Download Markdown”; inspect the real downloaded `.md` file. If clipboard permissions are denied, an actionable error points to downloading instead.
5. Click “Compare a second file”. Drag a real UTF-8 Markdown file onto the second panel containing `# Scope` and `- Run the formatter before submitting changes.`. Analyze again; the additional repeated instruction must cite the second file and refer back to the first. Edit the second path/target and recheck: no unrelated always/never pair should become a conflict.
6. Expand “Lint rules” and disable the duplicate rule. Old results disappear until reanalysis; the next report must omit that rule. Re-enable it if desired. Mark checklist items manually; these checks are prompts, not generated validation results.
7. Test a UTF-8 file with accents and CRLF. Line references must match the original physical lines. Try a file larger than 204,800 bytes, malformed UTF-8, a `.js` file and a multi-file drop: each must produce an understandable error and preserve the previous valid text. Oversized pasted text must be marked invalid and prevent analysis.
8. Paste this fixture and analyze it:

   ````markdown
   # Scope

   Always run tests
   Never commit secrets

   ```text
   Always commit secrets
   Never run tests
   ```
   ````

   No possible-conflict finding should appear. Fenced examples do not count as instructions. Next use `Always run tests` / `Never run tests` outside the fence: a possible conflict must appear. Different paths and different word order must not match automatically.

9. Paste `- Follow best practices <script>alert(1)</script>` outside any fence. The evidence must display literal angle brackets; no script runs. Try an HTML image URL too; no image request should be issued. Check the Network tab to confirm that analysis and exports produce no network requests containing the rules.
10. Press Tab from a fresh page. “Skip to workspace” appears; Enter then Tab reaches the workspace controls. Navigate through textareas, upload controls, rule toggles, findings and checklist using keyboard alone. Switch both themes and inspect focus/contrast. In device emulation, check 360, 768 and 1280 px: no horizontal page overflow, and code context can scroll within its panel.
11. With production preview running, wait for `navigator.serviceWorker.ready` in DevTools. Toggle Network to Offline and reload. The app should reopen. Load the demo, analyze and download while offline. Restore networking after the check. The development server intentionally does not install the worker.
12. Clear the workspace; no prior findings remain. Reload; this app does not reload file contents. The chosen theme may persist.

## Before a public release

Review the actual repository identity and public visibility, choose a license, test with a screen reader and physical phone, deploy the static output over HTTPS, and repeat first-load/offline checks on that origin. The launch copy is a draft and must not imply user feedback, a video or a deployment that does not exist.

## Release hardening follow-up (22 October 2026)

The original commit's remote Checks workflow succeeded: https://github.com/uemmebi/AgentRules-Check/actions/runs/39674759319.

The follow-up adds an explicit dependency-audit gate, scope-isolated caches, browser lifecycle tests (A to B to A rollback and a second installation on the same origin), a production CSP, and post-deployment browser and HTTP checks. Local lint, all 33 unit tests, build and dependency audit passed on 22 October. The local Playwright browser download failed; browser results must be taken from the follow-up commit's remote CI, not inferred from the earlier run.

License approval, authenticated Pages setup and a successful public deployment remain separate release gates. No physical-phone or screen-reader check is claimed. See [release operations](release.md).
