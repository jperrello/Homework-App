// Canvas API Types
export interface CanvasUser {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
}

export interface CanvasCourse {
  id: number;
  name: string;
  course_code: string;
  enrollment_term_id: number;
  workflow_state: string;
  account_id: number;
  start_at?: string;
  end_at?: string;
}

export interface CanvasAssignment {
  id: number;
  name: string;
  description: string;
  due_at?: string;
  course_id: number;
  points_possible: number;
  submission_types: string[];
  workflow_state: string;
}

export interface CanvasModule {
  id: number;
  name: string;
  position: number;
  workflow_state: string;
  course_id: number;
  items?: CanvasModuleItem[];
}

export interface CanvasModuleItem {
  id: number;
  title: string;
  type: string;
  content_id?: number;
  html_url?: string;
  url?: string;
  page_url?: string;
  external_url?: string;
}

export interface CanvasFile {
  id: number;
  display_name: string;
  filename: string;
  content_type: string;
  url: string;
  size: number;
  created_at: string;
  updated_at: string;
  folder_id: number;
}

// Study Material Types
export interface FlashcardSet {
  id: string;
  name: string;
  description?: string;
  course_id: number;
  topic: string;
  practice_frequency: 'daily' | 'every_2_days' | 'weekly' | 'bi_weekly' | 'monthly' | 'custom';
  custom_frequency_days?: number;
  next_practice_date: Date;
  created_at: Date;
  updated_at: Date;
  flashcard_count: number;
  last_practiced?: Date;
  is_active: boolean;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  course_id: number;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  next_review: Date;
  interval: number; // days
  ease_factor: number; // for spaced repetition algorithm
  source_material?: string;
  created_at: Date;
  updated_at: Date;
  flashcard_set_id?: string; // Link to flashcard set
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  course_id: number;
  topic: string;
  created_at: Date;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correct_answer: string | string[];
  explanation?: string;
}

export interface StudySummary {
  id: string;
  title: string;
  content: string;
  course_id: number;
  topic: string;
  source_material: string;
  created_at: Date;
}

export interface StudyVideo {
  id: string;
  title: string;
  description: string;
  video_url: string;
  duration: number; // seconds
  course_id: number;
  topic: string;
  script: string;
  created_at: Date;
}

export interface StudyPodcast {
  id: string;
  title: string;
  description: string;
  audio_url: string;
  duration: number; // seconds
  course_id: number;
  topic: string;
  transcript: string;
  created_at: Date;
}

// AI and Personalization Types
export interface CustomInstructions {
  tone: 'casual' | 'formal' | 'friendly';
  detail_level: 'brief' | 'moderate' | 'detailed';
  use_examples: boolean;
  use_analogies: boolean;
  focus_areas: string[];
  language_preference: string;
  format_preference: 'bullet_points' | 'paragraphs' | 'mixed';
}

export interface ReflectionPrompt {
  id: string;
  prompt: string;
  type: 'understanding' | 'application' | 'connection' | 'metacognition';
  course_id?: number;
  topic?: string;
}

export interface StudentResponse {
  id: string;
  prompt_id: string;
  response: string;
  timestamp: Date;
  follow_up_generated?: boolean;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  metadata?: {
    course_id?: number;
    topic?: string;
    prompt_type?: string;
  };
}

// Spaced Repetition Types
export interface StudySession {
  id: string;
  date: Date;
  flashcards_studied: number;
  quizzes_taken: number;
  reflection_prompts_answered: number;
  total_study_time: number; // minutes
  course_ids: number[];
}

export interface SpacedRepetitionItem {
  id: string;
  item_id: string; // references flashcard or quiz
  item_type: 'flashcard' | 'quiz' | 'summary';
  next_review: Date;
  interval: number; // days
  ease_factor: number;
  repetition_count: number;
  last_quality: number; // 0-5 scale
}

// User Profile and Preferences Types
export interface UserPreferences {
  // Academic preferences
  favorite_subjects: string[];
  difficult_subjects: string[];
  preferred_learning_style: 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing' | 'mixed';
  study_goals: string[];
  
  // Study schedule preferences
  preferred_study_times: ('morning' | 'afternoon' | 'evening' | 'night')[];
  optimal_study_duration: number; // minutes
  break_frequency: number; // minutes between breaks
  
  // Personal interests and context
  hobbies: string[];
  career_goals: string[];
  previous_experience: string[];
  motivation_factors: string[];
  
  // Learning preferences
  difficulty_preference: 'gradual' | 'challenging' | 'mixed';
  content_format_preference: ('flashcards' | 'quizzes' | 'summaries' | 'videos' | 'audio' | 'interactive')[];
  explanation_style: 'detailed' | 'concise' | 'examples' | 'analogies';
  
  // AI interaction preferences
  feedback_frequency: 'immediate' | 'after_session' | 'weekly';
  encouragement_level: 'minimal' | 'moderate' | 'high';
  progress_tracking: 'detailed' | 'summary' | 'minimal';
}

// App State Types
export interface AppUser {
  canvas_user?: CanvasUser;
  custom_instructions: CustomInstructions;
  user_preferences?: UserPreferences;
  study_preferences: {
    daily_goal: number; // minutes
    notification_enabled: boolean;
    preferred_study_times: string[];
  };
  created_at: Date;
  last_active: Date;
}

export interface AppState {
  user: AppUser | null;
  courses: CanvasCourse[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error?: string;
}

// API Response Types
export interface APIResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}