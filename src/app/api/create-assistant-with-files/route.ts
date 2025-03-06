// src/app/api/create-assistant-with-files/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import os from 'os';

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
    const assistantName = formData.get('assistantName') as string || 'Knowledge Assistant';
    const files = formData.getAll('files') as File[];
    
    console.log(`Request received: assistantName=${assistantName}, files=${files.length}`);
    
    if (!files.length) {
      return NextResponse.json(
        { error: 'At least one file is required' },
        { status: 400 }
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
        
        // Now use the file path with OpenAI SDK
        const uploadedFile = await openai.files.create({
          file: fs.createReadStream(tempFilePath),
          purpose: 'assistants'
        });
        
        console.log(`File uploaded successfully with ID: ${uploadedFile.id}`);
        fileIds.push(uploadedFile.id);
        
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
        
        try {
          // Check file status
          const fileStatus = await openai.files.retrieve(uploadedFile.id);
          console.log(`File status: ${fileStatus.status}, purpose: ${fileStatus.purpose}`);
          
          if (fileStatus.status !== 'processed') {
            console.log(`Waiting additional time for file to complete processing...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
          
          // Attach file to the assistant using SDK
          console.log(`Attaching file ${uploadedFile.id} to assistant ${assistantId}...`);
          
          const attachedFile = await openai.beta.assistants.files.create(
            assistantId,
            { file_id: uploadedFile.id }
          );
          
          console.log(`File successfully attached using SDK: ${JSON.stringify(attachedFile)}`);
          successfulAttachments.push(uploadedFile.id);
        } catch (attachError) {
          console.error(`Error with file processing or attachment:`, attachError);
          throw new Error(`Failed with file ${uploadedFile.id}: ${attachError instanceof Error ? attachError.message : 'Unknown error'}`);
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        fileErrors.push({
          fileName: file.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Step 3: Verify files attached to assistant using SDK
    let assistantFiles = [];
    try {
      console.log(`Checking files attached to assistant ${assistantId}...`);
      
      try {
        const fileList = await openai.beta.assistants.files.list(assistantId);
        assistantFiles = fileList.data || [];
        console.log(`Assistant has ${assistantFiles.length} files attached (via SDK)`);
      } catch (listError) {
        console.error(`Error listing files with SDK: ${listError}`);
      }
    } catch (err) {
      console.error(`Error in file listing process: ${err}`);
    }
    
    return NextResponse.json({
      success: successfulAttachments.length > 0,
      message: `New assistant created with ${successfulAttachments.length} files attached`,
      assistant: {
        id: assistantId,
        name: assistant.name,
        model: assistant.model,
        instructions: assistant.instructions,
        tools: assistant.tools
      },
      fileIds,
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