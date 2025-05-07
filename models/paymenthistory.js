const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.js");

const PaymentHistory = sequelize.define(
  "PaymentHistory",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    amId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      
      references: {
        model: "am",
        key: "id",
      },
      validate: {
        isInt: { msg: "AM ID must be an integer." },
        min: { args: [1], msg: "AM ID must be greater than 0." },
      },
    },
    ccmId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "ccm",
        key: "id",
      },
      validate: {
        isInt: { msg: "CCM ID must be an integer." },
        min: { args: [1], msg: "CCM ID must be greater than 0." },
      },
    },
    dmId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "dm",
        key: "id",
      },
      validate: {
        isInt: { msg: "DM ID must be an integer." },
        min: { args: [1], msg: "DM ID must be greater than 0." },
      },
    },

    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      validate: {
        isDate: { msg: "Date must be valid." },
      },
    },
    dm_royalty: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isFloat: { msg: "DM royalty must be a number." },
        min: { args: [0], msg: "DM royalty cannot be negative." },
      },
    },
    ccm_royalty: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isFloat: { msg: "CCM royalty must be a number." },
        min: { args: [0], msg: "CCM royalty cannot be negative." },
      },
    },
    am_benefit: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isFloat: { msg: "AM benefit must be a number." },
        // min: { args: [0], msg: "AM benefit cannot be negative." },
      },
    },
    company_benefit: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isFloat: { msg: "Company benefit must be a number." },
        min: { args: [0], msg: "Company benefit cannot be negative." },
      },
    },
    payment_sc: {
      type: DataTypes.BLOB("long"),
      allowNull: true,
      validate: {
        notEmpty: {
          args: true,
          msg: "Image data is required.",
        },
      },
    },
    product_request_status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
      allowNull: false,
      validate: {
        isIn: {
          args: [["pending", "approved", "rejected"]],
          msg: "Product request status must be either pending, approved, or rejected.",
        },
      },
    },
    quantity_array: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        isValidStructure(value) {
          if (!Array.isArray(value)) {
            throw new Error("Quantity array must be an array of objects.");
          }

          for (const item of value) {
            if (
              typeof item !== "object" ||
              typeof item.product !== "string" ||
              typeof item.quantity !== "number"
            ) {
              throw new Error(
                "Each item must contain a product (string) and quantity (number)."
              );
            }
          }
        },
      },
    },
  },
  {
    tableName: "payment_history",
    timestamps: false,
  }
);

module.exports = PaymentHistory;
