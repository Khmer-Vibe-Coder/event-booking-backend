const { db, mongoose } = require("./settings/connection");

const appSchema = new mongoose.Schema(
  {
    name: {type: String, required: true},
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

module.exports = db.model("roles", appSchema);
