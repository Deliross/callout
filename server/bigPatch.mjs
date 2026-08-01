import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { User } from './models/User.mjs';
import { Post } from './models/Post.mjs';
import { Guild } from './models/Guild.mjs';
import { GuildMessage } from './models/GuildMessage.mjs';
import { GuildMembership } from './models/GuildMembership.mjs';
import { GuildRole } from './models/GuildRole.mjs';
import { Notification } from './models/Notification.mjs';
import { Comment } from './models/Comment.mjs';
import { featureFlags } from './featureFlags.mjs';

const topicSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 100 },
  slug: { type: String, required: true, unique: true, lowercase: true, maxlength: 120 },
  description: { type: String, default: '', maxlength: 500 },
  rules: { type: String, default: '', maxlength: 1000 },
  artworkUrl: { type: String, default: '', maxlength: 2_800_000 },
  accentColor: { type: String, default: '#ff4713', match: /^#[0-9a-fA-F]{6}$/ },
  startsAt: { type: Date, required: true, index: true },
  endsAt: { type: Date, required: true, index: true },
  state: { type: String, enum: ['scheduled', 'live', 'ended', 'vaulted'], default: 'scheduled', index: true },
  featured: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vaultedAt: { type: Date, default: null }
}, { timestamps: true });

const battleSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 100 },
  guild: { type: mongoose.Schema.Types.ObjectId, ref: 'Guild', default: null, index: true },
  size: { type: Number, enum: [4, 8], required: true },
  status: { type: String, enum: ['draft', 'live', 'sudden_death', 'complete'], default: 'draft', index: true },
  entries: [{
    _id: false,
    seed: { type: Number, required: true },
    label: { type: String, required: true, maxlength: 100 },
    imageUrl: { type: String, default: '', maxlength: 2_800_000 }
  }],
  rounds: [{
    _id: false,
    round: Number,
    match: Number,
    leftSeed: Number,
    rightSeed: Number,
    leftVotes: { type: Number, default: 0 },
    rightVotes: { type: Number, default: 0 },
    voters: [{ user: mongoose.Schema.Types.ObjectId, seed: Number }],
    winnerSeed: { type: Number, default: null },
    suddenDeathUntil: { type: Date, default: null }
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startsAt: { type: Date, default: Date.now },
  endsAt: { type: Date, default: null }
}, { timestamps: true });

const aboutUpdateSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 120 },
  body: { type: String, required: true, maxlength: 4000 },
  label: { type: String, enum: ['building', 'shipped', 'milestone', 'coming_soon'], default: 'building' },
  pinned: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const platformAuditSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, required: true, maxlength: 100, index: true },
  targetType: { type: String, required: true, maxlength: 60 },
  targetId: { type: String, default: '', maxlength: 120 },
  details: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: { createdAt: true, updatedAt: false } });
const featureOverrideSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, maxlength: 60 },
  enabled: { type: Boolean, required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export const Topic = mongoose.models.Topic || mongoose.model('Topic', topicSchema);
export const Battle = mongoose.models.Battle || mongoose.model('Battle', battleSchema);
export const AboutUpdate = mongoose.models.AboutUpdate || mongoose.model('AboutUpdate', aboutUpdateSchema);
export const PlatformAudit = mongoose.models.PlatformAudit || mongoose.model('PlatformAudit', platformAuditSchema);
export const FeatureOverride = mongoose.models.FeatureOverride || mongoose.model('FeatureOverride', featureOverrideSchema);

const memory = {
  topics: new Map(),
  battles: new Map(),
  about: new Map(),
  audit: [],
  pinboard: new Map()
  ,features: new Map()
};

const connected = () => mongoose.connection.readyState === 1;
const plain = value => {
  if (!value) return null;
  const result = typeof value.toObject === 'function' ? value.toObject() : { ...value };
  result.id = String(result._id || result.id);
  delete result._id;
  delete result.__v;
  return result;
};
const postId = post => String(post?._id || post?.id || '');
const currentBoardCycle = (date = new Date()) => String(Math.floor(date.getTime() / (5 * 60 * 60 * 1000)));
const anonymousCode = () => `SIGNAL ${crypto.randomBytes(2).toString('hex').toUpperCase().slice(0, 3)}`;
const now = () => new Date();

export function heatTier(score = 0) {
  const tiers = [
    { level: 1, name: 'Fresh Take', className: 'heat-fresh', threshold: 0, next: 1000 },
    { level: 2, name: 'Mild Heat', className: 'heat-mild', threshold: 1000, next: 5000 },
    { level: 3, name: 'Spicy Take', className: 'heat-spicy', threshold: 5000, next: 15000 },
    { level: 4, name: 'Certified Hot Take', className: 'heat-certified', threshold: 15000, next: 40000 },
    { level: 5, name: 'Firestarter', className: 'heat-firestarter', threshold: 40000, next: 100000 },
    { level: 6, name: 'Hall of Heat', className: 'heat-hall', threshold: 100000, next: null }
  ];
  return [...tiers].reverse().find(tier => Number(score) >= tier.threshold) || tiers[0];
}

export async function recordPlatformAudit(actor, action, targetType, targetId = '', details = {}) {
  const value = { actor, action, targetType, targetId: String(targetId || ''), details, createdAt: now() };
  if (connected()) return PlatformAudit.create(value);
  value.id = crypto.randomUUID();
  memory.audit.unshift(value);
  return value;
}

export async function commentAllowsWrites(commentId) {
  if (!connected()) return true;
  const comment = await Comment.findById(commentId).select('post').lean();
  return comment ? postAllowsWrites(comment.post) : true;
}

export async function listPlatformAudit(limit = 200) {
  if (connected()) return (await PlatformAudit.find().sort({ createdAt: -1 }).limit(limit).populate('actor', 'displayName handle avatarUrl staffRole').lean()).map(plain);
  return memory.audit.slice(0, limit).map(plain);
}

export async function featureEnabled(key) {
  if (!(key in featureFlags)) return false;
  if (connected()) {
    const override = await FeatureOverride.findOne({ key }).select('enabled').lean();
    return override ? Boolean(override.enabled) : Boolean(featureFlags[key]);
  }
  return memory.features.has(key) ? memory.features.get(key) : Boolean(featureFlags[key]);
}

export async function listFeatureControls() {
  const overrides = connected() ? await FeatureOverride.find().lean() : [...memory.features].map(([key, enabled]) => ({ key, enabled }));
  const map = new Map(overrides.map(item => [item.key, Boolean(item.enabled)]));
  return Object.entries(featureFlags).map(([key, defaultEnabled]) => ({ key, enabled: map.has(key) ? map.get(key) : defaultEnabled, defaultEnabled, overridden: map.has(key) }));
}

export async function setFeatureControl(actorId, key, enabled) {
  if (!(key in featureFlags)) return null;
  if (connected()) await FeatureOverride.findOneAndUpdate({ key }, { enabled, updatedBy: actorId }, { upsert: true, new: true, runValidators: true });
  else memory.features.set(key, Boolean(enabled));
  await recordPlatformAudit(actorId, enabled ? 'feature.enabled' : 'feature.disabled', 'feature', key);
  return { key, enabled: Boolean(enabled), overridden: true };
}

async function syncTopicState(topic) {
  const time = Date.now();
  let next = topic.state;
  if (topic.state !== 'vaulted') {
    if (new Date(topic.startsAt).getTime() > time) next = 'scheduled';
    else if (new Date(topic.endsAt).getTime() > time) next = 'live';
    else next = 'vaulted';
  }
  if (next !== topic.state) {
    topic.state = next;
    if (next === 'vaulted') topic.vaultedAt = now();
    if (typeof topic.save === 'function') await topic.save();
  }
  return topic;
}

export async function listTopics({ includeScheduled = true } = {}) {
  const items = connected()
    ? await Topic.find(includeScheduled ? {} : { state: { $ne: 'scheduled' } }).sort({ startsAt: -1 }).lean()
    : [...memory.topics.values()].filter(item => includeScheduled || item.state !== 'scheduled');
  return Promise.all(items.map(async item => plain(await syncTopicState(item))));
}

export async function getTopic(idOrSlug) {
  const topic = connected()
    ? await Topic.findOne(mongoose.isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug })
    : memory.topics.get(String(idOrSlug)) || [...memory.topics.values()].find(item => item.slug === idOrSlug);
  return topic ? plain(await syncTopicState(topic)) : null;
}

