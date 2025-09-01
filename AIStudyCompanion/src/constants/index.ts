// App Configuration
export const APP_CONFIG = {
  name: 'AI Study Companion',
  version: '1.0.0',
  author: 'Canvas Study Team',
};

// Canvas API Configuration
export const CANVAS_CONFIG = {
  // These would be configured per institution
  BASE_URL: 'https://your-institution.instructure.com/api/v1',
  CLIENT_ID: 'your-canvas-client-id',
  REDIRECT_URI: 'aistudycompanion://oauth',
  SCOPES: [
    'url:GET|/api/v1/courses',
    'url:GET|/api/v1/courses/:course_id/assignments',
    'url:GET|/api/v1/courses/:course_id/modules',
    'url:GET|/api/v1/courses/:course_id/files',
    'url:GET|/api/v1/users/self',
    'url:GET|/api/v1/users/:user_id/courses',
  ].join(' '),
};

// AI Service Configuration
export const AI_CONFIG = {
  DEFAULT_MODEL: 'gpt-4',
  MAX_TOKENS: 2000,
  TEMPERATURE: 0.7,
  GENERATION_TIMEOUT: 30000, // 30 seconds
};

// Spaced Repetition Algorithm Settings (SM-2 Algorithm)
export const SPACED_REPETITION = {
  MIN_EASE_FACTOR: 1.3,
  MAX_EASE_FACTOR: 2.5,
  INITIAL_EASE_FACTOR: 2.5,
  INITIAL_INTERVAL: 1, // days
  EASE_FACTOR_CHANGE: 0.1,
  MIN_INTERVAL: 1, // days
  MAX_INTERVAL: 365, // days
  
  // Quality ratings
  QUALITY_RATINGS: {
    BLACKOUT: 0,      // Complete blackout
    INCORRECT: 1,     // Incorrect response, correct answer remembered
    INCORRECT_EASY: 2, // Incorrect response, correct answer seemed easy to recall
    CORRECT_HARD: 3,  // Correct response recalled with serious difficulty
    CORRECT_HESITANT: 4, // Correct response after hesitation
    CORRECT_EASY: 5,  // Perfect response
  },
};

// Study Session Settings
export const STUDY_SETTINGS = {
  DEFAULT_DAILY_GOAL: 30, // minutes
  MIN_SESSION_LENGTH: 5,  // minutes
  MAX_SESSION_LENGTH: 120, // minutes
  BREAK_REMINDER_INTERVAL: 25, // minutes (Pomodoro-style)
  DEFAULT_FLASHCARDS_PER_SESSION: 20,
  DEFAULT_QUIZ_QUESTIONS: 10,
};

// Content Generation Settings
export const CONTENT_GENERATION = {
  MAX_FLASHCARDS_PER_TOPIC: 50,
  MAX_QUIZ_QUESTIONS: 20,
  SUMMARY_MAX_LENGTH: 500, // words
  VIDEO_MAX_DURATION: 60, // seconds
  PODCAST_MAX_DURATION: 300, // seconds (5 minutes)
  
  // Content types
  CONTENT_TYPES: {
    FLASHCARD: 'flashcard',
    QUIZ: 'quiz',
    SUMMARY: 'summary',
    VIDEO: 'video',
    PODCAST: 'podcast',
    REFLECTION: 'reflection',
  },
};

// Custom Instructions Defaults
export const DEFAULT_CUSTOM_INSTRUCTIONS = {
  tone: 'friendly' as const,
  detail_level: 'moderate' as const,
  use_examples: true,
  use_analogies: true,
  focus_areas: ['key_concepts', 'problem_solving'],
  language_preference: 'english',
  format_preference: 'mixed' as const,
};

// Reflection Prompt Types
export const REFLECTION_TYPES = {
  UNDERSTANDING: 'understanding',
  APPLICATION: 'application', 
  CONNECTION: 'connection',
  METACOGNITION: 'metacognition',
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  USER_DATA: 'user_data',
  CANVAS_TOKEN: 'canvas_token',
  CANVAS_URL: 'canvas_url',
  CUSTOM_INSTRUCTIONS: 'custom_instructions',
  STUDY_HISTORY: 'study_history',
  FLASHCARDS: 'flashcards',
  QUIZZES: 'quizzes',
  COURSES: 'courses',
  LAST_SYNC: 'last_sync',
} as const;

// Navigation Routes
export const ROUTES = {
  // Auth Stack
  WELCOME: 'Welcome',
  LOGIN: 'Login',
  CANVAS_AUTH: 'CanvasAuth',
  CREATE_ACCOUNT: 'CreateAccount',
  ACCOUNT_SETUP: 'AccountSetup',
  ENHANCED_CANVAS_AUTH: 'EnhancedCanvasAuth',
  
  // Main App Tabs
  STUDY_QUEUE: 'StudyQueue',
  CONTENT_CREATOR: 'ContentCreator',
  CHATBOT: 'Chatbot',
  SETTINGS: 'Settings',
  
  // Study Stack
  FLASHCARD_CREATION: 'FlashcardCreation',
  FLASHCARD_STUDY: 'FlashcardStudy',
  QUIZ_STUDY: 'QuizStudy',
  CONTENT_VIEWER: 'ContentViewer',
  
  // Settings Stack
  CUSTOM_INSTRUCTIONS: 'CustomInstructions',
  STUDY_PREFERENCES: 'StudyPreferences',
  CANVAS_SETTINGS: 'CanvasSettings',
  OPENAI_SETTINGS: 'OpenAISettings',
  DEV_TOKEN_MANAGER: 'DevTokenManager',
} as const;

// Colors and Theme - Study Progress Theme 🚀
export const THEME = {
  colors: {
    // Study theme colors
    primary: '#4C63D2', // Cosmic blue
    secondary: '#7C3AED', // Nebula purple
    success: '#10B981', // Alien green
    warning: '#F59E0B', // Solar orange
    error: '#EF4444', // Mars red
    background: '#0F0F23', // Deep navy
    surface: '#1A1B3A', // Dark surface
    text: '#E2E8F0', // Light text
    textSecondary: '#94A3B8', // Secondary gray
    border: '#334155', // Border gray
    
    // Special theme colors
    rocket: '#FF6B35', // Accent orange
    moon: '#FEF3C7', // Golden yellow
    stars: '#FCD34D', // Bright gold
    galaxy: '#8B5CF6', // Purple accent
    earth: '#3B82F6', // Blue accent
    cosmic: 'rgba(124, 58, 237, 0.3)', // Purple mist
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
  },
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
  CANVAS_AUTH_FAILED: 'Canvas authentication failed. Please try again.',
  CANVAS_API_ERROR: 'Error connecting to Canvas. Please check your settings.',
  AI_GENERATION_FAILED: 'Failed to generate study content. Please try again.',
  STORAGE_ERROR: 'Error saving data locally. Please check your device storage.',
  INVALID_INPUT: 'Invalid input. Please check your data and try again.',
};