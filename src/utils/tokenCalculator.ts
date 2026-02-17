import { encoding_for_model } from 'tiktoken';

const encoder = encoding_for_model('gpt-3.5-turbo'); // Or another Azure OpenAI model

export const calculateTokens = (text: string): number => {
    try {
        const tokens = encoder.encode(text);
        return tokens.length;
    } catch (error) {
        console.error("Error calculating tokens:", error);
        return 0;
    }
};