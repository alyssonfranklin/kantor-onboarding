// src/app/api/upload-files/route.ts
import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// This helper function will save files to disk and return a buffer
async function saveAndReadFile(file: File): Promise<{ filepath: string, buffer: Buffer }> {
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
  
  // Optional: Save the file to disk
  // await writeFile(filepath, buffer);
  
  return { filepath, buffer };
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
      // Get the file data
      const { buffer } = await saveAndReadFile(file);
      
      // Upload directly using the buffer
      const uploadedFile = await openai.files.create({
        file: buffer,
        purpose: 'assistants',
        filename: file.name
      });
      
      fileIds.push(uploadedFile.id);
    }
    
    // Associate files with the assistant
    const attachments = [];
    for (const fileId of fileIds) {
      const attachment = await openai.beta.assistants.files.create(
        assistantId,
        { file_id: fileId }
      );
      attachments.push(attachment);
    }
    
    return NextResponse.json({
      success: true,
      message: `${fileIds.length} files uploaded successfully`,
      fileIds,
      attachments
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