export async function createTopic(actorId, values) {
  const slug = String(values.slug || values.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 110);
  const item = { ...values, slug, createdBy: actorId, state: new Date(values.startsAt) > now() ? 'scheduled' : 'live', createdAt: now(), updatedAt: now() };
  if (connected()) return plain(await Topic.create(item));
  item.id = crypto.randomUUID();
  memory.topics.set(item.id, item);
  await recordPlatformAudit(actorId, 'topic.created', 'topic', item.id, { title: item.title });
  return plain(item);
}

export async function updateTopic(actorId, id, values) {
  let topic;
  if (connected()) topic = await Topic.findByIdAndUpdate(id, values, { new: true, runValidators: true });
  else {
    topic = memory.topics.get(String(id));
    if (topic) Object.assign(topic, values, { updatedAt: now() });
  }
  if (!topic) return null;
  await recordPlatformAudit(actorId, 'topic.updated', 'topic', id, { fields: Object.keys(values) });
  return plain(await syncTopicState(topic));
}

export async function topicAllowsWrites(topicId) {
  if (!topicId) return true;
  const topic = await getTopic(String(topicId));
  return topic?.state === 'live';
}

export async function postAllowsWrites(postIdValue) {
  if (!connected()) return true;
  const post = await Post.findById(postIdValue).select('topic').lean();
  if (!post) return false;
  return topicAllowsWrites(post.topic ? String(post.topic) : '');
}

export async function prepareAnonymousPost(authorId, values) {
  if (!values.anonymous) return values;
  return { ...values, anonymous: true, anonymousCode: anonymousCode(), anonymousRevealedAt: null };
}

export function anonymousIdentity(post, viewerId = '') {
  if (!post?.anonymous || post.anonymousRevealedAt) return null;
  return {
    author: { id: '', displayName: post.anonymousCode || 'SIGNAL', handle: '', avatarUrl: '', anonymous: true },
    anonymousOwner: String(post.author?._id || post.author) === String(viewerId)
  };
}

export async function revealAnonymousPost(postIdValue, userId) {
  let post;
  if (connected()) post = await Post.findOneAndUpdate({ _id: postIdValue, author: userId, anonymous: true, anonymousRevealedAt: null }, { anonymousRevealedAt: now() }, { new: true });
  else return null;
  return post ? { id: postId(post), revealedAt: post.anonymousRevealedAt } : null;
}

export async function inspectAnonymousPost(postIdValue, staffId) {
  const post = connected() ? await Post.findOne({ _id: postIdValue, anonymous: true }).populate('author', 'displayName handle avatarUrl email staffRole').lean() : null;
  if (!post) return null;
  await recordPlatformAudit(staffId, 'anonymous.identity_viewed', 'post', postIdValue, { code: post.anonymousCode });
  return { code: post.anonymousCode, author: plain(post.author) };
}

function lifecycleView(post) {
  const createdAt = new Date(post.createdAt || now());
  const total = Number(post.alrightVotes || 0) + Number(post.cringeVotes || 0);
  const hotPercent = total ? Number(post.cringeVotes || 0) / total * 100 : 0;
  const lifecycle = post.lifecycle || {};
  const defense = lifecycle.defense || { status: 'none' };
  const redemption = lifecycle.redemption || { status: 'none', votes: [] };
  if ((!defense.status || defense.status === 'none') && Date.now() - createdAt.getTime() >= 24 * 60 * 60 * 1000 && total >= 10 && hotPercent >= 60) defense.status = 'eligible';
  if (redemption.status === 'open' && new Date(redemption.closesAt) <= now()) {
    const votes = redemption.votes || [];
    const redeemed = votes.filter(vote => vote.value === 'redeemed').length;
    redemption.status = votes.length >= 20 && redeemed / votes.length >= .6 ? 'gold' : 'silver';
  }
  let active = 'none';
  if (redemption.status && redemption.status !== 'none') active = 'redemption';
  else if (defense.status && defense.status !== 'none') active = 'defense';
  return { active, defense, redemption };
}

