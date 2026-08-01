import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { featureFlags } from '../server/featureFlags.mjs';
import { createPost, createUser, heatTrophies, listAnonymousPosts, listPosts } from '../server/repository.mjs';
import { createTopic, featureEnabled, getAbout, heatTier, listFeatureControls, topicAllowsWrites } from '../server/bigPatch.mjs';
import { schemas } from '../server/security.mjs';

test('all coordinated Big Patch capabilities have independent beta flags', async () => {
  for (const key of ['topics', 'anonymous', 'postStates', 'pinboards', 'battles', 'heatFrames', 'aboutWall', 'notificationUi']) {
    assert.equal(typeof featureFlags[key], 'boolean');
    assert.equal(await featureEnabled(key), featureFlags[key]);
  }
  assert.ok((await listFeatureControls()).every(item => typeof item.enabled === 'boolean'));
});

test('Heat frames use all six automatic tiers', () => {
  assert.deepEqual([0, 1000, 5000, 15000, 40000, 100000].map(score => heatTier(score).className), [
    'heat-fresh', 'heat-mild', 'heat-spicy', 'heat-certified', 'heat-firestarter', 'heat-hall'
  ]);
});

test('Heat Streak trophies replace the legacy badge system', () => {
  const trophies = heatTrophies(14);
  assert.deepEqual(trophies.filter(trophy => trophy.unlocked).map(trophy => trophy.key), ['first-spark', 'week-on-fire', 'heatwave']);
  assert.equal(trophies.some(trophy => /badge/i.test(trophy.name)), false);
});

test('anonymous posts are isolated from the normal feed and never expose an account id', async () => {
  const suffix = `${Date.now()}-${Math.random()}`;
  const author = await createUser({ email: `signal-${suffix}@example.com`, displayName: 'Hidden Author' });
  const viewer = await createUser({ email: `viewer-${suffix}@example.com`, displayName: 'Viewer' });
  const post = await createPost(author.id, { content: 'A masked opinion', category: 'Life', visibility: 'public', media: [], anonymous: true });
  assert.equal((await listPosts(viewer.id)).some(item => item.id === post.id), false);
  const publicItem = (await listAnonymousPosts(viewer.id)).find(item => item.id === post.id);
  assert.equal(publicItem.author.id, '');
  assert.match(publicItem.author.displayName, /^SIGNAL [A-F0-9]{3}$/);
  assert.equal(publicItem.anonymousOwner, false);
  const ownerItem = (await listAnonymousPosts(author.id)).find(item => item.id === post.id);
  assert.equal(ownerItem.author.id, '');
  assert.equal(ownerItem.anonymousOwner, true);
});

test('Topics become read-only vaults after expiry', async () => {
  const topic = await createTopic('staff-test', {
    title: 'Expired Moment', slug: '', description: '', rules: '', artworkUrl: '', accentColor: '#ff4713',
    startsAt: new Date(Date.now() - 7_200_000).toISOString(),
    endsAt: new Date(Date.now() - 3_600_000).toISOString(),
    featured: true
  });
  assert.equal(await topicAllowsWrites(topic.id), false);
});

test('About content is truthful project copy with all permanent sections', async () => {
  const about = await getAbout();
  assert.deepEqual(about.sections.map(section => section.title), [
    'Our Story', 'What Callout Is', 'Past and Current Development', 'Current Goals',
    'Future Vision', 'Project Status', 'Social Links', 'Safety and Community Principles'
  ]);
  assert.ok(about.sections.every(section => !/team of|employee|founder/i.test(section.body)));
});

test('Big Patch validators enforce battle, Topic and Pinboard limits', () => {
  assert.equal('predictionWager' in schemas, false);
  assert.equal(schemas.battle.validate({ title: 'Final Four', size: 4, status: 'live', guild: null, entries: ['A', 'B', 'C', 'D'].map(label => ({ label, imageUrl: '' })) }).error, undefined);
  assert.ok(schemas.battle.validate({ title: 'Broken', size: 8, status: 'live', entries: [{ label: 'Only one', imageUrl: '' }] }).error);
  assert.ok(schemas.pinboardEntry.validate({ text: '', attachments: [] }).error);
});

test('owner consoles are separate, hidden by default, and Battles is navigable', async () => {
  const [html, app, server, service] = await Promise.all([
    readFile(new URL('../index.html', import.meta.url), 'utf8'),
    readFile(new URL('../app.js', import.meta.url), 'utf8'),
    readFile(new URL('../server.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../server/bigPatch.mjs', import.meta.url), 'utf8')
  ]);
  assert.match(html, /href="#battles"[^>]+data-route="battles"/);
  assert.match(html, /id="analyticsNav"[^>]+hidden/);
  assert.match(html, /id="adminNav"[^>]+hidden/);
  assert.match(app, /analytics:\s*analyticsView,\s*admin:\s*adminControlView/);
  assert.match(app, /ADMIN CONSOLE · OWNER ONLY/);
  assert.match(server, /const isAdminAccount = user => Boolean\(user\?\.email && adminEmails\(\)\.has/);
  assert.match(service, /User\.find\(\{ email: \{ \$in: normalizedOwners \} \}\)/);
});
