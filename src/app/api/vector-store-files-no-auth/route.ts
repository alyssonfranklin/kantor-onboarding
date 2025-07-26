// Temporary version without auth for debugging
import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import Company from '@/lib/mongodb/models/company.model';
import OpenAI from 'openai';

export async function GET(req: NextRequest) {
  console.log('🔍 Vector store files (NO AUTH) API called:', req.url);
  
  try {
    await dbConnect();
    console.log('✅ Database connected');
    
    const url = new URL(req.url);
    const companyId = url.searchParams.get('companyId');
    console.log('📦 Company ID:', companyId);
    
    if (!companyId) {
      return NextResponse.json(
        { success: false, message: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Get company and its assistant
    const company = await Company.findOne({ company_id: companyId });
    console.log('🏢 Company found:', !!company, company?.assistant_id);
    
    if (!company) {
      return NextResponse.json(
        { success: false, message: 'Company not found' },
        { status: 404 }
      );
    }

    if (!company.assistant_id) {
      return NextResponse.json(
        { success: true, files: [], message: 'No assistant configured for this company' }
      );
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('🤖 OpenAI client initialized');

    // Get assistant details
    const assistant = await openai.beta.assistants.retrieve(company.assistant_id);
    console.log('👨‍💼 Assistant retrieved:', assistant.id);
    
    // Check if assistant has vector store
    const toolResources = assistant.tool_resources;
    if (!toolResources?.file_search?.vector_store_ids || toolResources.file_search.vector_store_ids.length === 0) {
      return NextResponse.json({
        success: true,
        files: [],
        message: 'No vector store found for this assistant'
      });
    }

    const vectorStoreId = toolResources.file_search.vector_store_ids[0];
    console.log('📚 Vector store ID:', vectorStoreId);

    // Get files from vector store
    const listResponse = await openai.beta.vectorStores.files.list(vectorStoreId);
    const vectorStoreFiles = listResponse.data || [];
    console.log('📄 Files found:', vectorStoreFiles.length);

    // Get file details for each file
    const filesWithDetails = await Promise.all(
      vectorStoreFiles.map(async (vectorFile) => {
        try {
          const fileDetails = await openai.files.retrieve(vectorFile.id);
          return {
            id: vectorFile.id,
            filename: fileDetails.filename,
            created_at: fileDetails.created_at,
            bytes: fileDetails.bytes,
            status: vectorFile.status,
            vectorStoreStatus: vectorFile.status
          };
        } catch (error) {
          console.error(`Error getting details for file ${vectorFile.id}:`, error);
          return {
            id: vectorFile.id,
            filename: `File ${vectorFile.id}`,
            created_at: Date.now() / 1000,
            bytes: 0,
            status: vectorFile.status,
            vectorStoreStatus: vectorFile.status
          };
        }
      })
    );

    console.log('✅ Returning files:', filesWithDetails.length);
    return NextResponse.json({
      success: true,
      files: filesWithDetails.sort((a, b) => b.created_at - a.created_at),
      vectorStoreId,
      assistantId: company.assistant_id
    });

  } catch (error) {
    console.error('🚨 Error fetching vector store files:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to fetch files' },
      { status: 500 }
    );
  }
}