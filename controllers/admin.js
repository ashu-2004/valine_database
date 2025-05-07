const AM = require("../models/am");
const DM = require("../models/dm");
const CCM = require("../models/ccm");
const Admin = require("../models/admin");
const Product = require("../models/products");
const bcrypt = require("bcrypt");
const PaymentHistory = require("../models/paymenthistory");
const { Op } = require("sequelize");
const { Sequelize } = require("sequelize");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const { sendEmail } = require("../utils/sendMail.js");
const ContactForm = require("../models/contact.js"); 

module.exports.RegisterAdmin = async (req, res) => {
  try {
    const { name, email, contact, password_hash } = req.body;

    // Check for missing fields
    if (!name || !email || !contact || !password_hash) {
      return res.status(400).json({
        message: "All fields are required.",
      });
    }

    // Check for existing email/contact in all user types
    const modelsToCheck = [Admin, AM, DM, CCM];
    let emailExists = false;
    let contactExists = false;

    for (const model of modelsToCheck) {
      const [existingEmail, existingContact] = await Promise.all([
        model.findOne({ where: { email } }),
        model.findOne({ where: { contact } }),
      ]);

      if (existingEmail) emailExists = true;
      if (existingContact) contactExists = true;
    }

    if (emailExists && contactExists) {
      return res
        .status(409)
        .json({ message: "Both email and contact already exist." });
    } else if (emailExists) {
      return res.status(409).json({ message: "Email is already registered." });
    } else if (contactExists) {
      return res
        .status(409)
        .json({ message: "Contact number is already registered." });
    }

    // Hash the password securely
    // const hashedPassword = await bcrypt.hash(password_hash, 10);

    // Create new admin
    const newAdmin = await Admin.create({
      name,
      email,
      contact,
      password_hash: password_hash,
    });

    return res.status(201).json({
      message: "Admin registered successfully",
      admin: newAdmin,
    });
  } catch (error) {
    if (
      error.name === "SequelizeValidationError" ||
      error.name === "SequelizeUniqueConstraintError"
    ) {
      const messages = error.errors.map((e) => e.message);
      return res.status(400).json({ errors: messages });
    }

    console.error("Admin Registration Error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error. Please try again later." });
  }
};

module.exports.RegisterCCM = async (req, res) => {
  try {
    const { name, email, contact, password_hash, address } = req.body;

    // Check required fields
    if (!name || !email || !contact || !password_hash || !address) {
      return res
        .status(400)
        .json({ message: "All required fields must be filled." });
    }

    // Check for existing email/contact in all user types
    const modelsToCheck = [AM, DM, CCM, Admin];
    let emailExists = false;
    let contactExists = false;

    for (const model of modelsToCheck) {
      const [existingEmail, existingContact] = await Promise.all([
        model.findOne({ where: { email } }),
        model.findOne({ where: { contact } }),
      ]);

      if (existingEmail) emailExists = true;
      if (existingContact) contactExists = true;
    }

    if (emailExists && contactExists) {
      return res
        .status(400)
        .json({ message: "Email and contact already exist in the system." });
    } else if (emailExists) {
      return res
        .status(400)
        .json({ message: "Email is already registered in the system." });
    } else if (contactExists) {
      return res.status(400).json({
        message: "Contact number is already registered in the system.",
      });
    }
    // Create CCM
    const newCCM = await CCM.create({
      name,
      email,
      contact,
      password_hash,
      address,
      product_request_status: "pending",
      week_summary_total: 0,
    });

    return res
      .status(201)
      .json({ message: "CCM registered successfully", ccm: newCCM });
  } catch (error) {
    if (
      error.name === "SequelizeValidationError" ||
      error.name === "SequelizeUniqueConstraintError"
    ) {
      const messages = error.errors.map((e) => e.message);
      return res.status(400).json({ errors: messages });
    }

    console.error("Error in CCM registration:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // Accepts email or contact

    if (!identifier || !password) {
      return res.status(400).json({
        message: "Email or Contact and password are required",
      });
    }

    let user = null;
    let role = "";

    const userRoles = [
      { model: Admin, role: "admin" },
      { model: CCM, role: "ccm" },
      { model: DM, role: "dm" },
      { model: AM, role: "am" },
    ];

    for (const entry of userRoles) {
      user = await entry.model.findOne({
        where: {
          [Op.or]: [{ email: identifier }, { contact: identifier }],
        },
      });
      // console.log(`Searching for ${entry.role}:`, user);
      if (user) {
        role = entry.role;
        // console.log("role is:",role);
        break;
      }
    }

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid email/contact or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Invalid email/contact or password" });
    }

    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables.");
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      contact: user.contact,
      role,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: `${user.name} Login successful`,
      token,
      role,
      user: user,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.AddProducts = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      commission_ccm,
      selling_prize,
      commission_dm,
      // company_benefit,
    } = req.body;

    // Convert string values to numbers
    const numericPrice = Number(price);
    const numericCCM = Number(commission_ccm);
    const numericSelling = Number(selling_prize);
    const numericDM = Number(commission_dm);
    // const numericBenefit = Number(company_benefit);

    if (
      !name ||
      !description ||
      isNaN(numericPrice) ||
      isNaN(numericCCM) ||
      isNaN(numericSelling) ||
      isNaN(numericDM) 
      // isNaN(numericBenefit)
    ) {
      return res
        .status(400)
        .json({ message: "Required fields are missing or invalid." });
    }

    // Optional: check for negatives
    if (
      numericPrice < 0 ||
      numericCCM < 0 ||
      numericSelling < 0 ||
      numericDM < 0 
      // numericBenefit < 0
    ) {
      return res
        .status(400)
        .json({ message: "Numeric values cannot be negative." });
    }

    const image = req.file ? req.file.buffer : null;

    if (!image) {
      return res.status(400).json({ message: "Image file is required." });
    }

    const product = await Product.create({
      name,
      image,
      description,
      price: numericPrice,
      commission_ccm: numericCCM,
      selling_prize: numericSelling,
      commission_dm: numericDM,
      // company_benefit: numericBenefit,
    });

    res.status(201).json({
      message: "Product added successfully.",
      product,
    });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({
      message: "Failed to add product.",
      error: error.message || "Internal Server Error",
    });
  }
};

