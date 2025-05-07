const express = require('express');
const cors = require('cors');
const db = require('./config/db.js');
const bodyParser = require('body-parser');
const app = express();
require("dotenv").config();
const DB_PORT = process.env.DB_PORT || 3306;

// const { syncModels } = require("./models/index.js");
// syncModels();

app.use(cors(
    {
    origin: 'http://localhost:5173',
    credentials: true
}
));

require("./cron/Promotion"); 
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

const admin = require("./routes/adminRoutes.js");
const ccm = require("./routes/ccmRoutes.js");
const dm = require("./routes/dmRoutes.js");
const am = require("./routes/amRoutes.js");

app.use("/api", admin);
app.use("/api/ccm", ccm);
app.use("/api/dm", dm);
app.use("/api/am", am);

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
});

app.listen(DB_PORT, () => {
    console.log('Server is running on the port 3306');
});