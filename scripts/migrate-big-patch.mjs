import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../server/models/User.mjs';
import { Post } from '../server/models/Post.mjs';
import { GuildMessage } from '../server/models/GuildMessage.mjs';

dotenv.config();
if (!process.env.DB_URI) throw new Error('DB_URI is required.');

await mongoose.connect(process.env.DB_URI);
const cycle = String(Math.floor(Date.now() / (5 * 60 * 60 * 1000)));
const [users, posts, messages] = await Promise.all([
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
console.log(JSON.stringify({ users: users.modifiedCount, posts: posts.modifiedCount, guildMessages: messages.modifiedCount }, null, 2));
await mongoose.disconnect();
