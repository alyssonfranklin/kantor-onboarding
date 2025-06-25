// src/app/api/update-assistant/route.ts
import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ErrorResponse {
  message: string;
  code?: string;
  type?: string;
}

export async function POST(req: Request) {
  try {
    const { instructions, assistantId } = await req.json();

    if (!instructions) {
      return NextResponse.json(
        { error: 'Instructions are required' },
        { status: 400 }
      );
    }
    
    if (!assistantId || assistantId === 'undefined') {
      return NextResponse.json(
        { error: 'Valid assistantId is required' },
        { status: 400 }
      );
    }

    // Update the assistant with new instructions
    const assistant = await openai.beta.assistants.update(
      assistantId,
      {
        instructions,
      }
    );

    return NextResponse.json({ success: true, assistant });
  } catch (error: unknown) {
    const errorResponse = error as ErrorResponse;
    console.error('Error updating assistant:', errorResponse);
    return NextResponse.json(
      { error: errorResponse.message || 'Failed to update assistant' },
      { status: 500 }
    );
  }
}