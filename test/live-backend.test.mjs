import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createPost, createUser } from '../server/repository.mjs';
import { addLiveMessage, createLiveCallout, createLiveRoom, endLiveRoom, getLiveRoom, joinLiveRoom, listLiveMessages, listLiveMoments, listLiveRooms, requestLiveMic, resetLiveMemoryStore, updateLiveParticipant, voteLiveCallout } from '../server/live.mjs';

const server = fs.readFileSync(new URL('../server.mjs', import.meta.url), 'utf8');

async function accounts() {
  const suffix = `${Date.now()}-${Math.random()}`;
  const host = await createUser({ email: `live-host-${suffix}@example.com`, displayName: 'Live Host' });
  const listener = await createUser({ email: `live-listener-${suffix}@example.com`, displayName: 'Live Listener' });
  return { host, listener };
}

test('Live persists rooms, membership, chat, mic permissions, votes and endings', async () => {
  resetLiveMemoryStore();
  const { host, listener } = await accounts();
  const post = await createPost(host.id, { title: 'College is a terrible investment for most people.', content: 'College is a terrible investment for most people.', category: 'Life', visibility: 'public' });
  const room = await createLiveRoom(host.id, { title: post.title, topic: 'Life', format: 'Debate', sourcePostId: post.id });
  assert.equal(room.host.id, host.id);
  assert.equal(room.sourcePostId, post.id);
  assert.equal(room.viewerRole, 'host');
  assert.equal((await listLiveRooms(listener.id))[0].id, room.id);

  let joined = await joinLiveRoom(room.id, listener.id);
  assert.equal(joined.viewerRole, 'listener');
  assert.equal(joined.participants.length, 2);
  joined = await requestLiveMic(room.id, listener.id);
  assert.equal(joined.micRequested, true);
  await assert.rejects(() => updateLiveParticipant(room.id, listener.id, listener.id, { role: 'speaker' }), /Only the room host/);
  const promoted = await updateLiveParticipant(room.id, host.id, listener.id, { role: 'speaker' });
  assert.equal(promoted.participants.find(person => person.id === listener.id).role, 'speaker');

  await addLiveMessage(room.id, listener.id, 'This is a real persisted live message.');
  assert.equal((await listLiveMessages(room.id))[0].sender.id, listener.id);
  await createLiveCallout(room.id, host.id, { speakerId: listener.id, quote: 'Degrees are becoming luxury status symbols.', duration: 20 });
  const voted = await voteLiveCallout(room.id, listener.id, 'hot');
  assert.equal(voted.currentCallout.hot, 1);
  assert.equal(voted.currentCallout.vote, 'hot');
  await new Promise(resolve => setTimeout(resolve, 22));
  const forcedResult = await endLiveRoom(room.id, host.id);
  assert.equal(forcedResult.moments[0].votes, 1);
  assert.equal(forcedResult.moments[0].hot, 1);
  assert.equal((await listLiveMoments(listener.id))[0].roomId, room.id);
  const ended = forcedResult;
  assert.equal(ended.status, 'ended');
  await assert.rejects(() => addLiveMessage(room.id, listener.id, 'Too late'), /Chat is closed/);
  assert.equal((await getLiveRoom(room.id, host.id)).endedAt instanceof Date || typeof ended.endedAt === 'string', true);
});

test('Live HTTP surface includes SSE updates and targeted WebRTC signaling', () => {
  for (const route of ['/api/live/rooms', '/api/live/moments', '/api/live/rooms/:id/stream', '/api/live/rooms/:id/chat', '/api/live/rooms/:id/mic-request', '/api/live/rooms/:id/callouts', '/api/live/rooms/:id/signal', '/api/live/rooms/:id/end']) assert.match(server, new RegExp(route.replaceAll('/', '\\/')));
  assert.match(server, /text\/event-stream/);
  assert.match(server, /pushLiveEvent\(room\.id/);
  assert.match(server, /targetUserId/);
});
