// src/lib/fileProcessor.ts

export interface ProcessedFileResult {
  text: string;
  success: boolean;
  error?: string;
  metadata?: {
    pages?: number;
    wordCount?: number;
  };
}

export class FileProcessor {
  
  /**
   * Process a file buffer and extract text content based on file type
   */
  static async processFileBuffer(buffer: Buffer, fileName: string, mimeType: string): Promise<ProcessedFileResult> {
    try {
      const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
      
      switch (fileExtension) {
        case '.pdf':
          return await this.processPDFBuffer(buffer);
        
        case '.doc':
        case '.docx':
          return await this.processWordBuffer(buffer);
        
        case '.txt':
        case '.md':
        case '.html':
        case '.htm':
        case '.xml':
        case '.json':
        case '.yaml':
        case '.yml':
          return await this.processTextBuffer(buffer);
        
        case '.csv':
          return await this.processCSVBuffer(buffer);
        
        case '.xls':
        case '.xlsx':
          return await this.processExcelBuffer(buffer);
        
        case '.ppt':
        case '.pptx':
          return {
            text: '',
            success: false,
            error: 'PowerPoint processing not yet implemented'
          };
        
        default:
          return {
            text: '',
            success: false,
            error: `Unsupported file type: ${fileExtension}`
          };
      }
    } catch (error) {
      return {
        text: '',
        success: false,
        error: `Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Process PDF buffer
   */
  private static async processPDFBuffer(buffer: Buffer): Promise<ProcessedFileResult> {
    try {
      const pdfParse = await import('pdf-parse').then(module => module.default);
      const data = await pdfParse(buffer);
      
      return {
        text: data.text,
        success: true,
        metadata: {
          pages: data.numpages,
          wordCount: data.text.split(/\s+/).length
        }
      };
    } catch (error) {
      return {
        text: '',
        success: false,
        error: `PDF processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Process Word documents buffer
   */
  private static async processWordBuffer(buffer: Buffer): Promise<ProcessedFileResult> {
    try {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      
      return {
        text: result.value,
        success: true,
        metadata: {
          wordCount: result.value.split(/\s+/).length
        }
      };
    } catch (error) {
      return {
        text: '',
        success: false,
        error: `Word document processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Process plain text buffer
   */
  private static async processTextBuffer(buffer: Buffer): Promise<ProcessedFileResult> {
    try {
      const text = buffer.toString('utf8');
      
      return {
        text,
        success: true,
        metadata: {
          wordCount: text.split(/\s+/).length
        }
      };
    } catch (error) {
      return {
        text: '',
        success: false,
        error: `Text file processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Process CSV buffer
   */
  private static async processCSVBuffer(buffer: Buffer): Promise<ProcessedFileResult> {
    try {
      const csvParse = await import('csv-parser').then(module => module.default);
      const { Readable } = await import('stream');
      
      const results: any[] = [];
      const stream = Readable.from(buffer);
      
      await new Promise<void>((resolve, reject) => {
        stream
          .pipe(csvParse())
          .on('data', (row: any) => {
            results.push(row);
          })
          .on('end', () => {
            resolve();
          })
          .on('error', (error: any) => {
            reject(error);
          });
      });

      const text = results.map(row => 
        Object.values(row).join(' ')
      ).join('\n');

      return {
        text,
        success: true,
        metadata: {
          wordCount: text.split(/\s+/).length
        }
      };
    } catch (error) {
      return {
        text: '',
        success: false,
        error: `CSV processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Process Excel buffer
   */
  private static async processExcelBuffer(buffer: Buffer): Promise<ProcessedFileResult> {
    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      let allText = '';

      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const csvData = XLSX.utils.sheet_to_csv(worksheet);
        allText += csvData + '\n';
      });

      return {
        text: allText,
        success: true,
        metadata: {
          wordCount: allText.split(/\s+/).length
        }
      };
    } catch (error) {
      return {
        text: '',
        success: false,
        error: `Excel processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}