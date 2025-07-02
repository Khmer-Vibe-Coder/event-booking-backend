const mongoose = require("mongoose")
const crypto = require('crypto');

/**
 * Normalize the value of pageSize
 * @param {int} pageSize
 * @returns {int}
 */
function defaultPageSize(pageSize) {
    let max = process.env.PageSize ? process.env.PageSize : 150
    max = parseInt(max)
    pageSize = parseInt(pageSize)
    if (isEmpty(pageSize)) {
        return max
    }

    return pageSize > max || pageSize < 1 ? max : pageSize
}

/**
 * Normalize the value of pageNo
 * @param {int} pageNo
 * @returns {int}
 */
function defaultPageNo(pageNo) {
    if (isEmpty(pageNo)) {
        return 1
    }
    pageNo = parseInt(pageNo)
    return pageNo < 1 ? 1 : pageNo
}


function notEmpty(data) {
    return !isEmpty(data)
}

const objectId = (id) => {
    if(notEmpty(id)) {
        return new mongoose.Types.ObjectId(id)
    }
    return null
}

function isEmpty(data) {
    if (data === null || data === undefined || data === "") {
        return true
    }
    if (typeof data == "boolean") {
        return false
    }

    if (typeof data == "string" || typeof data === undefined || typeof data === "undefined") {
        return data === null || data === undefined || data === "" || data === "undefined"
    }

    if (typeof data == "number" && parseFloat(data) === 0) {
        return true
    }

    if (typeof data == "number" && isNaN(data)) {
        return true
    }

    if (data instanceof mongoose.Types.ObjectId) {
        return false
    }

    if (data instanceof Array) {
        return data.length === 0
    }
    if (data instanceof Date) {
        return false
    }

    if (typeof data == "object") {
        return Object.keys(data).length === 0
    }

    return false
}


// Generate secure random token
const generateResetToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Hash token for storage
const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

// Validate email format
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
};

const ResSuss = (req, res, data = {}, message = "Successfully", paginate = null) => {
    const responseObj = {
        status: 200,
        message: message,
        data: data,
    }
    if(notEmpty(paginate)){
        responseObj.paginate = paginate
    }
    return res.send(responseObj)
}

function isError(v) {
    return v instanceof Error && typeof v.message !== "undefined"
}

function isString(v) {
    return typeof v === "string"
}

/**
 * Return status code and business code on failure
 * @param {*} req
 * @param {*} res
 * @param {*} rsp  error or errorCode
 * @param {*} data returned data, empty if not present
 * @returns none
 */
function ResFail(req, res, rsp, status, data = null) {
    let response = {}

    // If it is an error, handle accordingly
    if (isError(rsp)) {
        response.message = rsp.message
        response.status = status || 400 //default
        response.errorCode = 100000 //default
        // Handle when the message is an error message
        try {
            let tempObj = JSON.parse(rsp.message)
            if (tempObj instanceof Object && tempObj.errorCode > 0) {
                response.status = tempObj.status
                response.errorCode = tempObj.errorCode
                response.message = tempObj.message
                if(notEmpty(tempObj.data)) {
                    response.data = tempObj.data
                }
            }
        } catch (error) { }
    } else {
        if (isString(rsp)) {
            response.message = rsp
            response.status = status || 400 //default
            response.errorCode = 100000 //default
        } else {
            // Handle when it is an errCode error object
            response.status = rsp.status
            response.errorCode = rsp.errorCode
            response.message = rsp.message

            if (notEmpty(rsp?.errorData)) {
                response.data = rsp.errorData
            }
        }
    }

    if (notEmpty(data)) {
        response.data = data;
    }
    return res.status(status || 400).send(response)
}

function getPagination (page, per_page, total, totalPages){
    return {page, per_page, total, totalPages}
}


module.exports = {
    notEmpty,
    isEmpty,
    validateEmail,
    hashToken,
    generateResetToken,
    ResSuss,
    ResFail,
    objectId,
    defaultPageSize,
    defaultPageNo
    ,getPagination
}
