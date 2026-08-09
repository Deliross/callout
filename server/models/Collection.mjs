import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['saved', 'portfolio'], required: true },
  title: { type: String, required: true, trim: true, maxlength: 80 },
  description: { type: String, default: '', maxlength: 240 },
  coverUrl: { type: String, default: '', maxlength: 2800000 },
  visibility: { type: String, enum: ['public', 'friends', 'private'], default: 'private', index: true },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }]
}, { timestamps: true });

collectionSchema.index({ owner: 1, updatedAt: -1 });

export const Collection = mongoose.models.Collection || mongoose.model('Collection', collectionSchema);
