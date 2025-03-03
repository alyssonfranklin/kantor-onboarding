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
    
    // Upload files and attach them to the assistant using fetch directly
    const fileIds: string[] = [];
    const fileErrors: any[] = [];
    
    for (const file of files) {
      try {
        // Upload the file
        const uploadedFile = await openai.files.create({
          file: file,
          purpose: 'assistants',
        });
        
        console.log(`File uploaded: ${uploadedFile.id}`);
        fileIds.push(uploadedFile.id);
        
        // Attach the file to the assistant - using fetch directly to avoid SDK compatibility issues
        const response = await fetch(`https://api.openai.com/v1/assistants/${assistantId}/files`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2'
          },
          body: JSON.stringify({ file_id: uploadedFile.id })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to attach file: ${errorText}`);
        }
        
        const attachedFile = await response.json();
        console.log(`File attached: ${attachedFile.id}`);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        fileErrors.push({
          fileName: file.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Check files attached to the assistant - using fetch directly
    const filesResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantId}/files`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });
    
    let assistantFiles = [];
    if (filesResponse.ok) {
      const filesData = await filesResponse.json();
      assistantFiles = filesData.data || [];
    }
    
    return NextResponse.json({
      success: fileIds.length > 0,
      message: fileIds.length > 0 
        ? `${fileIds.length} files uploaded and attached successfully` 
        : 'No files were successfully processed',
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