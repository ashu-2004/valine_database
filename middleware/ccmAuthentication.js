const jwt = require("jsonwebtoken");
const CCM = require("../models/ccm");
const isCCMLoggedIn = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({ message: "No token provided." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const ccm = await CCM.findOne({ where: { id: decoded.id } });

        if (!ccm) {
            return res.status(404).json({ message: "CCM not found." });
        }

        req.user = decoded; // Attach user data to request object
        next(); // Pass control to next middleware/route
    } catch (error) {
        return res.status(400).json({ message: "Invalid or expired token." });
    }
};

module.exports = { isCCMLoggedIn };
