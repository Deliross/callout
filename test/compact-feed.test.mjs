import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [app, html, css] = await Promise.all([
  readFile(new URL('../app.js', import.meta.url), 'utf8'),
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../styles.css', import.meta.url), 'utf8')
]);

test('home feed stays compact and does not render Callout emoji reactions', () => {
  const template = app.slice(app.indexOf('function postTemplate'), app.indexOf('function formatPostContent'));
  const actions = app.slice(app.indexOf('function feedPostActions'), app.indexOf('function feedQuickComposer'));

  assert.match(app, /function feedQuickComposer\(\)/);
  assert.match(app, /class="feed-count"/);
  assert.doesNotMatch(template, /postEmojiPicker\(post\)/);
  assert.doesNotMatch(actions, /postEmojiPicker\(post\)/);
  assert.match(css, /\.take-card-feed \.take-content h2[^}]+15px\/1\.35/);
  assert.match(css, /@keyframes feed-number-settle/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /\.feed-tabs \{ gap:0; padding-inline:0; \}/);
  assert.match(css, /\.topbar \{ grid-template-columns:96px minmax\(0,1fr\) 42px 42px; \}/);
});

test('sidebar navigation is grouped into the approved sections', () => {
  for (const section of ['Discover', 'Social', 'Originals', 'Account']) {
    assert.match(html, new RegExp(`>${section}<`));
  }
  assert.match(html, /data-route="notifications"/);
  assert.match(html, /styles\.css\?v=20260906-timeline/);
  assert.match(html, /app\.js\?v=20260906-edge/);
});
