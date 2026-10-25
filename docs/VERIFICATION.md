# Verification

Date: 2026-10-25. Node 24.18.0, pnpm 11.7.0, Playwright 1.64.1.

The page is tested through its public browser interface, using the local static server and bundled image/font assets. No public API or outside website is needed for the tests.

## Regression checks

1. Same calibrated visible bottle height and baseline across all three wines and preview images.
2. Full circular hover/hit area; clicking the rail does not change the wine.
3. Rapid switching, keyboard navigation and selected-state consistency.
4. Add/remove, exact totals, reload persistence and dialog focus restoration.
5. Rejection of malformed data, unknown IDs and invalid quantities.
6. Functional in-memory collection when browser storage is blocked.
7. Six viewport widths, all wine states: no horizontal overflow, no name/Next collision, stable baseline.
8. Mobile navigation, anchor destinations and Escape focus restoration.
9. Images load, JavaScript has the correct MIME type, local source/config files are not exposed by the preview server.

## Results

- Windows: **9/9 Chromium and 9/9 WebKit checks passed**. Syntax and formatting checks passed. `pnpm audit --audit-level=high` reported no known vulnerabilities.
- Firefox could not launch in this Windows environment (`spawn UNKNOWN`, before page creation). Installing its Playwright browser and retrying a single worker did not resolve the environment failure. This is not reported as a successful Firefox run.
- Linux GitHub Actions: **27/27 checks passed** in Chromium, Firefox and WebKit, and Pages deployment succeeded. [Verified run](https://github.com/memorim/domaine-laffitte-wine-landing/actions/runs/40220738477), application/test commit `0a51105`.
- The responsive baseline assertion uses document coordinates: Playwright's automatic scrolling to a selector must not be mistaken for a layout change. The tolerance remains 0.1px.
- Desktop and mobile previews in this repository were captured from the real local page by `pnpm capture`; they are not generated illustrations.
