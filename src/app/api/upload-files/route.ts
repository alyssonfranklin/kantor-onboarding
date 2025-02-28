// src/app/api/upload-files/route.ts
import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface FileWithError {
  fileName: string;
  error: string;
}

type UploadableFile = Blob & { name: string };

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const assistantId = formData.get('assistantId') as string;
    const files = formData.getAll('files') as File[];
    
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
    
    // Upload files to OpenAI
    const fileIds: string[] = [];
    const fileErrors: FileWithError[] = [];
    
    for (const file of files) {
      try {
        // Convert File to Blob for direct upload
        const fileBlob = new Blob([await file.arrayBuffer()], { type: file.type });
        
        // Add .name property to make it compatible with OpenAI's API
        Object.defineProperty(fileBlob, 'name', {
          value: file.name,
          writable: false
        });
        
        // Upload directly using the file Blob with correct typing
        const uploadableFile = fileBlob as unknown as UploadableFile;
        
        const uploadedFile = await openai.files.create({
          file: uploadableFile,
          purpose: 'assistants',
        });
        
        fileIds.push(uploadedFile.id);
      } catch (uploadError) {
        console.error('Error uploading file:', file.name, uploadError);
        const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error';
        fileErrors.push({
          fileName: file.name,
          error: errorMessage
        });
      }
    }
    
    // Now try to associate files with the assistant
    const attachmentResults = [];
    
    for (const fileId of fileIds) {
      try {
        // Try to manually call the API endpoint to attach the file
        const url = `https://api.openai.com/v1/assistants/${assistantId}/files`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v1'
          },
          body: JSON.stringify({ file_id: fileId })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.error?.message || 'Failed to attach file to assistant';
          throw new Error(errorMessage);
        }
        
        const attachmentData = await response.json();
        attachmentResults.push(attachmentData);
      } catch (attachError) {
        console.error('Error attaching file to assistant:', attachError);
        // Continue with other files even if one fails
      }
    }
    
    return NextResponse.json({
      success: fileIds.length > 0,
      message: fileIds.length > 0 
        ? `${fileIds.length} files uploaded successfully` 
        : 'No files were uploaded successfully',
      fileIds,
      attachmentResults,
      fileErrors: fileErrors.length > 0 ? fileErrors : undefined
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    console.error('Error processing files:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to process files' },
      { status: 500 }
    );
  }
}