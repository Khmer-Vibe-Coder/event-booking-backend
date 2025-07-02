const Joi = require('joi');


const vCreateUser = Joi.object({
    firstName: Joi.string().min(2).max(30).required(),
    lastName: Joi.string().min(2).max(30).required(),
    email: Joi.string().email().required(),
    roleId: Joi.string().required(),
}).options({ abortEarly: false, allowUnknown: true });


const vUpdateUser = Joi.object({
    firstName: Joi.string().min(2).max(30),
    lastName: Joi.string().min(2).max(30),
    username: Joi.string().optional(),
    email: Joi.string().email().required(),
    roleId: Joi.string().required(),
}).options({ abortEarly: false, allowUnknown: true });


const vSetUpPassword = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    token: Joi.string().required(),
    orgId: Joi.string().optional(),
}).options({ abortEarly: false, allowUnknown: true });

// Schema for requesting a password setup link
const vRequestLinkSetUpPassword = Joi.object({
    email: Joi.string().email().required(),
    orgId: Joi.string().required(),
}).options({ abortEarly: false, allowUnknown: true });

module.exports ={vCreateUser, vUpdateUser, vSetUpPassword, vRequestLinkSetUpPassword}