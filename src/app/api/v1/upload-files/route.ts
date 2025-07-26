// src/app/api/upload-files/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { FileProcessor } from '@/lib/fileProcessor';
import { ContactExtractor } from '@/lib/contactExtractor';
import { DatabaseService } from '@/lib/database';

interface FileError {
  fileName: string;
  error: string;
}

interface ContactExtractionResult {
  fileName: string;
  extractedEmails: string[];
  uniqueEmails: string[];
  totalFound: number;
  uniqueCount: number;
  isWithinRecommendedLimit: boolean;
  processingSuccess: boolean;
  extractionSuccess: boolean;
  error?: string;
  warning?: string;
}

export async function POST(req: Request) {
  try {
    // Initialize OpenAI client with SDK
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const formData = await req.formData();
    const assistantId = formData.get('assistantId') as string;
    const files = formData.getAll('files') as File[];
    
    console.log(`Request received: assistantId=${assistantId}, files=${files.length}`);
    
    if (!assistantId || !files.length) {
      return NextResponse.json(
        { error: 'Assistant ID and files are required' },
        { status: 400 }
      );
    }

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
    
    // PHASE A: Contact Extraction (BEFORE OpenAI upload)
    console.log('Starting contact extraction phase...');
    const contactExtractionResults: ContactExtractionResult[] = [];
    const allExtractedEmails: string[] = [];
    
    // Process each file for contact extraction
    for (const file of files) {
      const fileName = file.name;
      let extractionResult: ContactExtractionResult = {
        fileName,
        extractedEmails: [],
        uniqueEmails: [],
        totalFound: 0,
        uniqueCount: 0,
        isWithinRecommendedLimit: true,
        processingSuccess: false,
        extractionSuccess: false
      };

      try {
        // Validate file type first
        if (!isFileSupported(file)) {
          const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
          extractionResult.error = `Unsupported file type: ${fileExtension}`;
          contactExtractionResults.push(extractionResult);
          continue;
        }

        // Create temporary file for processing
        const tempDir = os.tmpdir();
        const tempFilePath = path.join(tempDir, fileName);
        
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(tempFilePath, buffer);

        // Process file to extract text (A1)
        const fileProcessResult = await FileProcessor.processFile(tempFilePath, fileName, file.type);
        
        if (!fileProcessResult.success) {
          extractionResult.error = fileProcessResult.error;
          extractionResult.processingSuccess = false;
        } else {
          extractionResult.processingSuccess = true;
          
          // Extract contacts from text (A2)
          const contactResult = ContactExtractor.extractContacts(fileProcessResult.text);
          
          if (contactResult.success) {
            extractionResult.extractionSuccess = true;
            extractionResult.extractedEmails = contactResult.emails;
            extractionResult.uniqueEmails = contactResult.uniqueEmails;
            extractionResult.totalFound = contactResult.totalFound;
            extractionResult.uniqueCount = contactResult.uniqueCount;
            extractionResult.isWithinRecommendedLimit = contactResult.isWithinRecommendedLimit;
            
            // Add to master list
            allExtractedEmails.push(...contactResult.uniqueEmails);
            
            // Add warning if over recommended limit
            if (!contactResult.isWithinRecommendedLimit) {
              extractionResult.warning = ContactExtractor.getRecommendationMessage(contactResult.uniqueCount);
            }
          } else {
            extractionResult.extractionSuccess = false;
            extractionResult.error = contactResult.error;
          }
        }

        // Clean up temp file
        try {
          fs.unlinkSync(tempFilePath);
        } catch (cleanupError) {
          console.error(`Error cleaning up temp file: ${cleanupError}`);
        }

      } catch (error) {
        extractionResult.error = `File processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }

      contactExtractionResults.push(extractionResult);
    }

    // Remove duplicates from all extracted emails
    const uniqueExtractedEmails = [...new Set(allExtractedEmails)];
    
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment) {
      console.log(`Contact extraction completed:`);
      console.log(`- Total unique emails extracted: ${uniqueExtractedEmails.length}`);
      console.log(`- Emails: ${uniqueExtractedEmails.join(', ')}`);
    }

    // PHASE B1: Query database for existing users
    let userQueryResult;
    let companyID = 'default-company'; // TODO: Get actual company ID from request/session
    
    try {
      if (uniqueExtractedEmails.length > 0) {
        userQueryResult = await DatabaseService.queryUsersByEmails(uniqueExtractedEmails, companyID);
        
        if (isDevelopment) {
          console.log(`Database query completed: Found ${userQueryResult.totalFound} users`);
        }
      } else {
        userQueryResult = {
          eligibleUsers: [],
          skippedUsers: [],
          totalFound: 0,
          eligibleCount: 0,
          skippedCount: 0
        };
      }
    } catch (dbError) {
      console.error('Database query failed:', dbError);
      // Continue with file upload even if DB query fails
      userQueryResult = {
        eligibleUsers: [],
        skippedUsers: [],
        totalFound: 0,
        eligibleCount: 0,
        skippedCount: 0
      };
    }
    
    // Upload files and add to vector store
    const fileIds: string[] = [];
    const fileErrors: FileError[] = [];
    const successfulAttachments: string[] = [];
    
    for (const file of files) {
      try {
        // Validate file type first
        if (!isFileSupported(file)) {
          const fileName = file.name.toLowerCase();
          const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
          throw new Error(`Unsupported file type: ${fileExtension}. Supported formats: ${supportedExtensions.join(', ')}`);
        }

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
        
        // First upload the file to OpenAI
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
          const vectorStoreFile = await openai.beta.vectorStores.files.createAndPoll(
            vectorStoreId as string,
            {
              file_id: uploadedFile.id
            }
          );
          
          console.log(`File successfully added to vector store: ${JSON.stringify(vectorStoreFile)}`);
          successfulAttachments.push(uploadedFile.id);
        } catch (vectorStoreError) {
          console.error(`Error adding file to vector store:`, vectorStoreError);
          throw new Error(`Failed to add file to vector store: ${vectorStoreError instanceof Error ? vectorStoreError.message : 'Unknown error'}`);
        }
        
        // Clean up temporary file
        try {
          fs.unlinkSync(tempFilePath);
          console.log(`Temporary file deleted: ${tempFilePath}`);
        } catch (cleanupError) {
          console.error(`Error cleaning up temporary file: ${cleanupError}`);
        }
        
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

    // PHASE B2/B3: Update database with file IDs (AFTER OpenAI upload)
    let databaseUpdateResult = {
      modifiedCount: 0,
      updatedUserIds: [],
      success: true,
      error: undefined
    };

    if (successfulAttachments.length > 0 && userQueryResult.eligibleCount > 0) {
      console.log('Starting database update phase...');
      
      try {
        // Use the first successfully uploaded file ID for all users
        const fileIdToAssign = fileIds[0]; // All files get same treatment for now
        
        const eligibleEmails = userQueryResult.eligibleUsers.map(user => user.email);
        
        if (eligibleEmails.length > 0) {
          databaseUpdateResult = await DatabaseService.updateUsersWithFileId(
            eligibleEmails,
            companyID,
            fileIdToAssign
          );
          
          if (isDevelopment) {
            console.log(`Database update completed: Updated ${databaseUpdateResult.modifiedCount} users`);
          }
        }
      } catch (dbUpdateError) {
        console.error('Database update failed:', dbUpdateError);
        databaseUpdateResult.success = false;
        databaseUpdateResult.error = dbUpdateError instanceof Error ? dbUpdateError.message : 'Database update failed';
      }
    }
    
    // Calculate summary statistics
    const totalEmailsExtracted = uniqueExtractedEmails.length;
    const usersFound = userQueryResult.totalFound;
    const usersUpdated = databaseUpdateResult.modifiedCount;
    const usersSkipped = userQueryResult.skippedCount;
    
    // Prepare warnings
    const warnings: string[] = [];
    contactExtractionResults.forEach(result => {
      if (result.warning) {
        warnings.push(`${result.fileName}: ${result.warning}`);
      }
    });

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
      
      // Contact extraction results
      contactExtraction: {
        totalEmailsExtracted,
        uniqueEmailsExtracted: uniqueExtractedEmails.length,
        extractedEmails: isDevelopment ? uniqueExtractedEmails : undefined,
        fileResults: contactExtractionResults
      },
      
      // Database results
      userMatching: {
        usersFound,
        usersUpdated,
        usersSkipped,
        updatedUserIds: isDevelopment ? databaseUpdateResult.updatedUserIds : undefined,
        databaseSuccess: databaseUpdateResult.success,
        databaseError: databaseUpdateResult.error
      },
      
      // Warnings and errors
      warnings: warnings.length > 0 ? warnings : undefined,
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