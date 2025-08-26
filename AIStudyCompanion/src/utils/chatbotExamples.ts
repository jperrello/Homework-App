// Example queries to demonstrate chatbot functionality

export const EXAMPLE_QUERIES = [
  // Assignment-related queries
  "What assignments do I have to complete in CS 101?",
  "What assignments are due this week in my biology class?",
  "Show me upcoming deadlines for Data Structures",
  "What homework do I have for MATH 200?",
  
  // Study material queries
  "What are the main points I need to study in the first few weeks of Physics?",
  "What should I focus on for my chemistry course?",
  "Help me understand the key concepts in my statistics class",
  "What topics are covered in the beginning of Computer Science?",
  
  // General study queries
  "How should I prepare for my midterm exams?",
  "What study materials are available for my courses?",
  "Help me create a study schedule",
  "I need help organizing my coursework",
];

export const COURSE_NAME_PATTERNS = [
  // Common course naming patterns to help with recognition
  /([A-Z]{2,4}\s*\d{2,4})/g,           // CS101, MATH 200, PHYS101
  /(Computer Science|Biology|Physics|Chemistry|Mathematics|History|English|Psychology)/gi,
  /(Data Structures|Calculus|Organic Chemistry|World History|Creative Writing)/gi,
];

export const ASSIGNMENT_KEYWORDS = [
  'assignment', 'homework', 'project', 'essay', 'paper', 'lab', 'quiz', 'exam',
  'midterm', 'final', 'presentation', 'report', 'submission', 'due', 'deadline'
];

export const STUDY_KEYWORDS = [
  'study', 'learn', 'review', 'understand', 'prepare', 'focus', 'practice',
  'main points', 'key concepts', 'important topics', 'material', 'content'
];

export const TIME_KEYWORDS = [
  'first few weeks', 'beginning', 'start', 'early', 'initial', 'week 1', 'week 2',
  'this week', 'next week', 'upcoming', 'soon', 'today', 'tomorrow'
];

// Helper function to generate suggested queries based on user's courses
export function generateSuggestedQueries(courses: Array<{ name: string; course_code: string }>): string[] {
  if (courses.length === 0) {
    return EXAMPLE_QUERIES.slice(0, 4);
  }

  const suggestions = [];
  const sampleCourse = courses[0];
  
  suggestions.push(
    `What assignments do I have in ${sampleCourse.course_code}?`,
    `What are the main topics in ${sampleCourse.name}?`,
    `Show me what's due this week in my courses`,
    `Help me study for ${sampleCourse.name}`
  );

  return suggestions;
}