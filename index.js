require("dotenv").config();
const mongoose = require("mongoose");
const path = require("path");
const express = require('express')
const cors = require("cors")
const bodyParser = require("body-parser")
const fileUpload = require("express-fileupload");
const RightModel = require("./models/Right.model");
const app = express()


let PORT = process.env.PORT || 8080

// Middleware
app.use(express.static(path.join(__dirname, "public"))); // For serving static files

//* extend body limit to 50MB
app.use(bodyParser.json({ limit: process.env.LimitbodyParser }))
app.use(bodyParser.urlencoded({ limit: process.env.LimitbodyParser, extended: true }))
app.use(fileUpload());

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.use("/", require("./routes/index.route"));

//* Connect to MONGODB Database -> listen on PORT
mongoose
    .connect(process.env.DATABASE_CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((__, err) => {
        if (!err) {
            console.log("Connected to Database")


        } else {
            console.log(err)
        }
    })
    .finally(() => { })

app.listen(PORT, () => console.log(`listening on PORT ${PORT}!`))