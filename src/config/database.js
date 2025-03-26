/**
 * MongoDB connection configuration and setup
 * Implements connection pooling and reconnection logic
 */
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
const logger = require('../utils/logger');

// MongoDB Atlas connection string from environment variable
const MONGODB_URI = process.env.MONGODB_URI;

// Validate MongoDB URI
if (!MONGODB_URI) {
  logger.error('MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

// Mongoose connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10, // Maximum number of connections in the pool
  serverSelectionTimeoutMS: 5000, // Timeout for server selection
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
};

/**
 * Connect to MongoDB Atlas using Mongoose
 */
const connectWithMongoose = async () => {
  try {
    await mongoose.connect(MONGODB_URI, options);
    logger.info('MongoDB connected via Mongoose');
    
    // Handle connection events
    mongoose.connection.on('error', err => {
      logger.error(`MongoDB connection error: ${err}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
      setTimeout(connectWithMongoose, 5000); // Try to reconnect after 5 seconds
    });
    
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to app termination');
      process.exit(0);
    });
    
    return mongoose.connection;
  } catch (err) {
    logger.error(`Error connecting to MongoDB: ${err}`);
    process.exit(1);
  }
};

/**
 * Connect to MongoDB directly using the native driver
 * Useful for operations that Mongoose doesn't support well
 */
const connectWithNativeClient = async () => {
  try {
    const client = new MongoClient(MONGODB_URI, options);
    await client.connect();
    logger.info('MongoDB connected via native client');
    return client;
  } catch (err) {
    logger.error(`Error connecting to MongoDB with native client: ${err}`);
    throw err;
  }
};

module.exports = {
  connectWithMongoose,
  connectWithNativeClient,
  mongoose
};