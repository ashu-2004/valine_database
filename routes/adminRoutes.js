const express = require("express");
require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
const upload = require("../middleware/multer");
const AdminController = require("../controllers/admin");
const { isAdminLoggedIn } = require("../middleware/adminAuthenticate");
const { validateCCMRegistration } = require("../validators/ccmValidation");
const {
  authorizeRole,
  authenticateUser,
} = require("../middleware/authenticate");

// API to register the new CCM through Admin.
router.post(
  "/register-ccm",
  authenticateUser,
  isAdminLoggedIn,
  authorizeRole(["admin"]),
  validateCCMRegistration,
  AdminController.RegisterCCM
);

// API to register admin
router.post("/register-admin", AdminController.RegisterAdmin);

//API for login Admin,DM,CCM,AM
router.post("/login", AdminController.login);

// POST - Add product
router.post(
  "/add-products",
  authenticateUser,
  isAdminLoggedIn,
  authorizeRole(["admin"]),
  upload.single("image"),
  AdminController.AddProducts
);

//GET - Get all products
router.get(
  "/get-products",
  authenticateUser,
  authorizeRole(["admin"]),
  AdminController.getProducts
);

// Route to edit product information with image upload
router.put(
  "/:id/edit-product-information",
  authenticateUser,
  isAdminLoggedIn,
  authorizeRole(["admin"]),
  upload.single("image"),
  AdminController.editProducts
);

//get api for fetching all the ccm's
router.get(
  "/get-ccm",
  authenticateUser,
  authorizeRole(["admin"]),
  AdminController.getCCM
);

//get api for fetching all the DM's
router.get(
  "/get-dm",
  authenticateUser,
  authorizeRole(["admin"]),
  AdminController.getDM
);

//get api for fetching all the AM's
router.get(
  "/get-am",
  authenticateUser,
  authorizeRole(["admin"]),
  AdminController.getAM
);

//get api - Profile
router.get(
  "/get-profile",
  authenticateUser,
  authorizeRole(["admin"]),
  AdminController.profile
);

//Api to get All the dm's under perticular ccm
router.get(
  "/ccm/:ccmId/dm",
  authenticateUser,
  authorizeRole(["admin"]),
  AdminController.getDMsByCCMId
);

//Api to get All the am's under perticular dm
router.get(
  "/dm/:dmId/am",
  authenticateUser,
  authorizeRole(["admin"]),
  AdminController.getAMsByDMId
);

// Api to get All the dm's under perticular dm.
router.get(
  "/dm/:parentdmId/dm",
  authenticateUser,
  authorizeRole(["admin"]),
  AdminController.getDMsByDMId
);

//Api to get All the am's under perticular am.
router.get(
  "/am/:amId/am",
  authenticateUser,
  authorizeRole(["admin"]),
  AdminController.getAMsByParentAMId
);

//Api to edit profile
router.put(
  "/edit-profile",
  authenticateUser,
  isAdminLoggedIn,
  authorizeRole(["admin"]),
  AdminController.editProfile
);

//Api to accept or reject the product request
router.post(
  "/:product_id/accept-request",
  authenticateUser,
  isAdminLoggedIn,
  authorizeRole(["admin"]),
  AdminController.acceptOrRejectRequest
);

//Api to get the product request.
router.get(
  "/product-request-info",
  authenticateUser,
  authorizeRole(["admin"]),
  AdminController.productRequestInfo
);

//Api to put payment details (qr_image,upi address)
router.put(
  "/payment_details",
  authenticateUser,
  isAdminLoggedIn,
  authorizeRole(["admin"]),
  upload.single("qr_image"),
  AdminController.paymentDetails
);

// Api to get all one royalty's and dm,ccm,am count for dashboard
router.get(
  "/get-royalty",
  authenticateUser,
  authorizeRole(["admin", "ccm", "dm", "am"]),
  AdminController.getRoyalty
);

//api for the reset the password
router.post("/send_recovery_email", AdminController.sendemailOtp);

//reset password api
router.post("/resetPass", AdminController.resetPass);

//api - get all the contact details
router.get(
  "/get-contact-details",
  authenticateUser,
  authorizeRole(["admin"]),
  AdminController.getContactDetails
);

//Api - delete product
router.delete(
  "/delete-product/:productId",
  authenticateUser,
  isAdminLoggedIn,
  authorizeRole(["admin"]),
  AdminController.deleteProduct
);

//Api - All Products
router.get(
  "/all-products",
  AdminController.getAllProducts
);

//Api - get count of all the products,ccm ,dm,am
router.get(
  "/get-count",
  AdminController.getCount
);

//Api to delete ccm||dm||am
router.delete(
  "/delete/:id",
  authenticateUser,
  isAdminLoggedIn,
  authorizeRole(["admin"]),
  AdminController.deleteUser
);

module.exports = router;
