const express = require("express");
const app = express();

const Operations = require("./users.operation");

const router = express.Router();

router.get("/", Operations.getUsers);


module.exports = router;