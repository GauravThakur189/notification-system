const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
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
        validate: { isEmail: true },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: true,   // null for OAuth users (no password)
    },
    googleId: {
        type: DataTypes.STRING,
        allowNull: true,   // null for local users
        unique: true,
    },
    role: {
        type: DataTypes.ENUM('user', 'admin'),
        defaultValue: 'user',
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    refreshToken: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
},
    {
        tableName: 'users',
        timestamps: true,   // adds createdAt & updatedAt automatically
        hooks: {
            // auto-hash password before saving
            beforeCreate: async (user) => {
                if (user.password) {
                    user.password = await bcrypt.hash(user.password, 12);
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('password') && user.password) {
                    user.password = await bcrypt.hash(user.password, 12);
                }
            },
        },
    });

// Instance method to compare passwords
User.prototype.validatePassword = async function (plainPassword) {
    return bcrypt.compare(plainPassword, this.password);
};

module.exports = User;