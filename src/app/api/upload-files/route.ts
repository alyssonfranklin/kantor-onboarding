// src/app/api/upload-files/route.ts
import { NextResponse } from 'next/server';

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

    // Verify assistant with the confirmed working configuration
    try {
      console.log(`Verifying assistant ID: ${assistantId}`);
      const assistantResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'  // This is the correct header based on testing
        }
      });
      
      if (!assistantResponse.ok) {
        throw new Error(`Failed to get assistant: ${await assistantResponse.text()}`);
      }
      
      const assistant = await assistantResponse.json();
      console.log(`Assistant found: ${assistant.name} (ID: ${assistant.id})`);
    } catch (error) {
      console.error('Error verifying assistant:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to verify assistant.' },
        { status: 400 }
      );
    }
    
    // Upload files and attempt to attach them
    const fileIds: string[] = [];
    const fileErrors: FileError[] = [];
    const successfulAttachments: string[] = [];
    
    for (const file of files) {
      try {
        // Upload the file
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
        
        // Wait longer for file processing
        console.log('Waiting for file to be processed...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // First create an empty thread
        console.log(`Creating thread...`);
        const threadResponse = await fetch('https://api.openai.com/v1/threads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2'
          }
        });
        
        if (!threadResponse.ok) {
          console.error(`Thread creation failed: ${await threadResponse.text()}`);
          throw new Error('Failed to create thread');
        }
        
        const threadData = await threadResponse.json();
        const threadId = threadData.id;
        console.log(`Thread created with ID: ${threadId}`);
        
        // Add message with file attachment using content array format
        console.log(`Adding message with file attachment to thread ${threadId}...`);
        const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2'
          },
          body: JSON.stringify({
            role: "user",
            content: [
              { type: "text", text: "Here is a file that should be searchable" },
              { type: "file_attachment", file_id: uploadedFile.id }
            ]
          })
        });
        
        if (!messageResponse.ok) {
          const errorText = await messageResponse.text();
          console.error(`Message creation failed: ${errorText}`);
          throw new Error('Failed to add message with file attachment');
        }
        
        const messageData = await messageResponse.json();
        console.log(`Message added with ID: ${messageData.id}`);
        
        // Run the assistant on the thread to process the file
        console.log(`Running assistant ${assistantId} on thread ${threadId}...`);
        const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2'
          },
          body: JSON.stringify({
            assistant_id: assistantId
          })
        });
        
        if (!runResponse.ok) {
          console.error(`Run creation failed: ${await runResponse.text()}`);
          throw new Error('Failed to create run');
        }
        
        const runData = await runResponse.json();
        console.log(`Run created with ID: ${runData.id}`);
        
        // Success!
        successfulAttachments.push(uploadedFile.id);
        
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        fileErrors.push({
          fileName: file.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return NextResponse.json({
      success: successfulAttachments.length > 0,
      message: successfulAttachments.length > 0 
        ? `${successfulAttachments.length} files uploaded and attached successfully` 
        : 'No files were successfully processed',
      assistantId,
      fileIds,
      successfulAttachments,
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