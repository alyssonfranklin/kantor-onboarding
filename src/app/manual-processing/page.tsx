// src/app/manual-processing/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, FileText, Users, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import PasswordProtection from '@/components/PasswordProtection';

interface Company {
  _id: string;
  company_id: string;
  name: string;
  assistant_id?: string;
  status: string;
}

interface VectorStoreFile {
  id: string;
  filename: string;
  created_at: number;
  bytes: number;
  status: string;
}

interface ProcessingResult {
  fileId: string;
  filename: string;
  emailsExtracted: number;
  usersUpdated: number;
  success: boolean;
  error?: string;
}

export default function ManualProcessingPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [vectorStoreFiles, setVectorStoreFiles] = useState<VectorStoreFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResults, setProcessingResults] = useState<ProcessingResult[]>([]);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  // Initialize and get authentication token
  useEffect(() => {
    const initializeAndLogin = async () => {
      try {
        // Initialize database
        const initResponse = await fetch('/api/v1/admin/initialize-db', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        // Login to get token
        const loginResponse = await fetch('/api/v1/verify-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password: 'admin123'
          })
        });
        
        const loginData = await loginResponse.json();
        if (loginData.token) {
          setToken(loginData.token);
        } else {
          setError('Failed to authenticate');
        }
      } catch (err) {
        setError('Failed to initialize');
      }
    };
    
    initializeAndLogin();
  }, []);

  // Load companies when token is available
  useEffect(() => {
    if (!token) return;
    loadCompanies();
  }, [token]);

  const loadCompanies = async () => {
    if (!token) return;
    
    setIsLoadingCompanies(true);
    setError('');
    
    try {
      const response = await fetch('/api/v1/companies', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load companies');
      }
      
      const result = await response.json();
      if (result.success) {
        setCompanies(result.data || []);
      } else {
        setError('Failed to fetch companies');
      }
    } catch (error) {
      setError(`Failed to load companies: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  const loadVectorStoreFiles = async (companyId: string) => {
    if (!token) return;
    
    setIsLoadingFiles(true);
    setError('');
    setVectorStoreFiles([]);
    setSelectedFiles(new Set());
    
    try {
      const response = await fetch(`/api/vector-store-files?companyId=${companyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load vector store files');
      }
      
      const data = await response.json();
      if (data.success) {
        setVectorStoreFiles(data.files || []);
      } else {
        setError(data.message || 'Failed to load files');
      }
    } catch (error) {
      setError(`Failed to load files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleCompanySelect = (companyId: string) => {
    setSelectedCompany(companyId);
    if (companyId) {
      loadVectorStoreFiles(companyId);
    } else {
      setVectorStoreFiles([]);
      setSelectedFiles(new Set());
    }
  };

  const toggleFileSelection = (fileId: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }
    setSelectedFiles(newSelection);
  };

  const selectAllFiles = () => {
    if (selectedFiles.size === vectorStoreFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(vectorStoreFiles.map(f => f.id)));
    }
  };

  const processSelectedFiles = async () => {
    if (!token || !selectedCompany || selectedFiles.size === 0) {
      setError('Please select a company and at least one file');
      return;
    }

    setIsProcessing(true);
    setError('');
    setProcessingResults([]);

    try {
      const response = await fetch('/api/process-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          companyId: selectedCompany,
          fileIds: Array.from(selectedFiles)
        })
      });

      if (!response.ok) {
        throw new Error('Processing failed');
      }

      const data = await response.json();
      if (data.success) {
        setProcessingResults(data.results || []);
        // Reset selections after successful processing
        setSelectedFiles(new Set());
      } else {
        setError(data.message || 'Processing failed');
      }
    } catch (error) {
      setError(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return (
    <PasswordProtection>
      <main className="min-h-screen bg-gray-800 py-8 px-4">
        <div className="max-w-6xl mx-auto mb-6">
          <Link href="/" className="text-white hover:text-gray-300 flex items-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Home
          </Link>

          <Card className="bg-gray-800 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Users className="mr-2" />
                Manual Contact Processing
              </CardTitle>
              <p className="text-gray-400 text-sm">
                Select a company and files to extract contacts and update user records.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Company Selection */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Select Company
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedCompany}
                    onChange={(e) => handleCompanySelect(e.target.value)}
                    className="flex-1 p-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:border-blue-500"
                    disabled={isLoadingCompanies}
                  >
                    <option value="">-- Select a company --</option>
                    {companies.map((company) => (
                      <option key={company._id} value={company.company_id}>
                        {company.name} ({company.status})
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={loadCompanies}
                    disabled={isLoadingCompanies}
                    variant="outline"
                    className="border-gray-600"
                  >
                    {isLoadingCompanies ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
                  </Button>
                </div>
              </div>

              {/* Files Selection */}
              {selectedCompany && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-white font-medium">
                      Vector Store Files ({vectorStoreFiles.length})
                    </label>
                    {vectorStoreFiles.length > 0 && (
                      <Button
                        onClick={selectAllFiles}
                        variant="outline"
                        size="sm"
                        className="border-gray-600"
                      >
                        {selectedFiles.size === vectorStoreFiles.length ? 'Deselect All' : 'Select All'}
                      </Button>
                    )}
                  </div>

                  {isLoadingFiles ? (
                    <div className="flex items-center justify-center p-8 bg-gray-700 rounded-md">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-400 mr-2" />
                      <span className="text-white">Loading files...</span>
                    </div>
                  ) : vectorStoreFiles.length === 0 ? (
                    <div className="p-8 bg-gray-700 rounded-md text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-400">No files found in vector store</p>
                    </div>
                  ) : (
                    <div className="bg-gray-700 rounded-md max-h-96 overflow-y-auto">
                      {vectorStoreFiles.map((file) => (
                        <div
                          key={file.id}
                          className={`p-3 border-b border-gray-600 last:border-b-0 flex items-center justify-between hover:bg-gray-600 cursor-pointer ${
                            selectedFiles.has(file.id) ? 'bg-blue-900/30' : ''
                          }`}
                          onClick={() => toggleFileSelection(file.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedFiles.has(file.id)}
                              onChange={() => toggleFileSelection(file.id)}
                              className="rounded"
                            />
                            <FileText className="h-5 w-5 text-blue-400" />
                            <div>
                              <p className="text-white font-medium">{file.filename}</p>
                              <p className="text-gray-400 text-sm">
                                {formatFileSize(file.bytes)} • {formatDate(file.created_at)} • {file.status}
                              </p>
                            </div>
                          </div>
                          <div className="text-gray-400 text-sm">
                            {file.id}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedFiles.size > 0 && (
                    <div className="mt-4 p-3 bg-blue-900/30 border border-blue-600 rounded-md">
                      <p className="text-blue-300 text-sm">
                        {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} selected for processing
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Process Button */}
              {selectedFiles.size > 0 && (
                <Button
                  onClick={processSelectedFiles}
                  disabled={isProcessing}
                  className="w-full bg-[#E62E05] hover:bg-[#E62E05]/90"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''}...
                    </>
                  ) : (
                    `Process ${selectedFiles.size} Selected File${selectedFiles.size !== 1 ? 's' : ''}`
                  )}
                </Button>
              )}

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Processing Results */}
              {processingResults.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-white font-medium mb-3">Processing Results</h3>
                  <div className="space-y-2">
                    {processingResults.map((result, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-md border ${
                          result.success 
                            ? 'bg-green-900/30 border-green-600' 
                            : 'bg-red-900/30 border-red-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {result.success ? (
                              <CheckCircle className="h-5 w-5 text-green-400" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-400" />
                            )}
                            <span className="text-white font-medium">{result.filename}</span>
                          </div>
                          <div className="text-sm">
                            {result.success ? (
                              <span className="text-green-300">
                                {result.emailsExtracted} emails → {result.usersUpdated} users updated
                              </span>
                            ) : (
                              <span className="text-red-300">Failed</span>
                            )}
                          </div>
                        </div>
                        {result.error && (
                          <p className="text-red-300 text-sm mt-1">{result.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      </main>
    </PasswordProtection>
  );
}