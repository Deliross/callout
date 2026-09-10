import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const live=fs.readFileSync(new URL('../assets/live.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../assets/live.css',import.meta.url),'utf8');

test('Live is a first-class Discover route and loads its isolated adapter',()=>{
  assert.match(html,/data-route="trending"[\s\S]*data-route="live"[\s\S]*data-route="guilds"/);
  assert.match(html,/assets\/live\.js\?v=20260910-backend/);
  assert.match(app,/const routes = new Set\(\[[^\]]*'live'/);
  assert.match(app,/live:\s*\(\) => CalloutLive\.view/);
});

test('Live completes Take to room to Call It Out to Moment to new Take loop',()=>{
  for(const token of ['Discuss Live','PINNED ORIGINAL TAKE','Call It Out','JUST SAID','co-live-countdown','Live Moment created','Create New Take','LIVE ENDED','Heat Generated','View Live Moments']) assert.match(app+live,new RegExp(token));
  assert.match(live,/currentCallout\.endsAt/);
  assert.match(live,/\/api\/live\/rooms/);
  assert.match(live,/function startCountdown/);
  assert.match(live,/function startFromPost/);
  assert.match(app,/prefillTakeFromLive/);
});

test('room rail includes chat instead of a Takes tab and both themes are responsive',()=>{
  assert.match(live,/\['activity','chat','people'\]/);
  assert.doesNotMatch(live,/\['people','takes'\]/i);
  assert.match(css,/data-resolved-theme="dark"/);
  assert.match(css,/@media\(max-width:760px\)/);
  assert.match(css,/prefers-reduced-motion:reduce/);
});
