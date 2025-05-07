const Joi = require("joi");

const ccmRegistrationSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    "string.empty": "Name cannot be empty.",
    "string.min": "Name must be at least 3 characters.",
    "string.max": "Name cannot exceed 100 characters.",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Invalid email format. Please enter a valid email address.",
    "any.required": "Email is required.",
  }),
  contact: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.pattern.base": "Contact number must be exactly 10 digits.",
      "any.required": "Contact number is required.",
    }),
  password_hash: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters long.",
    "any.required": "Password is required.",
  }),
  address: Joi.string().min(5).max(255).required().messages({
    "string.empty": "Address cannot be empty.",
    "string.min": "Address must be at least 5 characters.",
    "string.max": "Address cannot exceed 255 characters.",
  }),
  // week_summary_total: Joi.number().min(0).optional().messages({
  //   // "number.base": "Week summary total must be a number.",
  //   // "number.min": "Week summary total cannot be negative.",
  // }),
  // product_request_status: Joi.string()
  // .valid("pending", "approved", "rejected")
  // .allow(null)
  // .optional()
  // .messages({
  //   "any.only":
  //     "Product request status must be either pending, approved, or rejected.",
  // }),
  // week_commission_request: Joi.boolean().optional().messages({
  //   "boolean.base":
  //     "Week commission request must be a boolean value (true or false).",
  // }),
});

const validateCCMRegistration = (req, res, next) => {
  const { error } = ccmRegistrationSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  next(); // Passes validation ✅
};

module.exports = { validateCCMRegistration };
