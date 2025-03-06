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
    const successfulAttachments: string[] = [];
    
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
        
        // Wait for file processing - longer wait to ensure file is fully processed
        console.log('Waiting for file to be processed...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Verify file is processed and ready to be attached
        try {
          const fileStatusResponse = await fetch(`https://api.openai.com/v1/files/${uploadedFile.id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
          });
          
          if (fileStatusResponse.ok) {
            const fileStatus = await fileStatusResponse.json();
            console.log(`File status: ${fileStatus.status}, purpose: ${fileStatus.purpose}`);
            
            if (fileStatus.status !== 'processed') {
              console.log(`Waiting additional time for file to complete processing...`);
              await new Promise(resolve => setTimeout(resolve, 3000));
            }
          } else {
            console.log(`Unable to check file status: ${await fileStatusResponse.text()}`);
          }
        } catch (statusError) {
          console.error(`Error checking file status: ${statusError}`);
        }
        
        console.log('Continuing after file processing wait...');
        
        // Attach file to the new assistant
        console.log(`Attaching file ${uploadedFile.id} to assistant ${assistantId}...`);
        
        try {
          // Try multiple possible endpoints to cover all API versions
          let attachResponse = null;
          let attachedFile = null;
          let successfulEndpoint = null;
          
          // Approach 1: Try the latest documented approach with v2 header
          try {
            console.log(`Trying approach 1: Standard /files endpoint with v2 header`);
            const response1 = await fetch(`https://api.openai.com/v1/assistants/${assistantId}/files`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'OpenAI-Beta': 'assistants=v2'
              },
              body: JSON.stringify({ file_id: uploadedFile.id })
            });
            
            console.log(`Approach 1 status: ${response1.status}`);
            if (response1.ok) {
              attachResponse = response1;
              attachedFile = await response1.json();
              successfulEndpoint = "Standard /files with v2 header";
              console.log(`Approach 1 succeeded`);
            } else {
              console.log(`Approach 1 failed: ${await response1.text()}`);
            }
          } catch (err) {
            console.error(`Error in approach 1: ${err}`);
          }
          
          // If still not successful, try another approach
          if (!attachedFile) {
            console.log(`Trying approach 2: Standard endpoint with different parameters`);
            try {
              const response2 = await fetch(`https://api.openai.com/v1/assistants/${assistantId}/files`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                  'OpenAI-Beta': 'assistants=v2'
                },
                body: JSON.stringify({ 
                  file_id: uploadedFile.id,
                  tool_type: "file_search" 
                })
              });
              
              console.log(`Approach 2 status: ${response2.status}`);
              if (response2.ok) {
                attachResponse = response2;
                attachedFile = await response2.json();
                successfulEndpoint = "Standard /files with tool_type parameter";
                console.log(`Approach 2 succeeded`);
              } else {
                console.log(`Approach 2 failed: ${await response2.text()}`);
              }
            } catch (err) {
              console.error(`Error in approach 2: ${err}`);
            }
          }
          
          // If still not successful, try a third approach
          if (!attachedFile) {
            console.log(`Trying approach 3: Direct SDK-style API URL`);
            try {
              const response3 = await fetch(`https://api.openai.com/v1/assistant_files`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                  'OpenAI-Beta': 'assistants=v2'
                },
                body: JSON.stringify({
                  assistant_id: assistantId,
                  file_id: uploadedFile.id
                })
              });
              
              console.log(`Approach 3 status: ${response3.status}`);
              if (response3.ok) {
                attachResponse = response3;
                attachedFile = await response3.json();
                successfulEndpoint = "Direct SDK-style API URL";
                console.log(`Approach 3 succeeded`);
              } else {
                console.log(`Approach 3 failed: ${await response3.text()}`);
              }
            } catch (err) {
              console.error(`Error in approach 3: ${err}`);
            }
          }
          
          if (attachedFile) {
            console.log(`File successfully attached using ${successfulEndpoint}: ${JSON.stringify(attachedFile)}`);
          } else {
            throw new Error(`All attachment attempts failed. See logs for details.`);
          }
          successfulAttachments.push(uploadedFile.id);
        } catch (attachError) {
          console.error(`Error attaching file: ${attachError}`);
          throw new Error(`Failed to attach file: ${attachError instanceof Error ? attachError.message : 'Unknown error'}`);
        }
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
      
      // Try both possible endpoints for listing files
      let listData = null;
      
      // Try the standard /files endpoint first
      try {
        console.log(`Trying standard /files endpoint for listing`);
        const listResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantId}/files`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2'
          }
        });
        
        if (listResponse.ok) {
          listData = await listResponse.json();
          console.log(`Successfully listed files with standard endpoint`);
        } else {
          console.log(`Standard endpoint failed: ${await listResponse.text()}`);
        }
      } catch (error) {
        console.error(`Error with standard endpoint: ${error}`);
      }
      
      // If the first approach failed, try the direct API style endpoint
      if (!listData) {
        try {
          console.log(`Trying direct API style endpoint for listing`);
          const listResponse = await fetch(`https://api.openai.com/v1/assistant_files?assistant_id=${assistantId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'OpenAI-Beta': 'assistants=v2'
            }
          });
          
          if (listResponse.ok) {
            listData = await listResponse.json();
            console.log(`Successfully listed files with direct API style endpoint`);
          } else {
            console.log(`Direct API style endpoint failed: ${await listResponse.text()}`);
          }
        } catch (error) {
          console.error(`Error with direct API style endpoint: ${error}`);
        }
      }
      
      if (listData) {
        assistantFiles = listData.data || [];
        console.log(`Assistant has ${assistantFiles.length} files attached`);
      } else {
        console.log(`All attempts to list files failed`);
      }
    } catch (err) {
      console.error(`Error listing files: ${err}`);
    }
    
    return NextResponse.json({
      success: successfulAttachments.length > 0,
      message: `New assistant created with ${successfulAttachments.length} files attached`,
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