const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CCMDemotionTracker = sequelize.define('CCMDemotionTracker', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  ccmId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  triggeredAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'ccm_demotion_tracker', 
  timestamps: false
});

module.exports = CCMDemotionTracker;
