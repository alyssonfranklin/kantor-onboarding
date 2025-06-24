"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import NavBar from "@/components/client/NavBar";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";

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

export default function WelcomePage() {
  const router = useRouter();
  const recaptchaRef = useRef<any>(null);
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  
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

  // reCAPTCHA v3 callback functions
  const onRecaptchaLoad = () => {
    setRecaptchaLoaded(true);
  };

  const executeRecaptcha = async (): Promise<string | null> => {
    if ((window as any).grecaptcha && (window as any).grecaptcha.ready) {
      return new Promise((resolve) => {
        (window as any).grecaptcha.ready(() => {
          (window as any).grecaptcha.execute('6Ld6fWsrAAAAAII_1UcAmpNG1xrImLqKW4sEOPfI', {
            action: 'submit'
          }).then((token: string) => {
            resolve(token);
          }).catch(() => {
            resolve(null);
          });
        });
      });
    }
    return null;
  };

  const onRecaptchaChange = (token: string | null) => {
    setRecaptchaToken(token);
  };

  const resetRecaptcha = () => {
    // reCAPTCHA v3 doesn't need manual reset
    setRecaptchaToken(null);
  };

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

    // Execute reCAPTCHA v3
    const recaptchaTokenResult = await executeRecaptcha();
    if (!recaptchaTokenResult) {
      setError('reCAPTCHA verification failed. Please try again.');
      return;
    }
    setRecaptchaToken(recaptchaTokenResult);
    
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

      // Redirect to thank you page immediately without showing success message
      router.push('/thankyou');
    } catch (error: unknown) {
      const err = error as Error;
      setError(err.message);
      resetRecaptcha(); // Reset reCAPTCHA on error
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = "w-full p-3 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white";
  const labelClasses = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <>
      <Script
        src="https://www.google.com/recaptcha/api.js"
        onLoad={onRecaptchaLoad}
      />
      <div className="min-h-screen flex flex-col items-center justify-center m-0 p-0">
        <div className="w-full">
          <NavBar />
        </div>
      <div className="w-full min-h-screen flex justify-center pt-4 md:pt-10">
        <div className='w-11/12 md:w-2/5'>
          <div className='flex justify-center'>
            <Image
              src="/voxerion-logo.png" 
              alt="Voxerion Logo" 
              width={32} 
              height={32} 
            />
          </div>

          <div className='text-center'>
            <h2 className="text-2xl font-bold my-2">
              Welcome to Voxerion
            </h2>
            <div className='text-gray-600 pt-0 mt-0'>
              Create your organization admin account to get started
            </div>
          </div>
            
          <Card className="mt-6 bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Create Organization Admin</CardTitle>
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
                    placeholder="Create a secure password"
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
                      </option>
                    ))}
                  </select>
                </div>

                {/* reCAPTCHA v3 runs in background - no visible widget */}
                {!recaptchaLoaded && (
                  <div className="mb-4">
                    <div className="p-3 border border-gray-300 rounded-md bg-gray-50 text-center text-gray-500 text-sm">
                      🤖 Loading security verification...
                    </div>
                  </div>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-200 bg-green-50">
                    <AlertDescription className="text-green-800">
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
                  className="w-full font-semibold bg-[#E62E05] hover:bg-[#E62E05]/90 text-white py-3"
                  disabled={isSubmitting || isLoadingVersions}
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

          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold text-[#E62E05] hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
    </>
  );
}