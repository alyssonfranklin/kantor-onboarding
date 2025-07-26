// src/lib/database.ts
import { MongoClient, Db, Collection } from 'mongodb';

export interface User {
  _id: string;
  email: string;
  companyID: string;
  assessment_fileID?: string;
  name?: string;
  // Add other user properties as needed
}

export interface UserQueryResult {
  eligibleUsers: User[];
  skippedUsers: User[];
  totalFound: number;
  eligibleCount: number;
  skippedCount: number;
}

export interface UserUpdateResult {
  modifiedCount: number;
  updatedUserIds: string[];
  success: boolean;
  error?: string;
}

export class DatabaseService {
  private static client: MongoClient | null = null;
  private static db: Db | null = null;

  /**
   * Initialize database connection
   */
  private static async getDb(): Promise<Db> {
    if (!this.db) {
      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) {
        throw new Error('MONGODB_URI environment variable is not set');
      }

      this.client = new MongoClient(mongoUri);
      await this.client.connect();
      this.db = this.client.db(); // Uses database from connection string
    }
    return this.db;
  }

  /**
   * Query users by emails within a company, respecting the no-overwrite rule
   */
  static async queryUsersByEmails(
    emails: string[], 
    companyID: string
  ): Promise<UserQueryResult> {
    try {
      const db = await this.getDb();
      const usersCollection: Collection<User> = db.collection('users');

      // Find all users with matching emails in the company
      const allMatchingUsers = await usersCollection.find({
        email: { $in: emails },
        companyID: companyID
      }).toArray();

      // Separate eligible users (no existing assessment_fileID) from skipped users
      const eligibleUsers = allMatchingUsers.filter(user => !user.assessment_fileID);
      const skippedUsers = allMatchingUsers.filter(user => user.assessment_fileID);

      const isDevelopment = process.env.NODE_ENV === 'development';
      
      if (isDevelopment) {
        console.log(`Database Query Results:`);
        console.log(`- Total matching users found: ${allMatchingUsers.length}`);
        console.log(`- Eligible for update: ${eligibleUsers.length}`);
        console.log(`- Skipped (already have fileID): ${skippedUsers.length}`);
        console.log(`- Eligible user emails: ${eligibleUsers.map(u => u.email).join(', ')}`);
        console.log(`- Skipped user emails: ${skippedUsers.map(u => u.email).join(', ')}`);
      }

      return {
        eligibleUsers,
        skippedUsers,
        totalFound: allMatchingUsers.length,
        eligibleCount: eligibleUsers.length,
        skippedCount: skippedUsers.length
      };

    } catch (error) {
      console.error('Error querying users:', error);
      throw new Error(`Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update users with assessment_fileID
   */
  static async updateUsersWithFileId(
    emails: string[],
    companyID: string,
    fileId: string
  ): Promise<UserUpdateResult> {
    try {
      const db = await this.getDb();
      const usersCollection: Collection<User> = db.collection('users');

      // Update only users that don't already have an assessment_fileID
      const updateResult = await usersCollection.updateMany(
        {
          email: { $in: emails },
          companyID: companyID,
          assessment_fileID: { $exists: false } // Double protection against overwriting
        },
        {
          $set: { assessment_fileID: fileId }
        }
      );

      // Get the IDs of updated users for reporting
      const updatedUsers = await usersCollection.find({
        email: { $in: emails },
        companyID: companyID,
        assessment_fileID: fileId
      }).toArray();

      const updatedUserIds = updatedUsers.map(user => user._id.toString());

      const isDevelopment = process.env.NODE_ENV === 'development';
      
      if (isDevelopment) {
        console.log(`Database Update Results:`);
        console.log(`- Modified count: ${updateResult.modifiedCount}`);
        console.log(`- Updated user IDs: ${updatedUserIds.join(', ')}`);
        console.log(`- File ID assigned: ${fileId}`);
      }

      // Always log summary
      console.log(`Updated ${updateResult.modifiedCount} users with assessment file ID`);

      return {
        modifiedCount: updateResult.modifiedCount,
        updatedUserIds,
        success: true
      };

    } catch (error) {
      console.error('Error updating users:', error);
      return {
        modifiedCount: 0,
        updatedUserIds: [],
        success: false,
        error: `Database update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get user by email and company (for testing/debugging)
   */
  static async getUserByEmail(email: string, companyID: string): Promise<User | null> {
    try {
      const db = await this.getDb();
      const usersCollection: Collection<User> = db.collection('users');

      const user = await usersCollection.findOne({
        email: email,
        companyID: companyID
      });

      return user;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  /**
   * Close database connection
   */
  static async closeConnection(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
  }

  /**
   * Health check for database connection
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const db = await this.getDb();
      await db.admin().ping();
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}