module.exports.getCCM = async (req, res) => {
  try {
    // Fetch all CCM users
    const users = await CCM.findAll();

    if (!users || users.length === 0) {
      return res.status(404).json({
        message: "No CCM records found.",
      });
    }

    // Get current month range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Fetch all approved PaymentHistory entries for this month
    const payments = await PaymentHistory.findAll({
      where: {
        date: {
          [Op.between]: [startOfMonth, endOfMonth],
        },
        product_request_status: "approved",
      },
      attributes: ["ccmId", "am_benefit"],
    });

    // Calculate benefit per CCM
    const ccmBenefitsMap = {};
    for (const payment of payments) {
      const ccmId = payment.ccmId;
      if (ccmId) {
        ccmBenefitsMap[ccmId] = (ccmBenefitsMap[ccmId] || 0) + (payment.am_benefit || 0);
      }
    }

    // Attach each CCM's benefit to their record
    const usersWithBenefit = users.map((ccm) => {
      const benefit = ccmBenefitsMap[ccm.id] || 0;
      return {
        ...ccm.toJSON(),
        own_ccm_benefit: benefit,
      };
    });

    return res.status(200).json({
      message: "CCM fetched successfully.",
      users: usersWithBenefit,
    });
  } catch (error) {
    console.error("Error during fetching CCM:", error.message);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports.getDM = async (req, res) => {
  try {
    // Fetch all DM users
    const users = await DM.findAll();

    if (!users || users.length === 0) {
      return res.status(404).json({
        message: "No DM records found.",
      });
    }

    // Get current month range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Fetch all approved PaymentHistory entries for this month
    const payments = await PaymentHistory.findAll({
      where: {
        date: {
          [Op.between]: [startOfMonth, endOfMonth],
        },
        product_request_status: "approved",
      },
      attributes: ["dmId", "am_benefit"],
    });

    // Calculate benefit per DM
    const dmBenefitsMap = {};
    for (const payment of payments) {
      const dmId = payment.dmId;
      if (dmId) {
        dmBenefitsMap[dmId] = (dmBenefitsMap[dmId] || 0) + (payment.am_benefit || 0);
      }
    }

    // Attach each DM's benefit to their record
    const usersWithBenefit = users.map((dm) => {
      const benefit = dmBenefitsMap[dm.id] || 0;
      return {
        ...dm.toJSON(),
        own_dm_benefit: benefit,
      };
    });

    return res.status(200).json({
      message: "DM fetched successfully.",
      users: usersWithBenefit,
    });
  } catch (error) {
    console.error("Error during fetching DM:", error.message);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports.getAM = async (req, res) => {
  try {
    // Fetch all AM users
    const users = await AM.findAll();

    if (!users || users.length === 0) {
      return res.status(404).json({
        message: "No AM records found.",
      });
    }

    // Get current month start and end dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Fetch all approved PaymentHistory entries for this month
    const payments = await PaymentHistory.findAll({
      where: {
        date: {
          [Op.between]: [startOfMonth, endOfMonth],
        },
        product_request_status: "approved",
      },
      attributes: ["amId", "am_benefit"],
    });

    // Calculate benefit per AM
    const amBenefitsMap = {};
    for (const payment of payments) {
      const amId = payment.amId;
      if (amId) {
        amBenefitsMap[amId] = (amBenefitsMap[amId] || 0) + (payment.am_benefit || 0);
      }
    }

    // Attach each AM's benefit to their record
    const usersWithBenefit = users.map((am) => {
      const benefit = amBenefitsMap[am.id] || 0;
      return {
        ...am.toJSON(),
        own_am_benefit: benefit,
      };
    });

    return res.status(200).json({
      message: "AM fetched successfully.",
      users: usersWithBenefit,
    });
  } catch (error) {
    console.error("Error during fetching AM:", error.message);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports.profile = async (req, res) => {
  try {
    const { id } = req.user;

    if (!id) {
      return res
        .status(400)
        .json({ message: "User ID is missing from request" });
    }

    const user = await Admin.findOne({ where: { id } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile fetched successfully.",
      user,
    });
  } catch (error) {
    console.error("Error while fetching profile:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports.getDMsByCCMId = async (req, res) => {
  const { ccmId } = req.params;

  try {
    const dms = await DM.findAll({
      where: { ccmId },
      attributes: { exclude: ["password_hash"] }, // optional
    });

    if (dms.length === 0) {
      return res.status(404).json({ message: "No DMs found under this CCM ID." });
    }

    // Get current month start and end dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Fetch approved payments for the current month
    const payments = await PaymentHistory.findAll({
      where: {
        date: {
          [Op.between]: [startOfMonth, endOfMonth],
        },
        product_request_status: "approved",
      },
      attributes: ["dmId", "am_benefit"],
    });

    // Calculate DM benefits
    const dmBenefitsMap = {};
    for (const payment of payments) {
      const dmId = payment.dmId;
      if (dmId) {
        dmBenefitsMap[dmId] = (dmBenefitsMap[dmId] || 0) + (payment.am_benefit || 0);
      }
    }

    // Attach own_dm_benefit to each DM
    const dmsWithBenefit = dms.map((dm) => {
      const benefit = dmBenefitsMap[dm.id] || 0;
      return {
        ...dm.toJSON(),
        own_dm_benefit: benefit,
      };
    });

    res.status(200).json({
      message: "DMs fetched successfully.",
      dms: dmsWithBenefit,
    });
  } catch (err) {
    console.error("Error fetching DMs:", err);
    res.status(500).json({ message: "Server error while fetching DMs." });
  }
};

module.exports.getAMsByDMId = async (req, res) => {
  const { dmId } = req.params;

  try {
    const ams = await AM.findAll({
      where: { dmId },
      attributes: { exclude: ["password_hash"] }, // optional
    });

    if (ams.length === 0) {
      return res.status(404).json({ message: "No AMs found under this DM." });
    }

    // Get current month start and end dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Fetch approved payments for the current month
    const payments = await PaymentHistory.findAll({
      where: {
        date: {
          [Op.between]: [startOfMonth, endOfMonth],
        },
        product_request_status: "approved",
      },
      attributes: ["amId", "am_benefit"],
    });

    // Calculate AM benefits
    const amBenefitsMap = {};
    for (const payment of payments) {
      const amId = payment.amId;
      if (amId) {
        amBenefitsMap[amId] = (amBenefitsMap[amId] || 0) + (payment.am_benefit || 0);
      }
    }

    // Attach own_am_benefit to each AM
    const amsWithBenefit = ams.map((am) => {
      const benefit = amBenefitsMap[am.id] || 0;
      return {
        ...am.toJSON(),
        own_am_benefit: benefit,
      };
    });

    res.status(200).json({
      message: "AMs fetched successfully.",
      ams: amsWithBenefit,
    });
  } catch (err) {
    console.error("Error fetching AMs:", err);
    res.status(500).json({ message: "Server error while fetching AMs." });
  }
};

module.exports.getProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json({
      message: "Products fetched successfully...",
      products: products,
    });
  } catch (error) {
    console.error("Error fetching Products:", err);
    res.status(500).json({ message: "Server error while fetching Products." });
  }
};

module.exports.getAMsByParentAMId = async (req, res) => {
  const parentAmId = req.params.amId;

  if (!parentAmId) {
    return res.status(400).json({ message: "Parent AM ID is required." });
  }

  try {
    const ams = await AM.findAll({
      where: { parentAmId },
      attributes: { exclude: ["password_hash"] },
    });

    if (!ams || ams.length === 0) {
      return res.status(404).json({ message: "No AMs found under this AM." });
    }

    // Get current month start and end dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Fetch approved payments for the current month
    const payments = await PaymentHistory.findAll({
      where: {
        date: {
          [Op.between]: [startOfMonth, endOfMonth],
        },
        product_request_status: "approved",
      },
      attributes: ["amId", "am_benefit"],
    });

    // Calculate AM benefits
    const amBenefitsMap = {};
    for (const payment of payments) {
      const amId = payment.amId;
      if (amId) {
        amBenefitsMap[amId] = (amBenefitsMap[amId] || 0) + (payment.am_benefit || 0);
      }
    }

    // Attach own_am_benefit to each AM
    const amsWithBenefit = ams.map((am) => {
      const benefit = amBenefitsMap[am.id] || 0;
      return {
        ...am.toJSON(),
        own_am_benefit: benefit,
      };
    });

    res.status(200).json({
      message: "AMs fetched successfully.",
      ams: amsWithBenefit,
    });
  } catch (err) {
    console.error("Error fetching AMs:", err);

    if (err.name === "SequelizeDatabaseError") {
      return res.status(400).json({ message: "Invalid Parent AM ID format." });
    }

    res.status(500).json({
      message: "Server error while fetching AMs.",
      error: err.message,
    });
  }
};

module.exports.editProducts = async (req, res) => {
  try {
    const productId = req.params.id;

    // Get fields from request body
    const {
      name,
      description,
      price,
      commission_ccm,
      selling_prize,
      commission_dm,
      company_benefit,
    } = req.body;

    if (
      !name ||
      !description ||
      price === undefined ||
      commission_ccm === undefined ||
      selling_prize === undefined ||
      commission_dm === undefined ||
      company_benefit === undefined
    ) {
      return res.status(400).json({
        message:
          "Missing required fields. Please ensure all fields are provided.",
      });
    }
    // Optional: Handle image if sent as base64 or file upload
    let image = req.body.image; // For base64, else handle file separately

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    // Update the fields
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price !== undefined ? price : product.price;
    product.commission_ccm =
      commission_ccm !== undefined ? commission_ccm : product.commission_ccm;
    product.selling_prize =
      selling_prize !== undefined ? selling_prize : product.selling_prize;
    product.commission_dm =
      commission_dm !== undefined ? commission_dm : product.commission_dm;
    product.company_benefit =
      company_benefit !== undefined ? company_benefit : product.company_benefit;

    if (image) {
      product.image = image;
    }

    await product.save();

    res.status(200).json({
      message: "Product information updated successfully.",
      product,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res
      .status(500)
      .json({ message: "Failed to update product.", error: error.message });
  }
};

module.exports.getDMsByDMId = async (req, res) => {
  const { parentdmId } = req.params;

  // Validate parentdmId
  if (!parentdmId) {
    return res.status(400).json({ message: "Parent DM ID is required." });
  }

  try {
    const dms = await DM.findAll({
      where: { parentdmId },
      attributes: { exclude: ["password_hash"] },
    });

    if (!dms || dms.length === 0) {
      return res.status(404).json({ message: "No DMs found under this DM." });
    }

    // Get current month start and end dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Fetch approved payments for the current month
    const payments = await PaymentHistory.findAll({
      where: {
        date: {
          [Op.between]: [startOfMonth, endOfMonth],
        },
        product_request_status: "approved",
      },
      attributes: ["dmId", "am_benefit"],
    });

    // Calculate DM benefits
    const dmBenefitsMap = {};
    for (const payment of payments) {
      const dmId = payment.dmId;
      if (dmId) {
        dmBenefitsMap[dmId] = (dmBenefitsMap[dmId] || 0) + (payment.am_benefit || 0);
      }
    }

    // Attach own_dm_benefit to each DM
    const dmsWithBenefit = dms.map((dm) => {
      const benefit = dmBenefitsMap[dm.id] || 0;
      return {
        ...dm.toJSON(),
        own_dm_benefit: benefit,
      };
    });

    res.status(200).json({
      message: "DMs fetched successfully.",
      dms: dmsWithBenefit,
    });
  } catch (err) {
    console.error("Error fetching DMs:", err);

    if (err.name === "SequelizeDatabaseError") {
      return res.status(400).json({ message: "Invalid Parent DM ID format." });
    }

    res.status(500).json({
      message: "Server error while fetching DMs.",
      error: err.message,
    });
  }
};

module.exports.editProfile = async (req, res) => {
  try {
    const { id } = req.user;
    let { name, email, contact } = req.body;

    // Trim values
    name = name?.trim();
    email = email?.trim();
    contact = contact?.trim();

    if (!name || !email || !contact) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    // Check email in other modules
    const [emailInAM, emailInCCM, emailInAdmin, emailInDM] = await Promise.all([
      AM.findOne({ where: { email } }),
      CCM.findOne({ where: { email } }),
      Admin.findOne({ where: { email, id: { [Op.ne]: id } } }),
      DM.findOne({ where: { email } }),
    ]);

    if (emailInAM || emailInCCM || emailInAdmin || emailInDM) {
      return res
        .status(409)
        .json({ message: "Email already in use by another account." });
    }

    // Check contact in other modules
    const [contactInAM, contactInCCM, contactInAdmin, contactInDM] =
      await Promise.all([
        AM.findOne({ where: { contact } }),
        CCM.findOne({ where: { contact } }),
        Admin.findOne({ where: { contact, id: { [Op.ne]: id } } }),
        DM.findOne({ where: { contact } }),
      ]);

    if (contactInAM || contactInCCM || contactInAdmin || contactInDM) {
      return res
        .status(409)
        .json({ message: "Contact number already in use by another account." });
    }

    // Update profile
    admin.name = name;
    admin.email = email;
    admin.contact = contact;

    await admin.save();

    return res
      .status(200)
      .json({ message: "Profile updated successfully.", data: admin });
  } catch (error) {
    console.error("Error while editing profile", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

module.exports.acceptOrRejectRequest = async (req, res) => {
  try {
    const id = req.params.product_id;
    const { status } = req.body;

    // Validate status
    const validStatuses = ["approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Must be either 'approved' or 'rejected'.",
      });
    }

    // Check if the request exists
    const paymentRequest = await PaymentHistory.findByPk(id);
    if (!paymentRequest) {
      return res.status(404).json({
        error: "Product request not found.",
      });
    }

    // Update the product_request_status and date
    await paymentRequest.update({
      product_request_status: status,
      date: new Date(), // Update date to current date and time
    });

    res.status(200).json({
      message: `Product request has been successfully ${status}.`,
      updatedRequest: paymentRequest,
    });
  } catch (error) {
    console.error("Error updating product request status:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

module.exports.productRequestInfo = async (req, res) => {
  try {
    const pendingRequests = await PaymentHistory.findAll({
      where: {
        product_request_status: "pending",
      },
      raw: true,
    });

    const enrichedRequests = await Promise.all(
      pendingRequests.map(async (request) => {
        let user = await AM.findOne({
          where: { id: request.amId },
          attributes: ["name"],
          raw: true,
        });
        let role = "AM";

        if (!user) {
          user = await DM.findOne({
            where: { id: request.dmId },
            attributes: ["name"],
            raw: true,
          });
          role = "DM";
        }

        if (!user) {
          user = await CCM.findOne({
            where: { id: request.ccmId },
            attributes: ["name"],
            raw: true,
          });
          role = "CCM";
        }

        return {
          id: request.id,
          amId: request.amId,
          name: user ? user.name : "Unknown",
          role: user ? role : "Unknown",
          products: request.quantity_array,
          date: request.date,
          product_request_status: request.product_request_status,
          payment_sc: request.payment_sc
            ? `data:image/jpeg;base64,${Buffer.from(
                request.payment_sc
              ).toString("base64")}`
            : null,
          // payment_sc: request.payment_sc,
        };
      })
    );

    res.status(200).json({
      message:
        "Pending product requests with user info and product details fetched successfully.",
      data: enrichedRequests,
    });
  } catch (error) {
    console.error("Error while getting the product request information", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

module.exports.paymentDetails = async (req, res) => {
  try {
    const { id } = req.user;
    const { upi_address } = req.body;

    if (!upi_address) {
      return res.status(400).json({ message: "UPI address not provided" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "QR image not provided" });
    }

    const user = await Admin.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "Admin not found" });
    }

    user.qr_image = req.file.buffer; // storing QR image as BLOB
    user.upi_address = upi_address;

    await user.save();

    res.status(200).json({
      message: "Payment details uploaded successfully",
      user,
    });
  } catch (error) {
    console.error("Error while uploading payment details", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

module.exports.getRoyalty = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const royalties = await PaymentHistory.findAll({
      where: {
        date: {
          [Op.between]: [startOfMonth, endOfMonth],
        },
        product_request_status:"approved",
      },
    });

    // Initialize totals
    let total_am_benefit = 0;
    let total_ccm_royalty = 0;
    let total_dm_royalty = 0;

    for (const royalty of royalties) {
      total_am_benefit += royalty.am_benefit || 0;
      total_ccm_royalty += royalty.ccm_royalty || 0;
      total_dm_royalty += royalty.dm_royalty || 0;
    }

    // Get counts
    const [am_count, ccm_count, dm_count] = await Promise.all([
      AM.count(),
      CCM.count(),
      DM.count(),
    ]);

    const dm_destribution = total_dm_royalty / dm_count;
    const ccm_destribution = total_ccm_royalty / ccm_count;
    const total_business =
      total_ccm_royalty + total_dm_royalty;
    return res.status(200).json({
      message: "Current month royalty summary",
      // total_am_benefit,
      total_ccm_royalty,
      total_dm_royalty,
      am_count,
      ccm_count,
      dm_count,
      dm_destribution,
      ccm_destribution,
      total_business,
    });
  } catch (error) {
    console.error("Error while fetching the royalty's", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

module.exports.resetPass = async (req, res) => {
  try {
    const { email, newpassword } = req.body;

    let user;
    let role;

    // 🔹 Check in all tables
    user = await Admin.findOne({ where: { email } });
    if (user) role = "admin";

    if (!user) {
      user = await CCM.findOne({ where: { email } });
      if (user) role = "ccm";
    }

    if (!user) {
      user = await DM.findOne({ where: { email } });
      if (user) role = "dm";
    }

    if (!user) {
      user = await AM.findOne({ where: { email } });
      if (user) role = "am";
    }

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    // 🔹 Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newpassword, saltRounds);

    // 🔹 Update password in the correct table
    await user.update({ password_hash: hashedPassword });

    res.status(200).json({
      message: `Password updated successfully for ${role}!`,
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server error!" });
  }
};

module.exports.sendemailOtp = async (req, res) => {
  sendEmail(req.body)
    .then((response) => res.send(response.message))
    .catch((error) => res.status(500).send(error.message));
};

module.exports.getContactDetails = async (req, res) => {
  try {
      const contacts = await ContactForm.findAll({
          order: [["createdAt", "DESC"]], // optional: latest first
      });

      return res.status(200).json({
          message: "Contact details fetched successfully!",
          data: contacts,
      });
  } catch (error) {
      console.error("Error fetching contact details:", error);
      return res.status(500).json({
          message: "Something went wrong while fetching contact details.",
          error: error.message,
      });
  }
};

module.exports.deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await product.destroy();
    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ message: "Server error while deleting product" });
  }
};


module.exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json({
      message: "Products fetched successfully...",
      products: products,
    });
  } catch (error) {
    console.error("Error fetching Products:", err);
    res.status(500).json({ message: "Server error while fetching Products." });
  }
};

module.exports.getCount = async (req, res) => {
  try {
    const [productCount, ccmCount, dmCount, amCount] = await Promise.all([
      Product.count(),
      CCM.count(),
      DM.count(),
      AM.count(),
    ]);

    res.json({
      success: true,
      data: {
        products: productCount,
        ccm: ccmCount,
        dm: dmCount,
        am: amCount,
      },
    });
  } catch (error) {
    console.error("Error fetching counts:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    let deleted = false;

    // Try deleting from Ccm table
    const ccmUser = await CCM.findOne({ where: { id, name } });
    if (ccmUser) {
      await ccmUser.destroy();
      deleted = true;
      return res.json({ success: true, message: "CCM user deleted successfully" });
    }

    // Try deleting from Dm table
    const dmUser = await DM.findOne({ where: { id, name } });
    if (dmUser) {
      await dmUser.destroy();
      deleted = true;
      return res.json({ success: true, message: "DM user deleted successfully" });
    }

    // Try deleting from Am table
    const amUser = await AM.findOne({ where: { id, name } });
    if (amUser) {
      await amUser.destroy();
      deleted = true;
      return res.json({ success: true, message: "AM user deleted successfully" });
    }

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "User not found in CCM, DM, or AM tables",
      });
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
