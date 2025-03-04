// src/components/CreateAssistantWithFiles.tsx
"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, X, Info } from 'lucide-react';

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

const CreateAssistantWithFiles = () => {
  const [assistantName, setAssistantName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdAssistant, setCreatedAssistant] = useState<AssistantData | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
    
    // Reset file input
    if (e.target) {
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      
      files.forEach(file => {
        formData.append('files', file);
      });
      
      const response = await fetch('/api/create-assistant-with-files', {
        method: 'POST',
        body: formData,
      });
      
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
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Card className="max-w-4xl mx-auto bg-gray-800">
      <CardHeader className="space-y-1">
        <CardTitle className="text-white">Create Assistant with Files</CardTitle>
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
              Upload Files
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
          
          {success && createdAssistant && (
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
          )}
          
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
              'Create Assistant with Files'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateAssistantWithFiles;