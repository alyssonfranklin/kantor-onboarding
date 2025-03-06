// src/app/api/upload-files/route.ts
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
    const assistantId = formData.get('assistantId') as string;
    const files = formData.getAll('files') as File[];
    
    console.log(`Request received: assistantId=${assistantId}, files=${files.length}`);
    
    if (!assistantId || !files.length) {
      return NextResponse.json(
        { error: 'Assistant ID and files are required' },
        { status: 400 }
      );
    }

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
        
        // Attach file to the assistant using direct API call (SDK types are incorrect)
        console.log(`Attaching file ${uploadedFile.id} to assistant ${assistantId}...`);
        
        try {
          let attachedFile;
          
          try {
            // Use the base endpoint with no version header as suggested in error
            const attachResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantId}/files`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
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
            
            attachedFile = await attachResponse.json();
            
            console.log(`File successfully attached using direct API: ${JSON.stringify(attachedFile)}`);
            successfulAttachments.push(uploadedFile.id);
          } catch (attachError) {
            console.error(`Error attaching file with direct API:`, attachError);
            throw new Error(`API failed to attach file: ${attachError instanceof Error ? attachError.message : 'Unknown error'}`);
          }
        } catch (attachError) {
          console.error(`Error attaching file: ${attachError}`);
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
    
    // Get list of files attached to the assistant using SDK
    let assistantFiles = [];
    try {
      console.log(`Checking files attached to assistant ${assistantId}...`);
      
      try {
        const listResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantId}/files`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          }
        });
        
        if (listResponse.ok) {
          const listData = await listResponse.json();
          assistantFiles = listData.data || [];
          console.log(`Assistant has ${assistantFiles.length} files attached (via direct API)`);
        } else {
          console.log(`Failed to list files: ${await listResponse.text()}`);
        }
      } catch (listError) {
        console.error(`Error listing files with direct API: ${listError}`);
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