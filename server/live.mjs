import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { LiveRoom } from './models/LiveRoom.mjs';
import { LiveMessage } from './models/LiveMessage.mjs';
import { canAccessPost, findUserById, getPublicPost } from './repository.mjs';

const rooms = new Map();
const messages = new Map();
const mongo = () => mongoose.connection.readyState === 1;
const id = value => String(value?._id || value?.id || value || '');
const copy = value => JSON.parse(JSON.stringify(value));
const notFound = () => Object.assign(new Error('Live room not found.'), { status: 404 });
const forbidden = message => Object.assign(new Error(message), { status: 403 });

async function userCard(userId) {
  const user = await findUserById(userId);
  return user ? { id: id(user), displayName: user.displayName, handle: user.handle, avatarUrl: user.avatarUrl || '' } : null;
}

async function finishExpiredCallout(room) {
  const callout = room.currentCallout;
  if (!callout || callout.endedAt || new Date(callout.endsAt).getTime() > Date.now()) return false;
  const based = (callout.basedVoters || []).length;
  const hot = (callout.hotVoters || []).length;
  const total = based + hot;
  callout.endedAt = new Date();
  if (total > 0) room.moments = [{ key: callout.key, speakerName: callout.speakerName, quote: callout.quote, based, hot, votes: total, listenerCount: activeParticipants(room).length, createdAt: new Date() }, ...(room.moments || [])].slice(0, 50);
  room.stats.totalVotes = Number(room.stats?.totalVotes || 0) + total;
  room.stats.heatGenerated = Number(room.stats?.heatGenerated || 0) + total;
  return true;
}

const activeParticipants = room => (room.participants || []).filter(person => !person.leftAt);
function memoryRoom(roomId) { const room = rooms.get(String(roomId)); if (!room) throw notFound(); return room; }
function assertHost(room, userId) { if (id(room.host) !== String(userId)) throw forbidden('Only the room host can do that.'); }

async function saveRoom(room) {
  if (typeof room.save === 'function') await room.save();
  else rooms.set(String(room.id), room);
  return room;
}

async function loadRoom(roomId) {
  if (mongo()) {
    const room = await LiveRoom.findById(roomId);
    if (!room) throw notFound();
    if (await finishExpiredCallout(room)) await room.save();
    return room;
  }
  const room = memoryRoom(roomId);
  await finishExpiredCallout(room);
  return room;
}

export async function liveRoomPayload(roomValue, viewerId = '') {
  const room = typeof roomValue === 'string' ? await loadRoom(roomValue) : roomValue;
  const host = await userCard(id(room.host));
  const participants = (await Promise.all(activeParticipants(room).map(async person => {
    const user = await userCard(id(person.user));
    return user ? { ...user, role: person.role, mic: Boolean(person.mic), joinedAt: person.joinedAt } : null;
  }))).filter(Boolean);
  const requestIds = (room.micRequests || []).map(request => id(request.user));
  const callout = room.currentCallout ? {
    id: room.currentCallout.key, speakerId: id(room.currentCallout.speaker), speakerName: room.currentCallout.speakerName,
    quote: room.currentCallout.quote, based: (room.currentCallout.basedVoters || []).length, hot: (room.currentCallout.hotVoters || []).length,
    vote: (room.currentCallout.basedVoters || []).some(value => id(value) === String(viewerId)) ? 'based' : (room.currentCallout.hotVoters || []).some(value => id(value) === String(viewerId)) ? 'hot' : '',
    startedAt: room.currentCallout.startedAt, endsAt: room.currentCallout.endsAt, endedAt: room.currentCallout.endedAt
  } : null;
  return {
    id: id(room), title: room.title, topic: room.topic, format: room.format, status: room.status, host,
    sourcePostId: id(room.sourcePost), sourceTake: room.sourceTake || '', participants,
    micRequested: requestIds.includes(String(viewerId)), micRequests: id(room.host) === String(viewerId) ? requestIds : [],
    currentCallout: callout, moments: copy(room.moments || []).map(moment => ({ ...moment, listeners: Number(moment.listenerCount || 0), listenerCount: undefined })), stats: copy(room.stats || {}), scheduledFor: room.scheduledFor,
    createdAt: room.createdAt, endedAt: room.endedAt, viewerRole: participants.find(person => person?.id === String(viewerId))?.role || 'guest'
  };
}

