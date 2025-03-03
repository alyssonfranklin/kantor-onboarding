// src/app/api/upload-files/route.ts
import { NextResponse } from 'next/server';

interface FileError {
  fileName: string;
  error: string;
}

interface FileDetails {
  id: string;
  object: string;
  bytes: number;
  created_at: number;
  filename: string;
  purpose: string;
  status: string;
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

    // Step 1: Validate the assistant exists
    console.log(`Validating assistant ID: ${assistantId}`);
    try {
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
      const hasRetrieval = assistant.tools?.some((tool: any) => tool.type === 'retrieval');
      if (!hasRetrieval) {
        console.warn('Warning: This assistant does not have retrieval enabled. Files may not be searchable.');
      }
    } catch (error) {
      console.error('Error validating assistant:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to validate assistant' },
        { status: 400 }
      );
    }

    // Step 2: Upload files to OpenAI
    const fileIds: string[] = [];
    const fileErrors: FileError[] = [];
    const fileDetails: Record<string, FileDetails> = {};
    
    console.log('Starting file uploads...');
    
    for (const file of files) {
      try {
        console.log(`Processing file: ${file.name} (${file.size} bytes, type: ${file.type})`);
        
        // Create FormData for direct API upload
        const fileFormData = new FormData();
        fileFormData.append('purpose', 'assistants');
        fileFormData.append('file', file);
        
        // Upload directly to OpenAI API
        console.log('Uploading to OpenAI...');
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
        fileDetails[uploadData.id] = uploadData;
        
        console.log(`File uploaded successfully. ID: ${uploadData.id}, Status: ${uploadData.status}`);
      } catch (error) {
        console.error('Error uploading file:', file.name, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        fileErrors.push({
          fileName: file.name,
          error: errorMessage
        });
      }
    }
    
    // Step 3: Verify file uploads
    console.log('Verifying file uploads...');
    for (const fileId of fileIds) {
      try {
        const fileCheckResponse = await fetch(`https://api.openai.com/v1/files/${fileId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          }
        });
        
        if (!fileCheckResponse.ok) {
          console.error(`File verification failed for ID: ${fileId}`);
          continue;
        }
        
        const fileInfo = await fileCheckResponse.json() as FileDetails;
        console.log(`File verified: ${fileId}, Status: ${fileInfo.status}, Name: ${fileInfo.filename}`);
        fileDetails[fileId] = fileInfo;
        
        // Wait if file is still processing
        if (fileInfo.status === 'processing') {
          console.log(`File ${fileId} is still processing. Waiting before attachment...`);
          // Wait for a short time to allow processing to begin
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`Error verifying file ${fileId}:`, error);
      }
    }
    
    // Step 4: Attach files to the assistant
    console.log('Attaching files to assistant...');
    const attachmentResults: unknown[] = [];
    const attachmentErrors: any[] = [];
    
    for (const fileId of fileIds) {
      try {
        console.log(`Attaching file ${fileId} to assistant ${assistantId}...`);
        
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
          const errorMessage = errorData.error?.message || 'Failed to attach file to assistant';
          throw new Error(errorMessage);
        }
        
        const attachmentData = await attachResponse.json();
        console.log(`File ${fileId} successfully attached to assistant ${assistantId}`);
        attachmentResults.push(attachmentData);
      } catch (error) {
        console.error(`Error attaching file ${fileId} to assistant:`, error);
        attachmentErrors.push({
          fileId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        // Continue with other files even if one fails
      }
    }
    
    // Step 5: Verify file attachments
    console.log('Verifying file attachments...');
    try {
      const assistantFilesResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantId}/files`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v1'
        }
      });
      
      if (assistantFilesResponse.ok) {
        const filesData = await assistantFilesResponse.json();
        console.log(`Assistant has ${filesData.data?.length || 0} files attached.`);
        console.log('Attached files:', filesData.data);
      } else {
        console.error('Could not verify attached files');
      }
    } catch (error) {
      console.error('Error verifying file attachments:', error);
    }
    
    return NextResponse.json({
      success: fileIds.length > 0,
      message: fileIds.length > 0 
        ? `${fileIds.length} files uploaded successfully` 
        : 'No files were uploaded successfully',
      fileIds,
      fileDetails,
      attachmentResults,
      attachmentErrors: attachmentErrors.length > 0 ? attachmentErrors : undefined,
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