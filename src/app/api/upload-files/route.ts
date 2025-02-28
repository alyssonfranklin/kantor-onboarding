// @ts-nocheck
// src/app/api/upload-files/route.ts
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const assistantId = formData.get('assistantId');
    const files = formData.getAll('files');
    
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

    // Skip the OpenAI SDK entirely and use direct API calls
    const fileIds = [];
    const fileErrors = [];
    
    for (const file of files) {
      try {
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
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error?.message || 'Failed to upload file');
        }
        
        const uploadData = await uploadResponse.json();
        fileIds.push(uploadData.id);
      } catch (error) {
        console.error('Error uploading file:', file.name, error);
        fileErrors.push({
          fileName: file.name,
          error: error.message || 'Unknown error'
        });
      }
    }
    
    // Now try to associate files with the assistant
    const attachmentResults = [];
    
    for (const fileId of fileIds) {
      try {
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
          const errorData = await attachResponse.json();
          throw new Error(errorData.error?.message || 'Failed to attach file to assistant');
        }
        
        const attachmentData = await attachResponse.json();
        attachmentResults.push(attachmentData);
      } catch (error) {
        console.error('Error attaching file to assistant:', error);
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
  } catch (error) {
    console.error('Error processing files:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process files' },
      { status: 500 }
    );
  }
}