export function enrichPostLifecycle(post) {
  const value = plain(post);
  value.lifecycle = lifecycleView(value);
  return value;
}

export async function submitDefense(postIdValue, userId, content) {
  if (!connected()) return null;
  const post = await Post.findOne({ _id: postIdValue, author: userId });
  if (!post) return null;
  const lifecycle = lifecycleView(post);
  const existing = post.lifecycle?.defense;
  const canEdit = existing?.status === 'submitted' && existing.editableUntil && new Date(existing.editableUntil) > now();
  if (lifecycle.defense.status !== 'eligible' && !canEdit) return { ineligible: true };
  const submittedAt = existing?.submittedAt || now();
  post.lifecycle.defense = { status: 'submitted', content, submittedAt, editableUntil: existing?.editableUntil || new Date(submittedAt.getTime() + 15 * 60 * 1000) };
  await post.save();
  return enrichPostLifecycle(post);
}

export async function openRedemption(postIdValue, userId) {
  if (!connected()) return null;
  const post = await Post.findOne({ _id: postIdValue, author: userId });
  if (!post || lifecycleView(post).defense.status !== 'submitted' || post.lifecycle.redemption.status !== 'none') return { ineligible: true };
  post.lifecycle.redemption = { status: 'open', opensAt: now(), closesAt: new Date(Date.now() + 72 * 60 * 60 * 1000), votes: [] };
  await post.save();
  return enrichPostLifecycle(post);
}

export async function voteRedemption(postIdValue, userId, value) {
  if (!connected()) return null;
  const post = await Post.findById(postIdValue);
  if (!post || String(post.author) === String(userId) || lifecycleView(post).redemption.status !== 'open') return { closed: true };
  post.lifecycle.redemption.votes = (post.lifecycle.redemption.votes || []).filter(vote => String(vote.user) !== String(userId));
  post.lifecycle.redemption.votes.push({ user: userId, value });
  await post.save();
  return enrichPostLifecycle(post);
}

async function guildPermission(guildId, userId) {
  if (!connected()) return { chat: true, manage: true };
  const guild = await Guild.findById(guildId).select('creator members').lean();
  if (!guild || !(guild.members || []).some(id => String(id) === String(userId))) return null;
  if (String(guild.creator) === String(userId)) return { chat: true, manage: true };
  const membership = await GuildMembership.findOne({ guild: guildId, user: userId, status: 'active' }).lean();
  const role = membership && await GuildRole.findOne({ guild: guildId, key: membership.roleKey }).lean();
  return { chat: Boolean(role?.permissions?.chat), manage: Boolean(role?.permissions?.manageGuild || role?.permissions?.managePosts) };
}

const serializePin = item => {
  const value = plain(item);
  value.guild = String(value.guild);
  value.parent = value.parent ? String(value.parent) : null;
  value.sender = value.sender ? { ...plain(value.sender), email: undefined, staffRole: undefined } : null;
  value.reactions = (value.reactions || []).map(reaction => ({ emoji: reaction.emoji, count: reaction.users?.length || 0 }));
  return value;
};

export async function listPinboard(guildId, userId, { archive = false } = {}) {
  const access = await guildPermission(guildId, userId);
  if (!access) return null;
  const cycle = currentBoardCycle();
  if (connected()) {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const query = archive ? { guild: guildId, createdAt: { $gte: cutoff } } : { guild: guildId, boardCycle: cycle, archivedAt: null };
    return { cycle, canManage: access.manage, items: (await GuildMessage.find(query).sort({ createdAt: 1 }).limit(300).populate('sender', 'displayName handle avatarUrl cringeScore').lean()).map(serializePin) };
  }
  return { cycle, canManage: access.manage, items: (memory.pinboard.get(String(guildId)) || []).filter(item => archive || item.boardCycle === cycle).map(serializePin) };
}

