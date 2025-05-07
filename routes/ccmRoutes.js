const express = require("express");
require("dotenv").config();
const router = express.Router();
const CCMController = require("../controllers/ccm");
const { validateDMRegistration } = require("../validators/dmValidation");
const { isCCMLoggedIn } = require("../middleware/ccmAuthentication");

const {
  authorizeRole,
  authenticateUser,
} = require("../middleware/authenticate");
const upload = require("../middleware/multer");

// API to register the new DM through CCM.
router.post(
  "/register-dm",
  authenticateUser,
  isCCMLoggedIn,
  authorizeRole(["ccm"]),
  validateDMRegistration,
  CCMController.RegisterDM
);

// Api to get Profile
router.get(
  "/get-profile",
  authenticateUser,
  authorizeRole(["ccm"]),
  CCMController.getProfile
);

//Api to update profile
router.put(
  "/update-profile",
  authenticateUser,
  isCCMLoggedIn,
  authorizeRole(["ccm"]),
  CCMController.updateProfile
);

// Api to get all one royalty's and dm,ccm,am count for dashboard
router.get(
  "/get-royalty",
  authenticateUser,
  authorizeRole(["ccm"]),
  CCMController.getRoyalty
)

//Api - get DM's
router.get(
  "/get-dm",
  authenticateUser,
  authorizeRole(["ccm"]),
  CCMController.getDMs
);

//Api - get AM's under DM
router.get(
  "/get-am/:dmId",
  authenticateUser,
  authorizeRole(["ccm"]),
  CCMController.getAMs
);

//Api - get all DM's under DM
router.get(
  "/get-dm/:parentdmId",
  authenticateUser,
  authorizeRole(["ccm"]),
  CCMController.getDMsUnderDM
);

//Api- Product request
router.post(
  "/product-request",
  authenticateUser,
  isCCMLoggedIn,
  authorizeRole(["ccm"]),
  upload.single("image"),
  CCMController.productRequest
);

//Api - request status
router.get(
  "/request-status",
  authenticateUser,
  authorizeRole(["ccm"]),
  CCMController.requestStatus
);

module.exports = router;
