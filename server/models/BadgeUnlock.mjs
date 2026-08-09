import mongoose from 'mongoose';

const badgeUnlockSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  key: { type: String, enum: ['hot-take', 'debater', 'wordsmith'], required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: { createdAt: 'unlockedAt', updatedAt: false } });

badgeUnlockSchema.index({ user: 1, key: 1 }, { unique: true });

export const BadgeUnlock = mongoose.models.BadgeUnlock || mongoose.model('BadgeUnlock', badgeUnlockSchema);
