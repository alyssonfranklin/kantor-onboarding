// src/app/api/v1/upload-files/route.ts
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

    // Verify assistant exists and get/create vector store
    let vectorStoreId: string | null = null;
    
    try {
      console.log(`Verifying assistant ID: ${assistantId}`);
      
      // Using OpenAI SDK to retrieve assistant
      const assistant = await openai.beta.assistants.retrieve(assistantId);
      
      console.log(`Assistant found: ${assistant.name} (ID: ${assistant.id})`);
      console.log(`Assistant details: model=${assistant.model}, tools=${JSON.stringify(assistant.tools || [])}`);
      
      // Check if file_search is enabled
      const hasFileSearch = assistant.tools?.some((tool: { type: string }) => tool.type === 'file_search');
      if (!hasFileSearch) {
        console.log('Warning: This assistant does not have file_search enabled. Enabling it now...');
        
        // Enable file_search if not already enabled
        await openai.beta.assistants.update(assistantId, {
          tools: [
            ...(assistant.tools || []), 
            { type: "file_search" }
          ]
        });
        
        console.log('Assistant updated with file_search tool');
      }

      // Check if assistant already has a vector store
      const toolResources = assistant.tool_resources;
      if (toolResources?.file_search?.vector_store_ids && toolResources.file_search.vector_store_ids.length > 0) {
        vectorStoreId = toolResources.file_search.vector_store_ids[0];
        console.log(`Assistant already has vector store: ${vectorStoreId}`);
      } else {
        console.log('No vector store found for assistant, creating one...');
        
        // Create new vector store
        const vectorStore = await openai.beta.vectorStores.create({
          name: `Files for Assistant ${assistantId}`,
        });
        vectorStoreId = vectorStore.id;
        console.log(`Created new vector store: ${vectorStoreId}`);

        // Update assistant to use the new vector store
        await openai.beta.assistants.update(assistantId, {
          tool_resources: {
            file_search: {
              vector_store_ids: [vectorStoreId]
            }
          }
        });
        console.log(`Assistant updated with new vector store: ${vectorStoreId}`);
      }
    } catch (error) {
      console.error('Error setting up assistant and vector store:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to setup assistant and vector store.' },
        { status: 400 }
      );
    }
    
    // Define supported file types for vector stores
    const supportedMimeTypes = [
      // Text formats
      'text/plain',
      'text/markdown',
      'text/csv',
      'text/html',
      'text/xml',
      'application/json',
      'application/xml',
      
      // Document formats
      'application/pdf',
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/rtf',
      
      // Presentation formats
      'application/vnd.ms-powerpoint', // .ppt
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      
      // Spreadsheet formats
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      
      // Other text-based formats
      'application/x-yaml',
      'text/yaml',
      'application/vnd.oasis.opendocument.text', // .odt
      'application/vnd.oasis.opendocument.presentation', // .odp
      'application/vnd.oasis.opendocument.spreadsheet' // .ods
    ];

    const supportedExtensions = [
      '.txt', '.md', '.csv', '.html', '.htm', '.xml', '.json', '.yaml', '.yml',
      '.pdf', '.doc', '.docx', '.rtf',
      '.ppt', '.pptx',
      '.xls', '.xlsx',
      '.odt', '.odp', '.ods'
    ];

    // Function to validate file type
    const isFileSupported = (file: File): boolean => {
      const fileName = file.name.toLowerCase();
      const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
      
      return supportedMimeTypes.includes(file.type) || supportedExtensions.includes(fileExtension);
    };
    
    // Upload files and add to vector store (with parallel processing when possible)
    const fileIds: string[] = [];
    const fileErrors: FileError[] = [];
    const successfulAttachments: string[] = [];
    
    console.log(`🚀 Processing ${files.length} files with optimized parallel processing...`);
    
    for (const file of files) {
      const fileStartTime = Date.now();
      try {
        // Validate file type first
        if (!isFileSupported(file)) {
          const fileName = file.name.toLowerCase();
          const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
          throw new Error(`Unsupported file type: ${fileExtension}. Supported formats: ${supportedExtensions.join(', ')}`);
        }

        // Upload the file using OpenAI SDK via filesystem
        console.log(`⏱️ Processing file: ${file.name} (${file.size} bytes, ${file.type})`);
        
        // First write the file to disk (temporary file)
        const tempDir = os.tmpdir();
        const tempFilePath = path.join(tempDir, file.name);
        
        // Convert browser File to buffer and write to temp file
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(tempFilePath, buffer);
        
        console.log(`Temporary file created at: ${tempFilePath}`);

        // 🚀 START PARALLEL PROCESSING: Email extraction + OpenAI upload
        let emailExtractionPromise = null;
        
        if (companyId) {
          console.log(`📧 Starting parallel email extraction for ${file.name}...`);
          emailExtractionPromise = (async () => {
            try {
              // Process file to extract text
              const processResult = await FileProcessor.processFileBuffer(buffer, file.name, file.type);
              
              if (processResult.success) {
                console.log(`📝 Extracted ${processResult.text.length} characters from ${file.name}`);
                
                // Extract contacts from text
                const contactResult = ContactExtractor.extractContacts(processResult.text);
                
                if (contactResult.success && contactResult.uniqueCount > 0) {
                  console.log(`📧 Found ${contactResult.uniqueCount} unique emails in ${file.name}`);
                  console.log(`📧 Sample emails found:`, contactResult.uniqueEmails.slice(0, 5).join(', '));
                  
                  return {
                    emails: contactResult.uniqueEmails,
                    count: contactResult.uniqueCount
                  };
                } else {
                  console.log(`📧 No emails found in ${file.name}`);
                  return null;
                }
              } else {
                console.log(`❌ Failed to extract text from ${file.name}: ${processResult.error}`);
                return null;
              }
            } catch (extractError) {
              console.error(`❌ Email extraction error for ${file.name}:`, extractError);
              return null;
            }
          })();
        }

        // Upload file to OpenAI (runs in parallel with email extraction)
        console.log(`Uploading file to OpenAI storage...`);
        let uploadedFile;
        try {
          uploadedFile = await openai.files.create({
            file: fs.createReadStream(tempFilePath),
            purpose: 'assistants'
          });
          console.log(`File uploaded successfully with ID: ${uploadedFile.id}`);
          fileIds.push(uploadedFile.id);
        } catch (uploadError) {
          console.error('Error uploading file:', uploadError);
          throw new Error(`Failed to upload file: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        }

        // Now add the file to the vector store using the file_id
        console.log(`Adding file ${uploadedFile.id} to vector store ${vectorStoreId}...`);
        
        try {
          // Add timeout protection for vector store operation
          const vectorStorePromise = openai.beta.vectorStores.files.createAndPoll(
            vectorStoreId as string,
            {
              file_id: uploadedFile.id
            }
          );
          
          // Set a reasonable timeout (30 seconds) 
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Vector store operation timed out')), 30000)
          );
          
          const vectorStoreFile = await Promise.race([vectorStorePromise, timeoutPromise]);
          
          console.log(`✅ File successfully added to vector store: ${uploadedFile.id}`);
          successfulAttachments.push(uploadedFile.id);
        } catch (vectorStoreError) {
          console.error(`❌ Error adding file to vector store:`, vectorStoreError);
          console.log(`⚠️ Vector store failed, but continuing with database update for ${uploadedFile.id}`);
          
          // Still try to update the database even if vector store fails
          // Don't throw error - let database update proceed
        }

        // 🚀 BACKGROUND DATABASE UPDATE (fire-and-forget to avoid timeout)
        if (emailExtractionPromise && companyId) {
          console.log(`🔄 Starting background database update for ${file.name}...`);
          
          // Don't await - let it run in background to avoid timeout
          const backgroundUpdate = async () => {
            try {
              const emailExtractionResult = await emailExtractionPromise;

              if (emailExtractionResult) {
                console.log(`📊 Background: Updating database with ${emailExtractionResult.count} emails from ${file.name}...`);
                console.log(`🔍 Background: Searching for users in company: ${companyId}`);
                console.log(`📧 Background: First 5 emails to match:`, emailExtractionResult.emails.slice(0, 5).join(', '));
                
                // Query database for existing users
                const userQueryResult = await DatabaseService.queryUsersByEmails(
                  emailExtractionResult.emails, 
                  companyId
                );

                console.log(`👥 Background: Database query results:`, {
                  totalFound: userQueryResult.totalFound,
                  eligibleCount: userQueryResult.eligibleCount,
                  skippedCount: userQueryResult.skippedCount
                });

                if (userQueryResult.eligibleCount > 0) {
                  console.log(`👥 Background: Found ${userQueryResult.eligibleCount} eligible users for update`);

                  // Update users with file ID
                  const eligibleEmails = userQueryResult.eligibleUsers.map(user => user.email);
                  const updateResult = await DatabaseService.updateUsersWithFileId(
                    eligibleEmails,
                    companyId,
                    uploadedFile.id
                  );

                  if (updateResult.success) {
                    console.log(`✅ Background: Updated ${updateResult.modifiedCount} users with fileID ${uploadedFile.id}`);
                  } else {
                    console.log(`❌ Background: Failed to update users: ${updateResult.error}`);
                  }
                } else {
                  console.log(`📧 Background: No matching users found in database for emails from ${file.name}`);
                  
                  // Let's see what users DO exist in this company for debugging
                  try {
                    const { dbConnect } = require('@/lib/mongodb/connect');
                    const User = require('@/lib/mongodb/models/user.model').default;
                    await dbConnect();
                    
                    const companyUsers = await User.find({ company_id: companyId }).limit(10);
                    console.log(`🔍 Background: Sample users in company ${companyId}:`, 
                      companyUsers.map(u => ({ email: u.email, hasFileId: !!u.assessment_fileID }))
                    );
                  } catch (debugError) {
                    console.error('Background: Debug query error:', debugError);
                  }
                }
              } else {
                console.log(`📧 Background: No emails extracted from ${file.name}`);
              }
            } catch (dbError) {
              console.error(`❌ Background: Database update error for ${file.name}:`, dbError);
            }
          };

          // Start background processing (don't await)
          backgroundUpdate().catch(err => 
            console.error('Background update failed:', err)
          );
        }
        
        // Clean up temporary file
        try {
          fs.unlinkSync(tempFilePath);
          console.log(`Temporary file deleted: ${tempFilePath}`);
        } catch (cleanupError) {
          console.error(`Error cleaning up temporary file: ${cleanupError}`);
        }

        const fileEndTime = Date.now();
        const processingTime = ((fileEndTime - fileStartTime) / 1000).toFixed(2);
        console.log(`✅ File ${file.name} processed successfully in ${processingTime}s`);
        
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        fileErrors.push({
          fileName: file.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Get list of files in the vector store
    let vectorStoreFiles = [];
    try {
      console.log(`Checking files in vector store ${vectorStoreId}...`);
      
      const listResponse = await openai.beta.vectorStores.files.list(vectorStoreId as string);
      vectorStoreFiles = listResponse.data || [];
      console.log(`Vector store has ${vectorStoreFiles.length} files`);
    } catch (err) {
      console.error(`Error listing vector store files: ${err}`);
    }
    
    return NextResponse.json({
      success: successfulAttachments.length > 0,
      message: successfulAttachments.length > 0 
        ? `${successfulAttachments.length} files uploaded and added to vector store successfully` 
        : 'No files were successfully added to vector store',
      assistantId,
      vectorStoreId,
      fileIds,
      successfulAttachments,
      vectorStoreFiles,
      hasRetrieval: true,
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