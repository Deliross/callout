import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  acceptFriendRequest, addCollectionPost, createCollection, createFriendRequest, createPost, createUser,
  followUser, getPublicProfile, listCollections, listFollowConnections, reorderCollection, unfollowUser, updateUser
} from '../server/repository.mjs';

const account = async label => createUser({ email: `${label}-${Date.now()}-${Math.random()}@example.com`, displayName: label });

test('followers are one-way, idempotent and independent from friends', async () => {
  const owner = await account('Follow Owner');
  const follower = await account('Follower');
  assert.equal(await followUser(owner.id, owner.id), null);
  assert.equal((await followUser(follower.id, owner.id)).following, true);
  assert.equal((await followUser(follower.id, owner.id)).following, true);
  const followers = await listFollowConnections(owner.id, 'followers');
  assert.equal(followers.total, 1);
  assert.equal(followers.users[0].id, follower.id);
  assert.equal((await getPublicProfile(owner.id, follower.id)).isFollowing, true);
  assert.equal((await unfollowUser(follower.id, owner.id)).following, false);
  assert.equal((await listFollowConnections(owner.id, 'followers')).total, 0);
});

test('About and Activity privacy is filtered server-side for strangers and friends', async () => {
  const owner = await account('Private Profile');
  const stranger = await account('Stranger');
  const friend = await account('Friend');
  await updateUser(owner.id, { tagline: 'Hidden tagline', location: 'Malta', bio: 'Hidden biography', profileVisibility: { about: 'friends', activity: 'private' } });
  await createPost(owner.id, { content: 'A visible public contribution', category: 'Life', visibility: 'public', media: [] });
  const strangerView = await getPublicProfile(owner.id, stranger.id);
  assert.equal(strangerView.aboutVisible, false);
  assert.equal(strangerView.tagline, '');
  assert.deepEqual(strangerView.activity, []);
  const request = await createFriendRequest(friend.id, owner.id);
  await acceptFriendRequest(request.id, owner.id);
  const friendView = await getPublicProfile(owner.id, friend.id);
  assert.equal(friendView.aboutVisible, true);
  assert.equal(friendView.tagline, 'Hidden tagline');
  assert.equal(friendView.activityVisible, false);
  const ownerView = await getPublicProfile(owner.id, owner.id);
  assert.equal(ownerView.activityVisible, true);
  assert.ok(ownerView.activity.some(item => item.type === 'post'));
});

test('collections default private, enforce portfolio ownership and preserve ordering', async () => {
  const owner = await account('Collector');
  const other = await account('Other Author');
  const ownPost = await createPost(owner.id, { content: 'My portfolio piece', category: 'Life', visibility: 'public', media: [] });
  const secondPost = await createPost(owner.id, { content: 'My second portfolio piece', category: 'Life', visibility: 'public', media: [] });
  const outsidePost = await createPost(other.id, { content: 'A useful saved post', category: 'Life', visibility: 'public', media: [] });
  const portfolio = await createCollection(owner.id, { type: 'portfolio', title: 'Best work', description: '', coverUrl: '', visibility: 'private' });
  assert.equal(await addCollectionPost(portfolio.id, owner.id, outsidePost.id), null);
  await addCollectionPost(portfolio.id, owner.id, ownPost.id);
  await addCollectionPost(portfolio.id, owner.id, secondPost.id);
  let ownerCollections = await listCollections(owner.id, owner.id);
  assert.deepEqual(ownerCollections[0].posts.map(post => post.id), [ownPost.id, secondPost.id]);
  await reorderCollection(portfolio.id, owner.id, [secondPost.id, ownPost.id]);
  ownerCollections = await listCollections(owner.id, owner.id);
  assert.deepEqual(ownerCollections[0].posts.map(post => post.id), [secondPost.id, ownPost.id]);
  assert.deepEqual(await listCollections(owner.id, other.id), []);
  const saved = await createCollection(owner.id, { type: 'saved', title: 'References', description: '', coverUrl: '', visibility: 'public' });
  assert.ok(await addCollectionPost(saved.id, owner.id, outsidePost.id));
  assert.equal((await listCollections(owner.id, other.id)).length, 1);
});

test('profile UI uses the shared dossier, six tabs and new badge shelf', async () => {
  const [app, styles] = await Promise.all([
    readFile(new URL('../app.js', import.meta.url), 'utf8'),
    readFile(new URL('../styles.css', import.meta.url), 'utf8')
  ]);
  assert.match(app, /const profileTabNames = \['posts', 'guilds', 'heat', 'about', 'activity', 'collections'\]/);
  assert.match(app, /function profileDossier/);
  assert.match(app, /function profileBadgeShelf/);
  assert.match(app, /data-follow-user/);
  assert.match(app, /data-add-post-collection/);
  assert.doesNotMatch(app, /function digitalTrophyCabinet/);
  assert.match(styles, /\.profile-dossier\{/);
  assert.match(styles, /\.profile-badge-shelf/);
  assert.match(styles, /@media\(max-width:620px\).*\.profile-dossier/s);
});
