// src/app/api/upload-files/route.ts
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
      const assistant = await openai.beta.assistants.retrieve(assistantId);
      console.log(`Assistant found: ${assistant.name} (ID: ${assistant.id})`);
      
      // Check if file_search is enabled
      const hasFileSearch = assistant.tools?.some((tool: { type: string }) => tool.type === 'file_search');
      if (!hasFileSearch) {
        console.log('Warning: This assistant does not have file_search enabled. Files might not be searchable.');
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
        // Upload the file using SDK
        console.log(`Uploading file: ${file.name} (${file.size} bytes, ${file.type})`);
        
        // Convert File to Buffer for SDK
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Upload file using OpenAI SDK
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
        
        // Attach file to assistant using SDK
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
    
    // Get list of files attached to the assistant using SDK
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