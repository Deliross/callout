import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { featureFlags } from '../server/featureFlags.mjs';
import { createPost, createUser, heatTrophies, listAnonymousPosts, listPosts } from '../server/repository.mjs';
import { closeBattleSubmissions, createBattle, createTopic, featureEnabled, getAbout, heatTier, listBattles, listFeatureControls, selectBattleFinalists, submitBattleTake, topicAllowsWrites } from '../server/bigPatch.mjs';
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

test('Heat dashboard includes weekly and full-year activity views', async () => {
  const [app, styles] = await Promise.all([
    readFile(new URL('../app.js', import.meta.url), 'utf8'),
    readFile(new URL('../styles.css', import.meta.url), 'utf8')
  ]);
  assert.match(app, /function heatWeekStrip/);
  assert.match(app, /function heatYearActivity/);
  assert.match(app, /YEAR TO DATE/);
  assert.match(app, /ACTIVE DAYS/);
  assert.match(styles, /\.heat-streak-dashboard/);
  assert.match(styles, /\.heat-year-cells/);
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
  assert.equal(schemas.battle.validate({ title: 'Final Four', size: 4, submissionHours: 24, roundHours: 24, guild: null }).error, undefined);
  assert.ok(schemas.battle.validate({ title: 'Broken', size: 12 }).error);
  assert.ok(schemas.battleSubmission.validate({ text: '' }).error);
  assert.ok(schemas.pinboardEntry.validate({ text: '', attachments: [] }).error);
});

test('Battles page supports free authenticated hosting and separate Host and Join flows', async () => {
  const [app, server, styles] = await Promise.all([
    readFile(new URL('../app.js', import.meta.url), 'utf8'),
    readFile(new URL('../server.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../styles.css', import.meta.url), 'utf8')
  ]);
  assert.match(app, /Live Battles/);
  assert.match(app, /Host a Battle/);
  assert.match(app, /Join a Battle/);
  assert.match(app, /Your hosted Battles/);
  assert.match(app, /Takes unlock for your private review when submissions close/);
  assert.match(app, /How Battles work/);
  assert.match(app, /function prepareBattleHostForm/);
  assert.match(app, /Advanced options/);
  assert.match(app, /Cover image \(optional\)/);
  assert.match(app, /payload\.details\.join/);
  assert.match(server, /app\.post\('\/api\/battles', requireFeature\('battles'\), requireAuth, validate\(schemas\.battle\)/);
  assert.doesNotMatch(server, /app\.post\('\/api\/battles'[^\n]+requireAdmin/);
  assert.match(styles, /\.battle-host-action\{background:#ff4b2d\}/);
  assert.match(styles, /\.battle-join-action\{background:#52df4b\}/);
});

test('Battles keep submissions sealed, let only the host shortlist, and reveal anonymous brackets', async () => {
  const suffix = `${Date.now()}-${Math.random()}`;
  const host = await createUser({ email: `battle-host-${suffix}@example.com`, displayName: 'Battle Host' });
  const entrants = await Promise.all(Array.from({ length: 4 }, (_, index) => createUser({ email: `battle-viewer-${index}-${suffix}@example.com`, displayName: `Entrant ${index + 1}` })));
  const battle = await createBattle(host.id, {
    title: 'Best opening scene', description: 'Submit your strongest opinion.', category: 'Movies', privacy: 'public',
    coverUrl: '', votingRule: 'community', submissionHours: 24, roundHours: 6, guild: null, size: 4
  });
  assert.equal(battle.category, 'Movies');
  assert.equal(battle.status, 'submissions');
  assert.equal(battle.isHost, true);
  for (const [index, entrant] of entrants.entries()) await submitBattleTake(battle.id, entrant.id, { text: `Secret opinion ${index + 1}`, mediaUrl: '' });
  const entrantView = (await listBattles(entrants[0].id)).find(item => item.id === battle.id);
  assert.equal(entrantView.submissionCount, 4);
  assert.equal(entrantView.submissions.length, 0);
  assert.equal(entrantView.viewerSubmitted, true);
  await closeBattleSubmissions(battle.id, host.id);
  const hostView = (await listBattles(host.id)).find(item => item.id === battle.id);
  assert.equal(hostView.status, 'selection');
  assert.equal(hostView.submissions.length, 4);
  const live = await selectBattleFinalists(battle.id, host.id, hostView.submissions.map(item => item.id));
  assert.equal(live.status, 'live');
  const publicBracket = (await listBattles(entrants[0].id)).find(item => item.id === battle.id);
  assert.equal(publicBracket.entries.length, 4);
  assert.ok(publicBracket.entries.every(item => item.signalCode.startsWith('SIGNAL ')));
  assert.ok(publicBracket.entries.every(item => !item.authorName));
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
