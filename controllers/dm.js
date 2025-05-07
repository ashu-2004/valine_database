const AM = require("../models/am");
const DM = require("../models/dm");
const CCM = require("../models/ccm");
const Admin = require("../models/admin");
const JWT_SECRET = process.env.JWT_SECRET;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { Sequelize } = require("sequelize");
const PaymentHistory = require("../models/paymenthistory");
const moment=require("moment");
const Product = require("../models/products");

module.exports.RegisterAM = async (req, res) => {
  try {
    const { id } = req.user; // DM's ID
    const dmId = id;

    const { name, email, contact, password_hash, address } = req.body;

    // Check required fields
    if (!name || !email || !contact || !password_hash || !address || !dmId) {
      return res
        .status(400)
        .json({ message: "All required fields must be filled." });
    }

    // Check if email/contact exists in any user type
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

    // Check if there are already 10 AMs under the current DM
    const amCount = await AM.count({ where: { dmId } });
    if (amCount >= 10) {
      return res
        .status(400)
        .json({ message: "Cannot register more than 10 AMs under this DM." });
    }

    // Create AM
    const newAM = await AM.create({
      dmId,
      name,
      email,
      contact,
      password_hash,
      address,
    });

    return res
      .status(201)
      .json({ message: "AM registered successfully", am: newAM });
  } catch (error) {
    if (
      error.name === "SequelizeValidationError" ||
      error.name === "SequelizeUniqueConstraintError"
    ) {
      const messages = error.errors.map((e) => e.message);
      return res.status(400).json({ errors: messages });
    }

    console.error("Error in AM registration:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.RegisterDM = async (req, res) => {
  try {
    const { id } = req.user; // DM's ID
    const parentdmId = id;

    const { name, email, contact, password_hash, address } = req.body;

    // Check required fields
    if (
      !name ||
      !email ||
      !contact ||
      !password_hash ||
      !address ||
      !parentdmId
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be filled." });
    }

    // Check if email/contact exists in any user type
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

    // Check if there are already 10 DMs under the current DM
    const dmCount = await DM.count({ where: { parentdmId } });
    if (dmCount >= 10) {
      return res
        .status(400)
        .json({ message: "Cannot register more than 10 DMs under this DM." });
    }

    // Create AM
    const newDM = await DM.create({
      parentdmId,
      name,
      email,
      contact,
      password_hash,
      address,
    });

    return res
      .status(201)
      .json({ message: "DM registered successfully", dm: newDM });
  } catch (error) {
    if (
      error.name === "SequelizeValidationError" ||
      error.name === "SequelizeUniqueConstraintError"
    ) {
      const messages = error.errors.map((e) => e.message);
      return res.status(400).json({ errors: messages });
    }

    console.error("Error in DM registration:", error);
    return res.status(500).json({ message: "Internal server error" });
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

    const user = await DM.findOne({ where: { id } });

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

module.exports.editProfile = async (req, res) => {
  try {
    const { id } = req.user;
    let { name, email, contact, address } = req.body;

    // Trim values
    name = name?.trim();
    email = email?.trim();
    contact = contact?.trim();
    address = address?.trim();

    if (!name || !email || !contact || !address) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const dm = await DM.findByPk(id);
    if (!dm) {
      return res.status(404).json({ message: "DM not found." });
    }

    // Check email in other modules
    const [emailInAM, emailInCCM, emailInAdmin, emailInDM] = await Promise.all([
      AM.findOne({ where: { email } }),
      CCM.findOne({ where: { email } }),
      Admin.findOne({ where: { email } }),
      DM.findOne({ where: { email, id: { [Op.ne]: id } } }),
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
        Admin.findOne({ where: { contact } }),
        DM.findOne({ where: { contact, id: { [Op.ne]: id } } }),
      ]);

    if (contactInAM || contactInCCM || contactInAdmin || contactInDM) {
      return res
        .status(409)
        .json({ message: "Contact number already in use by another account." });
    }

    // Update profile
    dm.name = name;
    dm.email = email;
    dm.contact = contact;
    dm.address = address;

    await dm.save();

    return res
      .status(200)
      .json({ message: "Profile updated successfully.", data: dm });
  } catch (error) {
    console.error("Error while editing profile", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

module.exports.getRoyalty = async (req, res) => {
  try {
    const parentdmId = req.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const royalties = await PaymentHistory.findAll({
      where: {
        date: {
          [Op.between]: [startOfMonth, endOfMonth],
        },
        product_request_status: "approved",
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

    const [am_count, ccm_count, dm_count] = await Promise.all([
      AM.count(),
      CCM.count(),
      DM.count(),
    ]);
    const dm_count1 = await DM.count({ where: { parentdmId: parentdmId } });
    const am_count1 = await AM.count({ where: { dmId: parentdmId } });
    const dm_destribution = total_dm_royalty / dm_count;
    const ccm_destribution = total_ccm_royalty / ccm_count;
    const total_business =
      total_ccm_royalty + total_dm_royalty;

    const ownProfitResult = await PaymentHistory.findAll({
      where: {
        date: {
          [Op.between]: [startOfMonth, endOfMonth],
        },
        product_request_status: "approved",
        dmId: parentdmId, 
      },
      attributes: ["am_benefit"],
    });

    let own_dm_profit = 0;
    for (const entry of ownProfitResult) {
      own_dm_profit += entry.am_benefit || 0;
    }

    return res.status(200).json({
      message: "Current month royalty summary",
      total_ccm_royalty,
      total_dm_royalty,
      dm_count1,
      am_count1,
      own_dm_profit,
      dm_destribution,
      ccm_destribution,
      total_business,
    });
  } catch (error) {
    console.error("Error while fetching the royalty's", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

module.exports.getAM = async (req, res) => {
  try {
    const { id } = req.user;

    if (!id) {
      return res.status(400).json({ message: "DM ID not found." });
    }

    const ams = await AM.findAll({
      where: { dmId: id },
      attributes: { exclude: ["password_hash"] },
    });

    if (!ams || ams.length === 0) {
      return res.status(404).json({ message: "No AMs present under this DM." });
    }

    // Calculate start and end of the current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Fetch payment history for the current month and approved requests
    const payments = await PaymentHistory.findAll({
      where: {
        date: { [Op.between]: [startOfMonth, endOfMonth] },
        product_request_status: "approved",
      },
      attributes: ["amId", "am_benefit"],
    });

    // Sum up benefits per AM
    const amBenefitMap = {};
    for (const payment of payments) {
      const amId = payment.amId;
      if (amId) {
        amBenefitMap[amId] = (amBenefitMap[amId] || 0) + (payment.am_benefit || 0);
      }
    }

    // Add own_am_benefit to each AM
    const enrichedAMs = ams.map((am) => ({
      ...am.toJSON(),
      own_am_benefit: amBenefitMap[am.id] || 0,
    }));

    return res.status(200).json({
      message: "Successfully fetched all AMs under this DM.",
      ams: enrichedAMs,
    });

  } catch (error) {
    console.error("Error while getting AMs:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports.getAMUnderAm = async (req, res) => {
  try {
    const { parentAmId } = req.params;

    if (!parentAmId) {
      return res.status(400).json({ message: "Parent AM ID is required." });
    }

    const childAms = await AM.findAll({
      where: { parentAmId },
      attributes: { exclude: ["password_hash"] },
    });

    if (!childAms || childAms.length === 0) {
      return res.status(404).json({ message: "No AMs found under this parent AM." });
    }

    // Get start and end of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Fetch approved payment history for the current month
    const payments = await PaymentHistory.findAll({
      where: {
        date: { [Op.between]: [startOfMonth, endOfMonth] },
        product_request_status: "approved",
      },
      attributes: ["amId", "am_benefit"],
    });

    // Aggregate benefit per AM
    const benefitMap = {};
    for (const payment of payments) {
      const amId = payment.amId;
      if (amId) {
        benefitMap[amId] = (benefitMap[amId] || 0) + (payment.am_benefit || 0);
      }
    }

    // Enrich AMs with benefit data
    const enrichedAms = childAms.map((am) => ({
      ...am.toJSON(),
      own_am_benefit: benefitMap[am.id] || 0,
    }));

    return res.status(200).json({
      message: "Successfully fetched AMs under the parent AM.",
      ams: enrichedAms,
    });
  } catch (error) {
    console.error("Error while fetching AMs under AM:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports.getDM = async (req, res) => {
  try {
    const { id } = req.user;

    if (!id) {
      return res.status(400).json({ message: "User ID not found." });
    }

    const dms = await DM.findAll({
      where: { parentdmId: id },
      attributes: { exclude: ["password_hash"] },
    });

    if (!dms || dms.length === 0) {
      return res.status(404).json({ message: "No DMs found under this user." });
    }

    // Get start and end of the current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Fetch approved payment histories for the current month
    const payments = await PaymentHistory.findAll({
      where: {
        date: { [Op.between]: [startOfMonth, endOfMonth] },
        product_request_status: "approved",
      },
      attributes: ["dmId", "am_benefit"],
    });

    // Aggregate DM benefits
    const benefitMap = {};
    for (const payment of payments) {
      const dmId = payment.dmId;
      if (dmId) {
        benefitMap[dmId] = (benefitMap[dmId] || 0) + (payment.am_benefit || 0);
      }
    }

    // Attach benefit to each DM
    const enrichedDMs = dms.map((dm) => ({
      ...dm.toJSON(),
      own_dm_benefit: benefitMap[dm.id] || 0,
    }));

    return res.status(200).json({
      message: "Successfully fetched DMs under the current user.",
      dms: enrichedDMs,
    });
  } catch (error) {
    console.error("Error while getting the DMs:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

module.exports.getDMUnderDM = async (req, res) => {
  try {
    const { parentdmId } = req.params;

    if (!parentdmId) {
      return res.status(400).json({ message: "Parent DM ID is required." });
    }

    const dms = await DM.findAll({
      where: { parentdmId },
      attributes: { exclude: ["password_hash"] },
    });

    if (!dms || dms.length === 0) {
      return res.status(404).json({ message: "No DMs found under this parent DM." });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const payments = await PaymentHistory.findAll({
      where: {
        date: { [Op.between]: [startOfMonth, endOfMonth] },
        product_request_status: "approved",
      },
      attributes: ["dmId", "am_benefit"],
    });

    const benefitMap = {};
    for (const payment of payments) {
      const dmId = payment.dmId;
      if (dmId) {
        benefitMap[dmId] = (benefitMap[dmId] || 0) + (payment.am_benefit || 0);
      }
    }

    const enrichedDMs = dms.map((dm) => ({
      ...dm.toJSON(),
      own_dm_benefit: benefitMap[dm.id] || 0,
    }));

    return res.status(200).json({
      message: "Successfully fetched DMs under the parent DM.",
      dms: enrichedDMs,
    });
  } catch (error) {
    console.error("Error while getting DMs under DM:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

module.exports.getAMUnderDM = async (req, res) => {
  try {
    const { dmId } = req.params;

    if (!dmId) {
      return res.status(400).json({ message: "DM ID is required." });
    }

    const ams = await AM.findAll({
      where: { dmId },
      attributes: { exclude: ["password_hash"] },
    });

    if (!ams || ams.length === 0) {
      return res.status(404).json({ message: "No AMs found under this DM." });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const payments = await PaymentHistory.findAll({
      where: {
        date: { [Op.between]: [startOfMonth, endOfMonth] },
        product_request_status: "approved",
      },
      attributes: ["amId", "am_benefit"],
    });

    const benefitMap = {};
    for (const payment of payments) {
      const amId = payment.amId;
      if (amId) {
        benefitMap[amId] = (benefitMap[amId] || 0) + (payment.am_benefit || 0);
      }
    }

    const enrichedAMs = ams.map((am) => ({
      ...am.toJSON(),
      own_am_benefit: benefitMap[am.id] || 0,
    }));

    return res.status(200).json({
      message: "Successfully fetched AMs under the specified DM.",
      ams: enrichedAMs,
    });
  } catch (error) {
    console.error("Error while getting AMs under DM:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

module.exports.productRequest = async (req, res) => {
  try {
    const dmId = req.user.id; // Current logged-in DM user
    let { products } = req.body;
    const image = req.file;

    if (typeof products === "string") {
      try {
        products = JSON.parse(products);
      } catch (parseErr) {
        return res
          .status(400)
          .json({ message: "Invalid JSON in products field." });
      }
    }
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res
        .status(400)
        .json({ message: "Products with quantity are required." });
    }

    if (!image) {
      return res
        .status(400)
        .json({ message: "Payment screenshot is required." });
    }

    let totalCcmRoyalty = 0;
    let totalDmRoyalty = 0;
    let totalCompanyBenefit = 0;
    let totalAmBenefit = 0;

    const results = [];

    for (let item of products) {
      const { id, quantity } = item;
      const q = parseFloat(quantity);

      const product = await Product.findByPk(id);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product with ID ${id} not found.` });
      }

      const ccmRoyalty = q * product.commission_ccm;
      const dmRoyalty = q * product.commission_dm;
      const companyBenefit = q * product.company_benefit;
      // const amBenefit = product.selling_prize - product.price;
      const amBenefit = q * (product.selling_prize - product.price); 
      totalCcmRoyalty += ccmRoyalty;
      totalDmRoyalty += dmRoyalty;
      totalCompanyBenefit += companyBenefit;
      totalAmBenefit += amBenefit;

      results.push({
        product: product.name, // string
        quantity: q, // number
      });
    }
    const payment_sc = req.file.buffer;

    // Save to PaymentHistory table
    await PaymentHistory.create({
      dmId,
      date: new Date(),
      dm_royalty: totalDmRoyalty,
      ccm_royalty: totalCcmRoyalty,
      am_benefit: totalAmBenefit,
      company_benefit: totalCompanyBenefit,
      payment_sc: payment_sc,
      quantity_array: results, // Store array of {product, quantity}
    });

    return res.status(200).json({
      message: "Product request submitted and saved successfully.",
      paymentScreenshot: payment_sc,
      dmId: dmId,
      breakdown: results,
      totals: {
        totalCcmRoyalty,
        totalDmRoyalty,
        totalCompanyBenefit,
        totalAmBenefit,
      },
    });
  } catch (error) {
    console.error("Error in productRequest:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

module.exports.requestStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const now = moment();
    const oneDayAgo = moment().subtract(1, "days").toDate();

    // Fetch all requests for this user
    const allRequests = await PaymentHistory.findAll({
      where: {
        dmId: userId,
        [Op.or]: [
          { product_request_status: "pending" },
          {
            product_request_status: { [Op.in]: ["approved", "rejected"] },
            date: { [Op.gte]: oneDayAgo }, // show only if within 1 day
          },
        ],
      },
      attributes: ["quantity_array", "product_request_status", "date"],
    });

    // Format all requests
    const formattedAll = allRequests.map((entry) => ({
      products: entry.quantity_array.map((item) => ({
        product: item.product,
        quantity: item.quantity,
      })),
      status: entry.product_request_status,
      date: entry.date,
    }));

    // Separate by statuses
    const formattedPending = formattedAll.filter(
      (request) => request.status === "pending"
    );

    const formattedApproved = formattedAll.filter(
      (request) =>
        request.status === "approved" && moment(request.date).isAfter(oneDayAgo)
    );

    const formattedRejected = formattedAll.filter(
      (request) =>
        request.status === "rejected" && moment(request.date).isAfter(oneDayAgo)
    );

    const combinedRequests = [
      ...formattedPending,
      ...formattedApproved,
      ...formattedRejected,
    ];

    // Sort combined requests by date (latest first)
    combinedRequests.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      requests: combinedRequests,
    });
  } catch (error) {
    console.error("Error fetching product requests:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};