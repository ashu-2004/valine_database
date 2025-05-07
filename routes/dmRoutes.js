const express = require("express");
require("dotenv").config();
const router = express.Router();
const DMController = require("../controllers/dm");
const { validateAMRegistration } = require("../validators/amValidation");
const { isDMLoggedIn } = require("../middleware/dmAuthentication");
const { validateDMRegistration } = require("../validators/dmValidation");

const {
  authorizeRole,
  authenticateUser,
} = require("../middleware/authenticate");
const upload = require("../middleware/multer");

// API to register the new AM through DM.
router.post(
  "/register-am",
  authenticateUser,
  isDMLoggedIn,
  authorizeRole("dm"),
  validateAMRegistration,
  DMController.RegisterAM
);

// API to register the new DM through DM.
router.post(
  "/register-dm",
  authenticateUser,
  isDMLoggedIn,
  authorizeRole("dm"),
  validateDMRegistration,
  DMController.RegisterDM
);

//Api -get profile
router.get(
  "/get-profile",
  authenticateUser,
  authorizeRole(["dm"]),
  DMController.profile
);

//Api - edit profile
router.put(
  "/profile/edit",
  authenticateUser,
  isDMLoggedIn,
  authorizeRole(["dm"]),
  DMController.editProfile
);

// Api to get all one royalty's and dm,ccm,am count for dashboard
router.get(
  "/get-royalty",
  authenticateUser,
  authorizeRole(["dm"]),
  DMController.getRoyalty
)

//Api - get AM'
router.get(
  "/get-am",
  authenticateUser,
  authorizeRole(["dm"]),
  DMController.getAM
)

//Api - get AM's under AM'
router.get(
  "/:parentAmId/get-am-under-am",
  authenticateUser,
  authorizeRole(["dm"]),
  DMController.getAMUnderAm
);

//Api to get Dm's
router.get(
  "/getDM",
  authenticateUser,
  authorizeRole(["dm"]),
  DMController.getDM
);

//Api to get DM's under DM of our DM
router.get(
  "/:parentdmId/getDM-under-dm",
  authenticateUser,
  authorizeRole(["dm"]),
  DMController.getDMUnderDM
);

//Api to get AM's under DM of our DM
router.get(
  "/:dmId/getAmUnder/dm",
  authenticateUser,
  authorizeRole(["dm"]),
  DMController.getAMUnderDM
);

//Api -product request
router.post(
  "/product-request",
  authenticateUser,
  isDMLoggedIn,
  authorizeRole(["dm"]),
  upload.single("image"),
  DMController.productRequest
);
//request status(accept,reject or pending)
router.get(
  "/request-status",
  authenticateUser,
  authorizeRole(["dm"]),
  DMController.requestStatus
);

module.exports = router;