export async function createPinboardEntry(guildId, userId, values) {
  const access = await guildPermission(guildId, userId);
  if (!access?.chat) return null;
  const entry = { guild: guildId, sender: userId, text: values.text || '', attachments: values.attachments || [], parent: values.parent || null, boardCycle: currentBoardCycle(), createdAt: now(), updatedAt: now() };
  if (connected()) return serializePin(await (await GuildMessage.create(entry)).populate('sender', 'displayName handle avatarUrl cringeScore'));
  entry.id = crypto.randomUUID();
  const items = memory.pinboard.get(String(guildId)) || []; items.push(entry); memory.pinboard.set(String(guildId), items);
  return serializePin(entry);
}

export async function resetPinboard(guildId, userId) {
  const access = await guildPermission(guildId, userId);
  if (!access?.manage) return null;
  if (connected()) await GuildMessage.updateMany({ guild: guildId, archivedAt: null }, { archivedAt: now() });
  await recordPlatformAudit(userId, 'pinboard.reset', 'guild', guildId);
  return { cycle: currentBoardCycle(new Date(Date.now() + 5 * 60 * 60 * 1000)) };
}

function serializeBattle(value, viewerId = '') {
  const battle = plain(value);
  battle.createdBy = undefined;
  battle.rounds = (battle.rounds || []).map(match => ({
    round: match.round, match: match.match, leftSeed: match.leftSeed, rightSeed: match.rightSeed,
    leftVotes: match.leftVotes || 0, rightVotes: match.rightVotes || 0, winnerSeed: match.winnerSeed || null,
    suddenDeathUntil: match.suddenDeathUntil || null,
    viewerVote: viewerId ? (match.voters || []).find(vote => String(vote.user) === String(viewerId))?.seed || null : null
  }));
  return battle;
}

export async function listBattles(viewerId = '') {
  if (connected()) return (await Battle.find().sort({ createdAt: -1 }).limit(50).lean()).map(item => serializeBattle(item, viewerId));
  return [...memory.battles.values()].map(item => serializeBattle(item, viewerId));
}

export async function createBattle(actorId, values) {
  const entries = values.entries.map((entry, index) => ({ ...entry, seed: index + 1 }));
  const rounds = [];
  for (let i = 0; i < entries.length; i += 2) rounds.push({ round: 1, match: i / 2 + 1, leftSeed: entries[i].seed, rightSeed: entries[i + 1].seed, voters: [] });
  const battle = { ...values, entries, rounds, createdBy: actorId, status: values.status || 'live', startsAt: values.startsAt || now(), endsAt: values.endsAt || new Date(Date.now() + 24 * 60 * 60 * 1000), createdAt: now(), updatedAt: now() };
  if (connected()) return serializeBattle(await Battle.create(battle), actorId);
  battle.id = crypto.randomUUID(); memory.battles.set(battle.id, battle); return serializeBattle(battle, actorId);
}

export async function voteBattle(battleId, userId, round, match, seed) {
  if (!connected()) return null;
  const battle = await Battle.findById(battleId);
  const game = battle?.rounds?.find(item => item.round === round && item.match === match);
  if (!game || game.winnerSeed || ![game.leftSeed, game.rightSeed].includes(seed)) return null;
  game.voters = (game.voters || []).filter(vote => String(vote.user) !== String(userId));
  game.voters.push({ user: userId, seed });
  game.leftVotes = game.voters.filter(vote => vote.seed === game.leftSeed).length;
  game.rightVotes = game.voters.filter(vote => vote.seed === game.rightSeed).length;
  await battle.save();
  return serializeBattle(battle, userId);
}

