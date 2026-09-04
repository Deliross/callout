import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  type: { type: String, enum: ['image', 'video', 'gif'], required: true },
  url: { type: String, required: true },
  alt: { type: String, default: '', maxlength: 120 },
  duration: { type: Number, default: 0, min: 0, max: 25 },
  aspectRatio: { type: Number, default: 1, min: 0.1, max: 10 }
}, { _id: false });

const externalEmbedSchema = new mongoose.Schema({
  platform: { type: String, enum: ['x', 'reddit', 'bluesky'], required: true },
  url: { type: String, required: true, maxlength: 2048 },
  authorName: { type: String, default: '', maxlength: 120 },
  authorHandle: { type: String, default: '', maxlength: 120 },
  authorAvatar: { type: String, default: '', maxlength: 2048 },
  text: { type: String, default: '', maxlength: 1200 },
  community: { type: String, default: '', maxlength: 120 },
  mediaUrl: { type: String, default: '', maxlength: 2048 },
  mediaType: { type: String, enum: ['', 'image', 'video'], default: '' },
  mediaItems: {
    type: [{
      _id: false,
      type: { type: String, enum: ['image', 'video'], required: true },
      url: { type: String, required: true, maxlength: 2048 },
      thumbnailUrl: { type: String, default: '', maxlength: 2048 },
      alt: { type: String, default: '', maxlength: 300 }
    }],
    default: []
  },
  replyCount: { type: Number, default: 0, min: 0 },
  repostCount: { type: Number, default: 0, min: 0 },
  likeCount: { type: Number, default: 0, min: 0 },
  viewCount: { type: Number, default: 0, min: 0 },
  sourceCreatedAt: { type: Date, default: null },
  fetchedAt: { type: Date, default: Date.now }
}, { _id: false });

const ttsAudioSchema = new mongoose.Schema({
  voiceKey: { type: String, enum: ['spark', 'debate', 'calm'], required: true },
  voiceName: { type: String, required: true, maxlength: 60 },
  mimeType: { type: String, default: 'audio/mpeg', maxlength: 80 },
  audioBase64: { type: String, required: true, maxlength: 3_000_000 },
  textHash: { type: String, required: true, maxlength: 80 },
  generatedAt: { type: Date, default: Date.now }
}, { _id: false });

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  clientRequestId: { type: String, default: '', maxlength: 80 },
  guild: { type: mongoose.Schema.Types.ObjectId, ref: 'Guild', default: null, index: true },
  topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null, index: true },
  anonymous: { type: Boolean, default: false, index: true },
  anonymousCode: { type: String, default: '', maxlength: 24 },
  anonymousRevealedAt: { type: Date, default: null },
  title: { type: String, default: '', maxlength: 160 },
  description: { type: String, default: '', maxlength: 600 },
  content: { type: String, default: '', maxlength: 2000 },
  category: { type: String, enum: ['Movies', 'Music', 'Entertainment', 'Games', 'Life'], required: true },
  contentType: { type: String, enum: ['text', 'image', 'video', 'gif', 'poll'], default: 'text' },
  visibility: { type: String, enum: ['public', 'guild', 'friends'], default: 'public', index: true },
  draft: { type: Boolean, default: false, index: true },
  scheduledPublishedAt: { type: Date, default: null, index: true },
  topics: [{ type: String, trim: true, maxlength: 40 }],
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  contentWarning: { type: String, default: '', maxlength: 160 },
  reactionSet: { type: String, enum: ['classic', 'support', 'spicy'], default: 'classic' },
  embedUrl: { type: String, default: '', maxlength: 2048 },
  externalEmbed: { type: externalEmbedSchema, default: null },
  ttsAudio: { type: [ttsAudioSchema], default: [] },
  viralVideoMilestones: { type: [Number], default: [] },
  poll: {
    question: { type: String, default: '', maxlength: 240 },
    options: [{
      text: { type: String, required: true, maxlength: 100 },
      voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }],
    closesAt: { type: Date, default: null }
  },
  alrightVotes: { type: Number, default: 0, min: 0 },
  cringeVotes: { type: Number, default: 0, min: 0 },
  impressions: { type: Number, default: 0, min: 0, index: true },
  adminMetrics: {
    basedAdjustment: { type: Number, default: 0 },
    cringeAdjustment: { type: Number, default: 0 },
    impressionsAdjustment: { type: Number, default: 0 },
    editedAt: { type: Date, default: null },
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  media: { type: [mediaSchema], default: [] },
  votes: [{
    _id: false,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    value: { type: String, enum: ['alright', 'cringe'], required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  emojiReactions: [{
    _id: false,
    key: { type: String, enum: ['spark', 'purple_smile', 'based_crown', 'heat', 'micdrop', 'sideeye', 'brainzap', 'popcorn', 'gold_star', 'red_flag', 'diamond', 'ghosted', 'clown', 'tiny_fire', 'skull', 'laugh', 'question', 'loud', 'rare', 'callout', 'fire', 'dead', 'mindblown'], required: true },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }],
  lifecycle: {
    defense: {
      status: { type: String, enum: ['none', 'eligible', 'submitted'], default: 'none' },
      content: { type: String, default: '', maxlength: 10000 },
      submittedAt: { type: Date, default: null },
      editableUntil: { type: Date, default: null }
    },
    redemption: {
      status: { type: String, enum: ['none', 'open', 'gold', 'silver'], default: 'none' },
      opensAt: { type: Date, default: null },
      closesAt: { type: Date, default: null },
      votes: [{
        _id: false,
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        value: { type: String, enum: ['redeemed', 'still_hot'] }
      }]
    }
  }
}, { timestamps: true });

postSchema.index({ author: 1, clientRequestId: 1 }, { unique: true, partialFilterExpression: { clientRequestId: { $type: 'string', $gt: '' } } });

export const Post = mongoose.models.Post || mongoose.model('Post', postSchema);
