// LLM Client - Provider-agnostic interface for LLM interactions
import { StudyPreferences } from '../../models/preferences';
import { withPromptContext } from '../prompt/buildContext';

// Quiz generation types (matching requirements)
export interface QuizQuestion {
  id: string;
  type: "mcq" | "short" | "code";
  prompt: string;
  choices?: string[]; // for mcq
  answer: string | number | string[];
  explanation?: string;
  sourceRef?: { id: string; title: string; range?: string };
  difficulty: 1 | 2 | 3 | 4 | 5;
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  createdAt: number;
}

export interface ContentChunk {
  id: string;
  content: string;
  source: {
    id: string;
    title: string;
    type: 'file' | 'module' | 'assignment';
  };
  metadata?: Record<string, any>;
}

export interface GenerateQuizRequest {
  chunks: ContentChunk[];
  preferences: StudyPreferences;
  title?: string;
}

// Abstract LLM client interface
export abstract class LLMClient {
  abstract generateQuiz(request: GenerateQuizRequest): Promise<Quiz>;
  abstract isAvailable(): boolean;
  abstract getModelInfo(): { name: string; provider: string };
}

// Mock LLM client for development/testing
export class MockLLMClient extends LLMClient {
  async generateQuiz(request: GenerateQuizRequest): Promise<Quiz> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { chunks, preferences } = request;
    const numQuestions = Math.min(preferences.quizConfig.numQuestions, 10);
    
    const questions: QuizQuestion[] = [];
    
    for (let i = 0; i < numQuestions; i++) {
      const chunk = chunks[i % chunks.length];
      const questionType = preferences.quizConfig.types[i % preferences.quizConfig.types.length];
      
      questions.push({
        id: `q_${Date.now()}_${i}`,
        type: questionType,
        prompt: `Sample ${questionType.toUpperCase()} question ${i + 1} based on: ${chunk.source.title}`,
        choices: questionType === 'mcq' ? [
          'Option A - Correct answer',
          'Option B - Incorrect',
          'Option C - Incorrect',
          'Option D - Incorrect'
        ] : undefined,
        answer: questionType === 'mcq' ? 0 : 'Sample answer for the question',
        explanation: preferences.includeExplanations 
          ? `This is the explanation for question ${i + 1}. The answer is correct because...`
          : undefined,
        sourceRef: {
          id: chunk.source.id,
          title: chunk.source.title,
          range: `Section ${i + 1}`,
        },
        difficulty: preferences.difficulty,
      });
    }
    
    return {
      id: `quiz_${Date.now()}`,
      title: request.title || `Quiz from ${chunks[0]?.source.title || 'Study Materials'}`,
      questions,
      createdAt: Date.now(),
    };
  }
  
  isAvailable(): boolean {
    return true;
  }
  
  getModelInfo() {
    return { name: 'Mock Model v1.0', provider: 'Development' };
  }
}

// OpenAI client implementation
export class OpenAIClient extends LLMClient {
  private apiKey: string;
  private model: string;
  private baseURL: string;
  private maxRetries: number;
  private timeout: number;
  
  constructor(
    apiKey: string, 
    model: string = 'gpt-4o-mini',
    baseURL: string = 'https://api.openai.com/v1',
    maxRetries: number = 3,
    timeout: number = 30000
  ) {
    super();
    this.apiKey = apiKey;
    this.model = model;
    this.baseURL = baseURL;
    this.maxRetries = maxRetries;
    this.timeout = timeout;
  }
  
