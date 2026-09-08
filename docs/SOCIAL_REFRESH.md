# Social refresh — September 2026

Adds Feed/Swipe/Loops navigation; hides the three archived features behind the existing owner controls; moves Idea Archive to Social. Existing routes and data remain intact.

Loops are explicit, single-video posts. The server probes local uploaded bytes (8 MB, 25 seconds, 9:16). Old videos remain normal posts. Discovery reuses locked vote serialization and excludes restricted content. Swipe uses normal votes, not game rewards.

Browser account grants live in MongoDB (memory only in development). An opaque HttpOnly cookie identifies the browser, up to five grants reference revocable login sessions, and access tokens are bound to the selected account/session. Account mutations require same-origin intent headers. Account changes reload state and notify other tabs. Local storage retains preferences only.

Shared styling refreshes Guilds, Trending, Saved, Messages, Notifications, account controls, Heat presentation and charcoal-green dark mode. No Heat calculations change.

Validation:
- Run node --test for unit/regression tests.
- scripts/qa-refresh.cjs checks routes and 390/768/1440-pixel dark layouts.
- scripts/qa-account-flow.cjs checks the local multi-account flow, stale writes/tokens and logout.
- scripts/qa-loop-flow.cjs generates a local test video and checks real upload, discovery and live preview.
- Browser scripts use PLAYWRIGHT_PATH when Playwright is supplied by the workspace runtime. Run them only against the local memory server; they create test accounts/content there.

Production-specific follow-up: Google OAuth and MongoDB concurrency need authenticated production/staging verification. Never create test posts in the public production feed.
