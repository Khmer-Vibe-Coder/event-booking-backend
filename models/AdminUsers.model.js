const { db, mongoose, refTable } = require("./settings/connection")
const validator = require("validator")

const adminSchema = mongoose.Schema(
    {
        isDeleted: { type: Boolean, default: false },
        isSuperAdmin: {type: Boolean, default: false},
        isOrganizationSuperAdmin : {type: Boolean,default: false},
        organization: refTable('organizations'),
        role: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "roles"
        },
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
            required: [true, "Email must not be null"],
            trim: true,
            unique: true,
            validate: {
                validator: (v) => validator.isEmail(v),
                message: "Invalid email format",
            },
        },
        passwordChangedAt: Date,
    },
    { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
)

module.exports = db.model("admin_users", adminSchema)
