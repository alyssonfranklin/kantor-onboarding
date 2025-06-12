// src/app/api/v1/create-agent/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    const response = await fetch('https://api.openai.com/v1/assistants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        instructions: `You are a helpful assistant for ${name}. You are knowledgeable about the company and can help employees with various tasks.`,
        name: `${name} Assistant`,
        tools: [{ type: "file_search" }],
        model: "gpt-4o-mini"
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to create assistant' },
        { status: 500 }
      );
    }

    const assistantData = await response.json();
    
    return NextResponse.json({
      success: true,
      assistantId: assistantData.id,
      message: `Assistant created successfully for ${name}`
    });

  } catch (error) {
    console.error('Error creating assistant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}