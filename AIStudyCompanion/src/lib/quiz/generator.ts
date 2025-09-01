// Quiz Generator - High-level quiz generation orchestrator
import { z } from 'zod';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  LLMClient, 
  defaultLLMClient, 
  Quiz, 
  QuizQuestion, 
  ContentChunk,
  GenerateQuizRequest 
} from '../llm/client';
import { StudyPreferences } from '../../models/preferences';
import openaiService from '../../services/openaiService';

// Zod schema for quiz validation
const QuizQuestionSchema = z.object({
  id: z.string(),
  type: z.enum(['mcq', 'short', 'code']),
  prompt: z.string().min(1),
  choices: z.array(z.string()).optional(),
  answer: z.union([z.string(), z.number(), z.array(z.string())]),
  explanation: z.string().optional(),
  sourceRef: z.object({
    id: z.string(),
    title: z.string(),
    range: z.string().optional(),
  }).optional(),
  difficulty: z.number().min(1).max(5),
});

const QuizSchema = z.object({
  id: z.string(),
  title: z.string(),
  questions: z.array(QuizQuestionSchema),
  createdAt: z.number(),
});

// Source selection and content extraction
export interface SourceInfo {
  id: string;
  title: string;
  type: 'file' | 'module' | 'assignment';
  content?: string;
  metadata?: Record<string, any>;
}

export class QuizGenerator {
  private client: LLMClient;
  
  constructor(client?: LLMClient) {
    // Use OpenAI service client if available, fallback to provided client or default
    this.client = client || openaiService.getClient();
  }
  
  /**
   * Update the LLM client (useful for switching providers)
   */
  setClient(client: LLMClient) {
    this.client = client;
  }
  
  /**
   * Get the current client info
   */
  getClientInfo(): { name: string; provider: string } {
    return this.client.getModelInfo();
  }
  
  /**
   * Generate a quiz from selected sources
   */
  async generateFromSources(
    sources: SourceInfo[], 
    preferences: StudyPreferences,
    title?: string
  ): Promise<Quiz> {
    // Extract and chunk content
    const chunks = await this.extractContent(sources);
    
    if (chunks.length === 0) {
      throw new Error('No content could be extracted from the selected sources');
    }
    
    // Generate quiz
    const request: GenerateQuizRequest = {
      chunks,
      preferences,
      title: title || `Quiz: ${sources.map(s => s.title).join(', ')}`
    };
    
    const quiz = await this.client.generateQuiz(request);
    
    // Validate generated quiz
    const validatedQuiz = this.validateQuiz(quiz);
    
    // Store quiz locally
    await this.storeQuiz(validatedQuiz);
    
    return validatedQuiz;
  }
  
  /**
   * Extract and chunk content from sources
   */
  private async extractContent(sources: SourceInfo[]): Promise<ContentChunk[]> {
    const chunks: ContentChunk[] = [];
    
    for (const source of sources) {
      if (!source.content) {
        console.warn(`No content available for source: ${source.title}`);
        continue;
      }
      
      // Clean and chunk the content
      const cleanedContent = this.cleanContent(source.content);
      const sourceChunks = this.chunkContent(cleanedContent, source);
      
      chunks.push(...sourceChunks);
    }
    
    return chunks;
  }
  
