// src/app/api/create-assistant-with-files/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

interface FileError {
  fileName: string;
  error: string;
}

// Allowed file types for security
const ALLOWED_FILE_TYPES = [
  'application/pdf', 
  'text/plain', 
  'text/markdown',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/json'
];

// Maximum file size (20MB)
const MAX_FILE_SIZE = 20 * 1024 * 1024;

// Function to validate files before processing
function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `File exceeds maximum size of 20MB`;
  }
  
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return `Unsupported file type: ${file.type}. Supported types: PDF, TXT, MD, CSV, DOCX, XLSX, JSON`;
  }
  
  return null;
}

// CORS headers for API routes
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  // Create a list of temporary files to clean up later
  const tempFilesToCleanup: string[] = [];
  
  try {
    // Initialize OpenAI client with SDK
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is missing' },
        { status: 500, headers: corsHeaders }
      );
    }
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    const formData = await req.formData();
    const assistantName = formData.get('assistantName') as string || 'Knowledge Assistant';
    const files = formData.getAll('files') as File[];
    
    console.log(`Request received: assistantName=${assistantName}, files=${files.length}`);
    
    if (!files.length) {
      return NextResponse.json(
        { error: 'At least one file is required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Validate all files first before proceeding
    const validationErrors: FileError[] = [];
    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        validationErrors.push({
          fileName: file.name,
          error
        });
      }
    }
    
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Some files failed validation', 
          validationErrors 
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Step 1: Create a new assistant with file_search enabled using SDK
    console.log(`Creating new assistant: ${assistantName}`);
    
    let assistant;
    try {
      assistant = await openai.beta.assistants.create({
        name: assistantName,
        instructions: `You are a helpful assistant that can answer questions based on the documents that have been uploaded. Use the information in the documents to provide accurate and relevant answers.`,
        model: "gpt-3.5-turbo",
        tools: [{ type: "file_search" }]
      });
      
      console.log(`Assistant created successfully with SDK: ${assistant.id}`);
    } catch (createError) {
      console.error('Error creating assistant with SDK:', createError);
      throw new Error(`Failed to create assistant: ${createError instanceof Error ? createError.message : 'Unknown error'}`);
    }
    
    const assistantId = assistant.id;
    console.log(`Assistant created successfully with ID: ${assistantId}`);
    
    // Step 2: Upload and attach files
    const fileIds: string[] = [];
    const fileErrors: FileError[] = [];
    const successfulAttachments: string[] = [];
    
    // Process files in parallel in batches to improve performance
    const BATCH_SIZE = 3; // Process 3 files at a time
    const fileBatches = [];
    
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      fileBatches.push(files.slice(i, i + BATCH_SIZE));
    }
    
    for (const batch of fileBatches) {
      // Process each batch in parallel
      const batchPromises = batch.map(async (file) => {
        try {
          // Upload the file using OpenAI SDK via filesystem
          console.log(`Uploading file: ${file.name} (${file.size} bytes, ${file.type})`);
          
          // First write the file to disk (temporary file)
          const tempDir = os.tmpdir();
          // Use UUID to prevent file name collisions
          const sanitizedFileName = `${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const tempFilePath = path.join(tempDir, sanitizedFileName);
          
          // Track file for cleanup
          tempFilesToCleanup.push(tempFilePath);
          
          // Convert browser File to buffer and write to temp file
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          fs.writeFileSync(tempFilePath, buffer);
          
          console.log(`Temporary file created at: ${tempFilePath}`);
          
          // Now use the file path with OpenAI SDK
          const uploadedFile = await openai.files.create({
            file: fs.createReadStream(tempFilePath),
            purpose: 'assistants'
          });
          
          console.log(`File uploaded successfully with ID: ${uploadedFile.id}`);
          fileIds.push(uploadedFile.id);
          
          // Check file status with polling instead of arbitrary timeouts
          const MAX_RETRIES = 10;
          const POLLING_INTERVAL = 1000; // 1 second
          
          let fileProcessed = false;
          let retries = 0;
          
          while (!fileProcessed && retries < MAX_RETRIES) {
            const fileStatus = await openai.files.retrieve(uploadedFile.id);
            console.log(`File status (attempt ${retries+1}): ${fileStatus.status}, purpose: ${fileStatus.purpose}`);
            
            if (fileStatus.status === 'processed') {
              fileProcessed = true;
            } else {
              retries++;
              await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
            }
          }
          
          if (!fileProcessed) {
            throw new Error(`File processing timed out after ${MAX_RETRIES} attempts`);
          }
          
          // Use SDK to attach file to assistant - more secure than direct API call
          try {
            console.log(`Attaching file ${uploadedFile.id} to assistant ${assistantId}...`);
            const attachedFile = await openai.beta.assistants.files.create(
              assistantId,
              { file_id: uploadedFile.id }
            );
            
            console.log(`File successfully attached: ${JSON.stringify(attachedFile)}`);
            successfulAttachments.push(uploadedFile.id);
          } catch (attachError) {
            console.error(`Error attaching file:`, attachError);
            throw new Error(`Failed to attach file ${uploadedFile.id}: ${attachError instanceof Error ? attachError.message : 'Unknown error'}`);
          }
          
          return { success: true, fileId: uploadedFile.id };
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          fileErrors.push({
            fileName: file.name,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          return { success: false, error };
        }
      });
      
      // Wait for all promises in the current batch to complete
      await Promise.all(batchPromises);
    }
    
    // Step 3: Verify files attached to assistant
    let assistantFiles = [];
    try {
      console.log(`Checking files attached to assistant ${assistantId}...`);
      
      // Use SDK to list files - more secure than direct API call
      try {
        const files = await openai.beta.assistants.files.list(assistantId);
        assistantFiles = files.data || [];
        console.log(`Assistant has ${assistantFiles.length} files attached`);
      } catch (listError) {
        console.error(`Error listing files: ${listError}`);
      }
    } catch (err) {
      console.error(`Error in file listing process: ${err}`);
    } finally {
      // Clean up all temporary files regardless of success or failure
      for (const tempFile of tempFilesToCleanup) {
        try {
          if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
            console.log(`Cleaned up temporary file: ${tempFile}`);
          }
        } catch (cleanupError) {
          console.error(`Error cleaning up temporary file ${tempFile}:`, cleanupError);
        }
      }
    }
    
    // Use SDK to get the latest assistant details
    let updatedAssistant;
    try {
      updatedAssistant = await openai.beta.assistants.retrieve(assistantId);
    } catch (retrieveError) {
      console.error('Error retrieving updated assistant:', retrieveError);
      // Fall back to original assistant data if retrieval fails
      updatedAssistant = assistant;
    }
    
    return NextResponse.json({
      success: successfulAttachments.length > 0,
      message: `New assistant created with ${successfulAttachments.length} files attached`,
      assistant: {
        id: assistantId,
        name: updatedAssistant.name,
        model: updatedAssistant.model,
        instructions: updatedAssistant.instructions,
        tools: updatedAssistant.tools
      },
      fileIds,
      assistantFiles,
      errors: fileErrors.length > 0 ? fileErrors : undefined
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error processing request:', error);
    
    // Clean up all temporary files in case of error
    for (const tempFile of tempFilesToCleanup) {
      try {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
          console.log(`Cleaned up temporary file in error handler: ${tempFile}`);
        }
      } catch (cleanupError) {
        console.error(`Error cleaning up temporary file ${tempFile}:`, cleanupError);
      }
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}