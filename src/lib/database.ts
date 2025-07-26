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

      // First, let's see what users we're trying to update
      const targetUsers = await User.find({
        email: { $in: emails },
        company_id: companyId
      }).select('email assessment_fileID');

      console.log(`🔍 Users to update:`, targetUsers.map(u => ({ 
        email: u.email, 
        currentFileId: u.assessment_fileID,
        fieldType: typeof u.assessment_fileID,
        fieldValue: JSON.stringify(u.assessment_fileID),
        isEmpty: !u.assessment_fileID || u.assessment_fileID === "",
        isNull: u.assessment_fileID === null,
        isUndefined: u.assessment_fileID === undefined,
        exists: u.assessment_fileID !== undefined
      })));

      // Update query conditions
      const updateQuery = {
        email: { $in: emails },
        company_id: companyId,
        $or: [
          { assessment_fileID: { $exists: false } }, // Field doesn't exist
          { assessment_fileID: null }, // Field is null
          { assessment_fileID: "" }, // Field is empty string
          { assessment_fileID: undefined } // Field is undefined
        ]
      };

      console.log(`🔍 MongoDB update query:`, JSON.stringify(updateQuery, null, 2));
      console.log(`🔍 Update data:`, { assessment_fileID: fileId });

      // Test query to see which users would match BEFORE the update
      const matchingUsers = await User.find(updateQuery).select('email assessment_fileID');
      console.log(`🔍 Users that match the update query (should be updated):`, matchingUsers.map(u => ({
        email: u.email,
        currentFileId: u.assessment_fileID,
        fieldType: typeof u.assessment_fileID
      })));

      // Update only users that don't already have an assessment_fileID
      const updateResult = await User.updateMany(
        updateQuery,
        {
          $set: { assessment_fileID: fileId }
        }
      );

      console.log(`📊 MongoDB update result:`, {
        matchedCount: updateResult.matchedCount,
        modifiedCount: updateResult.modifiedCount,
        acknowledged: updateResult.acknowledged
      });

      // VERIFICATION: Check if users were actually updated in the database
      const updatedUsers = await User.find({
        email: { $in: emails },
        company_id: companyId,
        assessment_fileID: fileId
      }).select('email assessment_fileID');

      console.log(`✅ Verification: Users actually updated in database:`, updatedUsers.map(u => ({
        email: u.email,
        assessment_fileID: u.assessment_fileID
      })));

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