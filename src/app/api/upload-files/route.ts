// src/app/api/upload-files/route.ts
import { NextResponse } from 'next/server';

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

    // Check if the assistant exists and has retrieval enabled
    try {
      console.log(`Validating assistant ID: ${assistantId}`);
      const assistantResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v1'
        }
      });

      if (!assistantResponse.ok) {
        const errorData = await assistantResponse.json() as { error?: { message?: string } };
        throw new Error(errorData.error?.message || `Assistant not found: ${assistantId}`);
      }

      const assistant = await assistantResponse.json();
      console.log(`Assistant verified: ${assistant.name || assistantId}`);
      
      // Check if assistant has retrieval tool enabled
      const hasRetrieval = (assistant.tools as AssistantTool[])?.some((tool) => tool.type === 'retrieval');
      console.log(`Assistant has retrieval enabled: ${hasRetrieval ? 'YES' : 'NO'}`);
      
      if (!hasRetrieval) {
        console.warn('Warning: This assistant does not have retrieval enabled. Files may not be searchable.');
      }
    } catch (error) {
      console.error('Error validating assistant:', error);
      // Continue anyway, as the assistant might still accept files
    }
    
    // Skip the OpenAI SDK entirely and use direct API calls
    const fileIds: string[] = [];
    const fileErrors: FileError[] = [];
    const fileDetailsMap: Record<string, FileDetails> = {};
    
    for (const file of files) {
      try {
        console.log(`Uploading file: ${file.name} (${file.size} bytes, ${file.type})`);
        
        // Convert file to FormData for direct API upload
        const fileFormData = new FormData();
        fileFormData.append('purpose', 'assistants');
        fileFormData.append('file', file);
        
        // Upload directly to OpenAI API
        const uploadResponse = await fetch('https://api.openai.com/v1/files', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: fileFormData
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json() as { error?: { message?: string } };
          throw new Error(errorData.error?.message || 'Failed to upload file');
        }
        
        const uploadData = await uploadResponse.json() as FileDetails;
        fileIds.push(uploadData.id);
        fileDetailsMap[uploadData.id] = uploadData;
        
        console.log(`File uploaded successfully. ID: ${uploadData.id}`);
        
        // Verify the file status
        const fileStatusResponse = await fetch(`https://api.openai.com/v1/files/${uploadData.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          }
        });
        
        if (fileStatusResponse.ok) {
          const fileStatus = await fileStatusResponse.json();
          console.log(`File status: ${fileStatus.status}, Filename: ${fileStatus.filename}, Purpose: ${fileStatus.purpose}`);
          fileDetailsMap[uploadData.id] = { ...fileDetailsMap[uploadData.id], ...fileStatus };
        }
        
      } catch (error) {
        console.error('Error uploading file:', file.name, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        fileErrors.push({
          fileName: file.name,
          error: errorMessage
        });
      }
    }
    
    // Now try to associate files with the assistant
    const attachmentResults: unknown[] = [];
    
    for (const fileId of fileIds) {
      try {
        console.log(`Attaching file ${fileId} to assistant ${assistantId}`);
        
        // Call the API endpoint to attach the file
        const attachResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantId}/files`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v1'
          },
          body: JSON.stringify({ file_id: fileId })
        });
        
        if (!attachResponse.ok) {
          const errorData = await attachResponse.json() as { error?: { message?: string } };
          throw new Error(errorData.error?.message || 'Failed to attach file to assistant');
        }
        
        const attachmentData = await attachResponse.json();
        attachmentResults.push(attachmentData);
        console.log(`File ${fileId} successfully attached to assistant ${assistantId}`);
      } catch (error) {
        console.error('Error attaching file to assistant:', error);
        // Continue with other files even if one fails
      }
    }
    
    // Check what files are attached to the assistant
    try {
      const filesResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantId}/files`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v1'
        }
      });
      
      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        console.log(`Assistant has ${filesData.data?.length || 0} files attached`);
      }
    } catch (error) {
      console.error('Error checking assistant files:', error);
    }
    
    return NextResponse.json({
      success: fileIds.length > 0,
      message: fileIds.length > 0 
        ? `${fileIds.length} files uploaded successfully` 
        : 'No files were uploaded successfully',
      fileIds,
      fileDetails: fileDetailsMap,
      attachmentResults,
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