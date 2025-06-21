// src/components/CompanyOnboardingForm.tsx
"use client";

import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { PromptTokenizer } from '@/lib/tokenizer';

const COST_PER_1K_TOKENS = 0.0037;
const tokenizer = new PromptTokenizer();
const debounceTime = 500; // ms

interface FormData {
  standardPrompt: string;
  mission: string;
  vision: string;
  values: string;
  history: string;
  products: string;
  branding: string;
}

interface FieldTokens {
  count: number;
  cost: string;
}

interface TokenCounts {
  [key: string]: FieldTokens;
}

// Debounce function to limit the frequency of function calls
function debounce<F extends (...args: unknown[]) => void>(fn: F, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return function(this: unknown, ...args: Parameters<F>) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

const CompanyOnboardingForm = () => {
  const [formData, setFormData] = useState<FormData>({
    standardPrompt: '', 
    mission: '',
    vision: '',
    values: '',
    history: '',
    products: '',
    branding: ''
  });

  const [assistantId, setAssistantId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);
  const [fieldTokens, setFieldTokens] = useState<TokenCounts>({});
  
  // We don't need a timerRef anymore since we're using debounce

  // Calculate tokens for all fields and update state
  const calculateAllTokens = useCallback(() => {
    // Calculate tokens for each field
    const newFieldTokens: TokenCounts = {};
    let totalInstructions = '';
    
    // Add headers and content to total instructions
    totalInstructions += `[PROPÓSITO DO AGENTE]\n${formData.standardPrompt}\n\n`;
    totalInstructions += `[MISSAO DO CLIENTE]\n${formData.mission}\n\n`;
    totalInstructions += `[VISAO DO CLIENTE]\n${formData.vision}\n\n`;
    totalInstructions += `[VALORES FUNDAMENTAIS DO CLIENTE]\n${formData.values}\n\n`;
    totalInstructions += `[HISTORIA DO CLIENTE]\n${formData.history}\n\n`;
    totalInstructions += `[O QUE VENDE O CLIENTE]\n${formData.products}\n\n`;
    totalInstructions += `[BRANDING E PROMESSAS DE MARCA]\n${formData.branding}`;
    
    // Calculate tokens for each field individually
    Object.entries(formData).forEach(([field, value]) => {
      try {
        const count = tokenizer.estimatePromptTokens(value);
        const cost = ((count / 1000) * COST_PER_1K_TOKENS).toFixed(4);
        newFieldTokens[field] = { count, cost };
      } catch (error) {
        console.error(`Error calculating tokens for ${field}:`, error);
        newFieldTokens[field] = { count: 0, cost: '0.0000' };
      }
    });
    
    // Calculate total tokens
    try {
      const totalCount = tokenizer.estimatePromptTokens(totalInstructions);
      setTokenCount(totalCount);
    } catch (error) {
      console.error('Error calculating total tokens:', error);
      setTokenCount(0);
    }
    
    setFieldTokens(newFieldTokens);
  }, [formData]);
  
  // Debounced token calculation - inline function to satisfy the ESLint rule
  const debouncedCalculateTokens = useCallback(
    // Using the debounce utility with an inline function
    debounce(function debouncedFn() {
      calculateAllTokens();
    }, debounceTime),
    [calculateAllTokens]
  );

  // Input change handler
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAssistantId(e.target.value);
  }, []);

  // Textarea change handler
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Debounce token calculation to avoid performance issues
    debouncedCalculateTokens();
  }, [debouncedCalculateTokens]);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess(false);

    if (!assistantId) {
      setError('Assistant ID is required');
      setIsSubmitting(false);
      return;
    }

    try {
      // Format instructions
      let instructions = '';
      instructions += `[PROPÓSITO DO AGENTE]\n${formData.standardPrompt}\n\n`;
      instructions += `[MISSAO DO CLIENTE]\n${formData.mission}\n\n`;
      instructions += `[VISAO DO CLIENTE]\n${formData.vision}\n\n`;
      instructions += `[VALORES FUNDAMENTAIS DO CLIENTE]\n${formData.values}\n\n`;
      instructions += `[HISTORIA DO CLIENTE]\n${formData.history}\n\n`;
      instructions += `[O QUE VENDE O CLIENTE]\n${formData.products}\n\n`;
      instructions += `[BRANDING E PROMESSAS DE MARCA]\n${formData.branding}`;
      
      const response = await fetch('/api/v1/update-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instructions,
          assistantId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update assistant');
      }

      setSuccess(true);
    } catch (error: unknown) {
      const err = error as Error;
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [assistantId, formData]);

  // Simple textarea component with label and token stats
  const TextareaWithStats = useCallback(({ 
    id, 
    name, 
    label, 
    value
  }: { 
    id: string; 
    name: string; 
    label: string; 
    value: string; 
  }) => {    
    return (
      <div>
        <div className="flex justify-between items-center mb-2">
          <label htmlFor={id} className="block font-bold text-white mb-2">
            {label}
          </label>
          <div className="flex gap-4">
            <span className="text-white text-sm bg-gray-700 px-2 py-1 rounded">
              Tokens: {fieldTokens[name]?.count.toLocaleString() || 0}
            </span>
            <span className="text-white text-sm bg-gray-700 px-2 py-1 rounded">
              Cost: ${fieldTokens[name]?.cost || "0.0000"}
            </span>
          </div>
        </div>
        <textarea
          id={id}
          name={name}
          value={value}
          onChange={handleTextareaChange}
          className="w-full p-2 border rounded-md min-h-32 mb-4 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          required
        />
      </div>
    );
  }, [handleTextareaChange, fieldTokens]);

  return (
    <Card className="max-w-4xl mx-auto bg-gray-800">
      <CardHeader className="space-y-1">
        <CardTitle className="text-white">Company Onboarding Form</CardTitle>
        <div className="flex flex-wrap gap-4">
          <div className="text-white text-sm font-medium bg-gray-700 px-3 py-1 rounded-md inline-block">
            Total tokens: {tokenCount.toLocaleString()}
          </div>
          <div className="text-white text-sm font-medium bg-gray-700 px-3 py-1 rounded-md inline-block">
            Total cost: ${((tokenCount / 1000) * COST_PER_1K_TOKENS).toFixed(4)} USD
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
              id="assistantId"
              type="text"
              value={assistantId}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md mb-4 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
              placeholder="Enter OpenAI Assistant ID"
            />
          </div>

          <TextareaWithStats
            id="standardPrompt"
            name="standardPrompt"
            label="Standard Prompt"
            value={formData.standardPrompt}
          />

          <TextareaWithStats
            id="mission"
            name="mission"
            label="Missão do Cliente"
            value={formData.mission}
          />

          <TextareaWithStats
            id="vision"
            name="vision"
            label="Visão do Cliente"
            value={formData.vision}
          />

          <TextareaWithStats
            id="values"
            name="values"
            label="Valores Fundamentais do Cliente"
            value={formData.values}
          />

          <TextareaWithStats
            id="history"
            name="history"
            label="História do Cliente"
            value={formData.history}
          />

          <TextareaWithStats
            id="products"
            name="products"
            label="O que Vende o Cliente"
            value={formData.products}
          />

          <TextareaWithStats
            id="branding"
            name="branding"
            label="Branding e Promessas de Marca"
            value={formData.branding}
          />

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>
                Assistant instructions successfully updated!
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
                Updating Assistant...
              </>
            ) : (
              'Update Assistant'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CompanyOnboardingForm;