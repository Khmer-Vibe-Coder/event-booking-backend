const Joi = require('joi');

// Schema for registering an organization
const vRegister = Joi.object({
    firstName: Joi.string().min(2).max(30).required(),
    lastName: Joi.string().min(2).max(30).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().optional(),
    orgName: Joi.string().min(2).max(100).required(),
    orgEmail: Joi.string().email().required(),
    orgDescription: Joi.string().min(10).required(),
    orgPhone: Joi.string().required(),
}).options({ abortEarly: false, allowUnknown: true });

const vRejectRequest = Joi.object({
    rejectReason: Joi.string().min(5).required(),
}).options({ abortEarly: false, allowUnknown: true });

module.exports = {vRegister, vRejectRequest}