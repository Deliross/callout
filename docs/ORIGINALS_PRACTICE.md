# Take Rush and Heat Wheel: isolated prototypes

Routes: `#take-rush`, `#heat-wheel`.

These are the two selected playable concepts, not production reward systems.
Every page labels sample results and practice Heat. There are no API writes,
real votes, paid spins, cash prizes, or changes to accounts, rankings or badges.

- Rush: 30 unique sample Takes, 10-second rounds, optional untimed mode,
  one answer per round, result reveal, streak, final score and device-local record.
- Wheel: three session-local demo spins, seven equally likely sample rewards,
  one additional spin per completed Rush run. Boost and badge outcomes are
  visual previews only. Votes/replies do not yet earn spins.
- Practice records use a separate localStorage key and are shared on this browser.
  Spins reset on reload. Navigating away cancels animation timers; already won
  wheel rewards are settled before animation.

Before real rewards are enabled, add authenticated server-owned sessions and
idempotent reward transactions; genuine eligible post selection with hidden
results; per-account daily caps; abuse protection; and account-bound spin grants.
Do not trust browser scores or localStorage to award actual Heat.

Feed framing is scoped to Home and Trending in `assets/timeline.css`.
Existing action-row markup, voting handlers and locked-result server logic are
unchanged. Dark surfaces use the existing resolved-theme preference.
