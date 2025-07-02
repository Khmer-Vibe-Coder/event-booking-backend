const { db, mongoose } = require("./settings/connection");

const roleSchema = new mongoose.Schema(
  {
    name: {type: String, required: true},
    organization: {type: mongoose.Schema.Types.ObjectId, default: null},
    rights: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "rights"
    }
  },

  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

module.exports = db.model("roles", roleSchema);
