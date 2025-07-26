// src/app/api/process-files/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import Company from '@/lib/mongodb/models/company.model';
import { withAuth } from '@/lib/middleware/auth';
import OpenAI from 'openai';
import { FileProcessor } from '@/lib/fileProcessor';
import { ContactExtractor } from '@/lib/contactExtractor';
import { DatabaseService } from '@/lib/database';

interface ProcessingResult {
  fileId: string;
  filename: string;
  emailsExtracted: number;
  usersUpdated: number;
  success: boolean;
  error?: string;
}

export async function POST(req: NextRequest) {
  return withAuth(req, async (req, user) => {
    await dbConnect();
    
    try {
      const body = await req.json();
      const { companyId, fileIds } = body;
      
      if (!companyId || !fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Company ID and file IDs are required' },
          { status: 400 }
        );
      }

      // Get company details
      const company = await Company.findOne({ company_id: companyId });
      if (!company) {
        return NextResponse.json(
          { success: false, message: 'Company not found' },
          { status: 404 }
        );
      }

      if (!company.assistant_id) {
        return NextResponse.json(
          { success: false, message: 'No assistant configured for this company' },
          { status: 400 }
        );
      }

      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const results: ProcessingResult[] = [];
      const allExtractedEmails: string[] = [];
      
      console.log(`Processing ${fileIds.length} files for company ${companyId}`);

      // Process each file
      for (const fileId of fileIds) {
        let result: ProcessingResult = {
          fileId,
          filename: `File ${fileId}`,
          emailsExtracted: 0,
          usersUpdated: 0,
          success: false
        };

        try {
          // Get file details
          const fileDetails = await openai.files.retrieve(fileId);
          result.filename = fileDetails.filename;
          
          console.log(`Processing file: ${fileDetails.filename} (${fileId})`);

          // Download file content
          const fileContent = await openai.files.content(fileId);
          const fileBuffer = Buffer.from(await fileContent.arrayBuffer());

          // Process file to extract text
          const processResult = await FileProcessor.processFileBuffer(
            fileBuffer, 
            fileDetails.filename, 
            ''
          );

          if (!processResult.success) {
            result.error = processResult.error || 'Failed to process file';
            results.push(result);
            continue;
          }

          // Extract contacts from text
          const contactResult = ContactExtractor.extractContacts(processResult.text);
          
          if (!contactResult.success) {
            result.error = contactResult.error || 'Failed to extract contacts';
            results.push(result);
            continue;
          }

          result.emailsExtracted = contactResult.uniqueCount;
          
          if (contactResult.uniqueCount === 0) {
            result.success = true;
            result.error = 'No email addresses found in file';
            results.push(result);
            continue;
          }

          // Add to master list
          allExtractedEmails.push(...contactResult.uniqueEmails);

          // Query database for existing users
          const userQueryResult = await DatabaseService.queryUsersByEmails(
            contactResult.uniqueEmails, 
            companyId
          );

          if (userQueryResult.eligibleCount === 0) {
            result.success = true;
            result.error = 'No matching users found in database';
            results.push(result);
            continue;
          }

          // Update users with file ID
          const eligibleEmails = userQueryResult.eligibleUsers.map(user => user.email);
          const updateResult = await DatabaseService.updateUsersWithFileId(
            eligibleEmails,
            companyId,
            fileId
          );

          if (updateResult.success) {
            result.usersUpdated = updateResult.modifiedCount;
            result.success = true;
          } else {
            result.error = updateResult.error || 'Failed to update users';
          }

        } catch (error) {
          console.error(`Error processing file ${fileId}:`, error);
          result.error = error instanceof Error ? error.message : 'Unknown error';
        }

        results.push(result);
      }

      // Calculate summary
      const totalEmailsExtracted = results.reduce((sum, r) => sum + r.emailsExtracted, 0);
      const totalUsersUpdated = results.reduce((sum, r) => sum + r.usersUpdated, 0);
      const successfulFiles = results.filter(r => r.success).length;
      const failedFiles = results.filter(r => !r.success).length;

      console.log(`Processing completed: ${successfulFiles} successful, ${failedFiles} failed`);
      console.log(`Total emails extracted: ${totalEmailsExtracted}, users updated: ${totalUsersUpdated}`);

      return NextResponse.json({
        success: true,
        message: `Processed ${fileIds.length} files: ${successfulFiles} successful, ${failedFiles} failed`,
        results,
        summary: {
          totalFiles: fileIds.length,
          successfulFiles,
          failedFiles,
          totalEmailsExtracted,
          totalUsersUpdated,
          uniqueEmailsExtracted: [...new Set(allExtractedEmails)].length
        }
      });

    } catch (error) {
      console.error('Error processing files:', error);
      return NextResponse.json(
        { success: false, message: error instanceof Error ? error.message : 'Processing failed' },
        { status: 500 }
      );
    }
  });
}