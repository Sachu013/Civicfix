const dotenv = require('dotenv');
dotenv.config(); // Load environment variables first

const connectDB = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 5000;

// Connect to Database, then start the Express server
const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log('Server running on port ' + PORT);
        });
    } catch (error) {
        console.error('Server failed to start due to database connection error:', error.message);
        process.exit(1);
    }
};

startServer();
