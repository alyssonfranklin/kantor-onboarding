// src/app/api/create-agent/route.ts
import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Custom type to extend the OpenAI tool types
type ExtendedToolType = "function" | "code_interpreter" | "file_search" | "retrieval";

// Define the correct tool interface
interface AssistantTool {
  type: ExtendedToolType;
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    
    if (!name) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }
    
    // Create a new assistant with the company name
    // Using proper typing with our extended tool types
    const assistant = await openai.beta.assistants.create({
      name: `${name} Agent`,
      instructions: `You are the AI assistant for ${name}. Help users with their queries and provide information about ${name}.`,
      model: "gpt-3.5-turbo",
      tools: [{ type: "file_search" }] // Keep file_search for now
    });
    
    return NextResponse.json({ 
      success: true, 
      assistantId: assistant.id,
      assistantName: assistant.name 
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error creating assistant:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create assistant' },
      { status: 500 }
    );
  }
}