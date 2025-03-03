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

    // Test direct API access with different versions/headers
    try {
      console.log("STEP 1: Testing various API configurations to find what works");
      
      // Try v1 without beta header
      const test1 = await fetch(`https://api.openai.com/v1/assistants/${assistantId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      });
      console.log(`Test 1 (v1, no beta header): Status ${test1.status}`);
      if (test1.ok) {
        console.log("CONFIGURATION 1 WORKS: v1 endpoint without beta header");
      }
      
      // Try v1 with v1 beta header
      const test2 = await fetch(`https://api.openai.com/v1/assistants/${assistantId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v1'
        }
      });
      console.log(`Test 2 (v1, v1 beta header): Status ${test2.status}`);
      if (test2.ok) {
        console.log("CONFIGURATION 2 WORKS: v1 endpoint with v1 beta header");
      }
      
      // Try v1 with v2 beta header
      const test3 = await fetch(`https://api.openai.com/v1/assistants/${assistantId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });
      console.log(`Test 3 (v1, v2 beta header): Status ${test3.status}`);
      if (test3.ok) {
        console.log("CONFIGURATION 3 WORKS: v1 endpoint with v2 beta header");
      }
    } catch (e) {
      console.error("Error during API testing:", e);
    }
    
    // Upload files and attach them to the assistant using the approach that works
    const fileIds: string[] = [];
    const fileErrors: FileError[] = [];
    
    for (const file of files) {
      try {
        // Upload the file - this part works with v1 endpoint
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
        
        // Try attaching file WITHOUT any beta header
        console.log(`ATTEMPT 1: Attaching file ${uploadedFile.id} to assistant ${assistantId} WITHOUT beta header`);
        
        const attachResponse1 = await fetch(`https://api.openai.com/v1/assistants/${assistantId}/files`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({ file_id: uploadedFile.id })
        });
        
        console.log(`Attachment response 1 status: ${attachResponse1.status}`);
        const attachResponseText1 = await attachResponse1.text();
        console.log(`Attachment response 1 body: ${attachResponseText1}`);
        
        if (attachResponse1.ok) {
          console.log("ATTACHMENT METHOD 1 WORKED: No beta header");
          continue; // Skip to next file since this worked
        }
        
        // If first attempt failed, try with v1 beta header
        console.log(`ATTEMPT 2: Attaching file ${uploadedFile.id} to assistant ${assistantId} with v1 beta header`);
        
        const attachResponse2 = await fetch(`https://api.openai.com/v1/assistants/${assistantId}/files`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v1'
          },
          body: JSON.stringify({ file_id: uploadedFile.id })
        });
        
        console.log(`Attachment response 2 status: ${attachResponse2.status}`);
        const attachResponseText2 = await attachResponse2.text();
        console.log(`Attachment response 2 body: ${attachResponseText2}`);
        
        if (attachResponse2.ok) {
          console.log("ATTACHMENT METHOD 2 WORKED: v1 beta header");
          continue; // Skip to next file since this worked
        }
        
        // Last attempt with v2.0.0-beta as suggested by https://beta.openai.com/docs/api-reference/assistants
        console.log(`ATTEMPT 3: Attaching file ${uploadedFile.id} to assistant ${assistantId} with v2.0.0-beta header`);
        
        const attachResponse3 = await fetch(`https://api.openai.com/v1/assistants/${assistantId}/files`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2.0.0-beta'
          },
          body: JSON.stringify({ file_id: uploadedFile.id })
        });
        
        console.log(`Attachment response 3 status: ${attachResponse3.status}`);
        const attachResponseText3 = await attachResponse3.text();
        console.log(`Attachment response 3 body: ${attachResponseText3}`);
        
        if (attachResponse3.ok) {
          console.log("ATTACHMENT METHOD 3 WORKED: v2.0.0-beta header");
        } else {
          throw new Error(`Failed to attach file after 3 attempts`);
        }
        
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        fileErrors.push({
          fileName: file.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return NextResponse.json({
      success: fileIds.length > 0 && fileErrors.length === 0,
      message: fileIds.length > 0 
        ? `${fileIds.length} files uploaded successfully` 
        : 'No files were successfully processed',
      assistantId,
      fileIds,
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