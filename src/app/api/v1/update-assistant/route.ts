// src/app/api/v1/update-assistant/route.ts
import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import Company from '@/lib/mongodb/models/company.model';
import UsageLog from '@/lib/mongodb/models/usage-log.model';
import { COMPANY_STATUS } from '@/lib/utils/usage-log-helper';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { instructions, assistantId, company_id } = await req.json();
    
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
    
    // Log company status if company_id is provided or can be found
    let resolvedCompanyId = company_id;
    
    // If company_id not provided, try to find it by assistant_id
    if (!resolvedCompanyId && assistantId) {
      try {
        await dbConnect();
        const company = await Company.findOne({ assistant_id: assistantId });
        if (company) {
          resolvedCompanyId = company.company_id;
        }
      } catch (error) {
        console.error('Error finding company by assistant_id:', error);
      }
    }
    
    // Log usage status if we have a company_id
    if (resolvedCompanyId) {
      try {
        await dbConnect();
        const usageId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await UsageLog.create({
          usage_id: usageId,
          company_id: resolvedCompanyId,
          last_status_id: COMPANY_STATUS.ONBOARDING_COMPLETED,
          datetime: new Date()
        });
        
        console.log('Onboarding completion status logged successfully');
      } catch (error) {
        console.error('Failed to log onboarding completion status:', error);
        // Don't fail the main operation if logging fails
      }
    }
    
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