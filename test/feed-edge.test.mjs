import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const source = app.slice(app.indexOf('function feedPostActions('), app.indexOf('function feedQuickComposer('));
const context = vm.createContext({calloutGlyph:()=>'<svg></svg>'});
vm.runInContext(source, context);
const render = (based,hot,unlocked=true) => context.feedPostActions({id:'test',alrightVotes:based,cringeVotes:hot},24,false,unlocked,65,35);
test('footer shows actual counts, not percentages inside vote buttons', () => {
  const html = render(130,70);
  assert.match(html, /class="feed-count">130</);
  assert.match(html, /class="feed-count">70</);
  assert.match(html, /edge-based" style="width:65%"/);
  assert.match(html, /65% Based, 35% Hot Take · 200 votes/);
  assert.doesNotMatch(html, /class="feed-count">[^<]*%/);
});
test('locked results leak neither counts nor proportional fill', () => {
  const html = render(987,13,false);
  assert.doesNotMatch(html, /987|edge-based|edge-hot|width:/);
  assert.match(html, /Vote to reveal/);
  assert.match(html, /class="feed-count">24</);
});
test('zero votes are neutral; ties and extremes use exact proportions', () => {
  assert.match(render(0,0), /No votes yet/);
  assert.doesNotMatch(render(0,0), /edge-based/);
  assert.match(render(5,5), /width:50%/);
  assert.match(render(1,0), /edge-based" style="width:100%"/);
  assert.match(render(0,1), /edge-hot" style="width:100%"/);
});
test('reveal is short, vote-triggered, and respects both motion preferences', async () => {
  const css = await readFile(new URL('../assets/timeline.css', import.meta.url), 'utf8');
  assert.match(css, /feed-edge-reveal .3s/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /data-reduced-motion="true"/);
  assert.match(app, /classList.add\('is-revealing'\)/);
  assert.match(app, /resultsUnlocked: Boolean\(payload.post.resultsUnlocked\)/);
});
