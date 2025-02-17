// src/app/api/update-assistant/route.ts
import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { instructions, assistantId } = await req.json();

    if (!instructions || !assistantId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update the assistant with new instructions
    const assistant = await openai.beta.assistants.update(
      assistantId,
      {
        instructions: instructions,
      }
    );

    return NextResponse.json({ success: true, assistant });
  } catch (error: any) {
    console.error('Error updating assistant:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update assistant' },
      { status: 500 }
    );
  }
}