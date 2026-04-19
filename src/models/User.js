const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },

  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  role: {
    type: DataTypes.ENUM("candidate", "recruiter"),
    allowNull: false,
  },

  companyId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  // ✅ FIXED HERE
  website: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  profileImage: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = User;