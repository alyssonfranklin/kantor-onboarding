// src/app/api/check-assistant/route.ts
import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const assistantId = url.searchParams.get('id');
  
  if (!assistantId) {
    return NextResponse.json({ error: 'Assistant ID is required' }, { status: 400 });
  }
  
  try {
    console.log(`Checking assistant: ${assistantId}`);
    
    // Retrieve the assistant data
    const assistant = await openai.beta.assistants.retrieve(assistantId);
    
    // Get the tool types
    const tools = assistant.tools || [];
    const toolTypes = tools.map(tool => tool.type);
    
    return NextResponse.json({
      id: assistant.id,
      name: assistant.name,
      model: assistant.model,
      toolTypes,
      tools
    });
  } catch (error) {
    console.error('Error checking assistant:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}