
const { db, mongoose } = require("./settings/connection")

// Password Reset Token Schema
const passwordResetTokenSchema = new mongoose.Schema({
  adminUserId: {
    type: mongoose.Schema.Types.ObjectId,

    default: null,
    ref: 'admin_users'
  },
  appUserId: {
    type: mongoose.Schema.Types.ObjectId,

    default: null,
    ref: 'app_users'
  },
  email: {
    type: String,
    required: true,
    lowercase: true
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
    default: () => new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
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
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = db.model('password_reset_token', passwordResetTokenSchema);