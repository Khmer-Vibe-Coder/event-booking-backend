const Joi = require('joi');


const vSetImage = Joi.object({
    imageUrl: Joi.string().uri().required(),
}).options({ abortEarly: false, allowUnknown: true });


const vCreateOrg = Joi.object({
    firstName: Joi.string().min(2).max(30).required(),
    lastName: Joi.string().min(2).max(30).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().optional(),
    roleId: Joi.string().required(),
    orgName: Joi.string().min(2).max(100).required(),
    orgEmail: Joi.string().email().required(),
    orgDescription: Joi.string().min(10).required(),
    orgPhone: Joi.string().optional(),
}).options({ abortEarly: false, allowUnknown: true });

const vUpdateOrg = Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    description: Joi.string().min(10).optional(),
    phone: Joi.string().optional(),
    image: Joi.string().uri().optional(),
}).options({ abortEarly: false, allowUnknown: true });

module.exports = {vSetImage, vCreateOrg, vUpdateOrg}