import {
  AI_PROVIDER,
  OPENAI_API_KEY,
  OPENAI_BASE_URL,
  OPENAI_MODEL,
  AI_MAX_TOKENS,
  AI_TEMPERATURE,
  AI_TIMEOUT,
  SUMMARY_MODEL,
  FLASHCARD_MODEL,
  QUIZ_MODEL,
  CHAT_MODEL,
} from '@env';

export type AIProvider = 'openai' | 'anthropic' | 'openrouter' | 'local';

export interface AIProviderConfig {
  apiKey?: string;
  baseURL: string;
  defaultModel: string;
  headers?: Record<string, string>;
  maxTokens: number;
  temperature: number;
  timeout: number;
}

export interface AIModelConfig {
  summary: string;
  flashcard: string;
  quiz: string;
  chat: string;
}

class AIConfigManager {
  private provider: AIProvider;
  private config: AIProviderConfig;
  private models: AIModelConfig;

  constructor() {
    this.provider = (AI_PROVIDER || 'openai') as AIProvider;
    this.config = this.getProviderConfig();
    this.models = this.getModelConfig();
  }

  private getProviderConfig(): AIProviderConfig {
    const baseConfig = {
      maxTokens: parseInt(AI_MAX_TOKENS) || 2000,
      temperature: parseFloat(AI_TEMPERATURE) || 0.7,
      timeout: parseInt(AI_TIMEOUT) || 30000,
    };

    switch (this.provider) {
      case 'openai':
        return {
          ...baseConfig,
          apiKey: OPENAI_API_KEY,
          baseURL: OPENAI_BASE_URL || 'https://api.openai.com/v1',
          defaultModel: OPENAI_MODEL || 'gpt-4o-mini',
          headers: {
            'Content-Type': 'application/json',
          },
        };

      default:
        throw new Error(`Unsupported AI provider: ${this.provider}`);
    }
  }

  private getModelConfig(): AIModelConfig {
    return {
      summary: SUMMARY_MODEL || this.config.defaultModel,
      flashcard: FLASHCARD_MODEL || this.config.defaultModel,
      quiz: QUIZ_MODEL || this.config.defaultModel,
      chat: CHAT_MODEL || this.config.defaultModel,
    };
  }

  getProvider(): AIProvider {
    return this.provider;
  }

  getConfig(): AIProviderConfig {
    return this.config;
  }

  getModels(): AIModelConfig {
    return this.models;
  }

  getModelForTask(task: keyof AIModelConfig): string {
    return this.models[task];
  }

  isConfigured(): boolean {
    if (this.provider === 'local') {
      return !!this.config.baseURL;
    }
    return !!this.config.apiKey;
  }

  getAuthHeaders(): Record<string, string> {
    const headers = { ...this.config.headers };

    if (this.config.apiKey) {
      switch (this.provider) {
        case 'openai':
        case 'openrouter':
        case 'local':
          headers['Authorization'] = `Bearer ${this.config.apiKey}`;
          break;
        case 'anthropic':
          headers['x-api-key'] = this.config.apiKey;
          break;
      }
    }

    return headers;
  }

  buildEndpointURL(endpoint: string): string {
    return `${this.config.baseURL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  }

  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.baseURL) {
      errors.push('Base URL is required');
    }

    if (this.provider !== 'local' && !this.config.apiKey) {
      errors.push(`API key is required for ${this.provider}`);
    }

    if (!this.config.defaultModel) {
      errors.push('Default model is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default new AIConfigManager();