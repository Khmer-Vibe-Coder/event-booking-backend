const Joi = require('joi');


const vCreateRole = Joi.object({
    name: Joi.string().min(2).max(50).required(),
});


const vUpdateRole = Joi.object({
    id: Joi.string().required(), 
    name: Joi.string().min(2).max(50).optional(),
    rights: Joi.array().items(Joi.string()).optional(),
    orgId: Joi.string().optional(), 
});

module.exports = {vCreateRole, vUpdateRole}