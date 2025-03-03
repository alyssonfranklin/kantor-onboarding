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

// Function to enable retrieval for an assistant
async function enableRetrievalForAssistant(assistantId: string): Promise<boolean> {
  try {
    console.log(`Attempting to enable retrieval for assistant ${assistantId}`);
    const response = await fetch(`https://api.openai.com/v1/assistants/${assistantId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v1'
      },
      body: JSON.stringify({
        tools: [{ type: "retrieval" }]
      })
    });
    
    if (response.ok) {
      // Fixed: removed unused data variable
      await response.json();
      console.log('Successfully enabled retrieval for assistant');
      return true;
    } else {
      const error = await response.json();
      console.error('Failed to enable retrieval:', error);
      return false;
    }
  } catch (error) {
    console.error('Error enabling retrieval:', error);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const assistantId = formData.get('assistantId') as string;
    const files = formData.getAll('files') as File[];
    const enableRetrieval = formData.get('enableRetrieval') === 'true';
    
    console.log(`Request received: assistantId=${assistantId}, files=${files.length}, enableRetrieval=${enableRetrieval}`);
    
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
    let hasRetrieval = false;
    let retrievalEnabled = false;
    
    try {
      console.log(`Validating assistant ID: ${assistantId}`);
      // Validate the assistant ID format first
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
          'OpenAI-Beta': 'assistants=v1'
        }
      });

      console.log(`Assistant validation response status: ${assistantResponse.status}`);

      if (!assistantResponse.ok) {
        const errorText = await assistantResponse.text();
        let errorMessage = `Assistant validation failed with status ${assistantResponse.status}`;
        
        try {
          // Try to parse as JSON to get detailed error
          const errorData = JSON.parse(errorText) as { error?: { message?: string, type?: string } };
          if (errorData.error?.message) {
            errorMessage = errorData.error.message;
            console.error('API Error details:', errorData.error);
          }
        } catch {
          // If parsing fails, use the raw text (removed unused 'e' variable)
          console.error('Raw error response:', errorText);
        }

        // Handle specific error cases
        if (assistantResponse.status === 404) {
          return NextResponse.json(
            { error: `Assistant not found: ${assistantId}. Please verify your assistant ID is correct.` },
            { status: 404 }
          );
        } else if (assistantResponse.status === 401) {
          return NextResponse.json(
            { error: 'API key is invalid or doesn\'t have permission to access this assistant.' },
            { status: 401 }
          );
        }
        
        throw new Error(errorMessage);
      }

      const assistant = await assistantResponse.json();
      console.log(`Assistant found: ${assistant.name || assistantId}`);
      
      // Check assistant details including tools
      console.log('Assistant tools:', JSON.stringify(assistant.tools || []));
      
      // Check if assistant has retrieval tool enabled
      hasRetrieval = (assistant.tools as AssistantTool[])?.some((tool) => tool.type === 'retrieval');
      console.log(`Assistant has retrieval enabled: ${hasRetrieval ? 'YES' : 'NO'}`);
      
      if (!hasRetrieval && enableRetrieval) {
        console.log('Retrieval not enabled, but user requested to enable it');
        retrievalEnabled = await enableRetrievalForAssistant(assistantId);
        hasRetrieval = retrievalEnabled;
        console.log(`Retrieval now enabled: ${retrievalEnabled ? 'YES' : 'NO'}`);
      } else if (!hasRetrieval) {
        console.warn('WARNING: This assistant does not have retrieval enabled. Files will not be added to vector store!');
      }
    } catch (error) {
      console.error('Error validating assistant:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to validate assistant. Please check the assistant ID and try again.' },
        { status: 400 }
      );
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
    
    // Wait a bit to allow processing to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check what files are attached to the assistant
    let assistantFiles = [];
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
        assistantFiles = filesData.data || [];
        console.log(`Assistant has ${assistantFiles.length} files attached`);
        console.log('Attached files:', JSON.stringify(assistantFiles));
      }
    } catch (error) {
      console.error('Error checking assistant files:', error);
    }
    
    return NextResponse.json({
      success: fileIds.length > 0,
      message: fileIds.length > 0 
        ? `${fileIds.length} files uploaded successfully` 
        : 'No files were uploaded successfully',
      hasRetrieval: hasRetrieval,
      retrievalEnabled: retrievalEnabled,
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