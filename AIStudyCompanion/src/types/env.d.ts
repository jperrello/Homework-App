declare module '@env' {
  export const AI_PROVIDER: string;
  
  // OpenAI
  export const OPENAI_API_KEY: string;
  export const OPENAI_BASE_URL: string;
  export const OPENAI_MODEL: string;
  
  // Anthropic
  export const ANTHROPIC_API_KEY: string;
  export const ANTHROPIC_BASE_URL: string;
  export const ANTHROPIC_MODEL: string;
  
  // OpenRouter
  export const OPENROUTER_API_KEY: string;
  export const OPENROUTER_BASE_URL: string;
  export const OPENROUTER_MODEL: string;
  
  // Local AI
  export const LOCAL_BASE_URL: string;
  export const LOCAL_MODEL: string;
  
  // Canvas
  export const CANVAS_API_KEY: string;
  export const CANVAS_API_URL: string;
  
  // AI Settings
  export const AI_MAX_TOKENS: string;
  export const AI_TEMPERATURE: string;
  export const AI_TIMEOUT: string;
  
  // Content Generation Models
  export const SUMMARY_MODEL: string;
  export const FLASHCARD_MODEL: string;
  export const QUIZ_MODEL: string;
  export const CHAT_MODEL: string;
}