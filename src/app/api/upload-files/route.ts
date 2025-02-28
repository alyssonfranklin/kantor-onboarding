// src/app/api/upload-files/route.ts
import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { createReadStream } from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// This helper function saves the file to disk and returns the filepath
async function saveFileToDisk(file: File): Promise<string> {
  // Create uploads directory if it doesn't exist
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }

  // Create a unique filename
  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const filepath = join(uploadsDir, filename);
  
  // Convert file to buffer and save to disk
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(filepath, buffer);
  
  return filepath;
}

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
    const fileIds = [];
    for (const file of files) {
      try {
        // First save the file to disk
        const filepath = await saveFileToDisk(file);
        
        // Create a read stream from the file
        const fileStream = createReadStream(filepath);
        
        // Upload to OpenAI using the file stream
        const uploadedFile = await openai.files.create({
          file: fileStream,
          purpose: 'assistants',
        });
        
        fileIds.push(uploadedFile.id);
      } catch (uploadError) {
        console.error('Error uploading file:', file.name, uploadError);
        throw new Error(`Failed to upload file ${file.name}: ${(uploadError as Error).message}`);
      }
    }
    
    // Just return success with the file IDs and skip the attachment step for now
    // The API is not matching the TypeScript definitions
    return NextResponse.json({
      success: true,
      message: `${fileIds.length} files uploaded successfully`,
      fileIds,
      note: 'Files were uploaded but not attached to the assistant due to API compatibility issues'
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error uploading files:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to upload files' },
      { status: 500 }
    );
  }
}