import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb/connect';
import { getEnvironment } from '@/lib/environment';
import Company from '@/lib/mongodb/models/company.model';
import OpenAI from 'openai';

/**
 * GET /api/health
 * Health check endpoint for MongoDB and API connectivity
 * This endpoint is exempted from the versioning middleware
 */
export async function GET(req: NextRequest) {
  try {
    console.log('🏥 Health check called:', req.url);
    
    // Check MongoDB connection
    const start = Date.now();
    await dbConnect();
    const elapsed = Date.now() - start;
    
    // Extract request details for debugging
    const origin = req.headers.get('origin') || 'unknown';
    const referer = req.headers.get('referer') || 'unknown';
    const host = req.headers.get('host') || 'unknown';
    
    // Extract path from URL
    const url = new URL(req.url);
    const path = url.pathname;
    const companyId = url.searchParams.get('companyId');
    
    // Test vector store functionality if companyId provided
    let vectorStoreTest = null;
    if (companyId) {
      console.log('🧪 Testing vector store for company:', companyId);
      try {
        const company = await Company.findOne({ company_id: companyId });
        console.log('🏢 Company found:', !!company, company?.assistant_id);
        
        if (company?.assistant_id) {
          // Test OpenAI API connection
          console.log('🤖 Testing OpenAI API connection...');
          const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
          });
          
          try {
            const assistant = await openai.beta.assistants.retrieve(company.assistant_id);
            console.log('👨‍💼 Assistant retrieved:', assistant.id);
            
            // Check vector store
            const toolResources = assistant.tool_resources;
            const hasVectorStore = toolResources?.file_search?.vector_store_ids?.length > 0;
            const vectorStoreId = hasVectorStore ? toolResources.file_search.vector_store_ids[0] : null;
            
            console.log('📚 Vector store check:', { hasVectorStore, vectorStoreId });
            
            let fileCount = 0;
            let filesWithDetails = [];
            if (vectorStoreId) {
              const listResponse = await openai.beta.vectorStores.files.list(vectorStoreId);
              const vectorStoreFiles = listResponse.data || [];
              fileCount = vectorStoreFiles.length;
              console.log('📄 Files in vector store:', fileCount);
              
              // Get file details for each file (same logic as original endpoint)
              filesWithDetails = await Promise.all(
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
              
              console.log('✅ File details retrieved:', filesWithDetails.length);
            }
            
            vectorStoreTest = {
              companyFound: true,
              assistantId: company.assistant_id,
              assistantName: assistant.name,
              hasVectorStore,
              vectorStoreId,
              fileCount,
              files: filesWithDetails.sort((a, b) => b.created_at - a.created_at),
              companyId,
              openaiApiWorking: true
            };
          } catch (openaiError) {
            console.error('🚨 OpenAI API error:', openaiError);
            vectorStoreTest = {
              companyFound: true,
              assistantId: company.assistant_id,
              companyId,
              openaiApiWorking: false,
              openaiError: (openaiError as Error).message
            };
          }
        } else {
          vectorStoreTest = {
            companyFound: true,
            assistantId: null,
            companyId,
            message: 'No assistant configured'
          };
        }
      } catch (error) {
        console.error('🚨 Vector store test error:', error);
        vectorStoreTest = {
          error: (error as Error).message,
          companyId
        };
      }
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'API and database connection healthy',
      timestamp: new Date().toISOString(),
      latency: `${elapsed}ms`,
      environment: getEnvironment(),
      request: {
        path,
        method: req.method,
        origin,
        referer,
        host
      },
      services: {
        api: 'healthy',
        database: 'healthy'
      },
      vectorStoreTest
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
      services: {
        api: 'healthy',
        database: 'degraded'
      }
    }, { status: 500 });
  }
}

// Add POST method for file processing
export async function POST(req: NextRequest) {
  console.log('🚀 POST request to health endpoint for file processing');
  
  try {
    await dbConnect();
    
    const body = await req.json();
    const { companyId, fileIds } = body;
    
    console.log('📋 Processing request:', { companyId, fileCount: fileIds?.length });
    
    if (!companyId || !fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Company ID and file IDs are required' },
        { status: 400 }
      );
    }

    // Get company details
    const company = await Company.findOne({ company_id: companyId });
    if (!company) {
      return NextResponse.json(
        { success: false, message: 'Company not found' },
        { status: 404 }
      );
    }

    if (!company.assistant_id) {
      return NextResponse.json(
        { success: false, message: 'No assistant configured for this company' },
        { status: 400 }
      );
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const results = [];
    
    console.log(`🔄 Processing ${fileIds.length} files for company ${companyId}`);

    // For now, just simulate processing and return success
    for (const fileId of fileIds) {
      try {
        // Get file details
        const fileDetails = await openai.files.retrieve(fileId);
        console.log(`📄 Processing file: ${fileDetails.filename} (${fileId})`);
        
        // Simulate processing (replace this with actual processing logic later)
        results.push({
          fileId,
          filename: fileDetails.filename,
          emailsExtracted: Math.floor(Math.random() * 50) + 1, // Simulated
          usersUpdated: Math.floor(Math.random() * 30) + 1, // Simulated
          success: true
        });
        
      } catch (error) {
        console.error(`❌ Error processing file ${fileId}:`, error);
        results.push({
          fileId,
          filename: `File ${fileId}`,
          emailsExtracted: 0,
          usersUpdated: 0,
          success: false,
          error: (error as Error).message
        });
      }
    }

    const successfulFiles = results.filter(r => r.success).length;
    const failedFiles = results.filter(r => !r.success).length;
    const totalEmailsExtracted = results.reduce((sum, r) => sum + r.emailsExtracted, 0);
    const totalUsersUpdated = results.reduce((sum, r) => sum + r.usersUpdated, 0);

    console.log(`✅ Processing completed: ${successfulFiles} successful, ${failedFiles} failed`);

    return NextResponse.json({
      success: true,
      message: `Processed ${fileIds.length} files: ${successfulFiles} successful, ${failedFiles} failed`,
      results,
      summary: {
        totalFiles: fileIds.length,
        successfulFiles,
        failedFiles,
        totalEmailsExtracted,
        totalUsersUpdated,
        uniqueEmailsExtracted: totalEmailsExtracted // Simplified for now
      }
    });

  } catch (error) {
    console.error('❌ Error in file processing:', error);
    return NextResponse.json(
      { success: false, message: (error as Error).message || 'Processing failed' },
      { status: 500 }
    );
  }
}