  /**
   * Clean content for LLM processing
   */
  private cleanContent(content: string): string {
    return content
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove empty lines
      .replace(/\n\s*\n/g, '\n')
      // Clean up common markdown artifacts
      .replace(/```[^`]*```/g, '[CODE_BLOCK]')
      .replace(/!\[.*?\]\(.*?\)/g, '[IMAGE]')
      // Preserve headings but clean them up
      .replace(/#{1,6}\s*(.*)/g, (match, heading) => `\n${heading.trim()}\n`)
      .trim();
  }
  
  /**
   * Chunk content into manageable pieces (1-2k tokens)
   */
  private chunkContent(content: string, source: SourceInfo): ContentChunk[] {
    const chunks: ContentChunk[] = [];
    const maxChunkSize = 1500; // characters (roughly 300-400 tokens)
    const minChunkSize = 500;
    
    // Split by headings first
    const sections = content.split(/\n([^\n]+)\n/).filter(Boolean);
    
    let currentChunk = '';
    let chunkIndex = 0;
    
    for (const section of sections) {
      if (currentChunk.length + section.length > maxChunkSize && currentChunk.length > minChunkSize) {
        // Save current chunk
        chunks.push({
          id: `${source.id}_chunk_${chunkIndex}`,
          content: currentChunk.trim(),
          source: {
            id: source.id,
            title: source.title,
            type: source.type,
          },
          metadata: {
            chunkIndex,
            originalLength: currentChunk.length,
          },
        });
        
        currentChunk = section;
        chunkIndex++;
      } else {
        currentChunk += (currentChunk ? '\n' : '') + section;
      }
    }
    
    // Save final chunk if it exists
    if (currentChunk.trim()) {
      chunks.push({
        id: `${source.id}_chunk_${chunkIndex}`,
        content: currentChunk.trim(),
        source: {
          id: source.id,
          title: source.title,
          type: source.type,
        },
        metadata: {
          chunkIndex,
          originalLength: currentChunk.length,
        },
      });
    }
    
    return chunks;
  }
  
  /**
   * Validate generated quiz against schema
   */
  private validateQuiz(quiz: Quiz): Quiz {
    try {
      return QuizSchema.parse(quiz);
    } catch (error) {
      console.error('Quiz validation failed:', error);
      
      // Try to fix common issues
      const fixedQuiz = this.fixQuizIssues(quiz);
      
      try {
        return QuizSchema.parse(fixedQuiz);
      } catch (retryError) {
        throw new Error('Generated quiz failed validation and could not be automatically fixed');
      }
    }
  }
  
  /**
   * Attempt to fix common quiz validation issues
   */
  private fixQuizIssues(quiz: Quiz): Quiz {
    const fixedQuestions: QuizQuestion[] = quiz.questions.map((q, index) => ({
      id: q.id || `question_${Date.now()}_${index}`,
      type: q.type || 'short',
      prompt: q.prompt || `Question ${index + 1}`,
      choices: q.type === 'mcq' && !q.choices ? ['Option A', 'Option B', 'Option C', 'Option D'] : q.choices,
      answer: q.answer || (q.type === 'mcq' ? 0 : 'Answer not provided'),
      explanation: q.explanation,
      sourceRef: q.sourceRef,
      difficulty: Math.max(1, Math.min(5, q.difficulty || 3)),
    }));
    
    return {
      id: quiz.id || `quiz_${Date.now()}`,
      title: quiz.title || 'Generated Quiz',
      questions: fixedQuestions,
      createdAt: quiz.createdAt || Date.now(),
    };
  }
  
  /**
   * Store quiz in local storage
   */
  private async storeQuiz(quiz: Quiz): Promise<void> {
    try {
      const key = `generated_quiz_${quiz.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(quiz));
      
      // Update quiz index
      await this.updateQuizIndex(quiz.id, quiz.title, quiz.createdAt);
      
    } catch (error) {
      console.error('Failed to store quiz:', error);
      // Non-fatal error - quiz generation succeeded
    }
  }
  
  /**
   * Update the quiz index for easy retrieval
   */
  private async updateQuizIndex(id: string, title: string, createdAt: number): Promise<void> {
    try {
      const indexKey = 'generated_quizzes_index';
      const existingIndex = await AsyncStorage.getItem(indexKey);
      const index = existingIndex ? JSON.parse(existingIndex) : [];
      
      // Add new quiz to index
      index.unshift({ id, title, createdAt });
      
      // Keep only the most recent 50 quizzes
      const trimmedIndex = index.slice(0, 50);
      
      await AsyncStorage.setItem(indexKey, JSON.stringify(trimmedIndex));
    } catch (error) {
      console.error('Failed to update quiz index:', error);
    }
  }
  
  /**
   * Retrieve stored quizzes
   */
  async getStoredQuizzes(): Promise<Array<{ id: string; title: string; createdAt: number }>> {
    try {
      const indexKey = 'generated_quizzes_index';
      const index = await AsyncStorage.getItem(indexKey);
      return index ? JSON.parse(index) : [];
    } catch (error) {
      console.error('Failed to retrieve quiz index:', error);
      return [];
    }
  }
  
  /**
   * Load a specific quiz by ID
   */
  async loadQuiz(id: string): Promise<Quiz | null> {
    try {
      const key = `generated_quiz_${id}`;
      const quizData = await AsyncStorage.getItem(key);
      
      if (!quizData) {
        return null;
      }
      
      return JSON.parse(quizData);
    } catch (error) {
      console.error('Failed to load quiz:', error);
      return null;
    }
  }
  
  /**
   * Delete a quiz
   */
  async deleteQuiz(id: string): Promise<void> {
    try {
      const key = `generated_quiz_${id}`;
      await AsyncStorage.removeItem(key);
      
      // Remove from index
      const indexKey = 'generated_quizzes_index';
      const existingIndex = await AsyncStorage.getItem(indexKey);
      if (existingIndex) {
        const index = JSON.parse(existingIndex);
        const filteredIndex = index.filter((item: any) => item.id !== id);
        await AsyncStorage.setItem(indexKey, JSON.stringify(filteredIndex));
      }
    } catch (error) {
      console.error('Failed to delete quiz:', error);
      throw error;
    }
  }
}

// Default quiz generator instance
export const defaultQuizGenerator = new QuizGenerator();

export default QuizGenerator;