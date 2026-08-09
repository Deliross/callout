import mongoose from 'mongoose';

const profileActivitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['joined', 'post', 'take', 'guild_join', 'guild_founder', 'badge', 'top_heat'], required: true, index: true },
  text: { type: String, default: '', maxlength: 240 },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
  guild: { type: mongoose.Schema.Types.ObjectId, ref: 'Guild', default: null },
  badgeKey: { type: String, default: '', maxlength: 40 },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: { createdAt: true, updatedAt: false } });

profileActivitySchema.index({ user: 1, createdAt: -1 });

export const ProfileActivity = mongoose.models.ProfileActivity || mongoose.model('ProfileActivity', profileActivitySchema);
