// src/app/api/upload-files/route.ts
import { NextResponse } from 'next/server';

// Create interfaces at the top of the file
interface FileError {
  fileName: string;
  error: string;
}

interface FileDetails {
  id: string;
  filename?: string;
  status?: string;
  purpose?: string;
}

interface AssistantFile {
  id: string;
  object: string;
  created_at: number;
  assistant_id: string;
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
    
    if (!assistantId) {
      return NextResponse.json(
        { error: 'Assistant ID is required' },
        { status: 400 }
      );
    }
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }
    
    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    // Check if the assistant exists - use v1 endpoint but with v2 beta header
    try {
      console.log(`Validating assistant ID: ${assistantId}`);
      if (!assistantId.startsWith('asst_')) {
        console.error('Invalid assistant ID format');
        return NextResponse.json(
          { error: 'Invalid assistant ID format. Assistant IDs should start with "asst_"' },
          { status: 400 }
        );
      }

      console.log(`Making API request to validate assistant: ${assistantId}`);
      const assistantResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'  // Required header for accessing assistants
        }
      });

      console.log(`Assistant validation response status: ${assistantResponse.status}`);

      if (!assistantResponse.ok) {
        const errorText = await assistantResponse.text();
        console.error('Error response:', errorText);
        return NextResponse.json(
          { error: `Assistant not found: ${assistantId}. Please verify your assistant ID is correct.` },
          { status: 404 }
        );
      }

      const assistant = await assistantResponse.json();
      console.log(`Assistant found: ${assistant.name || assistantId}`);
      
      // Check if retrieval is enabled
      const hasRetrieval = assistant.tools?.some((tool: AssistantTool) => tool.type === 'retrieval') || false;
      if (!hasRetrieval) {
        console.warn('WARNING: This assistant does not have retrieval enabled. Files will not be searchable!');
        // Continue anyway but warn the user
      }
      
    } catch (error) {
      console.error('Error validating assistant:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to validate assistant.' },
        { status: 400 }
      );
    }
    
    // Upload files
    const fileIds: string[] = [];
    const fileErrors: FileError[] = [];
    const fileDetailsMap: Record<string, FileDetails> = {};
    const attachmentResults: unknown[] = [];
    
    for (const file of files) {
      try {
        console.log(`Uploading file: ${file.name} (${file.size} bytes, ${file.type})`);
        
        // Upload file with purpose = assistants
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
          const errorText = await uploadResponse.text();
          console.error('File upload error:', errorText);
          throw new Error('Failed to upload file');
        }
        
        const uploadData = await uploadResponse.json() as FileDetails;
        fileIds.push(uploadData.id);
        fileDetailsMap[uploadData.id] = uploadData;
        
        console.log(`File uploaded successfully. ID: ${uploadData.id}`);
        
        // Attach file to assistant - v1 endpoint but with v2 beta header
        console.log(`Attaching file ${uploadData.id} to assistant ${assistantId}...`);
        
        const attachResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantId}/files`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2'  // Required header for accessing assistants
          },
          body: JSON.stringify({ file_id: uploadData.id })
        });
        
        if (!attachResponse.ok) {
          const errorText = await attachResponse.text();
          console.error('Attachment error:', errorText);
          throw new Error('Failed to attach file to assistant');
        }
        
        const attachmentData = await attachResponse.json();
        attachmentResults.push(attachmentData);
        console.log(`File ${uploadData.id} successfully attached to assistant ${assistantId}`);
        
      } catch (error) {
        console.error('Error processing file:', file.name, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        fileErrors.push({
          fileName: file.name,
          error: errorMessage
        });
      }
    }
    
    // Check what files are attached to the assistant
    let assistantFiles: AssistantFile[] = [];
    try {
      console.log(`Checking files attached to assistant ${assistantId}...`);
      const filesResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantId}/files`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'  // Required header for accessing assistants
        }
      });
      
      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        assistantFiles = filesData.data || [];
        console.log(`Assistant has ${assistantFiles.length} files attached`);
      } else {
        console.error(`Failed to get assistant files. Status: ${filesResponse.status}`);
      }
    } catch (error) {
      console.error('Error checking assistant files:', error);
    }
    
    return NextResponse.json({
      success: fileIds.length > 0 && fileErrors.length === 0,
      message: fileIds.length > 0 
        ? `${fileIds.length} files uploaded successfully` 
        : 'No files were uploaded successfully',
      fileIds,
      fileDetails: fileDetailsMap,
      attachmentResults,
      assistantFiles,
      fileErrors: fileErrors.length > 0 ? fileErrors : undefined
    });
  } catch (error) {
    console.error('Error processing files:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process files';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}