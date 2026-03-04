require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { validateOtpDeliveryConfig } = require('./src/config/validateEnv');

const PORT = process.env.PORT || 5000;

// Connect to Database first, then start server
const startServer = async () => {
    try {
        validateOtpDeliveryConfig();
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server running on port http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error.message || error);
        process.exit(1);
    }
};

startServer();