import AsyncStorage from '@react-native-async-storage/async-storage';
import { createLLMClient, LLMClient } from '../lib/llm/client';
import aiConfig from '../utils/aiConfig';
import { OPENAI_API_KEY } from '@env';

const OPENAI_CONFIG_STORAGE = 'openai_config';

export interface OpenAIConfig {
  model: string;
  baseURL: string;
  maxRetries: number;
  timeout: number;
}

class OpenAIService {
  private client: LLMClient | null = null;
  private config: OpenAIConfig;

  constructor() {
    this.config = {
      model: 'gpt-4o-mini',
      baseURL: 'https://api.openai.com/v1',
      maxRetries: 3,
      timeout: 30000,
    };
    this.initializeClient();
  }

  private async initializeClient(): Promise<void> {
    try {
      // Load saved configuration 
      await this.loadConfig();
      
      // Use environment API key
      const apiKey = OPENAI_API_KEY || aiConfig.getConfig().apiKey;
      
      if (apiKey) {
        this.client = createLLMClient({
          provider: 'openai',
          apiKey,
          model: this.config.model,
          baseURL: this.config.baseURL,
          maxRetries: this.config.maxRetries,
          timeout: this.config.timeout,
        });
      } else {
        console.warn('No OpenAI API key found in environment variables, falling back to mock client');
        this.client = createLLMClient({ provider: 'mock' });
      }
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error);
      this.client = createLLMClient({ provider: 'mock' });
    }
  }

  getApiKeyStatus(): { configured: boolean; source: string } {
    const envKey = OPENAI_API_KEY;
    const configKey = aiConfig.getConfig().apiKey;
    
    if (envKey) {
      return { configured: true, source: 'Environment Variable' };
    } else if (configKey) {
      return { configured: true, source: 'Configuration File' };
    } else {
      return { configured: false, source: 'Not configured' };
    }
  }

  private getApiKey(): string | null {
    return OPENAI_API_KEY || aiConfig.getConfig().apiKey || null;
  }

  async loadConfig(): Promise<void> {
    try {
      const savedConfig = await AsyncStorage.getItem(OPENAI_CONFIG_STORAGE);
      if (savedConfig) {
        this.config = { ...this.config, ...JSON.parse(savedConfig) };
      }
    } catch (error) {
      console.error('Error loading OpenAI config:', error);
    }
  }

  async saveConfig(config: Partial<OpenAIConfig>): Promise<boolean> {
    try {
      this.config = { ...this.config, ...config };
      await AsyncStorage.setItem(OPENAI_CONFIG_STORAGE, JSON.stringify(this.config));
      
      // Reinitialize client with new config and environment API key
      await this.initializeClient();
      
      return true;
    } catch (error) {
      console.error('Error saving OpenAI config:', error);
      return false;
    }
  }

  validateApiKey(): { valid: boolean; error?: string } {
    const keyToTest = this.getApiKey();
    
    if (!keyToTest) {
      return { valid: false, error: 'No API key configured in environment variables' };
    }

    // Basic format validation
    if (keyToTest.startsWith('sk-') && keyToTest.length > 40) {
      return { valid: true };
    } else {
      return { valid: false, error: 'Invalid API key format in environment variables' };
    }
  }

  getClient(): LLMClient {
    if (!this.client) {
      // Return mock client if not initialized
      return createLLMClient({ provider: 'mock' });
    }
    return this.client;
  }

  getConfig(): OpenAIConfig {
    return { ...this.config };
  }

  isConfigured(): boolean {
    return this.client?.isAvailable() || false;
  }

  getModelInfo(): { name: string; provider: string } {
    return this.client?.getModelInfo() || { name: 'Not configured', provider: 'None' };
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const client = this.getClient();
      
      if (!client.isAvailable()) {
        return { success: false, error: 'OpenAI client not configured' };
      }

      // Test with a minimal quiz generation request
      const testRequest = {
        chunks: [{
          id: 'test_chunk',
          content: 'This is a test content about mathematics. Addition is combining two or more numbers to get a sum.',
          source: {
            id: 'test_source',
            title: 'Test Material',
            type: 'assignment' as const
          }
        }],
        preferences: {
          difficulty: 1 as const,
          quizConfig: {
            numQuestions: 1,
            types: ['mcq' as const]
          },
          includeExplanations: true,
          preferred_study_times: [],
          session_length_minutes: 15
        },
        title: 'Connection Test Quiz'
      };

      await client.generateQuiz(testRequest);
      return { success: true };
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('Invalid OpenAI API key')) {
        return { success: false, error: 'Invalid API key' };
      } else if (errorMessage.includes('rate limit')) {
        return { success: false, error: 'Rate limit exceeded' };
      } else if (errorMessage.includes('Network error')) {
        return { success: false, error: 'Network connection failed' };
      } else {
        return { success: false, error: `Connection test failed: ${errorMessage}` };
      }
    }
  }
}

export default new OpenAIService();