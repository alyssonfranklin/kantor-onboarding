// src/app/api/upload-files/route.ts
import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface FileError {
  fileName: string;
  error: string;
}

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
      console.log(`Verifying assistant ID: ${assistantId}`);
      const assistant = await openai.beta.assistants.retrieve(assistantId);
      console.log(`Assistant found: ${assistant.name} (ID: ${assistant.id})`);
      
      const hasFileSearch = assistant.tools?.some(tool => tool.type === 'file_search');
      console.log(`Has file_search: ${hasFileSearch ? 'YES' : 'NO'}`);
      
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
    const fileErrors: FileError[] = [];
    const attachmentResponses: any[] = [];
    
    for (const file of files) {
      try {
        // Upload the file
        console.log(`Uploading file: ${file.name} (${file.size} bytes, ${file.type})`);
        const uploadedFile = await openai.files.create({
          file: file,
          purpose: 'assistants',
        });
        
        console.log(`File uploaded successfully with ID: ${uploadedFile.id}`);
        fileIds.push(uploadedFile.id);
        
        // IMPORTANT: Wait a moment for the file to be processed
        console.log('Waiting for file to be processed...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Attach the file to the assistant - using fetch directly to avoid SDK compatibility issues
        console.log(`Attaching file ${uploadedFile.id} to assistant ${assistantId}...`);
        
        const attachUrl = `https://api.openai.com/v1/assistants/${assistantId}/files`;
        console.log(`POST request to: ${attachUrl}`);
        
        const response = await fetch(attachUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2'
          },
          body: JSON.stringify({ file_id: uploadedFile.id })
        });
        
        console.log(`Attachment response status: ${response.status}`);
        const responseText = await response.text();
        console.log(`Attachment response body: ${responseText}`);
        
        if (!response.ok) {
          throw new Error(`Failed to attach file: ${responseText}`);
        }
        
        try {
          const attachedFile = JSON.parse(responseText);
          console.log(`File successfully attached: ${JSON.stringify(attachedFile)}`);
          attachmentResponses.push(attachedFile);
        } catch (e) {
          console.error('Error parsing attachment response:', e);
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        fileErrors.push({
          fileName: file.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Check files attached to the assistant - using fetch directly
    console.log(`Checking files currently attached to assistant ${assistantId}...`);
    const filesResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantId}/files`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });
    
    console.log(`Files check response status: ${filesResponse.status}`);
    
    let assistantFiles = [];
    if (filesResponse.ok) {
      const filesResponseText = await filesResponse.text();
      console.log(`Files response body: ${filesResponseText}`);
      
      try {
        const filesData = JSON.parse(filesResponseText);
        assistantFiles = filesData.data || [];
        console.log(`Assistant has ${assistantFiles.length} files attached`);
      } catch (e) {
        console.error('Error parsing files response:', e);
      }
    } else {
      console.error(`Failed to get assistant files: ${await filesResponse.text()}`);
    }
    
    // Compare uploaded files with attached files
    const attachedFileIds = assistantFiles.map((file: any) => file.id);
    const missingFiles = fileIds.filter(id => !attachedFileIds.includes(id));
    
    if (missingFiles.length > 0) {
      console.warn(`Some files were not properly attached: ${missingFiles.join(', ')}`);
    } else {
      console.log('All files were successfully attached');
    }
    
    return NextResponse.json({
      success: fileIds.length > 0 && fileErrors.length === 0,
      message: fileIds.length > 0 
        ? `${fileIds.length} files uploaded and attached successfully` 
        : 'No files were successfully processed',
      assistantId,
      fileIds,
      attachmentResponses,
      assistantFiles,
      missingFiles: missingFiles.length > 0 ? missingFiles : undefined,
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