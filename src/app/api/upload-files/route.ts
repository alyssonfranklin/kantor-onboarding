// src/app/api/upload-files/route.ts
import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

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

    // First check if the assistant exists and has file_search enabled
    try {
      const assistant = await openai.beta.assistants.retrieve(assistantId);
      console.log(`Assistant found: ${assistant.name}`);
      
      const hasFileSearch = assistant.tools?.some(tool => tool.type === 'file_search');
      if (!hasFileSearch) {
        return NextResponse.json(
          { error: 'This assistant does not have file_search enabled.' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Error verifying assistant:', error);
      return NextResponse.json(
        { error: 'Failed to verify assistant. Please check the ID is correct.' },
        { status: 400 }
      );
    }
    
    // Upload files and attach them to the assistant
    const fileIds = [];
    const fileErrors = [];
    
    for (const file of files) {
      try {
        // Upload the file
        const fileForm = new FormData();
        fileForm.append('purpose', 'assistants');
        fileForm.append('file', file);
        
        const uploadedFile = await openai.files.create({
          file: file,
          purpose: 'assistants',
        });
        
        console.log(`File uploaded: ${uploadedFile.id}`);
        fileIds.push(uploadedFile.id);
        
        // Attach the file to the assistant
        const attachedFile = await openai.beta.assistants.files.create(
          assistantId,
          { file_id: uploadedFile.id }
        );
        
        console.log(`File attached: ${attachedFile.id}`);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        fileErrors.push({
          fileName: file.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Check files attached to the assistant
    const assistantFiles = await openai.beta.assistants.files.list(assistantId);
    
    return NextResponse.json({
      success: fileIds.length > 0,
      message: fileIds.length > 0 
        ? `${fileIds.length} files uploaded and attached successfully` 
        : 'No files were successfully processed',
      fileIds,
      assistantFiles: assistantFiles.data,
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