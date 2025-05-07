const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.js");

const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: {
          args: true,
          msg: "Product name cannot be empty.",
        },
      },
    },
    image: {
      type: DataTypes.BLOB("long"),
      allowNull: false,
      validate: {
        notEmpty: {
          args: true,
          msg: "Image data is required.",
        },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          args: true,
          msg: "Product description cannot be empty.",
        },
      },
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    commission_ccm: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    selling_prize: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    commission_dm: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    // company_benefit: {
    //   type: DataTypes.FLOAT,
    //   allowNull: false,
    //   defaultValue: 0,
    // },
  },
  {
    timestamps: true,
    tableName: "products",
  }
);

module.exports = Product;
