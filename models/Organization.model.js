const { db, mongoose, refTable } = require("./settings/connection");
const validator = require("validator");

const organizationSchema = mongoose.Schema(
  {

    name: {type: String, required: true},
    description: {type: String, required: true},
    email: {type: String, required: true},
    phone: {type: String, required: true},
    adminUser: refTable("admin_users"),
    image: {
        type: String, default: null
    }
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

module.exports = db.model("organizations", organizationSchema);
