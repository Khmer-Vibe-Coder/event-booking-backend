const { db, mongoose } = require("./settings/connection")
const validator = require("validator")

const appUsersSchema = mongoose.Schema(
    {
        isDeleted: { type: Boolean, default: false },
        username: {
            type: String,
            required: [true, "Username must not be null"],
            trim: true,
        },
        firstName: {
            type: String,
            required: [true, "Username must not be null"],
            trim: true,
        },
        lastName: {
            type: String,
            required: [true, "Username must not be null"],
            trim: true,
        },
        password: { type: String, trim: true, default: null },
        email: {
            type: String,
            unique: true,
            required: [true, "Email must not be null"],
            trim: true,
            validate: {
                validator: (v) => validator.isEmail(v),
                message: "Invalid email format",
            },
        },
        passwordChangedAt: Date,
    },
    { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
)

module.exports = db.model("app_users", appUsersSchema)
