const jwt = require("jsonwebtoken");
const CCM = require("../models/ccm");
const Admin = require("../models/admin");
const DM = require("../models/dm");
const AM = require("../models/am");

const authenticateUser = async (req, res, next) => {
    try {
        const token = req.header("Authorization");

        if (!token) {
            return res.status(401).json({ error: "Access denied. No token provided." });
        }

        // Verify and decode the token
        const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);

        // 🔹 Check for Admin
        if (decoded.role === "admin") {
            const admin = await Admin.findOne({ where: { id: decoded.id } });
            if (admin) {
                req.user = { id: admin.id, role: "admin" };
                return next();
            }
        }

        // 🔹 Check for CCM
        if (decoded.role === "ccm") {
            const ccm = await CCM.findOne({ where: { id: decoded.id } });
            if (ccm) {
                req.user = { id: ccm.id, role: "ccm", email: ccm.email };
                return next();
            }
        }

        // 🔹 Check for DM
        if (decoded.role === "dm") {
            const dm = await DM.findOne({ where: { id: decoded.id } });
            if (dm) {
                req.user = { id: dm.id, role: "dm", email: dm.email };
                return next();
            }
        }

        // 🔹 Check for AM
        if (decoded.role === "am") {
            const am = await AM.findOne({ where: { id: decoded.id } });
            if (am) {
                req.user = { id: am.id, role: "am", email: am.email };
                return next();
            }
        }

        return res.status(404).json({ error: "User not found." });

    } catch (error) {
        console.error("Authentication Error:", error);
        return res.status(400).json({ error: "Invalid token." });
    }
};

const authorizeRole = (roles) => {
    return (req, res, next) => {
        // console.log("User details in authorizeRole middleware:", req.user); // Debugging line

        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Access denied." });
        }
        next();
    };
};

module.exports = { authorizeRole, authenticateUser };