const aboutSections = [
  ['story', 'Our Story', 'Callout is an independent social project built around honest opinions, public voting, and communities that reward participation without turning every conversation into noise.'],
  ['what', 'What Callout Is', 'A place to publish a Take, vote Based or Hot Take, discuss it through Takes, and build communities around shared interests.'],
  ['past', 'Past and Current Development', 'Callout began as a single experimental feed and has grown into accounts, persistent voting, profiles, Guilds, messages, rankings, media, analytics, and creator tools.'],
  ['goals', 'Current Goals', 'Make the product stable, welcoming, fast, easy to understand, and ready for its first real communities.'],
  ['future', 'Future Vision', 'Limited-Time Topics, Time Vaults, community Pinboards, Battles, post Defenses, Redemption, and transparent public development.'],
  ['project', 'Project Status', 'Callout is an independent project in active development. Features may change as the community learns what works.'],
  ['socials', 'Social Links', 'Official social channels will be published here as they become active.'],
  ['safety', 'Safety and Community Principles', 'Respect people, challenge ideas, report abuse, and never share sensitive personal information.']
].map(([key, title, body]) => ({ key, title, body }));

export async function getAbout() {
  const updates = connected()
    ? await AboutUpdate.find().sort({ pinned: -1, order: 1, createdAt: -1 }).populate('author', 'displayName handle avatarUrl').lean()
    : [...memory.about.values()].sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.order - b.order || new Date(b.createdAt) - new Date(a.createdAt));
  return { sections: aboutSections, updates: updates.map(item => ({ ...plain(item), author: item.author ? plain(item.author) : null })) };
}

export async function createAboutUpdate(actorId, values) {
  const update = { ...values, author: actorId, createdAt: now(), updatedAt: now() };
  if (connected()) return plain(await AboutUpdate.create(update));
  update.id = crypto.randomUUID(); memory.about.set(update.id, update); return plain(update);
}

export async function updateAboutUpdate(actorId, id, values) {
  const item = connected() ? await AboutUpdate.findByIdAndUpdate(id, values, { new: true, runValidators: true }) : memory.about.get(String(id));
  if (!item) return null;
  if (!connected()) Object.assign(item, values, { updatedAt: now() });
  await recordPlatformAudit(actorId, 'about.updated', 'about_update', id, { fields: Object.keys(values) });
  return plain(item);
}

export async function deleteAboutUpdate(actorId, id) {
  const deleted = connected() ? await AboutUpdate.findByIdAndDelete(id) : memory.about.get(String(id));
  if (!deleted) return false;
  if (!connected()) memory.about.delete(String(id));
  await recordPlatformAudit(actorId, 'about.deleted', 'about_update', id);
  return true;
}

export async function listStaff(ownerEmails = []) {
  if (!connected()) return [];
  const normalizedOwners = ownerEmails.map(email => String(email).trim().toLowerCase()).filter(Boolean);
  if (!normalizedOwners.length) return [];
  return (await User.find({ email: { $in: normalizedOwners } }).select('displayName handle avatarUrl email staffRole').sort({ createdAt: 1 }).lean())
    .map(user => plain({ ...user, staffRole: normalizedOwners.includes(String(user.email || '').toLowerCase()) ? 'owner' : user.staffRole }));
}

export async function setStaffRole(ownerId, userId, staffRole) {
  if (!connected()) return null;
  const target = await User.findById(userId);
  if (!target || target.staffRole === 'owner') return null;
  target.staffRole = staffRole;
  await target.save();
  await recordPlatformAudit(ownerId, 'staff.role_changed', 'user', userId, { staffRole });
  return plain(target);
}

