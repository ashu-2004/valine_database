const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.js");
const bcrypt = require("bcrypt");

const Admin = sequelize.define("Admin", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: {
                args: true,
                msg: "Name cannot be empty.",
            },
        },
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
            args: true,
            msg: "Email is already in use. Please use a different email.",
        },
        validate: {
            isEmail: {
                args: true,
                msg: "Invalid email format. Please enter a valid email address.",
            },
        },
    },
    contact: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: {
            args: true,
            msg: "Contact number already exists. Please use a different number.",
        },
        validate: {
            isNumeric: {
                args: true,
                msg: "Contact number must contain only numbers.",
            },
            len: {
                args: [10, 10],
                msg: "Contact number must be exactly 10 digits long.",
            },
        },
    },
    qr_image: {
        type: DataTypes.BLOB("long"),
        allowNull: true,
        validate: {
            notEmpty: {
                args: true,
                msg: "QR image cannot be empty if provided.",
            },
        },
    },
    upi_address: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            is: {
                args: /^[\w.-]+@[\w.-]+$/,
                msg: "Invalid UPI address format.",
            },
        },
    },
    password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: {
                args: true,
                msg: "Password cannot be empty.",
            },
        },
    },
}, {
    timestamps: true,
    tableName: "admin",
});

Admin.beforeCreate(async (instance) => {
    if (instance.password_hash) {
        const salt = await bcrypt.genSalt(10);
        instance.password_hash = await bcrypt.hash(instance.password_hash, salt);
    }
});

module.exports = Admin;