  async generateQuiz(request: GenerateQuizRequest): Promise<Quiz> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI client not available - API key required');
    }
    
    const systemPrompt = this.buildSystemPrompt(request.preferences);
    const userPrompt = this.buildUserPrompt(request);
    
    try {
      const response = await this.callOpenAI(systemPrompt, userPrompt, 0.3);
      return this.parseQuizResponse(response, request);
      
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate quiz: ' + (error as Error).message);
    }
  }

  private async callOpenAI(
    systemPrompt: string, 
    userPrompt: string, 
    temperature: number = 0.7,
    maxTokens: number = 2000
  ): Promise<string> {
    const requestBody = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: maxTokens,
      temperature,
    };

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(`${this.baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          if (response.status === 401) {
            throw new Error('Invalid OpenAI API key');
          } else if (response.status === 429) {
            const retryAfter = response.headers.get('retry-after');
            if (retryAfter && attempt < this.maxRetries - 1) {
              await this.delay(parseInt(retryAfter) * 1000);
              continue;
            }
            throw new Error('OpenAI API rate limit exceeded');
          } else if (response.status >= 500) {
            if (attempt < this.maxRetries - 1) {
              await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
              continue;
            }
            throw new Error('OpenAI service temporarily unavailable');
          } else {
            throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
          }
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (!content) {
          throw new Error('No content received from OpenAI API');
        }

        return content.trim();

      } catch (error) {
        lastError = error as Error;
        
        if (error instanceof TypeError && error.message.includes('fetch')) {
          if (attempt < this.maxRetries - 1) {
            await this.delay(Math.pow(2, attempt) * 1000);
            continue;
          }
          throw new Error('Network error connecting to OpenAI');
        }
        
        // Don't retry for certain errors
        if (error instanceof Error && (
          error.message.includes('Invalid OpenAI API key') ||
          error.message.includes('No content received')
        )) {
          throw error;
        }
        
        if (attempt < this.maxRetries - 1) {
          await this.delay(Math.pow(2, attempt) * 1000);
          continue;
        }
      }
    }
    
    throw lastError || new Error('Failed to call OpenAI API after retries');
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private parseQuizResponse(response: string, request: GenerateQuizRequest): Quiz {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : response;
      const parsedResponse = JSON.parse(jsonStr);
      
      if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
        throw new Error('Invalid response format: missing questions array');
      }

      const questions: QuizQuestion[] = parsedResponse.questions.map((q: any, index: number) => ({
        id: q.id || `q_${Date.now()}_${index}`,
        type: q.type || 'mcq',
        prompt: q.prompt || q.question || '',
        choices: q.choices,
        answer: q.answer,
        explanation: q.explanation,
        sourceRef: q.sourceRef || {
          id: request.chunks[0]?.source.id || 'unknown',
          title: request.chunks[0]?.source.title || 'Study Material',
          range: q.sourceRef?.range || `Question ${index + 1}`
        },
        difficulty: q.difficulty || request.preferences.difficulty,
      }));

      return {
        id: `quiz_${Date.now()}`,
        title: request.title || parsedResponse.title || `Quiz from ${request.chunks[0]?.source.title || 'Study Materials'}`,
        questions,
        createdAt: Date.now(),
      };

    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      console.error('Raw response:', response);
      
      // Fallback: create a simple quiz with an error message
      return {
        id: `quiz_${Date.now()}`,
        title: request.title || 'Generated Quiz',
        questions: [{
          id: `error_${Date.now()}`,
          type: 'short',
          prompt: 'Error: Could not parse AI response. Please try again.',
          answer: 'N/A',
          sourceRef: {
            id: 'error',
            title: 'System Error',
            range: 'N/A'
          },
          difficulty: 1,
        }],
        createdAt: Date.now(),
      };
    }
  }
  
  private buildSystemPrompt(preferences: StudyPreferences): string {
    const basePrompt = `You are an expert educational content creator specializing in generating high-quality assessment questions. Your task is to create quiz questions that test understanding, application, and critical thinking based on the provided study material.

Requirements:
- Generate questions that match the specified types and difficulty level
- Ensure questions are clear, unambiguous, and educational
- For multiple choice questions, provide exactly 4 options with only one correct answer
- Include source references for each question
- Provide explanations when requested
- Focus on key concepts and practical applications rather than trivial details

Output Format:
Respond with valid JSON matching this exact schema:
{
  "questions": [
    {
      "id": "string",
      "type": "mcq" | "short" | "code",
      "prompt": "string",
      "choices": ["string"] (only for mcq),
      "answer": string | number | string[],
      "explanation": "string" (optional),
      "sourceRef": {
        "id": "string",
        "title": "string",
        "range": "string"
      },
      "difficulty": 1 | 2 | 3 | 4 | 5
    }
  ]
}`;
    
    return withPromptContext(basePrompt, preferences);
  }
  
  private buildUserPrompt(request: GenerateQuizRequest): string {
    const { chunks, preferences } = request;
    
    let prompt = `Generate ${preferences.quizConfig.numQuestions} quiz questions using the following content:\n\n`;
    
    chunks.forEach((chunk, index) => {
      prompt += `--- Content ${index + 1}: ${chunk.source.title} ---\n`;
      prompt += `${chunk.content.substring(0, 1500)}...\n\n`; // Limit content length
    });
    
    prompt += `Question Types Required: ${preferences.quizConfig.types.join(', ')}\n`;
    prompt += `Difficulty Level: ${preferences.difficulty}/5\n`;
    prompt += `Include Explanations: ${preferences.includeExplanations ? 'Yes' : 'No'}\n\n`;
    prompt += `Generate the quiz questions now.`;
    
    return prompt;
  }
  
  isAvailable(): boolean {
    return !!this.apiKey;
  }
  
  getModelInfo() {
    return { name: this.model, provider: 'OpenAI' };
  }
}

// Client factory
export function createLLMClient(config?: { 
  provider?: 'openai' | 'mock'; 
  apiKey?: string; 
  model?: string;
  baseURL?: string;
  maxRetries?: number;
  timeout?: number;
}): LLMClient {
  const provider = config?.provider || 'mock';
  
  switch (provider) {
    case 'openai':
      if (!config?.apiKey) {
        console.warn('No OpenAI API key provided, falling back to mock client');
        return new MockLLMClient();
      }
      return new OpenAIClient(
        config.apiKey, 
        config.model,
        config.baseURL,
        config.maxRetries,
        config.timeout
      );
    
    case 'mock':
    default:
      return new MockLLMClient();
  }
}

// Default client instance - will use environment configuration if available
export const defaultLLMClient = createLLMClient();