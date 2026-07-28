import mongoose from 'mongoose';

const guildMessageSchema = new mongoose.Schema({
  guild: { type: mongoose.Schema.Types.ObjectId, ref: 'Guild', required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  text: { type: String, default: '', maxlength: 2000 },
  boardCycle: { type: String, default: '', index: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'GuildMessage', default: null },
  attachments: [{
    _id: false,
    type: { type: String, enum: ['image', 'gif', 'link'], required: true },
    url: { type: String, required: true, maxlength: 2_800_000 },
    alt: { type: String, default: '', maxlength: 120 }
  }],
  reactions: [{
    _id: false,
    emoji: { type: String, maxlength: 12 },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }],
  pinned: { type: Boolean, default: false },
  archivedAt: { type: Date, default: null, index: true }
}, { timestamps: true });

export const GuildMessage = mongoose.models.GuildMessage || mongoose.model('GuildMessage', guildMessageSchema);
