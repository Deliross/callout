# Callout Big Patch API

The Big Patch ships behind independent, server-enforced feature controls. The
Owner can change them from the private Analytics console without redeploying.

## Public and account APIs

- `GET /api/features` — current beta availability.
- `GET /api/topics`, `GET /api/topics/:id` — Limited-Time Topics and Time Vaults.
- `GET /api/vaults` — read-only archived Topics.
- `GET /api/anonymous` — masked Anonymous feed.
- `POST /api/posts` — supports `anonymous` and a live `topic` ID.
- `POST /api/posts/:id/reveal` — irreversible author reveal.
- `POST /api/posts/:id/defense` — one eligible author Defense.
- `POST /api/posts/:id/redemption` — open a 72-hour Redemption.
- `POST /api/posts/:id/redemption/vote` — vote `redeemed` or `unchanged`.
- `GET /api/battles`, `POST /api/battles/:id/vote` — community brackets.
- `GET /api/guilds/:id/pinboard` — current board and retained archives.
- `POST /api/guilds/:id/pinboard` — chronological text/media message.
- `POST /api/guilds/:id/pinboard/reset` — permission-checked manual reset.
- `GET /api/about` — permanent project copy and Project Wall.

Every Topic write path, including Take voting and deletion, checks the Topic
state. Vaulted content returns HTTP `423` and cannot be mutated.

## Staff APIs

- `GET /api/admin/staff`, `PATCH /api/admin/staff/:id` — Owner-managed roles.
- `GET /api/admin/audit` — immutable security and product activity.
- `GET /api/admin/features`, `PATCH /api/admin/features/:key` — kill switches.
- `GET /api/admin/anonymous/:id` — audited identity resolution for moderation.
- `POST/PATCH /api/topics/:id` — staff Topic scheduling and control.
- `POST /api/battles` — staff Battle creation.
- `POST/PATCH/DELETE /api/admin/about` — Project Wall publishing.
- `DELETE /api/admin/posts/:id` and `/api/admin/comments/:id` — audited moderation.

Roles are ordered `Owner > Admin > Moderator > Member`. Authorization is
calculated on the server; frontend visibility is only a convenience.

## Scheduled state transitions

The lifecycle worker runs every minute and uses idempotent state checks:

- Topics: Scheduled → Live → Ended → Vaulted.
- Redemption: settle after 72 hours with Gold/Silver status.
- Battles: normal round → six-hour sudden death → high-seed fallback.
- Pinboards: five-hour cycles with seven-day archive retention.

Heat Level is permanent participation progress and cannot be purchased,
transferred, withdrawn, or wagered.
