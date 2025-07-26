// src/lib/database.ts
import { dbConnect } from '@/lib/mongodb/connect';
import User from '@/lib/mongodb/models/user.model';

export interface UserQueryResult {
  eligibleUsers: any[];
  skippedUsers: any[];
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

  /**
   * Query users by emails within a company, respecting the no-overwrite rule
   */
  static async queryUsersByEmails(
    emails: string[], 
    companyId: string
  ): Promise<UserQueryResult> {
    try {
      await dbConnect();

      // Find all users with matching emails in the company
      const allMatchingUsers = await User.find({
        email: { $in: emails },
        company_id: companyId
      });

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
    companyId: string,
    fileId: string
  ): Promise<UserUpdateResult> {
    try {
      await dbConnect();

      // Update only users that don't already have an assessment_fileID
      const updateResult = await User.updateMany(
        {
          email: { $in: emails },
          company_id: companyId,
          assessment_fileID: { $exists: false } // Double protection against overwriting
        },
        {
          $set: { assessment_fileID: fileId }
        }
      );

      // Get the IDs of updated users for reporting
      const updatedUsers = await User.find({
        email: { $in: emails },
        company_id: companyId,
        assessment_fileID: fileId
      });

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
  static async getUserByEmail(email: string, companyId: string): Promise<any | null> {
    try {
      await dbConnect();
      
      const user = await User.findOne({
        email: email,
        company_id: companyId
      });

      return user;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  /**
   * Health check for database connection
   */
  static async healthCheck(): Promise<boolean> {
    try {
      await dbConnect();
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}