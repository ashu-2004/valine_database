const Joi = require("joi");

// Validation schema for DM registration
const dmRegistrationSchema = Joi.object({
    // ccmId: Joi.number().integer().positive().required().messages({
    //     "number.base": "CCM ID must be a number.",
    //     "number.positive": "CCM ID must be a positive number.",
    //     "any.required": "CCM ID is required.",
    // }),
    parentdmId: Joi.number().integer().positive().messages({
        "number.base": "DM ID must be a number.",
        "number.positive": "DM ID must be a positive number.",
        "any.required": "DM ID is required.",
    }),
    name: Joi.string().min(3).max(100).required().messages({
        "string.empty": "Name cannot be empty.",
        "string.min": "Name must be at least 3 characters long.",
        "string.max": "Name must not exceed 100 characters.",
    }),
    email: Joi.string().email().required().messages({
        "string.email": "Invalid email format. Please enter a valid email address.",
        "string.empty": "Email cannot be empty.",
    }),
    password_hash: Joi.string().min(6).required().messages({
        "string.min": "Password must be at least 6 characters long.",
        "string.empty": "Password cannot be empty.",
    }),
    contact: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
        "string.pattern.base": "Contact number must be exactly 10 digits.",
        "string.empty": "Contact number is required.",
    }),
    address: Joi.string().min(5).max(255).required().messages({
        "string.empty": "Address cannot be empty.",
        "string.min": "Address must be at least 5 characters long.",
        "string.max": "Address must not exceed 255 characters.",
    }),
    // week_summary_total: Joi.number().min(0).optional().messages({
    //     // "number.base": "Week summary total must be a number.",
    //     // "number.min": "Week summary total cannot be negative.",
    // }),
    // product_request_status: Joi.string()
    //     .valid("pending", "approved", "rejected")
    //     .optional()
    //     .messages({
    //         "any.only": "Product request status must be either pending, approved, or rejected.",
    //     }),
    // week_commission_request: Joi.boolean().optional(),
});

// Middleware for validating DM registration request
const validateDMRegistration = (req, res, next) => {
    const { error } = dmRegistrationSchema.validate(req.body, { abortEarly: false });

    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    next();
};

module.exports = { validateDMRegistration };
