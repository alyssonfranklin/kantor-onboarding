// src/app/api/upload-files/route.ts
import { NextResponse } from 'next/server';

interface FileError {
  fileName: string;
  error: string;
}

interface AttachmentResponse {
  id: string;
  object: string;
  created_at: number;
  assistant_id: string;
  file_id: string;
}

interface AssistantFile {
  id: string;
  object: string;
  created_at: number;
  assistant_id: string;
  file_id?: string;
}

interface AssistantTool {
  type: string;
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
      // Using v2 endpoint path
      const assistantResponse = await fetch(`https://api.openai.com/v2/assistants/${assistantId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });
      
      if (!assistantResponse.ok) {
        throw new Error(`Failed to get assistant: ${await assistantResponse.text()}`);
      }
      
      const assistant = await assistantResponse.json();
      console.log(`Assistant found: ${assistant.name} (ID: ${assistant.id})`);
      
      const hasFileSearch = assistant.tools?.some((tool: AssistantTool) => tool.type === 'file_search');
      console.log(`Has file_search: ${hasFileSearch ? 'YES' : 'NO'}`);
      
      if (!hasFileSearch) {
        // If file_search is not enabled, we need to enable it
        console.log("Enabling file_search for the assistant...");
        const updateResponse = await fetch(`https://api.openai.com/v2/assistants/${assistantId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2'
          },
          body: JSON.stringify({
            tools: [...(assistant.tools || []), { type: "file_search" }],
            model: assistant.model,
            name: assistant.name,
            instructions: assistant.instructions
          })
        });
        
        if (!updateResponse.ok) {
          throw new Error(`Failed to enable file_search: ${await updateResponse.text()}`);
        }
        
        console.log("File search successfully enabled");
      }
    } catch (error) {
      console.error('Error verifying assistant:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to verify assistant.' },
        { status: 400 }
      );
    }
    
    // Upload files and attach them to the assistant using fetch directly
    const fileIds: string[] = [];
    const fileErrors: FileError[] = [];
    const attachmentResponses: AttachmentResponse[] = [];
    
    for (const file of files) {
      try {
        // Upload the file - important: must be purpose='assistants'
        console.log(`Uploading file: ${file.name} (${file.size} bytes, ${file.type})`);
        
        // Create a form data object for the file upload
        const fileFormData = new FormData();
        fileFormData.append('purpose', 'assistants');
        fileFormData.append('file', file);
        
        // Upload file directly using fetch - file API still uses v1
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
        
        // IMPORTANT: Wait a moment for the file to be processed
        console.log('Waiting for file to be processed...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Attach the file to the assistant using v2 endpoint
        console.log(`Attaching file ${uploadedFile.id} to assistant ${assistantId}...`);
        
        const attachUrl = `https://api.openai.com/v2/assistants/${assistantId}/files`;
        console.log(`POST request to: ${attachUrl}`);
        
        const attachResponse = await fetch(attachUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2'
          },
          body: JSON.stringify({ file_id: uploadedFile.id })
        });
        
        console.log(`Attachment response status: ${attachResponse.status}`);
        const attachResponseText = await attachResponse.text();
        console.log(`Attachment response body: ${attachResponseText}`);
        
        if (!attachResponse.ok) {
          throw new Error(`Failed to attach file: ${attachResponseText}`);
        }
        
        try {
          const attachedFile = JSON.parse(attachResponseText) as AttachmentResponse;
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
    
    // Check files attached to the assistant using v2 endpoint
    console.log(`Checking files currently attached to assistant ${assistantId}...`);
    const filesResponse = await fetch(`https://api.openai.com/v2/assistants/${assistantId}/files`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });
    
    console.log(`Files check response status: ${filesResponse.status}`);
    
    let assistantFiles: AssistantFile[] = [];
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
    const attachedFileIds = assistantFiles.map((file: AssistantFile) => file.file_id || file.id);
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