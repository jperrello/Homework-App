// Emoji Resolution System
// Provides consistent emoji usage across the app and replaces question marks

export type EmojiContext = 
  | 'study'
  | 'quiz'
  | 'flashcard'
  | 'success'
  | 'error'
  | 'warning'
  | 'loading'
  | 'progress'
  | 'achievement'
  | 'course'
  | 'module'
  | 'assignment'
  | 'file'
  | 'settings'
  | 'user'
  | 'time'
  | 'difficulty'
  | 'book'
  | 'learn'
  | 'graduate'
  | 'sparkle'
  | 'brain'
  | 'focus'
  | 'navigation'
  | 'create'
  | 'edit'
  | 'delete'
  | 'search'
  | 'filter'
  | 'sync'
  | 'notification'
  | 'chat'
  | 'ai'
  | 'analytics'
  | 'streak'
  | 'calendar'
  | 'knowledge'
  | 'practice'
  | 'review'
  | 'new'
  | 'completed'
  | 'due'
  | 'overdue';

// Emoji mapping with contextual variations
const emojiMap: Record<EmojiContext, string | string[]> = {
  // Study-related
  study: '📚',
  quiz: '📝',
  flashcard: '💳',
  practice: '🎯',
  review: '🔍',
  knowledge: '🧠',
  
  // Status and feedback
  success: '✅',
  error: '❌',
  warning: '⚠️',
  loading: '⏳',
  progress: '⚡',
  achievement: '🏆',
  
  // Content types
  course: '📖',
  module: '📋',
  assignment: '📄',
  file: '📎',
  
  // App sections
  settings: '⚙️',
  user: '👤',
  analytics: '📊',
  chat: '💬',
  ai: '🤖',
  
  // Time and scheduling
  time: '🕐',
  calendar: '📅',
  streak: '🔥',
  due: '⏰',
  overdue: '🚨',
  
  // Academic theme
  book: '📚',
  learn: '📖',
  graduate: '🎓',
  sparkle: ['✨', '⭐', '💫'],
  brain: '🧠',
  focus: '🎯',
  
  // Actions
  create: '➕',
  edit: '✏️',
  delete: '🗑️',
  search: '🔍',
  filter: '🔽',
  sync: '🔄',
  navigation: '🧭',
  
  // Content state
  new: '🆕',
  completed: '✅',
  notification: '🔔',
  
  // Difficulty levels
  difficulty: ['🟢', '🟡', '🔴'], // easy, medium, hard
};

/**
 * Resolves an emoji for a given context
 * @param context - The context for which to get an emoji
 * @param variant - Optional variant index for contexts with multiple options
 * @returns The appropriate emoji string
 */
export function resolveEmoji(context: EmojiContext, variant?: number): string {
  const emoji = emojiMap[context];
  
  if (Array.isArray(emoji)) {
    const index = variant !== undefined ? variant % emoji.length : 0;
    return emoji[index];
  }
  
  return emoji;
}

/**
 * Gets a random emoji from a context that has multiple options
 * @param context - The context for which to get a random emoji
 * @returns A random emoji from the context, or the single emoji if not an array
 */
export function getRandomEmoji(context: EmojiContext): string {
  const emoji = emojiMap[context];
  
  if (Array.isArray(emoji)) {
    return emoji[Math.floor(Math.random() * emoji.length)];
  }
  
  return emoji;
}

/**
 * Gets difficulty emoji based on difficulty level
 * @param difficulty - 'easy' | 'medium' | 'hard' or 1-5 scale
 * @returns Appropriate difficulty emoji
 */
export function getDifficultyEmoji(difficulty: string | number): string {
  if (typeof difficulty === 'string') {
    switch (difficulty) {
      case 'easy': return resolveEmoji('difficulty', 0);
      case 'medium': return resolveEmoji('difficulty', 1);
      case 'hard': return resolveEmoji('difficulty', 2);
      default: return resolveEmoji('difficulty', 1);
    }
  }
  
  // Handle numeric difficulty (1-5 scale)
  if (difficulty <= 2) return resolveEmoji('difficulty', 0); // easy
  if (difficulty <= 4) return resolveEmoji('difficulty', 1); // medium
  return resolveEmoji('difficulty', 2); // hard
}

/**
 * Gets achievement emoji based on progress/score
 * @param progress - Progress percentage (0-100) or achievement level
 * @returns Appropriate achievement emoji
 */
export function getAchievementEmoji(progress: number): string {
  if (progress >= 100) return '🎓';
  if (progress >= 80) return '🏆';
  if (progress >= 60) return '🥉';
  if (progress >= 40) return '📚';
  return '💪';
}

/**
 * Gets a contextual sparkle emoji (for academic achievements)
 * @param context - Optional context for sparkle type selection
 * @returns A sparkle emoji appropriate for the context
 */
export function getSparkleEmoji(context?: 'twinkle' | 'bright' | 'shooting'): string {
  switch (context) {
    case 'twinkle': return '✨';
    case 'bright': return '⭐';
    case 'shooting': return '💫';
    default: return getRandomEmoji('sparkle');
  }
}

// Helper to replace any literal "?" with appropriate contextual emoji
export function replaceQuestionMarks(text: string, context: EmojiContext = 'study'): string {
  return text.replace(/\?(?!\w)/g, resolveEmoji(context));
}

// Message helper for internationalization support (future-proofing)
export function message(key: string, context?: EmojiContext): string {
  // For now, return the key as-is, but replace question marks if context provided
  if (context && key.includes('?')) {
    return replaceQuestionMarks(key, context);
  }
  return key;
}

export default {
  resolve: resolveEmoji,
  random: getRandomEmoji,
  difficulty: getDifficultyEmoji,
  achievement: getAchievementEmoji,
  star: getStarEmoji,
  replaceQuestionMarks,
  message,
};