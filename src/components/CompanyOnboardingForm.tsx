// src/components/CompanyOnboardingForm.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { PromptTokenizer } from '@/lib/tokenizer';

const COST_PER_1K_TOKENS = 0.0037;

interface FormData {
  standardPrompt: string;
  expectations: string;
  mission: string;
  vision: string;
  values: string;
  history: string;
  products: string;
  branding: string;
}

// Create tokenizer instance outside component
const tokenizer = new PromptTokenizer();

const CompanyOnboardingForm = () => {
  const [formData, setFormData] = useState<FormData>({
    standardPrompt: '', 
    expectations: '',
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

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatInstructions = useMemo(() => (data: FormData): string => {
    return `
[PROPÓSITO DO AGENTE]
${data.standardPrompt}

[EXPECTATIVAS DO CLIENTE]
${data.expectations}

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

  useEffect(() => {
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

  const textareaClasses = "w-full p-2 border rounded-md min-h-32 mb-4 text-black placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
  const labelClasses = "block font-bold text-white mb-2";

  return (
    <Card className="max-w-4xl mx-auto bg-gray-800">
      <CardHeader className="space-y-1">
        <CardTitle className="text-white">Company Onboarding Form</CardTitle>
        <div className="flex space-x-4">
          <div className="text-white text-sm font-medium bg-gray-700 px-3 py-1 rounded-md inline-block">
            Estimated tokens: {tokenCount}
          </div>
          <div className="text-white text-sm font-medium bg-gray-700 px-3 py-1 rounded-md inline-block">
            Estimated cost: ${((tokenCount / 1000) * COST_PER_1K_TOKENS).toFixed(4)} USD
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="assistantId" className={labelClasses}>
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
            <label htmlFor="standardPrompt" className={labelClasses}>
              Standard Prompt
            </label>
            <textarea
              id="standardPrompt"
              name="standardPrompt"
              value={formData.standardPrompt}
              onChange={handleChange}
              className={textareaClasses}
              required
            />
          </div>
          <div>
            <label htmlFor="expectations" className={labelClasses}>
              Expectativas do Cliente
            </label>
            <textarea
              id="expectations"
              name="expectations"
              value={formData.expectations}
              onChange={handleChange}
              className={textareaClasses}
              required
            />
          </div>

          <div>
            <label htmlFor="mission" className={labelClasses}>
              Missão do Cliente
            </label>
            <textarea
              id="mission"
              name="mission"
              value={formData.mission}
              onChange={handleChange}
              className={textareaClasses}
              required
            />
          </div>

          <div>
            <label htmlFor="vision" className={labelClasses}>
              Visão do Cliente
            </label>
            <textarea
              id="vision"
              name="vision"
              value={formData.vision}
              onChange={handleChange}
              className={textareaClasses}
              required
            />
          </div>

          <div>
            <label htmlFor="values" className={labelClasses}>
              Valores Fundamentais do Cliente
            </label>
            <textarea
              id="values"
              name="values"
              value={formData.values}
              onChange={handleChange}
              className={textareaClasses}
              required
            />
          </div>

          <div>
            <label htmlFor="history" className={labelClasses}>
              História do Cliente
            </label>
            <textarea
              id="history"
              name="history"
              value={formData.history}
              onChange={handleChange}
              className={textareaClasses}
              required
            />
          </div>

          <div>
            <label htmlFor="products" className={labelClasses}>
              O que Vende o Cliente
            </label>
            <textarea
              id="products"
              name="products"
              value={formData.products}
              onChange={handleChange}
              className={textareaClasses}
              required
            />
          </div>

          <div>
            <label htmlFor="branding" className={labelClasses}>
              Branding e Promessas de Marca
            </label>
            <textarea
              id="branding"
              name="branding"
              value={formData.branding}
              onChange={handleChange}
              className={textareaClasses}
              required
            />
          </div>

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