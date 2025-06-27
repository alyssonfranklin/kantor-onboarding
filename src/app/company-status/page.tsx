"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Circle } from 'lucide-react';
import Link from 'next/link';

interface StatusStep {
  statusId: string;
  name: string;
  description: string;
  step: number;
  completed: boolean;
  completedAt: string | null;
}

interface CompanyStatus {
  company: {
    company_id: string;
    name: string;
    status: string;
    created_at: string;
  };
  currentStatus: {
    name: string;
    description: string;
    step: number;
    statusId: string;
    lastUpdated: string;
  } | null;
  progress: {
    percentage: number;
    completedSteps: number;
    totalSteps: number;
    steps: StatusStep[];
  };
  statusHistory: Array<{
    statusId: string;
    name: string;
    description: string;
    datetime: string;
  }>;
}

export default function CompanyStatusPage() {
  const [companyStatus, setCompanyStatus] = useState<CompanyStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [isTestMode, setIsTestMode] = useState(false);

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
            email: 'admin@voxerion.com',
            password: 'admin123'
          }),
        });
        
        const loginData = await loginResponse.json();
        if (loginData.token) {
          setToken(loginData.token);
          setIsTestMode(true); // In test mode, we need to manually enter company ID
        } else {
          setError('Failed to authenticate');
        }
      } catch (err) {
        setError('Failed to initialize');
      }
    };
    
    initializeAndLogin();
  }, []);

  const fetchCompanyStatus = async (targetCompanyId?: string) => {
    if (!token) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const url = targetCompanyId 
        ? `/api/v1/company-status?companyId=${targetCompanyId}`
        : '/api/v1/company-status'; // Will use user's company_id from auth context
        
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setCompanyStatus(result.data);
      } else {
        setError(result.message || 'Failed to fetch company status');
      }
    } catch (err) {
      setError('Error fetching company status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (companyId.trim()) {
      fetchCompanyStatus(companyId.trim());
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (completed: boolean, isCurrent: boolean) => {
    if (completed) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (isCurrent) {
      return <Clock className="h-5 w-5 text-yellow-500" />;
    } else {
      return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-white hover:text-gray-300 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Home
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-white mb-8">Company Onboarding Status</h1>

        {/* Test Mode Input */}
        {isTestMode && !companyStatus && (
          <Card className="mb-6 bg-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Test Mode - Enter Company ID</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTestSubmit} className="flex gap-4">
                <input
                  type="text"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  placeholder="Enter company ID to check status"
                  className="flex-1 p-2 rounded-md border border-gray-700 bg-gray-800 text-white"
                  required
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Loading...' : 'Check Status'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert className="mb-6 bg-red-800 border-red-600">
            <AlertDescription className="text-white">{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && !isTestMode && (
          <div className="text-center py-8">
            <div className="text-white">Loading company status...</div>
          </div>
        )}

        {companyStatus && (
          <div className="space-y-6">
            {/* Company Information */}
            <Card className="bg-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Company Information</CardTitle>
              </CardHeader>
              <CardContent className="text-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold">Company Name</p>
                    <p className="text-gray-300">{companyStatus.company.name}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Company ID</p>
                    <p className="text-gray-300 font-mono text-sm">{companyStatus.company.company_id}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Status</p>
                    <p className="text-gray-300 capitalize">{companyStatus.company.status}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Created</p>
                    <p className="text-gray-300">{formatDate(companyStatus.company.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Status */}
            {companyStatus.currentStatus && (
              <Card className="bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Current Status</CardTitle>
                </CardHeader>
                <CardContent className="text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <div>
                      <h3 className="text-lg font-semibold">{companyStatus.currentStatus.name}</h3>
                      <p className="text-gray-300">{companyStatus.currentStatus.description}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">
                    Last updated: {formatDate(companyStatus.currentStatus.lastUpdated)}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Progress Overview */}
            <Card className="bg-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Onboarding Progress</CardTitle>
              </CardHeader>
              <CardContent className="text-white">
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{companyStatus.progress.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-green-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${companyStatus.progress.percentage}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    {companyStatus.progress.completedSteps} of {companyStatus.progress.totalSteps} steps completed
                  </p>
                </div>

                {/* Status Steps */}
                <div className="space-y-4">
                  {companyStatus.progress.steps.map((step, index) => (
                    <div key={step.statusId} className="flex items-start gap-3">
                      {getStatusIcon(step.completed, false)}
                      <div className="flex-1">
                        <h4 className="font-semibold">{step.name}</h4>
                        <p className="text-gray-300 text-sm">{step.description}</p>
                        {step.completedAt && (
                          <p className="text-xs text-gray-400 mt-1">
                            Completed: {formatDate(step.completedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Status History */}
            {companyStatus.statusHistory.length > 0 && (
              <Card className="bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="text-white">
                  <div className="space-y-3">
                    {companyStatus.statusHistory.slice(0, 5).map((log, index) => (
                      <div key={index} className="flex items-start gap-3 pb-3 border-b border-gray-700 last:border-b-0">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                        <div className="flex-1">
                          <h5 className="font-medium">{log.name}</h5>
                          <p className="text-sm text-gray-300">{log.description}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(log.datetime)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                onClick={() => fetchCompanyStatus(companyStatus.company.company_id)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Refresh Status
              </Button>
              {isTestMode && (
                <Button
                  onClick={() => {
                    setCompanyStatus(null);
                    setCompanyId('');
                  }}
                  variant="outline"
                  className="border-gray-600 text-white hover:bg-gray-700"
                >
                  Check Another Company
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}