export async function listLiveRooms(viewerId = '', filter = 'for-you') {
  const query = filter === 'scheduled' ? { status: 'scheduled' } : { status: 'live' };
  const found = mongo() ? await LiveRoom.find(query).sort({ 'stats.peakListeners': -1, updatedAt: -1 }).limit(40) : [...rooms.values()].filter(room => room.status === query.status);
  const payloads = await Promise.all(found.map(room => liveRoomPayload(room, viewerId)));
  if (filter === 'following') return payloads.filter(room => room.participants.some(person => person.id === String(viewerId)));
  return filter === 'trending' ? payloads.sort((a, b) => Number(b.stats?.peakListeners || 0) - Number(a.stats?.peakListeners || 0)) : payloads;
}

export async function listLiveMoments(viewerId = '') {
  const found = mongo()
    ? await LiveRoom.find({ 'moments.0': { $exists: true } }).sort({ updatedAt: -1 }).limit(40)
    : [...rooms.values()].filter(room => (room.moments || []).length);
  const roomPayloads = await Promise.all(found.map(room => liveRoomPayload(room, viewerId)));
  return roomPayloads.flatMap(room => (room.moments || []).map(moment => ({
    ...moment,
    roomId: room.id,
    roomTitle: room.title,
    roomStatus: room.status,
    listeners: room.participants.length
  }))).sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()).slice(0, 20);
}

export async function createLiveRoom(hostId, values) {
  let sourceTake = '';
  if (values.sourcePostId) {
    if (!await canAccessPost(values.sourcePostId, hostId)) throw forbidden('That Take is not available to this account.');
    const post = await getPublicPost(values.sourcePostId);
    if (!post || post.anonymous || id(post.author) !== String(hostId)) throw forbidden('Only the public Take author can discuss it Live.');
    sourceTake = post.title || post.content;
  }
  const data = { title: values.title || sourceTake, topic: values.topic || 'Life', format: values.format || 'Debate', status: values.scheduledFor ? 'scheduled' : 'live', host: hostId, sourcePost: values.sourcePostId || null, sourceTake, participants: [{ user: hostId, role: 'host', mic: false, joinedAt: new Date(), leftAt: null }], micRequests: [], moments: [], stats: { heatGenerated: 0, peakListeners: 1, totalVotes: 0 }, scheduledFor: values.scheduledFor || null, createdAt: new Date(), updatedAt: new Date() };
  if (mongo()) return liveRoomPayload(await LiveRoom.create(data), hostId);
  data.id = crypto.randomUUID(); rooms.set(data.id, data); return liveRoomPayload(data, hostId);
}

export async function getLiveRoom(roomId, viewerId = '') { return liveRoomPayload(await loadRoom(roomId), viewerId); }

export async function joinLiveRoom(roomId, userId) {
  const room = await loadRoom(roomId); if (room.status !== 'live') throw Object.assign(new Error('This Live room has ended.'), { status: 409 });
  let person = (room.participants || []).find(item => id(item.user) === String(userId));
  if (person) person.leftAt = null;
  else room.participants.push({ user: userId, role: 'listener', mic: false, joinedAt: new Date(), leftAt: null });
  room.stats.peakListeners = Math.max(Number(room.stats?.peakListeners || 0), activeParticipants(room).length);
  await saveRoom(room); return liveRoomPayload(room, userId);
}

export async function leaveLiveRoom(roomId, userId) {
  const room = await loadRoom(roomId); const person = room.participants.find(item => id(item.user) === String(userId));
  if (person && person.role !== 'host') { person.leftAt = new Date(); person.mic = false; }
  room.micRequests = (room.micRequests || []).filter(request => id(request.user) !== String(userId));
  await saveRoom(room); return liveRoomPayload(room, userId);
}

export async function requestLiveMic(roomId, userId) {
  const room = await loadRoom(roomId); if (!activeParticipants(room).some(person => id(person.user) === String(userId))) throw forbidden('Join the room before requesting the mic.');
  const existing = (room.micRequests || []).some(request => id(request.user) === String(userId));
  room.micRequests = existing ? room.micRequests.filter(request => id(request.user) !== String(userId)) : [...(room.micRequests || []), { user: userId, createdAt: new Date() }];
  await saveRoom(room); return liveRoomPayload(room, userId);
}

