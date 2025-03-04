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

    // Verify assistant exists
    try {
      console.log(`Verifying assistant ID: ${assistantId}`);
      const assistantResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantId}`, {
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
      
      // Check if file_search is enabled
      const hasFileSearch = assistant.tools?.some((tool: { type: string }) => tool.type === 'file_search');
      if (!hasFileSearch) {
        console.log('Warning: This assistant does not have file_search enabled. Files might not be searchable.');
      }
    } catch (error) {
      console.error('Error verifying assistant:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to verify assistant.' },
        { status: 400 }
      );
    }
    
    // Upload files and try multiple attachment approaches
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
        
        // Wait for file processing
        console.log('Waiting for file to be processed...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Try all possible API endpoint combinations
        let attachmentSuccess = false;
        
        // Attempt 1: v1 endpoint with v2 header (previous attempt)
        console.log(`Attempt 1: Attaching file to v1 endpoint with v2 header`);
        try {
          const attachResponse1 = await fetch(`https://api.openai.com/v1/assistants/${assistantId}/files`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'OpenAI-Beta': 'assistants=v2'
            },
            body: JSON.stringify({
              file_id: uploadedFile.id
            })
          });
          
          if (attachResponse1.ok) {
            const attachData = await attachResponse1.json();
            console.log(`Attempt 1 succeeded: ${JSON.stringify(attachData)}`);
            attachmentSuccess = true;
            successfulAttachments.push(uploadedFile.id);
          } else {
            console.log(`Attempt 1 failed: ${await attachResponse1.text()}`);
          }
        } catch (err) {
          console.error(`Error in attempt 1: ${err}`);
        }
        
        // Attempt 2: v2 endpoint with v2 header
        if (!attachmentSuccess) {
          console.log(`Attempt 2: Attaching file to v2 endpoint with v2 header`);
          try {
            const attachResponse2 = await fetch(`https://api.openai.com/v2/assistants/${assistantId}/files`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'OpenAI-Beta': 'assistants=v2'
              },
              body: JSON.stringify({
                file_id: uploadedFile.id
              })
            });
            
            if (attachResponse2.ok) {
              const attachData = await attachResponse2.json();
              console.log(`Attempt 2 succeeded: ${JSON.stringify(attachData)}`);
              attachmentSuccess = true;
              successfulAttachments.push(uploadedFile.id);
            } else {
              console.log(`Attempt 2 failed: ${await attachResponse2.text()}`);
            }
          } catch (err) {
            console.error(`Error in attempt 2: ${err}`);
          }
        }
        
        // Attempt 3: v1 endpoint without beta header
        if (!attachmentSuccess) {
          console.log(`Attempt 3: Attaching file to v1 endpoint without beta header`);
          try {
            const attachResponse3 = await fetch(`https://api.openai.com/v1/assistants/${assistantId}/files`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
              },
              body: JSON.stringify({
                file_id: uploadedFile.id
              })
            });
            
            if (attachResponse3.ok) {
              const attachData = await attachResponse3.json();
              console.log(`Attempt 3 succeeded: ${JSON.stringify(attachData)}`);
              attachmentSuccess = true;
              successfulAttachments.push(uploadedFile.id);
            } else {
              console.log(`Attempt 3 failed: ${await attachResponse3.text()}`);
            }
          } catch (err) {
            console.error(`Error in attempt 3: ${err}`);
          }
        }
        
        // Attempt 4: v1 endpoint with custom beta header
        if (!attachmentSuccess) {
          console.log(`Attempt 4: Attaching file with custom beta header`);
          try {
            const attachResponse4 = await fetch(`https://api.openai.com/v1/assistants/${assistantId}/files`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'OpenAI-Beta': 'assistants=v1'  // Try v1 beta header
              },
              body: JSON.stringify({
                file_id: uploadedFile.id
              })
            });
            
            if (attachResponse4.ok) {
              const attachData = await attachResponse4.json();
              console.log(`Attempt 4 succeeded: ${JSON.stringify(attachData)}`);
              attachmentSuccess = true;
              successfulAttachments.push(uploadedFile.id);
            } else {
              console.log(`Attempt 4 failed: ${await attachResponse4.text()}`);
            }
          } catch (err) {
            console.error(`Error in attempt 4: ${err}`);
          }
        }
        
        if (!attachmentSuccess) {
          throw new Error('All attachment attempts failed. See logs for details.');
        }
        
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        fileErrors.push({
          fileName: file.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Get list of files attached to the assistant
    let assistantFiles = [];
    try {
      console.log(`Checking files attached to assistant ${assistantId}...`);
      const listResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantId}/files`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });
      
      if (listResponse.ok) {
        const listData = await listResponse.json();
        assistantFiles = listData.data || [];
        console.log(`Assistant has ${assistantFiles.length} files attached`);
      } else {
        console.log(`Failed to list files: ${await listResponse.text()}`);
      }
    } catch (err) {
      console.error(`Error listing files: ${err}`);
    }
    
    return NextResponse.json({
      success: successfulAttachments.length > 0,
      message: successfulAttachments.length > 0 
        ? `${successfulAttachments.length} files uploaded and attached successfully` 
        : 'No files were successfully attached',
      assistantId,
      fileIds,
      successfulAttachments,
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