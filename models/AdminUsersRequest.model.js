const { db, mongoose } = require("./settings/connection");
const validator = require("validator");

const adminUsersRequestSchema = mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    rejectReason: {
      type: String,
      default: null,
    },

    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
    },

    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },

    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },

    email: {
      type: String,
      unique: true,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      validate: {
        validator: (v) => validator.isEmail(v),
        message: "Invalid email format",
      },
    },
    phone: {
      type: String,
      required: [true, "Phone is required"]
    },
    actionBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "admin_users",
    }
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

module.exports = db.model("admin_users_request", adminUsersRequestSchema);
