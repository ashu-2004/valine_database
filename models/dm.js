const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.js");
const bcrypt = require("bcrypt");

const DM = sequelize.define("DM", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    parentdmId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "dm",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL", // ✅ Safe option
      },
    // CCM foreign key
    ccmId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: "ccm", // Table name of the CCM model
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
    // total_commission: {
    //     type: DataTypes.FLOAT,
    //     allowNull: false,
    //     defaultValue: 0,
    //     validate: {
    //         isFloat: { msg: "Total commission must be a number." },
    //         min: {
    //             args: 0,
    //             msg: "Total commission cannot be negative.",
    //         },
    //     },
    // },
    // week_summary_total: {
    //     type: DataTypes.FLOAT,
    //     allowNull: true,
    //     defaultValue: 0,
    //     // validate: {
    //     //     isFloat: { msg: "Week summary total must be a number." },
    //     //     min: {
    //     //         args: 0,
    //     //         msg: "Week summary total cannot be negative.",
    //     //     },
    //     // },
    // },
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
    // week_commission_request: {
    //     type: DataTypes.BOOLEAN,
    //     allowNull: false,
    //     defaultValue: false,
    // },
}, {
    timestamps: true,
    tableName: "dm", 
});

DM.beforeCreate(async (instance) => {
    if (instance.password_hash) {
        const salt = await bcrypt.genSalt(10);
        instance.password_hash = await bcrypt.hash(instance.password_hash, salt);
    }
});

module.exports = DM;