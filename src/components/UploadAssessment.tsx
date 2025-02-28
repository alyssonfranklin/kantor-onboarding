// src/components/UploadAssessment.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, X } from 'lucide-react';
import { PromptTokenizer } from '@/lib/tokenizer';

const COST_PER_1K_TOKENS = 0.0037;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const MAX_FILES = 10;

const tokenizer = new PromptTokenizer();

const UploadAssessment = () => {
  const [assistantId, setAssistantId] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);
  const [fileContents, setFileContents] = useState<string[]>([]);

  // Calculate tokens whenever file contents change
  useEffect(() => {
    const calculateTokens = async () => {
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
    const readFileContents = async () => {
      const contents: string[] = [];
      
      for (const file of files) {
        try {
          // Only process text files for token calculation
          if (file.type.startsWith('text/') || 
              file.type === 'application/pdf' || 
              file.type === 'application/msword' || 
              file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            
            const text = await readFileAsText(file);
            contents.push(text);
          }
        } catch (error) {
          console.error('Error reading file:', error);
        }
      }
      
      setFileContents(contents);
    };

    readFileContents();
  }, [files]);

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validate file size
    const oversizedFiles = selectedFiles.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      setError(`Some files exceed the 5MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }
    
    // Validate file count
    if (files.length + selectedFiles.length > MAX_FILES) {
      setError(`You can only upload up to ${MAX_FILES} files.`);
      return;
    }
    
    setError('');
    setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
    
    // Reset file input
    if (e.target) {
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    setFileContents(prevContents => prevContents.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!assistantId) {
      setError('Assistant ID is required');
      return;
    }
    
    if (files.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setSuccess(false);
    
    try {
      const formData = new FormData();
      formData.append('assistantId', assistantId);
      
      files.forEach(file => {
        formData.append('files', file);
      });
      
      const response = await fetch('/api/upload-files', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload files');
      }
      
      const data = await response.json();
      
      setSuccess(true);
      setFiles([]);
      setFileContents([]);
      setTokenCount(0);
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.message || 'An error occurred during upload');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Card className="max-w-4xl mx-auto bg-gray-800">
      <CardHeader className="space-y-1">
        <CardTitle className="text-white">Upload Assessment Files</CardTitle>
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
            <label htmlFor="assistantId" className="block font-bold text-white mb-2">
              Assistant ID
            </label>
            <input
              type="text"
              id="assistantId"
              value={assistantId}
              onChange={(e) => setAssistantId(e.target.value)}
              className="w-full p-2 border rounded-md mb-4 text-black placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
              placeholder="Enter OpenAI Assistant ID"
            />
          </div>
          
          <div>
            <label className="block font-bold text-white mb-2">
              Upload Files (Max 10 files, 5MB each)
            </label>
            <div className="border-2 border-dashed border-gray-600 rounded-md p-6 text-center cursor-pointer hover:border-gray-400 transition-colors">
              <input
                type="file"
                id="fileUpload"
                onChange={handleFileChange}
                className="hidden"
                multiple
              />
              <label htmlFor="fileUpload" className="cursor-pointer flex flex-col items-center">
                <Upload className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-white mb-1">Click to browse files</p>
                <p className="text-sm text-gray-400">or drag and drop files here</p>
              </label>
            </div>
          </div>
          
          {files.length > 0 && (
            <div className="mt-4">
              <h3 className="text-white font-medium mb-2">Selected Files:</h3>
              <ul className="space-y-2">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center justify-between bg-gray-700 p-2 rounded-md">
                    <div className="flex items-center text-white overflow-hidden">
                      <span className="truncate max-w-md">{file.name}</span>
                      <span className="ml-2 text-sm text-gray-400">({formatFileSize(file.size)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert>
              <AlertDescription>
                Files successfully uploaded and added to the assistant.
              </AlertDescription>
            </Alert>
          )}
          
          <Button 
            type="submit" 
            className="w-full font-bold bg-[#E62E05] hover:bg-[#E62E05]/90"
            disabled={isSubmitting || files.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading Files...
              </>
            ) : (
              'Upload Files'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default UploadAssessment;