// src/lib/fileProcessor.ts
import pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import * as csv from 'csv-parser';

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
   * Process a file and extract text content based on file type
   */
  static async processFile(filePath: string, fileName: string, mimeType: string): Promise<ProcessedFileResult> {
    try {
      const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
      
      switch (fileExtension) {
        case '.pdf':
          return await this.processPDF(filePath);
        
        case '.doc':
        case '.docx':
          return await this.processWord(filePath);
        
        case '.txt':
        case '.md':
        case '.html':
        case '.htm':
        case '.xml':
        case '.json':
        case '.yaml':
        case '.yml':
          return await this.processTextFile(filePath);
        
        case '.csv':
          return await this.processCSV(filePath);
        
        case '.xls':
        case '.xlsx':
          return await this.processExcel(filePath);
        
        case '.ppt':
        case '.pptx':
          // For now, we'll skip PowerPoint processing as it's complex
          // Can be added later with a dedicated library
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
   * Process PDF files
   */
  private static async processPDF(filePath: string): Promise<ProcessedFileResult> {
    try {
      const fs = require('fs');
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      
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
   * Process Word documents (.doc, .docx)
   */
  private static async processWord(filePath: string): Promise<ProcessedFileResult> {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      
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
   * Process plain text files
   */
  private static async processTextFile(filePath: string): Promise<ProcessedFileResult> {
    try {
      const fs = require('fs');
      const text = fs.readFileSync(filePath, 'utf8');
      
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
   * Process CSV files
   */
  private static async processCSV(filePath: string): Promise<ProcessedFileResult> {
    try {
      const results: any[] = [];
      const fs = require('fs');
      
      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
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

      // Convert CSV rows to text format for email extraction
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
   * Process Excel files (.xls, .xlsx)
   */
  private static async processExcel(filePath: string): Promise<ProcessedFileResult> {
    try {
      const workbook = XLSX.readFile(filePath);
      let allText = '';

      // Process all sheets
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