
const { db, mongoose } = require("./settings/connection")


const passwordSetUpTokenSchema = new mongoose.Schema({
  adminUserId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'app_users'
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
    hashedToken: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
  },
  used: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
  
});

// Auto-delete expired tokens
passwordSetUpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = db.model('password_setup_token', passwordSetUpTokenSchema);