const Joi = require('joi');

const vLogin = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().trim().min(6).required(),
}).options({ abortEarly: false,allowUnknown: true });

const vRegister = Joi.object({
    firstName: Joi.string().min(2).max(30).required(),
    lastName: Joi.string().min(2).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    terms: Joi.boolean().required(),
    consents: Joi.boolean().required(),
    isSuperAdmin: Joi.boolean().default(false)
}).options({ abortEarly: false,allowUnknown: true });

const vResetPassword= Joi.object({
    token: Joi.string().required(),
    email: Joi.string().email().required(),
    newPassword: Joi.string().min(6).required()
}).options({ abortEarly: false,allowUnknown: true });

const vForgotPassword = Joi.object({
    email: Joi.string().email().required(),
    resend: Joi.boolean().default(false) 
});

module.exports = {vLogin, vRegister, vResetPassword, vForgotPassword}