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
    
    private PATTERNS = {
        whitespace: /\s+/g,
        punctuation: /[.,!?;:'"()\[\]{}]/g,
        numbers: /\d+/g,
        specialChars: /[^a-zA-Z0-9\s]/g
    };

    estimateTokens(text: string): number {
        if (!text) return 0;

        let tokenCount = 0;

        tokenCount += Math.ceil(text.length * this.AVG_TOKENS_PER_CHAR);

        const whitespaceMatches = text.match(this.PATTERNS.whitespace) || [];
        tokenCount += whitespaceMatches.length * this.SPECIAL_TOKENS.space;

        const punctuationMatches = text.match(this.PATTERNS.punctuation) || [];
        tokenCount += punctuationMatches.length * this.SPECIAL_TOKENS.punctuation;

        const numberMatches = text.match(this.PATTERNS.numbers) || [];
        tokenCount -= numberMatches.join('').length * 0.1;

        const specialCharMatches = text.match(this.PATTERNS.specialChars) || [];
        tokenCount += specialCharMatches.length;

        return Math.ceil(tokenCount);
    }

    estimatePromptTokens(promptObject: PromptInput): number {
        let totalTokens = 0;

        if (typeof promptObject === 'string') {
            totalTokens = this.estimateTokens(promptObject);
        } else if (Array.isArray(promptObject)) {
            for (const message of promptObject) {
                if (typeof message === 'string') {
                    totalTokens += this.estimateTokens(message);
                } else if (typeof message === 'object' && message !== null) {
                    if (message.content) {
                        totalTokens += this.estimateTokens(message.content);
                    }
                    if (message.role) {
                        totalTokens += this.estimateTokens(message.role);
                    }
                }
            }
        } else if (typeof promptObject === 'object' && promptObject !== null) {
            for (const key in promptObject) {
                if (typeof promptObject[key] === 'string') {
                    totalTokens += this.estimateTokens(promptObject[key] as string);
                } else if (typeof promptObject[key] === 'object') {
                    totalTokens += this.estimatePromptTokens(promptObject[key] as PromptInput);
                }
            }
        }

        return totalTokens;
    }

    analyzePrompt(prompt: PromptInput): PromptAnalysis {
        const analysis = {
            totalTokens: this.estimatePromptTokens(prompt),
            characterCount: typeof prompt === 'string' ? prompt.length : JSON.stringify(prompt).length,
            whitespacesCount: (typeof prompt === 'string' ? prompt : JSON.stringify(prompt)).match(this.PATTERNS.whitespace)?.length || 0,
            punctuationCount: (typeof prompt === 'string' ? prompt : JSON.stringify(prompt)).match(this.PATTERNS.punctuation)?.length || 0,
            numbersCount: (typeof prompt === 'string' ? prompt : JSON.stringify(prompt)).match(this.PATTERNS.numbers)?.length || 0,
            tokensPerCharacter: 0
        };

        analysis.tokensPerCharacter = analysis.totalTokens / analysis.characterCount;
        return analysis;
    }
}