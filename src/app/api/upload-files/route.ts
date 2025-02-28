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

// This helper function will save files to a temporary directory
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
      // First save the file to disk
      const filepath = await saveFileToDisk(file);
      
      // Then upload to OpenAI
      const uploadedFile = await openai.files.create({
        file: filepath,
        purpose: 'assistants',
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
  } catch (error: any) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload files' },
      { status: 500 }
    );
  }
}