const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
    if (isConnected) {
        console.log('✅ Using existing MongoDB connection');
        return;
    }

    try {
        console.log('🔄 Attempting to connect to MongoDB Atlas...');
        
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            bufferCommands: false,
        });

        isConnected = true;
        console.log(`✅ MongoDB Connected Successfully!`);
        console.log(`🌐 Host: ${conn.connection.host}`);
        console.log(`📂 Database: ${conn.connection.name}`);
        
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        
        // Provide specific error guidance
        if (error.message.includes('IP') || error.message.includes('whitelist')) {
            console.error('💡 SOLUTION: Add your IP address to MongoDB Atlas whitelist');
            console.error('🔗 Go to: https://cloud.mongodb.com → Network Access → IP Access List');
            console.error('🌍 Or add 0.0.0.0/0 to allow all IPs (for development only)');
        }
        
        if (error.message.includes('authentication')) {
            console.error('💡 SOLUTION: Check your username and password in the connection string');
        }
        
        // Don't exit in serverless environment
        if (process.env.NODE_ENV !== 'production') {
            process.exit(1);
        } else {
            throw error;
        }
    }
};

module.exports = connectDB;
