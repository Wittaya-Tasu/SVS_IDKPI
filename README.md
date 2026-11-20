# SVS Individual KPI

GitHub Pages frontend for the existing SVS Individual KPI application.

## Architecture

Browser → direct HTTPS POST to Google Apps Script → existing private Google Sheet.
Evidence files remain in the pre-existing Google Drive folders.
No Cloudflare service, iframe, JSONP, or Google account cookies are used for KPI API requests.
Gmail sign-in is needed only when opening a shared Drive folder.

- Existing username/password and role checks stay on the GAS server.
- Session tokens are sent in POST bodies and kept in browser sessionStorage.
- Frontend never contains account hashes, passwords, score records, roster seeds, or owner OAuth credentials.
- API responses must explicitly acknowledge success; uncertain writes are never automatically retried.
- Draft autosave and submitted-assessment unlocking rules remain unchanged.

## Files

- `index.html`, `app.js`, `styles.css`, `svs-logo.png`: static frontend preserving the existing Thai interface.
- `transport.js`: direct cross-origin GAS transport (`credentials: omit`).
- `http_gateway.js`: HTTP adapter to add to the existing private GAS project; it delegates to existing authentication and authorization.
- `build_frontend.py`: rebuild using `python3 build_frontend.py /absolute/path/to/private/GAS/source`. The private source must not be committed here.
- `transport.test.mjs`: run with `node transport.test.mjs`.

Deploy GitHub Pages from `main`, root. Backend updates are deployed separately in Apps Script; this repository does not include the private server source or real assessment data.

## Export update · 19 November 2026

- Each completed KPI grade includes its meaning; the color legend explains per-KPI grades, not the overall weighted score.
- Detail rows are grouped under KPI headings; Sponsor project scores appear under the KPI6 group for authorized viewers.
- Hidden KPI6 is excluded as before. No formulas, submitted records or backend authorization changed.
- Fixed literal variable text in the PNG KPI count.
- `report_view.js` is the report source used by the frontend builder. Report tests: `node report.test.mjs`.

### Display refinement · v3.0.2

The grade column shows numeric grades only. Percentages are rounded to whole numbers for display; grading still uses original precision. Non-applicable KPI summary and detail groups are muted gray in HTML and PNG. The two risk-assessment labels use โครงการส่งเสริม/เล้าขาย, including display of submitted snapshots; stored criteria and scores are untouched.

## Presence and navigation · v3.1.0

- Signed-in users see an approximate count of unique accounts active within two minutes. Normal authenticated API responses update it; a visible idle tab refreshes about once a minute with jitter. Hidden tabs stop polling, and stale counts become unknown.
- Multiple sessions/tabs for one username count once. Logout/closed tabs age out within the window. Cache eviction may temporarily undercount; this is informational and never blocks entry.
- Only count/time/window metadata is returned. Names, usernames and score data are never returned by presence. Every heartbeat validates the normal app session.
- The presence map uses GAS ScriptCache only, a short non-blocking lock, no presence sheet and no writes to assessment records. Presence failures do not abort saves. Existing session verification still uses the original server authentication.
- Account name, username and logout are aligned in a separate account toolbar.
- Server integration: add `presence.js` to the private server, set `REQUEST_PRESENCE_=presenceUpdate_(actor)` immediately after `authCall` validates its session, and handle `getPresence` before loading KPI definitions. Deploy the updated `http_gateway.js` with this module.
- Frontend build sources: `header.html`, `header.css`, `presence_client.js`; tests: `node presence.test.mjs`.


## v3.2.0 — production release
Team heads can open the own-team member from the team table, explicitly reopen submitted assessments, edit self-assessed KPIs and resubmit. Backend must enforce year-specific team ownership. KPI6 remains assigned-Sponsor/Admin only.

The new progress tab is available only to the Admin and the two specifically authorized executives. It shows aggregate team counts only: not started, in progress, self-complete, submitted and complete including Sponsor. Demo accounts are excluded.

Backend v3.2.0 deployed as GAS Version17 on 20 November 2026. Expanded own-team editing access was confirmed by the owner. Frontend released through PR #1; existing URL and accounts retained.

Validation: `node progress.test.mjs`, `node report.test.mjs`, `node presence.test.mjs`, `node transport.test.mjs`. Private backend access tests and regression suite are maintained outside this public repository.
