// src/app/api/create-assistant-with-files/route.ts
import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

interface FileError {
  fileName: string;
  error: string;
}

// Initialize OpenAI client with SDK
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
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
    const assistant = await openai.beta.assistants.create({
      name: assistantName,
      instructions: `You are a helpful assistant that can answer questions based on the documents that have been uploaded. Use the information in the documents to provide accurate and relevant answers.`,
      model: "gpt-3.5-turbo",
      tools: [{ type: "file_search" }]
    });
    
    const assistantId = assistant.id;
    console.log(`Assistant created successfully with ID: ${assistantId}`);
    
    // Step 2: Upload and attach files
    const fileIds: string[] = [];
    const fileErrors: FileError[] = [];
    const successfulAttachments: string[] = [];
    
    for (const file of files) {
      try {
        // Upload file using SDK
        console.log(`Uploading file: ${file.name} (${file.size} bytes, ${file.type})`);
        
        // Convert File to Buffer for SDK
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const uploadedFile = await openai.files.create({
          file: buffer,
          purpose: 'assistants',
          file_name: file.name,
        });
        
        console.log(`File uploaded successfully with ID: ${uploadedFile.id}`);
        fileIds.push(uploadedFile.id);
        
        // Wait for file processing - needed for large files
        console.log('Waiting for file to be processed...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Attach file to the new assistant using SDK
        console.log(`Attaching file ${uploadedFile.id} to assistant ${assistantId}...`);
        
        try {
          const attachedFile = await openai.beta.assistants.files.create(
            assistantId,
            { file_id: uploadedFile.id }
          );
          
          console.log(`File successfully attached: ${JSON.stringify(attachedFile)}`);
          successfulAttachments.push(uploadedFile.id);
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
    
    // Step 3: Verify files attached to assistant using SDK
    let assistantFiles = [];
    try {
      console.log(`Checking files attached to assistant ${assistantId}...`);
      const fileList = await openai.beta.assistants.files.list(assistantId);
      assistantFiles = fileList.data || [];
      console.log(`Assistant has ${assistantFiles.length} files attached`);
    } catch (err) {
      console.error(`Error listing files: ${err}`);
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