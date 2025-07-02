const { db, mongoose } = require("./settings/connection");

const rightSchema = new mongoose.Schema(
  {
    name: {type: String, required: true, unique: true},
    description: {type: String, required: true},
    group: {
        type: String, enum: ["Organization", "Event", "AdminUser", "Role"]
    }
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

module.exports = db.model("rights", rightSchema);
