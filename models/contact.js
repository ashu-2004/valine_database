const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.js");

const ContactForm = sequelize.define("ContactForm", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    full_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: "Full name cannot be empty." },
        },
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            isEmail: {
                args: true,
                msg: "Invalid email format. Please enter a valid email address.",
            },
        },
    },
    phone_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            isNumeric: {
                args: true,
                msg: "Phone number must contain only numbers.",
            },
            len: {
                args: [10],
                msg: "Phone number must be of 10 digits.",
            },
        },
    },
    subject: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: "Subject cannot be empty." },
        },
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: { msg: "Message cannot be empty." },
        },
    },
}, {
    timestamps: true, // will automatically create createdAt and updatedAt
    tableName: "contact", // table name
});

module.exports = ContactForm;
