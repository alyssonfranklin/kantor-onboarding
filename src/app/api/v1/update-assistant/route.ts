// src/app/api/v1/update-assistant/route.ts
import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    const updatedAssistant = await openai.beta.assistants.update(assistantId, {
      instructions: instructions
    });
    
    return NextResponse.json({ 
      success: true, 
      assistantId: updatedAssistant.id,
      message: 'Assistant instructions updated successfully'
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error updating assistant:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update assistant' },
      { status: 500 }
    );
  }
}