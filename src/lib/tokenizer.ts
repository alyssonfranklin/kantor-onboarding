// src/lib/tokenizer.ts

type PromptMessage = {
    role?: string;
    content?: string;
};

type PromptInput = string | PromptMessage[] | Record<string, unknown>;

type PromptAnalysis = {
    totalTokens: number;
    characterCount: number;
    whitespacesCount: number;
    punctuationCount: number;
    numbersCount: number;
    tokensPerCharacter: number;
};

export class PromptTokenizer {
    private AVG_TOKENS_PER_CHAR = 0.25;
    
    private SPECIAL_TOKENS = {
        newline: 1,
        space: 1,
        tab: 1,
        punctuation: 1
    };
    
    // Compile patterns once during initialization
    private readonly PATTERNS = {
        whitespace: /\s+/g,
        punctuation: /[.,!?;:'"()\[\]{}]/g,
        numbers: /\d+/g,
        specialChars: /[^a-zA-Z0-9\s]/g
    };

    // Cache for tokenization results to prevent repeated calculations
    private tokenCache = new Map<string, number>();
    private readonly MAX_CACHE_SIZE = 1000;

    // Clear the cache when it gets too large to prevent memory leaks
    private trimCache(): void {
        if (this.tokenCache.size > this.MAX_CACHE_SIZE) {
            const keysToDelete = Array.from(this.tokenCache.keys()).slice(0, 200);
            keysToDelete.forEach(key => this.tokenCache.delete(key));
        }
    }

    estimateTokens(text: string): number {
        if (!text) return 0;

        // Check cache first
        const cacheKey = text.substring(0, 100) + text.length.toString();
        if (this.tokenCache.has(cacheKey)) {
            return this.tokenCache.get(cacheKey)!;
        }

        let tokenCount = 0;

        tokenCount += Math.ceil(text.length * this.AVG_TOKENS_PER_CHAR);

        // Reset RegExp.lastIndex to ensure consistent behavior
        this.PATTERNS.whitespace.lastIndex = 0;
        this.PATTERNS.punctuation.lastIndex = 0;
        this.PATTERNS.numbers.lastIndex = 0;
        this.PATTERNS.specialChars.lastIndex = 0;

        const whitespaceMatches = text.match(this.PATTERNS.whitespace) || [];
        tokenCount += whitespaceMatches.length * this.SPECIAL_TOKENS.space;

        const punctuationMatches = text.match(this.PATTERNS.punctuation) || [];
        tokenCount += punctuationMatches.length * this.SPECIAL_TOKENS.punctuation;

        const numberMatches = text.match(this.PATTERNS.numbers) || [];
        tokenCount -= numberMatches.join('').length * 0.1;

        const specialCharMatches = text.match(this.PATTERNS.specialChars) || [];
        tokenCount += specialCharMatches.length;

        const result = Math.ceil(tokenCount);
        
        // Cache the result
        this.tokenCache.set(cacheKey, result);
        this.trimCache();
        
        return result;
    }

    estimatePromptTokens(promptObject: PromptInput): number {
        let totalTokens = 0;

        // Quick path for strings
        if (typeof promptObject === 'string') {
            return this.estimateTokens(promptObject);
        } 
        
        // Handle arrays with special optimization for common chat format
        if (Array.isArray(promptObject)) {
            return promptObject.reduce((sum, message) => {
                if (typeof message === 'string') {
                    return sum + this.estimateTokens(message);
                } else if (typeof message === 'object' && message !== null) {
                    let msgTokens = 0;
                    if (message.content) {
                        msgTokens += this.estimateTokens(message.content as string);
                    }
                    if (message.role) {
                        msgTokens += this.estimateTokens(message.role as string);
                    }
                    return sum + msgTokens;
                }
                return sum;
            }, 0);
        } 
        
        // Handle objects with iterative approach instead of recursion
        if (typeof promptObject === 'object' && promptObject !== null) {
            const stack = Object.entries(promptObject).map(([_, value]) => value);
            
            while (stack.length > 0) {
                const current = stack.pop();
                
                if (typeof current === 'string') {
                    totalTokens += this.estimateTokens(current);
                } else if (typeof current === 'object' && current !== null) {
                    if (Array.isArray(current)) {
                        stack.push(...current);
                    } else {
                        stack.push(...Object.values(current));
                    }
                }
            }
        }

        return totalTokens;
    }

    analyzePrompt(prompt: PromptInput): PromptAnalysis {
        const totalTokens = this.estimatePromptTokens(prompt);
        const stringifiedPrompt = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);
        const characterCount = stringifiedPrompt.length;
        
        // Reset RegExp.lastIndex
        this.PATTERNS.whitespace.lastIndex = 0;
        this.PATTERNS.punctuation.lastIndex = 0;
        this.PATTERNS.numbers.lastIndex = 0;
        
        const analysis = {
            totalTokens,
            characterCount,
            whitespacesCount: stringifiedPrompt.match(this.PATTERNS.whitespace)?.length || 0,
            punctuationCount: stringifiedPrompt.match(this.PATTERNS.punctuation)?.length || 0,
            numbersCount: stringifiedPrompt.match(this.PATTERNS.numbers)?.length || 0,
            tokensPerCharacter: characterCount > 0 ? totalTokens / characterCount : 0
        };

        return analysis;
    }
}