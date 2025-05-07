const AM = require("../models/am");
const DM = require("../models/dm");
const CCM = require("../models/ccm");
const { Sequelize } = require("sequelize");
const Admin = require("../models/admin");
const PaymentHistory = require("../models/paymenthistory");
const db = require("../models");
const Product = require("../models/products");
const sequelize = db.sequelize;
const { Op } = require("sequelize");
const moment = require("moment");
const ContactForm = require("../models/contact.js");

module.exports.RegisterAMThroughAM = async (req, res) => {
  try {
    const { id } = req.user;
    const parentAmId = id;
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

    // Check if there are already 10 AMs under this parent AM
    const amCount = await AM.count({ where: { parentAmId } });
    if (amCount >= 10) {
      return res.status(400).json({
        message: "Cannot register more than 10 AMs under this parent AM.",
      });
    }

    // Create AM
    const newAM = await AM.create({
      parentAmId,
      name,
      email,
      contact,
      password_hash,
      address,
    });

    return res.status(201).json({
      message: "AM registered successfully under another AM",
      am: newAM,
    });
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

module.exports.RegisterAM = async (req, res) => {
  try {
    const { dmId, parentAmId, name, email, contact, password_hash, address } =
      req.body;

    // Check required fields
    if (!name || !email || !contact || !password_hash || !address) {
      return res
        .status(400)
        .json({ message: "All required fields must be filled." });
    }

    if (!(dmId || parentAmId)) {
      return res
        .status(400)
        .json({ message: "Either dmId or parentAmId must be provided." });
    }

    if (dmId && parentAmId) {
      return res.status(400).json({
        message: "Only one of dmId or parentAmId should be provided.",
      });
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

    // Check if parentAmId or dmId exists in the system
    if (parentAmId) {
      const parentAmExists = await AM.findOne({ where: { id: parentAmId } });
      if (!parentAmExists) {
        return res.status(400).json({ message: "Parent AM does not exist." });
      }

      // Check if there are already 10 AMs under this parent AM
      const childAmCount = await AM.count({ where: { parentAmId } });
      if (childAmCount >= 10) {
        return res.status(400).json({
          message: "Cannot register more than 10 AMs under this parent AM.",
        });
      }
    }

    if (dmId) {
      const dmExists = await DM.findOne({ where: { id: dmId } });
      if (!dmExists) {
        return res.status(400).json({ message: "DM does not exist." });
      }

      // Check if there are already 10 AMs under this DM
      const amCountUnderDM = await AM.count({ where: { dmId } });
      if (amCountUnderDM >= 10) {
        return res.status(400).json({
          message: "Cannot register more than 10 AMs under this DM.",
        });
      }
    }

    // Create AM under DM or parent AM
    const newAM = await AM.create({
      dmId,
      parentAmId,
      name,
      email,
      contact,
      password_hash,
      address,
    });

    return res
      .status(201)
      .json({ message: "AM registered successfully.", am: newAM });
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

module.exports.getDMAndAM = async (req, res) => {
  try {
    // Fetch all DMs and AMs
    const dms = await DM.findAll();
    const ams = await AM.findAll();

    // Filter DMs: Only include DMs with less than 10 AMs under them
    const filteredDMs = [];
    for (const dm of dms) {
      const amCount = await AM.count({ where: { dmId: dm.id } });

      if (amCount < 10) {
        filteredDMs.push(dm);
      }
    }

    // Filter AMs: Only include AMs with less than 10 sub-AMs under them
    const filteredAMs = [];
    for (const am of ams) {
      const downlineCount = await AM.count({ where: { parentAMId: am.id } });

      if (downlineCount < 10) {
        filteredAMs.push(am);
      }
    }

    // Respond with the filtered data for both DMs and AMs
    res.status(200).json({
      success: true,
      data: {
        DMs: filteredDMs,
        AMs: filteredAMs,
      },
    });
  } catch (error) {
    console.error("Error fetching DMs and AMs:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports.getProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      attributes: [
        "id",
        "name",
        "price",
        "commission_ccm",
        "commission_dm",
        "company_benefit",
        "selling_prize",
      ],
    });
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Failed to retrieve products." });
  }
};

module.exports.productRequest = async (req, res) => {
  try {
    const amId = req.user.id; // Current logged-in DM user
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
      amId,
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
      amId: amId,
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

module.exports.profile = async (req, res) => {
  try {
    const { id } = req.user;

    if (!id) {
      return res
        .status(400)
        .json({ message: "User ID is missing from request" });
    }

    const user = await AM.findOne({ where: { id } });

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

module.exports.getAM = async (req, res) => {
  try {
    const { id } = req.user;

    if (!id) {
      return res.status(400).json({ message: "AM ID is missing from request" });
    }

    const subAMs = await AM.findAll({
      where: { parentAMId: id },
      attributes: ["id", "name", "email", "address", "contact"],
    });

    if (!subAMs || subAMs.length === 0) {
      return res.status(404).json({ message: "No AMs found under this AM." });
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

    const enrichedSubAMs = subAMs.map((am) => ({
      ...am.toJSON(),
      own_am_benefit: benefitMap[am.id] || 0,
    }));

    return res.status(200).json({
      message: "Fetched all AMs under this AM",
      data: enrichedSubAMs,
    });
  } catch (error) {
    console.error("Error while fetching AMs under this AM:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports.getSubAMsById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "AM ID is missing from URL" });
    }

    const subAMs = await AM.findAll({
      where: { parentAMId: id },
      attributes: ["id", "name", "email", "address", "contact"],
    });

    if (!subAMs || subAMs.length === 0) {
      return res.status(404).json({ message: "No sub-AMs found under this AM." });
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

    const enrichedSubAMs = subAMs.map((am) => ({
      ...am.toJSON(),
      own_am_benefit: benefitMap[am.id] || 0,
    }));

    return res.status(200).json({
      message: `Fetched all AMs under AM with ID ${id}`,
      data: enrichedSubAMs,
    });
  } catch (error) {
    console.error("Error while fetching sub-AMs:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
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
        amId: userId,
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

    const am = await AM.findByPk(id);
    if (!am) {
      return res.status(404).json({ message: "AM not found." });
    }

    // Check email in other modules
    const [emailInAM, emailInCCM, emailInAdmin, emailInDM] = await Promise.all([
      AM.findOne({ where: { email, id: { [Op.ne]: id } } }),
      CCM.findOne({ where: { email } }),
      Admin.findOne({ where: { email } }),
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
        AM.findOne({ where: { contact, id: { [Op.ne]: id } } }),
        CCM.findOne({ where: { contact } }),
        Admin.findOne({ where: { contact } }),
        DM.findOne({ where: { contact } }),
      ]);

    if (contactInAM || contactInCCM || contactInAdmin || contactInDM) {
      return res
        .status(409)
        .json({ message: "Contact number already in use by another account." });
    }

    // Update profile
    am.name = name;
    am.email = email;
    am.contact = contact;
    am.address = address;

    await am.save();

    return res
      .status(200)
      .json({ message: "Profile updated successfully.", data: am });
  } catch (error) {
    console.error("Error while editing profile", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

module.exports.paymentDetails = async (req, res) => {
  try {
    const admin = await Admin.findOne({
      attributes: ["qr_image", "upi_address"],
    });

    if (!admin) {
      return res
        .status(404)
        .json({ message: "Admin payment details not found" });
    }

    res.status(200).json({
      message: "Admin payment details fetched successfully",
      qr_image: admin.qr_image,
      upi_address: admin.upi_address,
    });
  } catch (error) {
    console.error("Error while getting payment details", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

module.exports.contact = async (req, res) => {
  try {
    const { full_name, email, phone_number, subject, message } = req.body;

    // Validation (optional basic check)
    if (!full_name || !email || !phone_number || !subject || !message) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Create new contact record
    const newContact = await ContactForm.create({
      full_name,
      email,
      phone_number,
      subject,
      message,
    });

    return res.status(201).json({
      message: "Contact query submitted successfully!",
      data: newContact,
    });
  } catch (error) {
    console.error("Error submitting contact query:", error);
    return res.status(500).json({
      message: "Something went wrong while submitting the query.",
      error: error.message,
    });
  }
};

module.exports.getRoyalty = async (req, res) => {
  try {
    const amId = req.user.id;
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
    const am_count1 = await AM.count({ where: { parentAmId: amId } });
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
        amId: amId, 
      },
      attributes: ["am_benefit"],
    });

    let own_am_profit = 0;
    for (const entry of ownProfitResult) {
      own_am_profit += entry.am_benefit || 0;
    }

    return res.status(200).json({
      message: "Current month royalty summary",
      total_ccm_royalty,
      total_dm_royalty,
      am_count1,
      own_am_profit,
      dm_destribution,
      ccm_destribution,
      total_business,
    });
  } catch (error) {
    console.error("Error while fetching the royalty's", error);
    res.status(500).json({ error: "Internal server error." });
  }
};