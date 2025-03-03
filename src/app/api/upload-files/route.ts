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

interface AssistantTool {
  type: string;
}

interface AssistantFile {
  id: string;
  object: string;
  created_at: number;
  assistant_id: string;
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
        'OpenAI-Beta': 'assistants=v2'
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
      const errorText = await response.text();
      let errorInfo = 'Unknown error';
      try {
        const error = JSON.parse(errorText);
        errorInfo = error.error?.message || JSON.stringify(error);
      } catch {
        errorInfo = errorText;
      }
      console.error('Failed to enable retrieval:', errorInfo);
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
          'OpenAI-Beta': 'assistants=v2'
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
        
        if (!retrievalEnabled) {
          return NextResponse.json(
            { error: 'Failed to enable retrieval capability for this assistant. Files cannot be indexed for search.' },
            { status: 400 }
          );
        }
        
        // Wait a bit for retrieval to be enabled
        console.log('Waiting for retrieval capability to be fully enabled...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else if (!hasRetrieval) {
        console.warn('WARNING: This assistant does not have retrieval enabled. Files will not be added to vector store!');
        return NextResponse.json(
          { error: 'This assistant does not have retrieval enabled. Please check the "Enable retrieval" option to add files to the vector store.' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Error validating assistant:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to validate assistant. Please check the assistant ID and try again.' },
        { status: 400 }
      );
    }
    
    // Upload files and attach them to the assistant
    const fileIds: string[] = [];
    const fileErrors: FileError[] = [];
    const fileDetailsMap: Record<string, FileDetails> = {};
    const attachmentResults: unknown[] = [];
    
    for (const file of files) {
      try {
        console.log(`Uploading file: ${file.name} (${file.size} bytes, ${file.type})`);
        
        // Convert file to FormData for direct API upload
        const fileFormData = new FormData();
        // Important: set purpose to 'assistants' to enable vector indexing
        fileFormData.append('purpose', 'assistants');
        fileFormData.append('file', file);
        
        console.log('Uploading file with purpose: assistants');
        
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
        
        // Immediately attach the file to the assistant to ensure proper association
        console.log(`Attaching file ${uploadData.id} to assistant ${assistantId} for vector indexing...`);
        
        // Important: This is what adds the file to the vector store
        const attachResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantId}/files`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2'
          },
          body: JSON.stringify({ file_id: uploadData.id })
        });
        
        if (!attachResponse.ok) {
          const errorText = await attachResponse.text();
          let errorMessage = `Failed to attach file to assistant (Status: ${attachResponse.status})`;
          
          try {
            const errorData = JSON.parse(errorText) as { error?: { message?: string } };
            if (errorData.error?.message) {
              errorMessage = errorData.error.message;
            }
          } catch {
            console.error('Raw attachment error:', errorText);
          }
          
          console.error(`Error attaching file ${uploadData.id} to assistant:`, errorMessage);
          throw new Error(errorMessage);
        }
        
        const attachmentData = await attachResponse.json();
        attachmentResults.push(attachmentData);
        console.log(`File ${uploadData.id} successfully attached to assistant ${assistantId} and indexed for retrieval`);
        
        // Wait a bit to allow for processing
        await new Promise(resolve => setTimeout(resolve, 1000));
        
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
        console.error('Error processing file:', file.name, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        fileErrors.push({
          fileName: file.name,
          error: errorMessage
        });
      }
    }
    
    // Check what files are attached to the assistant and verify retrieval is working
    let assistantFiles: AssistantFile[] = [];
    try {
      console.log(`Checking files attached to assistant ${assistantId}...`);
      const filesResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantId}/files`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });
      
      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        assistantFiles = filesData.data || [];
        console.log(`Assistant has ${assistantFiles.length} files attached`);
        console.log('Attached files:', JSON.stringify(assistantFiles));
        
        // Verify the newly uploaded files are in the list
        const newFileIds = fileIds.filter(id => 
          !fileErrors.some(error => error.fileName === fileDetailsMap[id]?.filename)
        );
        
        const missingFiles = newFileIds.filter(id => 
          !assistantFiles.some((file: AssistantFile) => file.id === id)
        );
        
        if (missingFiles.length > 0) {
          console.warn(`Warning: Some files were not properly attached to the assistant: ${missingFiles.join(', ')}`);
        } else if (newFileIds.length > 0) {
          console.log(`Success: All ${newFileIds.length} new files were properly attached to the assistant`);
        }
      } else {
        console.error(`Failed to get assistant files. Status: ${filesResponse.status}`);
      }
    } catch (error) {
      console.error('Error checking assistant files:', error);
    }
    
    // Verify the retrieval capability one more time
    if (hasRetrieval) {
      console.log(`Assistant ${assistantId} has retrieval capability. Files should be searchable.`);
    } else {
      console.error(`Assistant ${assistantId} does NOT have retrieval capability! Files won't be searchable.`);
    }
    
    return NextResponse.json({
      success: fileIds.length > 0 && fileErrors.length === 0,
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