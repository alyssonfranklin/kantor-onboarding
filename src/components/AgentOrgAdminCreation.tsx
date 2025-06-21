// src/components/AgentOrgAdminCreation.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface FormData {
  email: string;
  name: string;
  companyName: string;
  password: string;
  version: string;
  createDefaultDepartment: boolean;
}

interface InsightVersion {
  insight_id: string;
  kantor_version: string;
  insights_limit: number;
  price_monthly?: number;
  description?: string;
}

const AgentOrgAdminCreation = () => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    name: '',
    companyName: '',
    password: '',
    version: '',
    createDefaultDepartment: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [insightVersions, setInsightVersions] = useState<InsightVersion[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(true);
  const [createdData, setCreatedData] = useState<{
    companyId?: string;
    userId?: string;
    assistantId?: string;
    companyWasExisting?: boolean;
  }>({});

  // Fetch insight versions on component mount
  useEffect(() => {
    const fetchInsightVersions = async () => {
      try {
        setIsLoadingVersions(true);
        const response = await fetch('/api/v1/insights');
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setInsightVersions(result.data);
            // Set default version to the first option if available
            if (result.data.length > 0 && !formData.version) {
              setFormData(prev => ({ ...prev, version: result.data[0].insight_id }));
            }
          } else {
            setError('Failed to load Kantor versions');
          }
        } else {
          setError('Failed to fetch Kantor versions');
        }
      } catch (err) {
        console.error('Error fetching insight versions:', err);
        setError('Error loading Kantor versions');
      } finally {
        setIsLoadingVersions(false);
      }
    };

    fetchInsightVersions();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateEmail = (email: string): boolean => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate email
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid corporate email');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      // Create OpenAI agent
      const agentResponse = await fetch('/api/v1/create-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.companyName
        })
      });

      if (!agentResponse.ok) {
        const agentData = await agentResponse.json();
        throw new Error(agentData.error || 'Failed to create agent');
      }

      const agentData = await agentResponse.json();
      const assistantId = agentData.assistantId;

      // Add user and company to database
      const spreadsheetResponse = await fetch('/api/v1/add-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Set header for department creation based on checkbox
          'x-create-default-department': formData.createDefaultDepartment ? 'true' : 'false',
        },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          companyName: formData.companyName,
          password: formData.password,
          version: formData.version,
          assistantId
        })
      });

      if (!spreadsheetResponse.ok) {
        const spreadsheetData = await spreadsheetResponse.json();
        throw new Error(spreadsheetData.error || 'Failed to add to database');
      }

      const spreadsheetData = await spreadsheetResponse.json();
      
      setCreatedData({
        companyId: spreadsheetData.companyId,
        userId: spreadsheetData.userId,
        assistantId,
        companyWasExisting: spreadsheetData.companyWasExisting
      });

      setSuccess(true);
      // Reset form
      setFormData({
        email: '',
        name: '',
        companyName: '',
        password: '',
        version: insightVersions.length > 0 ? insightVersions[0].insight_id : '',
        createDefaultDepartment: false
      });
    } catch (error: unknown) {
      const err = error as Error;
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = "w-full p-2 border rounded-md mb-4 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
  const labelClasses = "block font-bold text-white mb-2";

  return (
    <Card className="max-w-xl mx-auto bg-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Create Organization Admin</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className={labelClasses}>
              Corporate Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={inputClasses}
              required
              placeholder="youremail@company.com"
            />
          </div>

          <div>
            <label htmlFor="name" className={labelClasses}>
              Your Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={inputClasses}
              required
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="companyName" className={labelClasses}>
              Your Company Name
            </label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              className={inputClasses}
              required
              placeholder="Acme Corp"
            />
          </div>

          <div>
            <label htmlFor="password" className={labelClasses}>
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={inputClasses}
              required
              minLength={8}
            />
          </div>

          <div>
            <label htmlFor="version" className={labelClasses}>
              Kantor Version
            </label>
            <select
              id="version"
              name="version"
              value={formData.version}
              onChange={handleChange}
              className={inputClasses}
              required
              disabled={isLoadingVersions}
            >
              <option value="">
                {isLoadingVersions ? 'Loading versions...' : 'Select a Kantor version'}
              </option>
              {insightVersions.map(version => (
                <option key={version.insight_id} value={version.insight_id}>
                  {version.kantor_version}
                  {version.price_monthly ? ` - $${version.price_monthly}/month` : ' - Free'}
                  {` (${version.insights_limit} insights/month)`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center my-4">
            <input
              type="checkbox"
              id="createDefaultDepartment"
              name="createDefaultDepartment"
              checked={formData.createDefaultDepartment}
              onChange={handleChange}
              className="w-4 h-4 mr-2"
            />
            <label htmlFor="createDefaultDepartment" className="text-white">
              Create default Management department
            </label>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>
                {createdData.companyWasExisting ? (
                  <p>New user added to existing company successfully!</p>
                ) : (
                  <p>Company and admin user created successfully!</p>
                )}
                {createdData.assistantId && (
                  <p className="mt-2 text-sm">Assistant ID: {createdData.assistantId}</p>
                )}
                {createdData.companyId && (
                  <p className="text-sm">Company ID: {createdData.companyId} {createdData.companyWasExisting && '(existing)'}</p>
                )}
                {createdData.userId && (
                  <p className="text-sm">User ID: {createdData.userId}</p>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full font-bold bg-[#E62E05] hover:bg-[#E62E05]/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AgentOrgAdminCreation;