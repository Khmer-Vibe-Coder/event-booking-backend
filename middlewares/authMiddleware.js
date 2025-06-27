const jwt = require('jsonwebtoken');
const util = require('../exports/util');
const AdminUser = require("../models/AdminUsers.model");
const AppUser = require("../models/AppUsers.model"); // add this

const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return util.ResFail(req, res, 'Unauthorized: Token missing.', 401);
    }

    const token = authHeader.split(' ')[2];
    

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (util.isEmpty(decoded)) {
            return util.ResFail(req, res, 'Invalid Token.', 401);
        }

        // Determine which user model to use
        const isAppRequest = req.originalUrl.startsWith('/app');
        const UserModel = isAppRequest ? AppUser : AdminUser;

        const user = await UserModel.findOne({ _id: util.objectId(decoded.id) }).catch(error => { throw error });

        if (util.isEmpty(user)) {
            return util.ResFail(req, res, 'Unauthorized. Invalid Token', 401);
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('JWT verification error:', error);
        return util.ResFail(req, res, 'Unauthorized: Invalid or expired token.', 401);
    }
};

module.exports = authenticate;
