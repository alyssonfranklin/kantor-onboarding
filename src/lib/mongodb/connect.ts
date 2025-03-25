import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

// In development, don't throw if MONGODB_URI is not defined
// This will allow the build to complete but the API will return an error
// when called without a valid MONGODB_URI
if (!MONGODB_URI && process.env.NODE_ENV === 'production') {
  console.error('WARNING: Please define the MONGODB_URI environment variable');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
// Declare the mongoose global variable
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// @ts-expect-error - Initialize global mongoose if it doesn't exist
global.mongoose = global.mongoose || ({ conn: null, promise: null } as MongooseCache);

// @ts-expect-error - Global mongoose connection cache
const cached = global.mongoose;

export async function dbConnect() {
  // Return early with an error if MONGODB_URI is not defined
  if (!MONGODB_URI) {
    throw new Error('MongoDB URI is not defined. Please set the MONGODB_URI environment variable.');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Disconnect from database
export async function disconnectFromDatabase() {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
}