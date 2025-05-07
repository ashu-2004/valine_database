const sequelize = require("../config/db.js");

// Import models
const Admin = require("./admin.js");
const AM = require("./am.js");
const DM = require("./dm.js");
const CCM = require("./ccm.js");
const Products = require("./products.js");
const PaymentHistory = require("./paymenthistory.js");
const Tracker = require("./tracker.js");
const ContactForm = require("./contact.js");

// Sync all models (create tables if not exist)
const syncModels = async () => {
  try {
    await sequelize.sync({ alter: true }); // `alter: true` updates schema without deleting data
    console.log("All tables created (if not exist)");
  } catch (error) {
    console.error("Error creating tables:", error);
  }
};

// module.exports = { sequelize, Admin,CCM,DM,AM,Products,Tracker,PaymentHistory, syncModels };
module.exports = { sequelize, Products, syncModels };
