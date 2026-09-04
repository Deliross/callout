import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createPost, createUser, listPosts, voteOnPost } from '../server/repository.mjs';
import { featureFlags } from '../server/featureFlags.mjs';
import { schemas } from '../server/security.mjs';

const [app, html, css] = await Promise.all([
  readFile(new URL('../app.js', import.meta.url), 'utf8'),
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../styles.css', import.meta.url), 'utf8')
]);

test('new Takes require a concise title and accept an optional description', () => {
  assert.ok(schemas.post.validate({ description: 'Context only', category: 'Life', media: [] }).error);
  assert.equal(schemas.post.validate({ title: 'School should start later', description: 'Students need more sleep.', category: 'Life', media: [] }).error, undefined);
  assert.ok(schemas.post.validate({ title: 'x'.repeat(161), category: 'Life', media: [] }).error);
  assert.ok(schemas.post.validate({ title: 'Valid title', description: 'x'.repeat(601), category: 'Life', media: [] }).error);
});

test('vote totals stay server-locked until the viewer votes while authors retain access', async () => {
  const suffix = `${Date.now()}-${Math.random()}`;
  const author = await createUser({ email: `feed-author-${suffix}@example.com`, passwordHash: 'hash', displayName: 'Author', handle: `@author_${String(Date.now()).slice(-6)}` });
  const viewer = await createUser({ email: `feed-viewer-${suffix}@example.com`, passwordHash: 'hash', displayName: 'Viewer', handle: `@viewer_${String(Date.now()).slice(-6)}` });
  const post = await createPost(author.id || author._id, { title: 'Blind voting makes results more honest', description: 'People should decide before seeing the crowd.', category: 'Life', media: [] });
  const postId = String(post.id || post._id);

  const ownerView = (await listPosts(String(author.id || author._id))).find(item => item.id === postId);
  const lockedView = (await listPosts(String(viewer.id || viewer._id))).find(item => item.id === postId);
  assert.equal(ownerView.resultsUnlocked, true);
  assert.equal(ownerView.alrightVotes, 0);
  assert.equal(lockedView.resultsUnlocked, false);
  assert.equal(lockedView.alrightVotes, null);
  assert.equal(lockedView.voteSummary.locked, true);

  await voteOnPost(postId, String(viewer.id || viewer._id), 'alright');
  const revealedView = (await listPosts(String(viewer.id || viewer._id))).find(item => item.id === postId);
  assert.equal(revealedView.resultsUnlocked, true);
  assert.equal(revealedView.alrightVotes, 1);
  assert.equal(revealedView.voteSummary.total, 1);
});

test('Battles starts waiting and the owner controls it through a persistent show or hide action', () => {
  assert.equal(featureFlags.battles, false);
  assert.match(html, /data-feature-nav="battles" hidden/);
  assert.match(app, /Waiting Features/);
  assert.match(app, /Hide from site/);
  assert.match(app, /Show on site/);
  assert.match(app, /featureUnavailableView\('Battles'\)/);
  assert.match(css, /\.waiting-feature-list article/);
  assert.match(css, /\.main-content\[data-route="home"\],\.main-content\[data-route="trending"\]\s*\{[^}]*820px/);
});

test('compact feed uses title, description, no bar chart, and five icon actions', () => {
  const template = app.slice(app.indexOf('function postTemplate'), app.indexOf('function formatPostContent'));
  const actions = app.slice(app.indexOf('function feedPostActions'), app.indexOf('function feedQuickComposer'));
  assert.match(template, /take-description/);
  assert.doesNotMatch(template, /feed-verdict/);
  assert.match(actions, /basedPercent/);
  assert.match(actions, /hotPercent/);
  assert.match(actions, /data-open-take/);
  assert.match(actions, /data-vote="alright"/);
  assert.match(actions, /data-vote="cringe"/);
  assert.match(actions, /data-feed-share/);
  assert.match(actions, /data-save-post/);
  assert.doesNotMatch(actions, /data-post-menu/);
});
