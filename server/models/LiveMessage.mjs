import mongoose from 'mongoose';

const liveMessageSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveRoom', required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  text: { type: String, required: true, maxlength: 500 }
}, { timestamps: true });

liveMessageSchema.index({ room: 1, createdAt: -1 });
export const LiveMessage = mongoose.models.LiveMessage || mongoose.model('LiveMessage', liveMessageSchema);