export async function updateLiveParticipant(roomId, hostId, userId, values) {
  const room = await loadRoom(roomId); const selfUpdate = String(hostId) === String(userId) && !values.remove && (!values.role || values.role === 'listener');
  if (!selfUpdate) assertHost(room, hostId);
  const person = room.participants.find(item => id(item.user) === String(userId)); if (!person) throw notFound();
  if (selfUpdate && typeof values.mic === 'boolean' && !['host', 'speaker'].includes(person.role)) throw forbidden('Only people on stage can use a microphone.');
  if (String(userId) === String(hostId) && values.role && values.role !== 'host') throw forbidden('The host cannot remove their own host role.');
  if (values.role) person.role = values.role;
  if (typeof values.mic === 'boolean') person.mic = values.mic;
  if (values.remove) { person.leftAt = new Date(); person.mic = false; }
  room.micRequests = (room.micRequests || []).filter(request => id(request.user) !== String(userId));
  await saveRoom(room); return liveRoomPayload(room, hostId);
}

export async function createLiveCallout(roomId, hostId, values) {
  const room = await loadRoom(roomId); assertHost(room, hostId);
  if (room.status !== 'live') throw Object.assign(new Error('This room is no longer live.'), { status: 409 });
  if (room.currentCallout && !room.currentCallout.endedAt && new Date(room.currentCallout.endsAt).getTime() > Date.now()) throw Object.assign(new Error('A Call It Out vote is already running.'), { status: 409 });
  const speaker = values.speakerId ? activeParticipants(room).find(person => id(person.user) === String(values.speakerId)) : null;
  const speakerCard = speaker ? await userCard(values.speakerId) : null;
  const startedAt = new Date(); room.currentCallout = { key: crypto.randomUUID(), speaker: speaker ? values.speakerId : null, speakerName: speakerCard?.displayName || values.speakerName || 'Speaker', quote: values.quote, basedVoters: [], hotVoters: [], startedAt, endsAt: new Date(startedAt.getTime() + values.duration * 1000), endedAt: null };
  await saveRoom(room); return liveRoomPayload(room, hostId);
}

export async function voteLiveCallout(roomId, userId, value) {
  const room = await loadRoom(roomId); const callout = room.currentCallout;
  if (!callout || callout.endedAt || new Date(callout.endsAt).getTime() <= Date.now()) throw Object.assign(new Error('This live vote has ended.'), { status: 409 });
  if (!activeParticipants(room).some(person => id(person.user) === String(userId))) throw forbidden('Join the room before voting.');
  callout.basedVoters = (callout.basedVoters || []).filter(entry => id(entry) !== String(userId));
  callout.hotVoters = (callout.hotVoters || []).filter(entry => id(entry) !== String(userId));
  callout[value === 'based' ? 'basedVoters' : 'hotVoters'].push(userId);
  await saveRoom(room); return liveRoomPayload(room, userId);
}

export async function endLiveRoom(roomId, hostId) {
  const room = await loadRoom(roomId); assertHost(room, hostId);
  if (room.currentCallout && !room.currentCallout.endedAt) room.currentCallout.endsAt = new Date();
  await finishExpiredCallout(room);
  room.status = 'ended'; room.endedAt = new Date(); activeParticipants(room).forEach(person => { person.mic = false; });
  await saveRoom(room); return liveRoomPayload(room, hostId);
}

export async function addLiveMessage(roomId, userId, text) {
  const room = await loadRoom(roomId); if (room.status !== 'live') throw Object.assign(new Error('Chat is closed because this room ended.'), { status: 409 });
  if (!activeParticipants(room).some(person => id(person.user) === String(userId))) throw forbidden('Join the room before chatting.');
  if (mongo()) {
    const saved = await LiveMessage.create({ room: roomId, sender: userId, text });
    return { id: id(saved), text, sender: await userCard(userId), createdAt: saved.createdAt };
  }
  const message = { id: crypto.randomUUID(), room: roomId, text, sender: await userCard(userId), createdAt: new Date() };
  messages.set(String(roomId), [...(messages.get(String(roomId)) || []), message]); return copy(message);
}

export async function listLiveMessages(roomId) {
  await loadRoom(roomId);
  if (mongo()) return Promise.all((await LiveMessage.find({ room: roomId }).sort({ createdAt: 1 }).limit(200).lean()).map(async message => ({ id: id(message), text: message.text, sender: await userCard(id(message.sender)), createdAt: message.createdAt })));
  return copy(messages.get(String(roomId)) || []);
}

export function resetLiveMemoryStore() { rooms.clear(); messages.clear(); }
