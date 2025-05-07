const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.js");
const bcrypt = require("bcrypt");

const AM = sequelize.define("AM", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    parentAmId: {
        type: DataTypes.INTEGER,
        allowNull: true, // allow null for top-level AMs
        references: {
            model: "am", // Self-referencing the same table
            key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL", // If parent AM is deleted, this becomes null
    },    
    dmId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: "dm", // Table name of DM model
            key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: "Name cannot be empty." },
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
    password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: "Password cannot be empty." },
        },
    },
    address: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: "Address cannot be empty." },
        },
    },
    // product_request_status: {
    //     type: DataTypes.ENUM("pending", "approved", "rejected"),
    //     defaultValue: "pending",
    //     allowNull: false,
    //     validate: {
    //         isIn: {
    //             args: [["pending", "approved", "rejected"]],
    //             msg: "Product request status must be either pending, approved, or rejected.",
    //         },
    //     },
    // },
}, {
    timestamps: true,
    tableName: "am", 
});

AM.beforeCreate(async (instance) => {
    if (instance.password_hash) {
        const salt = await bcrypt.genSalt(10);
        instance.password_hash = await bcrypt.hash(instance.password_hash, salt);
    }
});

module.exports = AM;