export async function processBigPatchLifecycles() {
  if (!connected()) return { topics: 0, redemptions: 0, battles: 0 };
  const current = now();
  const [topics, redemptions, battles] = await Promise.all([
    Topic.find({ state: { $ne: 'vaulted' }, endsAt: { $lte: current } }),
    Post.find({ 'lifecycle.redemption.status': 'open', 'lifecycle.redemption.closesAt': { $lte: current } }),
    Battle.find({ status: { $in: ['live', 'sudden_death'] } })
  ]);
  for (const topic of topics) {
    topic.state = 'vaulted'; topic.vaultedAt = topic.vaultedAt || current; await topic.save();
  }
  for (const post of redemptions) {
    const votes = post.lifecycle.redemption.votes || [];
    const redeemed = votes.filter(vote => vote.value === 'redeemed').length;
    post.lifecycle.redemption.status = votes.length >= 20 && redeemed / votes.length >= .6 ? 'gold' : 'silver';
    await post.save();
  }
  let battleChanges = 0;
  for (const battle of battles) {
    const roundNumber = Math.max(1, ...(battle.rounds || []).filter(match => !match.winnerSeed).map(match => Number(match.round || 1)));
    const openMatches = (battle.rounds || []).filter(match => Number(match.round) === roundNumber && !match.winnerSeed);
    let changed = false;
    for (const match of openMatches) {
      if (match.suddenDeathUntil && new Date(match.suddenDeathUntil) <= current) {
        match.winnerSeed = match.leftVotes === match.rightVotes
          ? Math.min(match.leftSeed, match.rightSeed)
          : match.leftVotes > match.rightVotes ? match.leftSeed : match.rightSeed;
        changed = true;
      } else if (!match.suddenDeathUntil && battle.endsAt && new Date(battle.endsAt) <= current) {
        if (match.leftVotes === match.rightVotes) {
          match.suddenDeathUntil = new Date(Date.now() + 6 * 60 * 60 * 1000);
          battle.status = 'sudden_death';
        } else match.winnerSeed = match.leftVotes > match.rightVotes ? match.leftSeed : match.rightSeed;
        changed = true;
      }
    }
    const round = (battle.rounds || []).filter(match => Number(match.round) === roundNumber);
    if (round.length && round.every(match => match.winnerSeed)) {
      const winners = round.map(match => match.winnerSeed);
      if (winners.length === 1) {
        battle.status = 'complete';
        battle.endsAt = current;
      } else if (!(battle.rounds || []).some(match => Number(match.round) === roundNumber + 1)) {
        winners.forEach((seed, index) => {
          if (index % 2 === 0) battle.rounds.push({ round: roundNumber + 1, match: index / 2 + 1, leftSeed: seed, rightSeed: winners[index + 1], voters: [] });
        });
        battle.status = 'live';
        battle.endsAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      }
      changed = true;
    }
    if (changed) { await battle.save(); battleChanges += 1; }
  }
  await GuildMessage.deleteMany({ archivedAt: { $lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });
  return { topics: topics.length, redemptions: redemptions.length, battles: battleChanges };
}

export async function migrateBigPatchDefaults() {
  if (!connected()) return { users: 0, posts: 0, guildMessages: 0 };
  const cycle = String(Math.floor(Date.now() / (5 * 60 * 60 * 1000)));
  const [users, posts, guildMessages] = await Promise.all([
    User.collection.updateMany({}, [
      { $set: {
        heatScore: { $max: [0, { $ifNull: ['$heatScore', { $ifNull: ['$vibeScore', 0] }] }] },
        heatStreakCurrent: { $ifNull: ['$heatStreakCurrent', 0] },
        heatStreakLongest: { $ifNull: ['$heatStreakLongest', 0] },
        heatLastActiveDate: { $ifNull: ['$heatLastActiveDate', ''] },
        heatActivityDates: { $ifNull: ['$heatActivityDates', []] },
        profileLayout: ['posts', 'guilds', 'heat']
      } },
      { $unset: ['vibeScore', 'vibeTokens', 'lastTokenClaimAt', 'vibeAura', 'featuredBadges'] }
    ]),
    Post.collection.updateMany({}, [
      { $set: {
        anonymous: { $ifNull: ['$anonymous', false] },
        'lifecycle.defense': { $ifNull: ['$lifecycle.defense', { status: 'none', content: '', submittedAt: null, editableUntil: null }] },
        'lifecycle.redemption': { $ifNull: ['$lifecycle.redemption', { status: 'none', opensAt: null, closesAt: null, votes: [] }] }
      } },
      { $unset: 'lifecycle.prediction' }
    ]),
    GuildMessage.updateMany({ boardCycle: { $exists: false } }, { $set: { boardCycle: cycle, attachments: [], reactions: [], pinned: false } })
  ]);
  return { users: users.modifiedCount, posts: posts.modifiedCount, guildMessages: guildMessages.modifiedCount };
}
