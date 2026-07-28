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
  User.updateMany({ vibeTokens: { $exists: false } }, { $set: { vibeTokens: 100 } }),
  Post.updateMany({ lifecycle: { $exists: false } }, {
    $set: {
      anonymous: false,
      lifecycle: {
        prediction: { status: 'none', locksAt: null, settlesAt: null, outcome: '' },
        defense: { status: 'none', content: '', submittedAt: null, editableUntil: null },
        redemption: { status: 'none', opensAt: null, closesAt: null, votes: [] }
      }
    }
  }),
  GuildMessage.updateMany({ boardCycle: { $exists: false } }, { $set: { boardCycle: cycle, attachments: [], reactions: [], pinned: false } })
]);
console.log(JSON.stringify({ users: users.modifiedCount, posts: posts.modifiedCount, guildMessages: messages.modifiedCount }, null, 2));
await mongoose.disconnect();
