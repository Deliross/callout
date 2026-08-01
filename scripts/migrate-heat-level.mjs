import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../server/models/User.mjs';

dotenv.config();
if (!process.env.DB_URI) throw new Error('DB_URI is required.');

await mongoose.connect(process.env.DB_URI);

// Preserve the old participation total once, then remove every retired field.
// The native collection pipeline can read fields no longer present in Mongoose.
const users = await User.collection.updateMany(
  {},
  [{
    $set: {
      heatScore: { $max: [0, { $ifNull: ['$heatScore', { $ifNull: ['$vibeScore', 0] }] }] },
      heatStreakCurrent: { $ifNull: ['$heatStreakCurrent', 0] },
      heatStreakLongest: { $ifNull: ['$heatStreakLongest', 0] },
      heatLastActiveDate: { $ifNull: ['$heatLastActiveDate', ''] },
      heatActivityDates: { $ifNull: ['$heatActivityDates', []] },
      profileLayout: ['posts', 'guilds', 'heat']
    }
  }, {
    $unset: ['vibeScore', 'vibeTokens', 'lastTokenClaimAt', 'vibeAura', 'featuredBadges']
  }]
);

console.log(JSON.stringify({ usersMatched: users.matchedCount, usersMigrated: users.modifiedCount }, null, 2));
await mongoose.disconnect();
