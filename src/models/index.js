const { sequelize } = require('../config/database');
const User = require('./users');

// Define associations here if needed
// e.g. User.hasMany(Notification)

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ MySQL connected successfully.');

        // Sync all models
        // await sequelize.sync({ alter: true });
        console.log('✅ Models synced with database.');
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB, User };