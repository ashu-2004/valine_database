const express = require("express");
require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
const upload = require("../middleware/multer");
const AMController = require("../controllers/am");

const { validateAMRegistration } = require("../validators/amValidation");
const { isAMLoggedIn } = require("../middleware/amAuthentication");
const {
  authorizeRole,
  authenticateUser,
} = require("../middleware/authenticate");

// API to register the new AM.
router.post(
  "/register-am-through-am",
  authenticateUser,
  isAMLoggedIn,
  authorizeRole(["am"]),
  validateAMRegistration,
  AMController.RegisterAMThroughAM
);

//API to register AM by its own.
router.post("/register-am", validateAMRegistration, AMController.RegisterAM);

//get api for fetch all the DM's And AM's name and Id whoes under does not exist 10 dm's for showing during the register of AM.
router.get("/getDMAndAM", AMController.getDMAndAM);

//get api to fetch all products
router.get(
  "/get-products",
  authenticateUser,
  authorizeRole(["am", "ccm", "dm"]),
  AMController.getProducts
);

//send product request
router.post(
  "/product-request",
  authenticateUser,
  isAMLoggedIn,
  authorizeRole(["am"]),
  upload.single("image"),
  AMController.productRequest
);

//get api - Profile
router.get(
  "/get-profile",
  authenticateUser,
  authorizeRole(["am"]),
  AMController.profile
);

//get All Am's Under it.
router.get(
  "/get-AM",
  authenticateUser,
  authorizeRole(["am"]),
  AMController.getAM
);

//get AM's Under Its AM
router.get(
  "/under/:id",
  authenticateUser,
  authorizeRole(["am"]),
  AMController.getSubAMsById
);

//request status(accept,reject or pending)
router.get(
  "/request-status",
  authenticateUser,
  authorizeRole(["am"]),
  AMController.requestStatus
);

// AM profile update route
router.put(
  "/am/profile/edit",
  authenticateUser,
  isAMLoggedIn,
  authorizeRole(["am"]),
  AMController.editProfile
);

//get payment details provided by admin.
router.get(
  "/get-paymentDetails",
  authenticateUser,
  authorizeRole(["am"]),
  AMController.paymentDetails
);

//Api - Post contact details
router.post("/contact-us-query", AMController.contact);

// Api to get all one royalty's and dm,ccm,am count for dashboard
router.get(
  "/get-royalty",
  authenticateUser,
  authorizeRole(["am"]),
  AMController.getRoyalty
)

module.exports = router;
