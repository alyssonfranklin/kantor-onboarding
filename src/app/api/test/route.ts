import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb/connect';

export async function GET() {
  try {
    // Get the MongoDB URI from environment variable
    const MONGODB_URI = process.env.MONGODB_URI || '';
    
    if (!MONGODB_URI) {
      return NextResponse.json({ 
        success: false, 
        message: 'MONGODB_URI environment variable is not set',
        env: process.env.NODE_ENV
      });
    }
    
    // Print the URI but mask the password for security
    const uriParts = MONGODB_URI.split('@');
    let maskedUri = MONGODB_URI;
    
    if (uriParts.length > 1) {
      const authPart = uriParts[0].split(':');
      if (authPart.length > 1) {
        maskedUri = `${authPart[0]}:***********@${uriParts.slice(1).join('@')}`;
      }
    }
    
    // Attempt to connect to MongoDB
    console.log('Testing MongoDB connection to:', maskedUri);
    
    try {
      await dbConnect();
      
      // Get connection stats
      const stats = {
        connected: mongoose.connection.readyState === 1,
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        // Count of collections to verify we can query the database
        collections: Object.keys(mongoose.connection.collections).length
      };
      
      return NextResponse.json({
        success: true,
        message: 'Successfully connected to MongoDB',
        uri: maskedUri,
        connection: stats,
        collections: Object.keys(mongoose.connection.collections)
      });
    } catch (connError) {
      console.error('Failed to connect to MongoDB:', connError);
      
      return NextResponse.json({
        success: false,
        message: 'Failed to connect to MongoDB',
        error: connError instanceof Error ? connError.message : String(connError),
        uri: maskedUri,
      });
    }
  } catch (error) {
    console.error('Error in test route:', error);
    
    return NextResponse.json({
      success: false,
      message: 'An error occurred while testing MongoDB connection',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}