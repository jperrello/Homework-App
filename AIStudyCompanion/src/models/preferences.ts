// Preferences Data Model
// Single source of truth for study preferences and custom instructions

export type StudyMode = "flashcards" | "quizzes" | "notes" | "mixed";

export type ReadingLevel = "concise" | "detailed";
export type Tone = "neutral" | "friendly" | "challenging";
export type TargetLanguage = "en" | "es";
export type Difficulty = 1 | 2 | 3 | 4 | 5;

export type QuizType = "mcq" | "short" | "code";
export type SourceType = "files" | "modules" | "assignments";

export interface QuizConfig {
  numQuestions: number;
  types: QuizType[];
}

export interface StudyPreferences {
  // Reading and comprehension
  readingLevel: ReadingLevel;
  tone: Tone;
  targetLanguage: TargetLanguage;
  difficulty: Difficulty; // 1 = easiest, 5 = hardest
  
  // Study session configuration
  timePerSessionMins: number; // 10–90
  studyMode: StudyMode;
  
  // Quiz configuration
  quizConfig: QuizConfig;
  
  // Content sources
  sourcesInclude: SourceType[];
  
  // Learning assistance
  allowHints: boolean;
  includeExplanations: boolean;
  
  // Free-form custom instructions
  customInstructions: string;
}

// Default preferences
export const defaultPreferences: StudyPreferences = {
  readingLevel: "detailed",
  tone: "friendly",
  targetLanguage: "en",
  difficulty: 3,
  timePerSessionMins: 30,
  studyMode: "mixed",
  quizConfig: {
    numQuestions: 10,
    types: ["mcq", "short"],
  },
  sourcesInclude: ["files", "modules", "assignments"],
  allowHints: true,
  includeExplanations: true,
  customInstructions: "",
};

// Validation functions
export function validatePreferences(prefs: Partial<StudyPreferences>): string[] {
  const errors: string[] = [];
  
  if (prefs.timePerSessionMins !== undefined) {
    if (prefs.timePerSessionMins < 10 || prefs.timePerSessionMins > 90) {
      errors.push("Study session time must be between 10 and 90 minutes");
    }
  }
  
  if (prefs.difficulty !== undefined) {
    if (prefs.difficulty < 1 || prefs.difficulty > 5) {
      errors.push("Difficulty must be between 1 and 5");
    }
  }
  
  if (prefs.quizConfig?.numQuestions !== undefined) {
    if (prefs.quizConfig.numQuestions < 1 || prefs.quizConfig.numQuestions > 50) {
      errors.push("Number of quiz questions must be between 1 and 50");
    }
  }
  
  if (prefs.customInstructions !== undefined) {
    if (prefs.customInstructions.length > 1000) {
      errors.push("Custom instructions must be less than 1000 characters");
    }
  }
  
  return errors;
}

// Helper functions for UI labels
export function getReadingLevelLabel(level: ReadingLevel): string {
  switch (level) {
    case "concise": return "Concise (brief summaries)";
    case "detailed": return "Detailed (comprehensive explanations)";
  }
}

export function getToneLabel(tone: Tone): string {
  switch (tone) {
    case "neutral": return "Neutral (formal, academic)";
    case "friendly": return "Friendly (conversational, encouraging)";
    case "challenging": return "Challenging (direct, focused on mastery)";
  }
}

export function getDifficultyLabel(difficulty: Difficulty): string {
  const labels = {
    1: "Beginner (foundations and basics)",
    2: "Elementary (building understanding)", 
    3: "Intermediate (standard college level)",
    4: "Advanced (challenging applications)",
    5: "Expert (complex problem solving)",
  };
  return labels[difficulty];
}

export function getStudyModeLabel(mode: StudyMode): string {
  switch (mode) {
    case "flashcards": return "Flashcards Only";
    case "quizzes": return "Quizzes Only";
    case "notes": return "Study Notes Only";
    case "mixed": return "Mixed (flashcards, quizzes, notes)";
  }
}

export function getQuizTypeLabel(type: QuizType): string {
  switch (type) {
    case "mcq": return "Multiple Choice";
    case "short": return "Short Answer";
    case "code": return "Code Problems";
  }
}

export function getSourceTypeLabel(type: SourceType): string {
  switch (type) {
    case "files": return "Course Files & Documents";
    case "modules": return "Course Modules & Lessons";
    case "assignments": return "Assignments & Projects";
  }
}

// Migration support for versioning preferences
export const PREFERENCES_VERSION = 1;

export interface VersionedPreferences {
  version: number;
  preferences: StudyPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export function migratePreferences(
  stored: any,
  currentVersion: number = PREFERENCES_VERSION
): StudyPreferences {
  // Handle case where no stored preferences exist
  if (!stored) {
    return { ...defaultPreferences };
  }
  
  // Handle legacy format without version
  if (typeof stored.version === 'undefined') {
    return { ...defaultPreferences, ...stored };
  }
  
  // Handle current version
  if (stored.version === currentVersion) {
    return { ...defaultPreferences, ...stored.preferences };
  }
  
  // Handle future versions (backwards compatibility)
  if (stored.version > currentVersion) {
    console.warn('Preferences from newer app version detected, using defaults');
    return { ...defaultPreferences };
  }
  
  // Handle version migrations (when needed in the future)
  let migrated = stored.preferences || stored;
  
  // Future migration logic would go here
  // if (stored.version < 2) { ... }
  
  return { ...defaultPreferences, ...migrated };
}