import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['listener', 'speaker', 'host'], default: 'listener' },
  mic: { type: Boolean, default: false },
  joinedAt: { type: Date, default: Date.now },
  leftAt: { type: Date, default: null }
}, { _id: false });

const calloutSchema = new mongoose.Schema({
  key: { type: String, required: true },
  speaker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  speakerName: { type: String, required: true, maxlength: 40 },
  quote: { type: String, required: true, maxlength: 280 },
  basedVoters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  hotVoters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  startedAt: { type: Date, default: Date.now },
  endsAt: { type: Date, required: true },
  endedAt: { type: Date, default: null }
}, { _id: false });

const momentSchema = new mongoose.Schema({
  key: { type: String, required: true },
  speakerName: { type: String, required: true, maxlength: 40 },
  quote: { type: String, required: true, maxlength: 280 },
  based: { type: Number, default: 0 },
  hot: { type: Number, default: 0 },
  votes: { type: Number, default: 0 },
  listenerCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const liveRoomSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 160 },
  topic: { type: String, enum: ['Movies', 'Music', 'Entertainment', 'Games', 'Life'], default: 'Life' },
  format: { type: String, enum: ['Debate', 'Discussion', 'Podcast'], default: 'Debate' },
  status: { type: String, enum: ['live', 'ended', 'scheduled'], default: 'live', index: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sourcePost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
  sourceTake: { type: String, default: '', maxlength: 160 },
  participants: { type: [participantSchema], default: [] },
  micRequests: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, createdAt: { type: Date, default: Date.now } }],
  currentCallout: { type: calloutSchema, default: null },
  moments: { type: [momentSchema], default: [] },
  stats: {
    heatGenerated: { type: Number, default: 0, min: 0 },
    peakListeners: { type: Number, default: 1, min: 0 },
    totalVotes: { type: Number, default: 0, min: 0 }
  },
  scheduledFor: { type: Date, default: null },
  endedAt: { type: Date, default: null }
}, { timestamps: true });

liveRoomSchema.index({ status: 1, updatedAt: -1 });
export const LiveRoom = mongoose.models.LiveRoom || mongoose.model('LiveRoom', liveRoomSchema);
