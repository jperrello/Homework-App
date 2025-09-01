// Prompt Context Builder - Converts user preferences to LLM directives
import { StudyPreferences } from '../../models/preferences';

export interface PromptContext {
  summary: string; // one-paragraph summary of user preferences
  directives: string[]; // normalized, deduplicated rules
  variables: Record<string, string | number | boolean>;
}

/**
 * Builds a comprehensive prompt context from user study preferences
 * This context should be prepended to all LLM interactions in the app
 */
export function buildPromptContext(prefs: StudyPreferences): PromptContext {
  const directives: string[] = [];
  const variables: Record<string, string | number | boolean> = {};

  // Reading level directives
  switch (prefs.readingLevel) {
    case 'concise':
      directives.push('Provide brief, to-the-point explanations');
      directives.push('Use bullet points and short sentences');
      variables.verbosity = 'low';
      break;
    case 'detailed':
      directives.push('Provide comprehensive explanations with examples');
      directives.push('Include background context where relevant');
      variables.verbosity = 'high';
      break;
  }

  // Tone directives
  switch (prefs.tone) {
    case 'neutral':
      directives.push('Maintain a formal, academic tone');
      directives.push('Focus on facts and objective information');
      variables.tone = 'formal';
      break;
    case 'friendly':
      directives.push('Use a conversational, encouraging tone');
      directives.push('Include motivational language and positive reinforcement');
      variables.tone = 'conversational';
      break;
    case 'challenging':
      directives.push('Use a direct, focused approach');
      directives.push('Challenge the student to think critically');
      variables.tone = 'challenging';
      break;
  }

  // Language directives
  if (prefs.targetLanguage === 'es') {
    directives.push('Respond in Spanish');
    variables.language = 'spanish';
  } else {
    variables.language = 'english';
  }

  // Difficulty level directives
  switch (prefs.difficulty) {
    case 1:
      directives.push('Focus on foundational concepts and basic understanding');
      directives.push('Avoid complex terminology without explanation');
      break;
    case 2:
      directives.push('Build upon basic concepts with elementary applications');
      directives.push('Introduce intermediate terminology with context');
      break;
    case 3:
      directives.push('Present standard college-level concepts');
      directives.push('Balance theory with practical applications');
      break;
    case 4:
      directives.push('Include challenging applications and advanced concepts');
      directives.push('Encourage deeper analytical thinking');
      break;
    case 5:
      directives.push('Present expert-level material with complex problem solving');
      directives.push('Focus on synthesis and advanced critical analysis');
      break;
  }
  variables.difficulty = prefs.difficulty;

  // Study mode directives
  switch (prefs.studyMode) {
    case 'flashcards':
      directives.push('Format responses suitable for flashcard-style learning');
      directives.push('Focus on key facts and definitions');
      break;
    case 'quizzes':
      directives.push('Emphasize testable knowledge and application');
      directives.push('Include practice questions when appropriate');
      break;
    case 'notes':
      directives.push('Provide comprehensive study notes format');
      directives.push('Organize information hierarchically');
      break;
    case 'mixed':
      directives.push('Adapt content format based on the specific learning context');
      break;
  }
  variables.studyMode = prefs.studyMode;

  // Learning assistance directives
  if (prefs.allowHints) {
    directives.push('Provide hints and guidance when the student seems stuck');
  } else {
    directives.push('Avoid giving direct hints; encourage independent thinking');
  }
  variables.hintsAllowed = prefs.allowHints;

  if (prefs.includeExplanations) {
    directives.push('Always include explanations for answers and concepts');
    directives.push('Explain the reasoning behind correct and incorrect responses');
  } else {
    directives.push('Keep explanations minimal unless specifically requested');
  }
  variables.explanationsIncluded = prefs.includeExplanations;

  // Quiz configuration
  variables.quizQuestionCount = prefs.quizConfig.numQuestions;
  variables.quizTypes = prefs.quizConfig.types.join(', ');

  // Session timing
  variables.sessionLength = prefs.timePerSessionMins;

  // Content sources
  variables.contentSources = prefs.sourcesInclude.join(', ');

  // Custom instructions (highest priority)
  if (prefs.customInstructions.trim()) {
    directives.unshift(prefs.customInstructions.trim());
  }

  // Remove duplicates and normalize directives
  const uniqueDirectives = Array.from(new Set(directives))
    .filter(directive => directive.length > 0)
    .map(directive => directive.trim().replace(/\.$/, '') + '.'); // Ensure period at end

  // Build summary
  const summary = buildSummary(prefs, uniqueDirectives.length);

  return {
    summary,
    directives: uniqueDirectives,
    variables,
  };
}

/**
 * Helper function to create a concise summary of user preferences
 */
function buildSummary(prefs: StudyPreferences, directiveCount: number): string {
  const components: string[] = [];
  
  components.push(`Student prefers ${prefs.readingLevel} explanations`);
  components.push(`with a ${prefs.tone} tone`);
  components.push(`at difficulty level ${prefs.difficulty}/5`);
  
  if (prefs.studyMode !== 'mixed') {
    components.push(`focusing on ${prefs.studyMode}-based learning`);
  }
  
  if (prefs.customInstructions.trim()) {
    components.push(`with specific custom requirements`);
  }
  
  const sessionInfo = `Study sessions are typically ${prefs.timePerSessionMins} minutes long`;
  components.push(sessionInfo);
  
  return `${components.join(', ')}. ${directiveCount} specific preferences configured.`;
}

/**
 * Helper to prepend prompt context to any system prompt
 */
export function withPromptContext(baseSystemPrompt: string, prefs: StudyPreferences): string {
  const context = buildPromptContext(prefs);
  
  const contextHeader = [
    '=== STUDENT PREFERENCES ===',
    context.summary,
    '',
    'Please follow these specific directives:',
    ...context.directives.map((directive, i) => `${i + 1}. ${directive}`),
    '',
    '=== END PREFERENCES ===',
    '',
    baseSystemPrompt,
  ].join('\n');
  
  return contextHeader;
}

/**
 * Lightweight version that just adds essential context
 */
export function withEssentialContext(baseSystemPrompt: string, prefs: StudyPreferences): string {
  const context = buildPromptContext(prefs);
  
  const essentialDirectives = context.directives.filter(directive => 
    directive.includes('tone') || 
    directive.includes('difficulty') ||
    directive.includes('language') ||
    directive.includes(prefs.customInstructions)
  );
  
  if (essentialDirectives.length === 0) {
    return baseSystemPrompt;
  }
  
  const lightContextHeader = [
    'Student preferences:',
    ...essentialDirectives.map(directive => `- ${directive}`),
    '',
    baseSystemPrompt,
  ].join('\n');
  
  return lightContextHeader;
}

export default buildPromptContext;