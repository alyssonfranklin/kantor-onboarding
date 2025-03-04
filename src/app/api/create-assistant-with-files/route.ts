// src/app/api/create-assistant-with-files/route.ts
import { NextResponse } from 'next/server';

interface FileError {
  fileName: string;
  error: string;
}

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

    // Step 1: Create a new assistant with file_search enabled
    console.log(`Creating new assistant: ${assistantName}`);
    const createResponse = await fetch('https://api.openai.com/v1/assistants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        name: assistantName,
        instructions: `You are a helpful assistant that can answer questions based on the documents that have been uploaded. Use the information in the documents to provide accurate and relevant answers.`,
        model: "gpt-3.5-turbo",
        tools: [{ type: "file_search" }]
      })
    });
    
    if (!createResponse.ok) {
      throw new Error(`Failed to create assistant: ${await createResponse.text()}`);
    }
    
    const assistant = await createResponse.json();
    const assistantId = assistant.id;
    console.log(`Assistant created successfully with ID: ${assistantId}`);
    
    // Step 2: Upload and attach files
    const fileIds: string[] = [];
    const fileErrors: FileError[] = [];
    
    for (const file of files) {
      try {
        // Upload file
        console.log(`Uploading file: ${file.name} (${file.size} bytes, ${file.type})`);
        
        const fileFormData = new FormData();
        fileFormData.append('purpose', 'assistants');
        fileFormData.append('file', file);
        
        const uploadResponse = await fetch('https://api.openai.com/v1/files', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: fileFormData
        });
        
        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload file: ${await uploadResponse.text()}`);
        }
        
        const uploadedFile = await uploadResponse.json();
        console.log(`File uploaded successfully with ID: ${uploadedFile.id}`);
        fileIds.push(uploadedFile.id);
        
        // Wait for file processing
        console.log('Waiting for file to be processed...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Attach file to the new assistant
        console.log(`Attaching file ${uploadedFile.id} to assistant ${assistantId}...`);
        
        const attachResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantId}/files`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2'
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
        
        const attachedFile = await attachResponse.json();
        console.log(`File successfully attached: ${JSON.stringify(attachedFile)}`);
        
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        fileErrors.push({
          fileName: file.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Step 3: Verify files attached to assistant
    let assistantFiles = [];
    try {
      console.log(`Checking files attached to assistant ${assistantId}...`);
      const listResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantId}/files`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });
      
      if (listResponse.ok) {
        const listData = await listResponse.json();
        assistantFiles = listData.data || [];
        console.log(`Assistant has ${assistantFiles.length} files attached`);
      } else {
        console.log(`Failed to list files: ${await listResponse.text()}`);
      }
    } catch (err) {
      console.error(`Error listing files: ${err}`);
    }
    
    return NextResponse.json({
      success: true,
      message: `New assistant created with ${fileIds.length} files attached`,
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