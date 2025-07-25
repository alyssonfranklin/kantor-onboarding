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
    
    // Upload files and add to vector store
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