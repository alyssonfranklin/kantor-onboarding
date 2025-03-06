// src/components/CompanyOnboardingForm.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { PromptTokenizer } from '@/lib/tokenizer';

const COST_PER_1K_TOKENS = 0.0037;

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

const tokenizer = new PromptTokenizer();

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
  
  // Create a memoized input component
  const MemoizedInput = useMemo(() => React.memo(
    function CustomInput({ 
      id,
      value,
      onChange,
      placeholder,
      className,
      required
    }: {
      id: string;
      value: string;
      onChange: (value: string) => void;
      placeholder?: string;
      className: string;
      required?: boolean;
    }) {
      // Create a ref for the input
      const inputRef = useRef<HTMLInputElement>(null);
      
      // Handle changes and maintain focus
      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
        
        // Schedule focus retention after state update
        requestAnimationFrame(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        });
      };
      
      return (
        <input
          ref={inputRef}
          type="text"
          id={id}
          value={value}
          onChange={handleChange}
          className={className}
          placeholder={placeholder}
          required={required}
        />
      );
    }
  ), []);

  // Use memoized callback to prevent recreating the function on each render
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const formatInstructions = useMemo(() => (data: FormData): string => {
    return `
[PROPÓSITO DO AGENTE]
${data.standardPrompt}

[MISSAO DO CLIENTE]
${data.mission}

[VISAO DO CLIENTE]
${data.vision}

[VALORES FUNDAMENTAIS DO CLIENTE]
${data.values}

[HISTORIA DO CLIENTE]
${data.history}

[O QUE VENDE O CLIENTE]
${data.products}

[BRANDING E PROMESSAS DE MARCA]
${data.branding}
    `.trim();
  }, []);

  const calculateFieldTokens = (text: string): FieldTokens => {
    const count = tokenizer.estimatePromptTokens(text);
    const cost = ((count / 1000) * COST_PER_1K_TOKENS).toFixed(4);
    return { count, cost };
  };

  useEffect(() => {
    const newFieldTokens: TokenCounts = {};
    Object.entries(formData).forEach(([field, value]) => {
      newFieldTokens[field] = calculateFieldTokens(value);
    });
    setFieldTokens(newFieldTokens);

    const instructions = formatInstructions(formData);
    const count = tokenizer.estimatePromptTokens(instructions);
    setTokenCount(count);
  }, [formData, formatInstructions]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      const instructions = formatInstructions(formData);
      
      const response = await fetch('/api/update-assistant', {
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
  };

  // Create a custom textarea component that maintains focus
  const MemoizedTextarea = useMemo(() => React.memo(
    function CustomTextarea({ 
      id,
      name,
      value,
      onChange,
      className,
      required
    }: {
      id: string;
      name: string;
      value: string;
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
      className: string;
      required?: boolean;
    }) {
      // Create a ref for the textarea
      const textareaRef = useRef<HTMLTextAreaElement>(null);
      
      // Save the current cursor position and focus
      const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        // Call the parent onChange handler
        onChange(e);
        
        // Schedule focus retention after state update
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        });
      };
      
      return (
        <textarea
          ref={textareaRef}
          id={id}
          name={name}
          value={value}
          onChange={handleChange}
          className={className}
          required={required}
        />
      );
    }
  ), []);

  // A component for textarea with token statistics
  const TextareaWithStats = useCallback(({ 
    id, 
    name, 
    label, 
    value, 
    onChange 
  }: { 
    id: string; 
    name: string; 
    label: string; 
    value: string; 
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; 
  }) => {    
    return (
      <div>
        <div className="flex justify-between items-center mb-2">
          <label htmlFor={id} className={labelClasses}>
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
        <MemoizedTextarea
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          className={textareaClasses}
          required
        />
      </div>
    );
  }, [fieldTokens, MemoizedTextarea]);

  const textareaClasses = "w-full p-2 border rounded-md min-h-32 mb-4 text-black placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
  const labelClasses = "block font-bold text-white mb-2";

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
            <label htmlFor="assistantId" className={labelClasses}>
              Assistant ID
            </label>
            <MemoizedInput
              id="assistantId"
              value={assistantId}
              onChange={setAssistantId}
              className="w-full p-2 border rounded-md mb-4 text-black placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
              placeholder="Enter OpenAI Assistant ID"
            />
          </div>

          <TextareaWithStats
            id="standardPrompt"
            name="standardPrompt"
            label="Standard Prompt"
            value={formData.standardPrompt}
            onChange={handleChange}
          />

          <TextareaWithStats
            id="mission"
            name="mission"
            label="Missão do Cliente"
            value={formData.mission}
            onChange={handleChange}
          />

          <TextareaWithStats
            id="vision"
            name="vision"
            label="Visão do Cliente"
            value={formData.vision}
            onChange={handleChange}
          />

          <TextareaWithStats
            id="values"
            name="values"
            label="Valores Fundamentais do Cliente"
            value={formData.values}
            onChange={handleChange}
          />

          <TextareaWithStats
            id="history"
            name="history"
            label="História do Cliente"
            value={formData.history}
            onChange={handleChange}
          />

          <TextareaWithStats
            id="products"
            name="products"
            label="O que Vende o Cliente"
            value={formData.products}
            onChange={handleChange}
          />

          <TextareaWithStats
            id="branding"
            name="branding"
            label="Branding e Promessas de Marca"
            value={formData.branding}
            onChange={handleChange}
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