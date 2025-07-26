// src/app/api/upload-files/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { FileProcessor } from '@/lib/fileProcessor';
import { ContactExtractor } from '@/lib/contactExtractor';
import { DatabaseService } from '@/lib/database';
import { dbConnect } from '@/lib/mongodb/connect';

interface FileError {
  fileName: string;
  error: string;
}

export async function POST(req: Request) {
  try {
    // Initialize OpenAI client with SDK
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const formData = await req.formData();
    const assistantId = formData.get('assistantId') as string;
    const companyId = formData.get('companyId') as string;
    const files = formData.getAll('files') as File[];
    
    console.log(`Request received: assistantId=${assistantId}, companyId=${companyId}, files=${files.length}`);
    
    if (!assistantId || !files.length) {
      return NextResponse.json(
        { error: 'Assistant ID and files are required' },
        { status: 400 }
      );
    }

    // Connect to database for email processing
    await dbConnect();

    // Verify assistant exists using SDK
    try {
      console.log(`Verifying assistant ID: ${assistantId}`);
      
      try {
        // Using OpenAI SDK to retrieve assistant (SDK handles API versioning properly)
        const assistant = await openai.beta.assistants.retrieve(assistantId);
        
        console.log(`Assistant found: ${assistant.name} (ID: ${assistant.id})`);
        console.log(`Assistant details: model=${assistant.model}, tools=${JSON.stringify(assistant.tools || [])}`);
        
        // Check if file_search is enabled
        const hasFileSearch = assistant.tools?.some((tool: { type: string }) => tool.type === 'file_search');
        if (!hasFileSearch) {
          console.log('Warning: This assistant does not have file_search enabled. Files might not be searchable.');
          
          // Attempt to enable file_search if not already enabled
          console.log('Attempting to enable file_search tool...');
          try {
            const updatedAssistant = await openai.beta.assistants.update(assistantId, {
              tools: [
                ...(assistant.tools || []), 
                { type: "file_search" }
              ]
            });
            
            console.log(`Assistant updated with file_search tool: ${JSON.stringify(updatedAssistant.tools)}`);
          } catch (updateError) {
            console.error('Error updating assistant:', updateError);
          }
        }
      } catch (sdkError) {
        console.error('SDK Error retrieving assistant:', sdkError);
        throw new Error(`Failed to get assistant: ${sdkError instanceof Error ? sdkError.message : 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error verifying assistant:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to verify assistant.' },
        { status: 400 }
      );
    }
    
    // Upload files and attach to assistant
    const fileIds: string[] = [];
    const fileErrors: FileError[] = [];
    const successfulAttachments: string[] = [];
    
    for (const file of files) {
      try {
        // Upload the file using OpenAI SDK via filesystem
        console.log(`Uploading file: ${file.name} (${file.size} bytes, ${file.type})`);
        
        // First write the file to disk (temporary file)
        const tempDir = os.tmpdir();
        const tempFilePath = path.join(tempDir, file.name);
        
        // Convert browser File to buffer and write to temp file
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(tempFilePath, buffer);
        
        console.log(`Temporary file created at: ${tempFilePath}`);

        // 🚀 EXTRACT EMAILS FROM FILE BEFORE UPLOADING TO OPENAI
        let emailExtractionResult = null;
        if (companyId) {
          try {
            console.log(`📧 Starting email extraction for ${file.name}...`);
            
            // Process file to extract text
            const processResult = await FileProcessor.processFileBuffer(buffer, file.name, file.type);
            
            if (processResult.success) {
              console.log(`📝 Extracted ${processResult.text.length} characters from ${file.name}`);
              
              // Extract contacts from text
              const contactResult = ContactExtractor.extractContacts(processResult.text);
              
              if (contactResult.success && contactResult.uniqueCount > 0) {
                console.log(`📧 Found ${contactResult.uniqueCount} unique emails in ${file.name}`);
                
                // We'll update the database AFTER successful OpenAI upload (with the file ID)
                emailExtractionResult = {
                  emails: contactResult.uniqueEmails,
                  count: contactResult.uniqueCount
                };
              } else {
                console.log(`📧 No emails found in ${file.name}`);
              }
            } else {
              console.log(`❌ Failed to extract text from ${file.name}: ${processResult.error}`);
            }
          } catch (extractError) {
            console.error(`❌ Email extraction error for ${file.name}:`, extractError);
          }
        }
        
        // Create a file object using SDK with file stream
        let uploadedFile;
        try {
          uploadedFile = await openai.files.create({
            file: fs.createReadStream(tempFilePath),
            purpose: 'assistants'
          });
          console.log(`File uploaded successfully with ID: ${uploadedFile.id}`);
          fileIds.push(uploadedFile.id);
        } catch (uploadError) {
          console.error('Error uploading file with SDK:', uploadError);
          throw new Error(`Failed to upload file: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        }
        
        // Clean up temporary file
        try {
          fs.unlinkSync(tempFilePath);
          console.log(`Temporary file deleted: ${tempFilePath}`);
        } catch (cleanupError) {
          console.error(`Error cleaning up temporary file: ${cleanupError}`);
        }
        
        // Wait for file processing
        console.log('Waiting for file to be processed...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Verify file is processed and ready to be attached
        try {
          const fileStatus = await openai.files.retrieve(uploadedFile.id);
          console.log(`File status: ${fileStatus.status}, purpose: ${fileStatus.purpose}`);
          
          if (fileStatus.status !== 'processed') {
            console.log(`Waiting additional time for file to complete processing...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        } catch (statusError) {
          console.error(`Error checking file status with SDK: ${statusError}`);
        }
        
        console.log('Continuing after file processing wait...');
        
        // Attach file to the assistant using direct API call
        console.log(`Attaching file ${uploadedFile.id} to assistant ${assistantId}...`);
        
        try {
          const attachResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantId}/files`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'OpenAI-Beta': 'assistants=v2'
            },
            body: JSON.stringify({ 
              file_id: uploadedFile.id 
            })
          });
          
          if (!attachResponse.ok) {
            const errorText = await attachResponse.text();
            console.log(`Attachment failed: ${errorText}`);
            throw new Error(`Failed to attach file: ${errorText}`);
          }
          
          const attachedFile = await attachResponse.json();
          
          console.log(`File successfully attached: ${JSON.stringify(attachedFile)}`);
          successfulAttachments.push(uploadedFile.id);

          // 🚀 UPDATE DATABASE WITH EXTRACTED EMAILS (now that we have the file ID)
          if (emailExtractionResult && companyId) {
            try {
              console.log(`📊 Updating database with ${emailExtractionResult.count} emails from ${file.name}...`);
              
              // Query database for existing users
              const userQueryResult = await DatabaseService.queryUsersByEmails(
                emailExtractionResult.emails, 
                companyId
              );

              if (userQueryResult.eligibleCount > 0) {
                console.log(`👥 Found ${userQueryResult.eligibleCount} eligible users for update`);

                // Update users with file ID
                const eligibleEmails = userQueryResult.eligibleUsers.map(user => user.email);
                const updateResult = await DatabaseService.updateUsersWithFileId(
                  eligibleEmails,
                  companyId,
                  uploadedFile.id
                );

                if (updateResult.success) {
                  console.log(`✅ Updated ${updateResult.modifiedCount} users with fileID ${uploadedFile.id}`);
                } else {
                  console.log(`❌ Failed to update users: ${updateResult.error}`);
                }
              } else {
                console.log(`📧 No matching users found in database for emails from ${file.name}`);
              }
            } catch (dbError) {
              console.error(`❌ Database update error for ${file.name}:`, dbError);
            }
          }
        } catch (attachError) {
          console.error(`Error attaching file:`, attachError);
          throw new Error(`Failed to attach file: ${attachError instanceof Error ? attachError.message : 'Unknown error'}`);
        }
        
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        fileErrors.push({
          fileName: file.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Get list of files attached to the assistant
    let assistantFiles = [];
    try {
      console.log(`Checking files attached to assistant ${assistantId}...`);
      
      try {
        const listResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantId}/files`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2'
          }
        });
        
        if (listResponse.ok) {
          const listData = await listResponse.json();
          assistantFiles = listData.data || [];
          console.log(`Assistant has ${assistantFiles.length} files attached`);
        } else {
          console.log(`Failed to list files: ${await listResponse.text()}`);
        }
      } catch (listError) {
        console.error(`Error listing files: ${listError}`);
      }
    } catch (err) {
      console.error(`Error in file listing process: ${err}`);
    }
    
    return NextResponse.json({
      success: successfulAttachments.length > 0,
      message: successfulAttachments.length > 0 
        ? `${successfulAttachments.length} files uploaded and attached successfully` 
        : 'No files were successfully attached',
      assistantId,
      fileIds,
      successfulAttachments,
      assistantFiles,
      errors: fileErrors.length > 0 ? fileErrors : undefined
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}