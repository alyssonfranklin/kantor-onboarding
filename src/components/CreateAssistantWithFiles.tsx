// src/components/CreateAssistantWithFiles.tsx
"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, X, Info } from 'lucide-react';
import { PromptTokenizer } from '@/lib/tokenizer';

const COST_PER_1K_TOKENS = 0.0037;
const tokenizer = new PromptTokenizer();

// Define interface for the assistant response
interface AssistantData {
  id: string;
  name: string;
  model: string;
  instructions?: string;
  tools?: { type: string }[];
}

interface AssistantTool {
  type: string;
}

// Maximum file size in bytes (20MB)
const MAX_FILE_SIZE = 20 * 1024 * 1024;
// Valid file types
const VALID_FILE_TYPES = [
  'application/pdf', 
  'text/plain', 
  'text/markdown',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/json'
];

const CreateAssistantWithFiles = () => {
  const [assistantName, setAssistantName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdAssistant, setCreatedAssistant] = useState<AssistantData | null>(null);
  const [tokenCount, setTokenCount] = useState(0);
  const [fileContents, setFileContents] = useState<string[]>([]);

  // Debounce function to limit the frequency of function calls
  const debounce = useCallback((fn: () => void, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(), delay);
    };
  }, []);

  // Calculate tokens whenever file contents change
  useEffect(() => {
    const calculateTokens = () => {
      try {
        const combinedContent = fileContents.join(' ');
        const count = tokenizer.estimatePromptTokens(combinedContent);
        setTokenCount(count);
      } catch (error) {
        console.error('Error calculating tokens:', error);
      }
    };

    calculateTokens();
  }, [fileContents]);

  // Read file contents when files change
  useEffect(() => {
    // Use a more sophisticated approach to estimate tokens in files
    const readFileContents = async () => {
      const contents: string[] = [];
      let totalEstimatedTokens = 0;
      
      for (const file of files) {
        try {
          // Process different file types
          if (['text/plain', 'text/markdown', 'text/csv', 'application/json'].includes(file.type)) {
            // For text files, read the actual content
            const text = await file.text();
            contents.push(text);
            
            // Calculate tokens for this specific file
            const fileTokens = tokenizer.estimatePromptTokens(text);
            totalEstimatedTokens += fileTokens;
          } else {
            // For non-text files (PDF, DOCX, etc), use file size as a proxy
            // PDF/DOCX typically have ~100 tokens per KB after extraction (rough estimate)
            const estimatedTokens = Math.ceil(file.size / 1024 * 100);
            
            contents.push(`[Non-text file: ~${estimatedTokens} tokens]`);
            totalEstimatedTokens += estimatedTokens;
          }
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          // Still account for file in token count estimation
          const fallbackEstimate = Math.ceil(file.size / 1024 * 75); // Conservative estimate
          totalEstimatedTokens += fallbackEstimate;
        }
      }
      
      setFileContents(contents);
      
      // Update token count directly here for more accuracy with non-text files
      setTokenCount(totalEstimatedTokens);
    };

    // Debounce file content reading to avoid performance issues with large files
    const debouncedProcess = debounce(() => {
      if (files.length > 0) {
        readFileContents();
      } else {
        setFileContents([]);
        setTokenCount(0);
      }
    }, 300);

    debouncedProcess();
  }, [files, debounce]);

  // Memoize file validation function
  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" exceeds maximum size of 20MB`;
    }
    
    // Check file type
    if (!VALID_FILE_TYPES.includes(file.type)) {
      return `File "${file.name}" has unsupported format. Supported formats: PDF, text, markdown, CSV, DOCX, XLSX, JSON`;
    }
    
    return null;
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validate files before adding
    const invalidFiles = selectedFiles
      .map(file => validateFile(file))
      .filter(error => error !== null);
    
    if (invalidFiles.length > 0) {
      setError(invalidFiles.join('. '));
      // Reset file input
      if (e.target) {
        e.target.value = '';
      }
      return;
    }
    
    setError('');
    setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
    
    // Reset file input
    if (e.target) {
      e.target.value = '';
    }
  }, [validateFile]);

  const removeFile = useCallback((index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!files.length) {
      setError('Please select at least one file to upload');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setSuccess(false);
    setCreatedAssistant(null);

    try {
      const formData = new FormData();
      formData.append('assistantName', assistantName);
      
      // Batch files into formData
      files.forEach(file => {
        formData.append('files', file);
      });
      
      // Use AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      const response = await fetch('/api/v1/create-assistant-with-files', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create assistant');
      }
      
      setSuccess(true);
      setCreatedAssistant(responseData.assistant);
      
      // Clear form
      setFiles([]);
      setAssistantName('');
      
    } catch (error) {
      const err = error as Error;
      console.error('Creation error:', err);
      setError(err.message || 'An error occurred during creation');
    } finally {
      setIsSubmitting(false);
    }
  }, [assistantName, files]);

  // Memoize formatter to prevent recreation on each render
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }, []);

  // Calculate individual file token estimates
  const getFileTokenEstimate = useCallback((file: File): number => {
    if (['text/plain', 'text/markdown', 'text/csv', 'application/json'].includes(file.type)) {
      // Text-based files: roughly 1 token per 4 characters
      return Math.ceil(file.size * 0.25);
    } else {
      // For non-text files, use size-based heuristic
      return Math.ceil(file.size / 1024 * 100); // ~100 tokens per KB
    }
  }, []);

  // Memoize the file list to prevent unnecessary re-renders
  const fileList = useMemo(() => {
    if (files.length === 0) return null;
    
    return (
      <div className="mt-4">
        <h3 className="text-white font-medium mb-2">Selected Files:</h3>
        <ul className="space-y-2">
          {files.map((file, index) => {
            // Estimate tokens for this file
            const estimatedTokens = getFileTokenEstimate(file);
            const estimatedCost = ((estimatedTokens / 1000) * COST_PER_1K_TOKENS).toFixed(4);
            
            return (
              <li key={index} className="flex items-center justify-between bg-gray-700 p-2 rounded-md">
                <div className="flex flex-col">
                  <div className="flex items-center text-white overflow-hidden">
                    <span className="truncate max-w-md">{file.name}</span>
                    <span className="ml-2 text-sm text-gray-400">({formatFileSize(file.size)})</span>
                  </div>
                  <div className="mt-1 flex items-center text-sm text-gray-300">
                    <Info className="h-3.5 w-3.5 text-blue-400 mr-1" />
                    <span>Est. tokens: {estimatedTokens.toLocaleString()} (${estimatedCost})</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }, [files, formatFileSize, removeFile, getFileTokenEstimate]);

  // Memoize the assistant details component
  const assistantDetails = useMemo(() => {
    if (!success || !createdAssistant) return null;
    
    return (
      <Alert>
        <div className="space-y-2">
          <AlertDescription>
            Assistant successfully created with files attached!
          </AlertDescription>
          <div className="bg-gray-700 p-3 rounded-md mt-2">
            <div className="flex items-center mb-2">
              <Info className="h-5 w-5 text-blue-400 mr-2" />
              <h3 className="text-white font-medium">Assistant Details:</h3>
            </div>
            <div className="text-white text-sm space-y-1">
              <p><span className="font-semibold">ID:</span> {createdAssistant.id}</p>
              <p><span className="font-semibold">Name:</span> {createdAssistant.name}</p>
              <p><span className="font-semibold">Model:</span> {createdAssistant.model}</p>
              <p><span className="font-semibold">Tools:</span> {createdAssistant.tools?.map((t: AssistantTool) => t.type).join(', ')}</p>
            </div>
          </div>
        </div>
      </Alert>
    );
  }, [success, createdAssistant]);

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-gray-800">
        <CardHeader className="space-y-1">
          <CardTitle className="text-white">Create Assistant with Files</CardTitle>
          <div className="flex flex-wrap gap-4">
            <div className="text-white text-sm font-medium bg-gray-700 px-3 py-1 rounded-md inline-block">
              Total tokens: {tokenCount.toLocaleString()}
            </div>
            <div className="text-white text-sm font-medium bg-gray-700 px-3 py-1 rounded-md inline-block">
              Estimated cost: ${((tokenCount / 1000) * COST_PER_1K_TOKENS).toFixed(4)} USD
            </div>
          </div>
        </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="assistantName" className="block font-bold text-white mb-2">
              Assistant Name
            </label>
            <input
              type="text"
              id="assistantName"
              value={assistantName}
              onChange={(e) => setAssistantName(e.target.value)}
              className="w-full p-2 border rounded-md mb-4 text-black placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Knowledge Assistant"
            />
          </div>
          
          <div>
            <label className="block font-bold text-white mb-2">
              Upload Files (Max 20MB each)
            </label>
            <div className="border-2 border-dashed border-gray-600 rounded-md p-6 text-center cursor-pointer hover:border-gray-400 transition-colors">
              <input
                type="file"
                id="fileUpload"
                onChange={handleFileChange}
                className="hidden"
                multiple
                accept=".pdf,.txt,.md,.csv,.docx,.xlsx,.json,application/pdf,text/plain,text/markdown,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/json"
              />
              <label htmlFor="fileUpload" className="cursor-pointer flex flex-col items-center">
                <Upload className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-white mb-1">Click to browse files</p>
                <p className="text-sm text-gray-400">or drag and drop files here</p>
                <p className="text-xs text-gray-500 mt-2">Supported formats: PDF, TXT, MD, CSV, DOCX, XLSX, JSON</p>
              </label>
            </div>
          </div>
          
          {fileList}

          {files.length > 0 && (
            <div className="mt-2 p-3 bg-gray-700 rounded-md">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center">
                  <Info className="h-4 w-4 text-blue-400 mr-2" />
                  <span>Estimated Tokens:</span>
                </div>
                <div>
                  <span className="font-bold">{tokenCount.toLocaleString()}</span>
                  <span className="text-sm text-gray-400 ml-2">
                    (Est. Cost: ${((tokenCount / 1000) * COST_PER_1K_TOKENS).toFixed(4)})
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {assistantDetails}
          
          <Button 
            type="submit" 
            className="w-full font-bold bg-[#E62E05] hover:bg-[#E62E05]/90"
            disabled={isSubmitting || files.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Assistant...
              </>
            ) : (
              'Create Assistant'
            )}
          </Button>
        </form>
      </CardContent>
      </Card>
    </div>
  );
};

export default CreateAssistantWithFiles;