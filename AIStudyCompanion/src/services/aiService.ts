import axios from 'axios';
import { 
  Flashcard, 
  Quiz, 
  QuizQuestion,
  StudySummary,
  CustomInstructions,
  ReflectionPrompt,
  ChatMessage,
  APIResponse,
  UserPreferences
} from '../types';
import { CONTENT_GENERATION, DEFAULT_CUSTOM_INSTRUCTIONS } from '../constants';
import aiConfig, { AIProvider } from '../utils/aiConfig';
import userPreferencesService from './userPreferencesService';
import openaiService from './openaiService';
import { createLLMClient, GenerateQuizRequest, ContentChunk } from '../lib/llm/client';

// New interfaces for enhanced functionality
interface HomeworkSolutionOptions extends AIGenerationRequest {
  assignmentName: string;
  dueDate?: string;
  points?: number;
}

interface ReflectiveQuestionsOptions extends AIGenerationRequest {
  className: string;
  assignmentType?: string;
}

interface AIGenerationRequest {
  content: string;
  courseContext?: {
    courseName: string;
    courseId: number;
    topic?: string;
  };
  customInstructions?: CustomInstructions;
}

interface FlashcardGenerationOptions extends AIGenerationRequest {
  count?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface QuizGenerationOptions extends AIGenerationRequest {
  questionCount?: number;
  questionTypes?: ('multiple_choice' | 'true_false' | 'short_answer')[];
}

class AIService {
  private provider: AIProvider;
  private isConfigured: boolean;

  constructor() {
    this.provider = aiConfig.getProvider();
    this.isConfigured = aiConfig.isConfigured();
    
    // Validate configuration on startup
    const validation = aiConfig.validateConfig();
    if (!validation.isValid) {
      console.warn('AI Service configuration issues:', validation.errors);
    }
  }

  // Load user preferences from storage
  private async getUserPreferences(): Promise<UserPreferences | null> {
    try {
      // Get both custom instructions and study preferences
      const [customInstructions, studyPreferences] = await Promise.all([
        userPreferencesService.getCustomInstructions(),
        userPreferencesService.getStudyPreferences()
      ]);

      // Convert our new preference format to the legacy UserPreferences interface
      return {
        favorite_subjects: [],
        difficult_subjects: [],
        preferred_learning_style: customInstructions.learning_style,
        study_goals: [],
        preferred_study_times: studyPreferences.preferred_study_times,
        optimal_study_duration: studyPreferences.session_length_minutes,
        hobbies: [],
        career_goals: [],
        content_format_preference: [customInstructions.format_preference.replace('_', ' ')],
        explanation_style: customInstructions.tone,
        difficulty_preference: customInstructions.difficulty_preference
      };
    } catch (error) {
      console.error('Error loading user preferences:', error);
      return null;
    }
  }

  // Build user context prompt from preferences
  private buildUserContextPrompt(preferences: UserPreferences): string {
    let context = '\n## Student Profile and Learning Preferences\n\n';
    
    // Academic preferences
    if (preferences.favorite_subjects && preferences.favorite_subjects.length > 0) {
      context += `Student's favorite subjects: ${preferences.favorite_subjects.join(', ')}\n`;
    }
    if (preferences.difficult_subjects && preferences.difficult_subjects.length > 0) {
      context += `Student finds these subjects challenging: ${preferences.difficult_subjects.join(', ')}\n`;
    }
    if (preferences.preferred_learning_style) {
      context += `Preferred learning style: ${preferences.preferred_learning_style.replace('_', ' ')}\n`;
    }
    if (preferences.study_goals && preferences.study_goals.length > 0) {
      context += `Study goals: ${preferences.study_goals.join(', ')}\n`;
    }
    
    // Study schedule and habits
    if (preferences.preferred_study_times && preferences.preferred_study_times.length > 0) {
      context += `Prefers to study during: ${preferences.preferred_study_times.join(', ')}\n`;
    }
    if (preferences.optimal_study_duration) {
      context += `Optimal study session length: ${preferences.optimal_study_duration} minutes\n`;
    }
    
    // Personal context
    if (preferences.hobbies && preferences.hobbies.length > 0) {
      context += `Hobbies and interests: ${preferences.hobbies.join(', ')}\n`;
    }
    if (preferences.career_goals && preferences.career_goals.length > 0) {
      context += `Career goals: ${preferences.career_goals.join(', ')}\n`;
    }
    
    // Learning preferences  
    if (preferences.content_format_preference && preferences.content_format_preference.length > 0) {
      context += `Preferred content formats: ${preferences.content_format_preference.join(', ')}\n`;
    }
    if (preferences.explanation_style) {
      context += `Explanation style preference: ${preferences.explanation_style}\n`;
    }
    if (preferences.difficulty_preference) {
      context += `Difficulty preference: ${preferences.difficulty_preference}\n`;
    }
    
    context += '\nUse this information to personalize your response style, relate content to their interests, and adapt to their learning preferences. Make connections between course material and their hobbies, career goals, and interests when relevant. Adjust your teaching approach based on their learning style and difficulty preferences.\n\n';
    
    return context;
  }

  getProvider(): AIProvider {
    return this.provider;
  }

  isReady(): boolean {
    return this.isConfigured || openaiService.isConfigured();
  }

  // OpenAI specific methods
  getOpenAIApiKeyStatus(): { configured: boolean; source: string } {
    return openaiService.getApiKeyStatus();
  }

  validateOpenAIConfiguration(): { valid: boolean; error?: string } {
    return openaiService.validateApiKey();
  }

  getOpenAIModelInfo(): { name: string; provider: string } {
    return openaiService.getModelInfo();
  }

  async testOpenAIConnection(): Promise<{ success: boolean; error?: string }> {
    return await openaiService.testConnection();
  }

  // Unified quiz generation that prefers LLM client
  async generateQuizUnified(options: QuizGenerationOptions): Promise<APIResponse<Quiz>> {
    // Try LLM client first if OpenAI is configured
    if (openaiService.isConfigured()) {
      try {
        return await this.generateQuizWithLLM(options);
      } catch (error) {
        console.warn('LLM client failed, falling back to legacy method:', error);
      }
    }
    
    // Fallback to legacy implementation
    return await this.generateQuiz(options);
  }

  private buildCustomInstructionsPrompt(instructions: CustomInstructions): string {
    const { tone, detail_level, use_examples, use_analogies, format_preference } = instructions;
    
    let prompt = '';
    
    // Tone
    switch (tone) {
      case 'casual':
        prompt += 'Use a casual, friendly tone with simple language. ';
        break;
      case 'formal':
        prompt += 'Use a formal, academic tone with precise language. ';
        break;
      case 'friendly':
        prompt += 'Use a warm, encouraging tone that motivates learning. ';
        break;
    }

    // Detail level
    switch (detail_level) {
      case 'brief':
        prompt += 'Keep explanations concise and to the point. ';
        break;
      case 'detailed':
        prompt += 'Provide comprehensive explanations with thorough details. ';
        break;
      default:
        prompt += 'Provide moderate detail, balancing clarity with completeness. ';
    }

    // Examples and analogies
    if (use_examples) {
      prompt += 'Include relevant real-world examples where appropriate. ';
    }
    if (use_analogies) {
      prompt += 'Use analogies to help explain complex concepts. ';
    }

    // Format preference
    switch (format_preference) {
      case 'bullet_points':
        prompt += 'Format responses using bullet points and lists. ';
        break;
      case 'paragraphs':
        prompt += 'Format responses in clear paragraphs. ';
        break;
      default:
        prompt += 'Use a mix of paragraphs and bullet points as appropriate. ';
    }

    return prompt;
  }

  private async callLLM(
    systemPrompt: string, 
    userPrompt: string, 
    model?: string,
    temperature?: number
  ): Promise<APIResponse<string>> {
    try {
      if (!this.isConfigured) {
        return {
          data: '',
          success: false,
          error: `AI service not configured. Please set up your ${this.provider} API credentials.`,
        };
      }

      const config = aiConfig.getConfig();
      const modelToUse = model || config.defaultModel;
      const tempToUse = temperature !== undefined ? temperature : config.temperature;

      const requestBody = this.buildRequestBody(
        systemPrompt,
        userPrompt,
        modelToUse,
        tempToUse,
        config.maxTokens
      );

      const endpoint = this.getEndpoint();
      const url = aiConfig.buildEndpointURL(endpoint);
      const headers = aiConfig.getAuthHeaders();

      const response = await axios.post(url, requestBody, {
        headers,
        timeout: config.timeout,
      });

      const content = this.extractContent(response.data);
      if (!content) {
        return {
          data: '',
          success: false,
          error: 'No response generated from AI service',
        };
      }

      return {
        data: content.trim(),
        success: true,
      };
    } catch (error: any) {
      console.error('AI Service Error:', error);
      console.error('Error Response Status:', error.response?.status);
      console.error('Error Response Data:', error.response?.data);
      
      let errorMessage = `Failed to generate AI content using ${this.provider}`;
      if (error.response?.status === 401) {
        errorMessage = `${this.provider} API authentication failed. Check your API key.`;
      } else if (error.response?.status === 429) {
        const errorType = error.response?.data?.error?.code;
        const rateLimitReason = error.response?.data?.error?.message || 'Rate limit exceeded';
        
        if (errorType === 'insufficient_quota') {
          errorMessage = `OpenAI API quota exceeded. Please add billing credits to your OpenAI account or use a different API key.`;
        } else {
          const retryAfter = error.response?.headers['retry-after'] || 'unknown';
          errorMessage = `${this.provider} API rate limit exceeded. ${rateLimitReason}. Retry after: ${retryAfter}`;
        }
      } else if (error.response?.status >= 500) {
        errorMessage = `${this.provider} service temporarily unavailable`;
      } else if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR') {
        errorMessage = `Network error connecting to ${this.provider} service`;
      } else if (error.response?.data?.error?.message) {
        errorMessage = `${this.provider} API error: ${error.response.data.error.message}`;
      }

      return {
        data: '',
        success: false,
        error: errorMessage,
      };
    }
  }

  private buildRequestBody(
    systemPrompt: string,
    userPrompt: string,
    model: string,
    temperature: number,
    maxTokens: number
  ): any {
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    switch (this.provider) {
      case 'anthropic':
        return {
          model,
          max_tokens: maxTokens,
          temperature,
          messages,
        };
      
      case 'openai':
      case 'openrouter':
      case 'local':
      default:
        return {
          model,
          messages,
          max_tokens: maxTokens,
          temperature,
        };
    }
  }

  private getEndpoint(): string {
    switch (this.provider) {
      case 'anthropic':
        return '/messages';
      case 'openai':
      case 'openrouter':
      case 'local':
      default:
        return '/chat/completions';
    }
  }

  private extractContent(responseData: any): string | null {
    switch (this.provider) {
      case 'anthropic':
        return responseData.content?.[0]?.text || null;
      
      case 'openai':
      case 'openrouter':
      case 'local':
      default:
        return responseData.choices?.[0]?.message?.content || null;
    }
  }

  // Flashcard Generation
  async generateFlashcards(options: FlashcardGenerationOptions): Promise<APIResponse<Flashcard[]>> {
    // Get current user preferences
    const customInstructions = await userPreferencesService.getCustomInstructions();
    const studyPreferences = await userPreferencesService.getStudyPreferences();
    
    const customPrompt = options.customInstructions ? 
      this.buildCustomInstructionsPrompt(options.customInstructions) : 
      userPreferencesService.generateAIPromptFromInstructions(customInstructions);

    // Get user preferences for personalization
    const userPreferences = await this.getUserPreferences();
    const userContextPrompt = userPreferences ? this.buildUserContextPrompt(userPreferences) : '';

    const systemPrompt = `You are an expert educational content creator specializing in creating effective flashcards for student learning. ${customPrompt}${userContextPrompt}

Create flashcards that follow these principles:
- Questions should test understanding, not just memorization
- Answers should be concise but complete
- Include the source concept or topic for context
- Vary difficulty appropriately
- Focus on key concepts, definitions, and important facts
${userPreferences ? `- When possible, relate concepts to the student's interests (${userPreferences.hobbies?.join(', ') || ''}) and career goals (${userPreferences.career_goals?.join(', ') || ''})` : ''}
${userPreferences?.difficulty_preference ? `- Adjust difficulty based on student's preference: ${userPreferences.difficulty_preference}` : ''}

Return your response as a JSON array of flashcard objects with this structure:
{
  "question": "Clear, specific question",
  "answer": "Accurate, concise answer", 
  "topic": "Main topic or concept",
  "difficulty": "easy|medium|hard",
  "source_material": "Reference to source content"
}`;

    const courseContext = options.courseContext ? 
      `Course: ${options.courseContext.courseName}${options.courseContext.topic ? `, Topic: ${options.courseContext.topic}` : ''}` : '';

    const userPrompt = `${courseContext}

Generate ${options.count || 10} flashcards based on this content:

${options.content}

Focus on the most important concepts and ensure variety in question types.`;

    const model = aiConfig.getModelForTask('flashcard');
    const response = await this.callLLM(systemPrompt, userPrompt, model);
    
    if (!response.success) {
      return {
        data: [],
        success: false,
        error: response.error,
      };
    }

    try {
      const flashcardsData = JSON.parse(response.data);
      const flashcards: Flashcard[] = flashcardsData.map((item: any, index: number) => ({
        id: `flashcard_${Date.now()}_${index}`,
        question: item.question,
        answer: item.answer,
        course_id: options.courseContext?.courseId || 0,
        topic: item.topic,
        difficulty: item.difficulty || 'medium',
        next_review: new Date(),
        interval: 1,
        ease_factor: 2.5,
        source_material: item.source_material,
        created_at: new Date(),
        updated_at: new Date(),
      }));

      return {
        data: flashcards,
        success: true,
      };
    } catch (error) {
      console.error('Error parsing flashcard response:', error);
      return {
        data: [],
        success: false,
        error: 'Failed to parse generated flashcards',
      };
    }
  }

  // Enhanced Quiz Generation using LLM client
  async generateQuizWithLLM(options: QuizGenerationOptions): Promise<APIResponse<Quiz>> {
    try {
      const studyPreferences = await userPreferencesService.getStudyPreferences();
      
      // Convert content to chunks
      const chunks: ContentChunk[] = [{
        id: `content_${Date.now()}`,
        content: options.content,
        source: {
          id: options.courseContext?.courseId?.toString() || 'unknown',
          title: options.courseContext?.courseName || 'Study Material',
          type: 'assignment'
        }
      }];

      const request: GenerateQuizRequest = {
        chunks,
        preferences: studyPreferences,
        title: `Quiz - ${options.courseContext?.courseName || 'Study Session'}`
      };

      const client = openaiService.getClient();
      const quiz = await client.generateQuiz(request);

      return {
        data: {
          ...quiz,
          course_id: options.courseContext?.courseId || 0,
          topic: options.courseContext?.topic || 'General',
          created_at: new Date(),
        },
        success: true,
      };
    } catch (error) {
      console.error('Error generating quiz with LLM:', error);
      return {
        data: {} as Quiz,
        success: false,
        error: `Failed to generate quiz: ${(error as Error).message}`,
      };
    }
  }

  // Legacy Quiz Generation (fallback)
  async generateQuiz(options: QuizGenerationOptions): Promise<APIResponse<Quiz>> {
    const customPrompt = options.customInstructions ? 
      this.buildCustomInstructionsPrompt(options.customInstructions) : 
      this.buildCustomInstructionsPrompt(DEFAULT_CUSTOM_INSTRUCTIONS);

    // Get user preferences for personalization
    const userPreferences = await this.getUserPreferences();
    const userContextPrompt = userPreferences ? this.buildUserContextPrompt(userPreferences) : '';

    const systemPrompt = `You are an expert educational assessment creator. ${customPrompt}${userContextPrompt}

Create engaging quiz questions that test comprehension and application of knowledge. Follow these guidelines:
- Multiple choice questions should have 4 options with only one correct answer
- True/false questions should test important concepts
- Short answer questions should require brief but thoughtful responses
- Include explanations for correct answers
- Vary question difficulty and types
${userPreferences ? `- When possible, use examples or scenarios that relate to the student's interests (${userPreferences.hobbies?.join(', ') || ''}) or career goals (${userPreferences.career_goals?.join(', ') || ''})` : ''}
${userPreferences?.difficulty_preference ? `- Adjust overall difficulty to match student's preference: ${userPreferences.difficulty_preference}` : ''}

Return your response as a JSON object with this structure:
{
  "title": "Quiz title",
  "questions": [
    {
      "question": "Question text",
      "type": "multiple_choice|true_false|short_answer",
      "options": ["option1", "option2", "option3", "option4"], // for multiple choice only
      "correct_answer": "correct answer or option",
      "explanation": "Why this is correct"
    }
  ]
}`;

    const courseContext = options.courseContext ? 
      `Course: ${options.courseContext.courseName}${options.courseContext.topic ? `, Topic: ${options.courseContext.topic}` : ''}` : '';

    const questionTypes = options.questionTypes || ['multiple_choice', 'true_false'];
    const userPrompt = `${courseContext}

Generate a quiz with ${options.questionCount || 10} questions based on this content. Use these question types: ${questionTypes.join(', ')}.

Content:
${options.content}

Make sure questions test understanding and application, not just recall.`;

    const model = aiConfig.getModelForTask('quiz');
    const response = await this.callLLM(systemPrompt, userPrompt, model);
    
    if (!response.success) {
      return {
        data: {} as Quiz,
        success: false,
        error: response.error,
      };
    }

    try {
      const quizData = JSON.parse(response.data);
      const questions: QuizQuestion[] = quizData.questions.map((q: any, index: number) => ({
        id: `question_${Date.now()}_${index}`,
        question: q.question,
        type: q.type,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
      }));

      const quiz: Quiz = {
        id: `quiz_${Date.now()}`,
        title: quizData.title,
        questions,
        course_id: options.courseContext?.courseId || 0,
        topic: options.courseContext?.topic || 'General',
        created_at: new Date(),
      };

      return {
        data: quiz,
        success: true,
      };
    } catch (error) {
      console.error('Error parsing quiz response:', error);
      return {
        data: {} as Quiz,
        success: false,
        error: 'Failed to parse generated quiz',
      };
    }
  }

  // Summary Generation
  async generateSummary(options: AIGenerationRequest): Promise<APIResponse<StudySummary>> {
    const customPrompt = options.customInstructions ? 
      this.buildCustomInstructionsPrompt(options.customInstructions) : 
      this.buildCustomInstructionsPrompt(DEFAULT_CUSTOM_INSTRUCTIONS);

    // Get user preferences for personalization
    const userPreferences = await this.getUserPreferences();
    const userContextPrompt = userPreferences ? this.buildUserContextPrompt(userPreferences) : '';

    const systemPrompt = `You are an expert at creating clear, comprehensive study summaries. ${customPrompt}${userContextPrompt}

Create summaries that:
- Identify and highlight key concepts and main points
- Organize information logically
- Use clear headings and structure
- Include important definitions and explanations
- Connect related concepts
- Are concise but comprehensive
${userPreferences ? `- When appropriate, include analogies or examples that relate to the student's interests (${userPreferences.hobbies?.join(', ') || ''}) to help explain complex concepts` : ''}
${userPreferences ? `- Consider how the material might apply to their career goals (${userPreferences.career_goals?.join(', ') || ''})` : ''}
${userPreferences?.explanation_style ? `- Format explanations in their preferred style: ${userPreferences.explanation_style}` : ''}

Return a JSON object with this structure:
{
  "title": "Summary title",
  "content": "Well-structured summary content",
  "key_points": ["point1", "point2", "point3"]
}`;

    const courseContext = options.courseContext ? 
      `Course: ${options.courseContext.courseName}${options.courseContext.topic ? `, Topic: ${options.courseContext.topic}` : ''}` : '';

    const userPrompt = `${courseContext}

Create a comprehensive study summary of this content:

${options.content}

Focus on the most important concepts and organize them clearly for effective studying.`;

    const model = aiConfig.getModelForTask('summary');
    const response = await this.callLLM(systemPrompt, userPrompt, model);
    
    if (!response.success) {
      return {
        data: {} as StudySummary,
        success: false,
        error: response.error,
      };
    }

    try {
      const summaryData = JSON.parse(response.data);
      const summary: StudySummary = {
        id: `summary_${Date.now()}`,
        title: summaryData.title,
        content: summaryData.content,
        course_id: options.courseContext?.courseId || 0,
        topic: options.courseContext?.topic || 'General',
        source_material: 'AI Generated Summary',
        created_at: new Date(),
      };

      return {
        data: summary,
        success: true,
      };
    } catch (error) {
      console.error('Error parsing summary response:', error);
      return {
        data: {} as StudySummary,
        success: false,
        error: 'Failed to parse generated summary',
      };
    }
  }

  // Reflection Prompt Generation
  async generateReflectionPrompts(options: AIGenerationRequest): Promise<APIResponse<ReflectionPrompt[]>> {
    const systemPrompt = `You are an expert educational coach who helps students develop metacognitive skills through thoughtful reflection questions.

Generate reflection prompts that encourage students to:
- Think about their understanding of concepts
- Connect new learning to prior knowledge
- Consider real-world applications
- Reflect on their learning process
- Identify areas for improvement

Return a JSON array with this structure:
[
  {
    "prompt": "Thoughtful reflection question",
    "type": "understanding|application|connection|metacognition"
  }
]`;

    const courseContext = options.courseContext ? 
      `Course: ${options.courseContext.courseName}${options.courseContext.topic ? `, Topic: ${options.courseContext.topic}` : ''}` : '';

    const userPrompt = `${courseContext}

Generate 5 reflection prompts based on this content that will help students think deeply about what they've learned:

${options.content}

Include a variety of prompt types that encourage different kinds of thinking.`;

    const model = aiConfig.getModelForTask('summary');
    const response = await this.callLLM(systemPrompt, userPrompt, model);
    
    if (!response.success) {
      return {
        data: [],
        success: false,
        error: response.error,
      };
    }

    try {
      const promptsData = JSON.parse(response.data);
      const prompts: ReflectionPrompt[] = promptsData.map((item: any, index: number) => ({
        id: `reflection_${Date.now()}_${index}`,
        prompt: item.prompt,
        type: item.type,
        course_id: options.courseContext?.courseId,
        topic: options.courseContext?.topic,
      }));

      return {
        data: prompts,
        success: true,
      };
    } catch (error) {
      console.error('Error parsing reflection prompts:', error);
      return {
        data: [],
        success: false,
        error: 'Failed to parse generated reflection prompts',
      };
    }
  }

  // Chat/Coaching Response
  async generateCoachingResponse(
    message: string, 
    context: {
      previousMessages?: ChatMessage[];
      courseContext?: { courseName: string; courseId: number; topic?: string };
      customInstructions?: CustomInstructions;
      canvasData?: string;
    }
  ): Promise<APIResponse<string>> {
    const customPrompt = context.customInstructions ? 
      this.buildCustomInstructionsPrompt(context.customInstructions) : 
      this.buildCustomInstructionsPrompt(DEFAULT_CUSTOM_INSTRUCTIONS);

    // Get user preferences for personalization
    const userPreferences = await this.getUserPreferences();
    const userContextPrompt = userPreferences ? this.buildUserContextPrompt(userPreferences) : '';

    const systemPrompt = `You are an AI study coach who helps students learn effectively. ${customPrompt}${userContextPrompt}

Your role is to:
- Ask thought-provoking questions that encourage deeper thinking
- Guide students to discover answers rather than giving them directly
- Provide encouragement and motivation
- Help students develop metacognitive skills
- Connect concepts to real-world applications
- Suggest effective study strategies
- Use Canvas course data when available to provide specific, relevant guidance
${userPreferences ? `- Use analogies and examples from their interests (${userPreferences.hobbies?.join(', ') || ''}) to explain concepts when appropriate` : ''}
${userPreferences ? `- Consider their career goals (${userPreferences.career_goals?.join(', ') || ''}) when suggesting applications of concepts` : ''}
${userPreferences?.explanation_style ? `- Adapt explanations to their preferred style: ${userPreferences.explanation_style}` : ''}

When you have access to Canvas course data, reference specific assignments, deadlines, modules, and course materials to give personalized advice.

Be supportive, patient, and focus on helping the student learn rather than just providing information.`;

    let conversationContext = '';
    if (context.previousMessages && context.previousMessages.length > 0) {
      conversationContext = 'Previous conversation:\n' + 
        context.previousMessages.slice(-5).map(msg => 
          `${msg.role}: ${msg.content}`
        ).join('\n') + '\n\n';
    }

    const courseContext = context.courseContext ? 
      `Course: ${context.courseContext.courseName}${context.courseContext.topic ? `, Topic: ${context.courseContext.topic}` : ''}\n` : '';

    const canvasContext = context.canvasData ? `\n${context.canvasData}\n` : '';

    const userPrompt = `${courseContext}${canvasContext}${conversationContext}Student: ${message}

Respond as a helpful study coach. When Canvas course data is available, use it to provide specific guidance about assignments, deadlines, and course materials. Ask questions that help the student think more deeply about the topic.`;

    const model = aiConfig.getModelForTask('chat');
    return this.callLLM(systemPrompt, userPrompt, model, 0.8); // Slightly higher temperature for more conversational responses
  }

  // Homework/Assignment Solution Generation (adapted from auto_student.py)
  async generateHomeworkSolution(options: HomeworkSolutionOptions): Promise<APIResponse<string>> {
    // Use the academic homework solving system prompt from auto_student.py
    const systemPrompt = `You are a helpful assistant that completes university homework concisely and accurately, adhering to specified formats like MLA.`;

    const courseContext = options.courseContext ? 
      `Course: ${options.courseContext.courseName}${options.courseContext.topic ? `, Topic: ${options.courseContext.topic}` : ''}` : '';

    // Build the comprehensive prompt similar to auto_student.py structure
    const userPrompt = `You are an expert academic assistant. Your task is to provide a comprehensive solution for the following university-level assignment.
Please analyze the assignment description and any supplementary content (files, transcripts) carefully and generate a complete response.
Only provide the answer to the question in an appropriate format. That means a proper MLA essay format for a question that wants an essay response, simple python code if the result is for a python notebook, or others as appropriate to the assignment's requirements. Do not restate my question or offer a follow up question.

--- ASSIGNMENT DETAILS ---
Assignment Name: ${options.assignmentName}
${options.dueDate ? `Due Date: ${options.dueDate}` : ''}
${options.points ? `Points: ${options.points}` : ''}
${courseContext}
--- END OF ASSIGNMENT DETAILS ---

--- ASSIGNMENT CONTENT ---
${options.content}
--- END OF ASSIGNMENT CONTENT ---

Please provide your solution below:`;

    const model = aiConfig.getModelForTask('summary'); // Use summary model for academic work
    return this.callLLM(systemPrompt, userPrompt, model, 0.3); // Lower temperature for more consistent academic responses
  }

  // Generate Reflective Questions (adapted from auto_student.py)
  async generateReflectiveQuestions(options: ReflectiveQuestionsOptions): Promise<APIResponse<string[]>> {
    const systemPrompt = `You are an AI assistant specialized in educational psychology and ethical reflection.
Your task is to generate a series of reflective questions for a student who is considering using an
LLM (Large Language Model) or similar tool to complete a specific academic assignment.
The goal of these questions is to prompt the student to pause, think critically about their decision,
and consider the implications of using the tool versus completing the assignment themselves. The
questions are intended to be a 'speed bump' before accessing the cheating functionality.
The questions should be rooted in scientific and psychological principles, including:
- Consequences analysis (examining potential short-term benefits vs. long-term costs, risks, missed opportunities)
- Values clarification (connecting the action to personal values like integrity, learning, growth)
- Motivational Interviewing techniques (exploring ambivalence, reasons for considering the tool, and reasons for doing the work authentically)
- Cognitive Behavioral Therapy principles (considering thoughts and feelings associated with the decision and its outcomes)
- Principles of learning and skill development (what the assignment is *meant* to teach, what is lost by bypassing it)
Make the questions as relevant and specific as possible to the learning objectives and content of the assignment.
Output JSON format: {"questions": ["Q1", "Q2", ...]}`;

    const userPrompt = `Generate between 5 and 8 distinct questions to present to a student who is considering using an LLM to
solve the following homework assignment. The tone of the questions should be neutral and reflective,
not accusatory or preachy. Ensure questions are concise enough to be easily read on a web or mobile interface.

- CLASS: ${options.className}
- ASSIGNMENT TYPE: ${options.assignmentType || 'General Assignment'}
- DESCRIPTION: ${options.content}

Questions should:
- Be open-ended and thought-provoking
- Focus on learning consequences, ethics, and personal growth
- Avoid accusatory language
- Be concise (max 15 words each)

Just to reiterate, the only output should be in JSON format: {"questions": ["Q1", "Q2", ...]}`;

    const model = aiConfig.getModelForTask('summary');
    const response = await this.callLLM(systemPrompt, userPrompt, model, 0.3);

    if (!response.success) {
      return {
        success: false,
        error: response.error,
        data: []
      };
    }

    try {
      // Parse JSON response and extract questions
      const cleanedResponse = this.removeThinkTags(response.data);
      const parsedResponse = JSON.parse(cleanedResponse);
      const questions = parsedResponse.questions || [];

      if (!Array.isArray(questions) || questions.length === 0) {
        return {
          success: false,
          error: 'No valid questions found in response',
          data: ['What did you learn from this experience?'] // Fallback question
        };
      }

      return {
        success: true,
        data: questions
      };

    } catch (error) {
      console.error('Error parsing reflective questions:', error);
      return {
        success: false,
        error: 'Failed to parse reflective questions',
        data: ['What did you learn from this experience?'] // Fallback question
      };
    }
  }

  // Summarize text with academic focus (adapted from auto_student.py _summarize_text)
  async summarizeAcademicContent(
    text: string, 
    maxWords: number = 500,
    courseContext?: { courseName: string; topic?: string }
  ): Promise<APIResponse<string>> {
    if (!text || !text.trim()) {
      return {
        success: false,
        error: 'No content to summarize',
        data: '[No content to summarize]'
      };
    }

    const wordCount = text.split(' ').length;
    if (wordCount <= maxWords) {
      return {
        success: true,
        data: text
      };
    }

    const systemPrompt = 'You are a helpful assistant that summarizes academic materials concisely and accurately.';
    
    const courseInfo = courseContext ? 
      `Course: ${courseContext.courseName}${courseContext.topic ? `, Topic: ${courseContext.topic}` : ''}\n` : '';

    const userPrompt = `${courseInfo}Please summarize the following text in no more than ${maxWords} words, focusing on key points relevant to an academic assignment. Only provide me the summary as a block of text, I do not want you to repeat your task or ask me any follow up questions:

${text.substring(0, 10000)}`;

    const model = aiConfig.getModelForTask('summary');
    const response = await this.callLLM(systemPrompt, userPrompt, model, 0.3);

    if (!response.success) {
      // Fallback: truncate to word limit
      const words = text.split(' ');
      const truncated = words.slice(0, maxWords).join(' ') + 
                      (words.length > maxWords ? '... [truncated due to summarization error]' : '');
      return {
        success: true,
        data: truncated
      };
    }

    const summary = response.data.trim();
    if (!summary) {
      return {
        success: false,
        error: 'Empty summary returned',
        data: `[Empty summary returned for content of length ${text.length}]`
      };
    }

    return {
      success: true,
      data: summary
    };
  }

  // Helper function to remove think tags from AI responses (from auto_student.py)
  private removeThinkTags(responseText: string): string {
    // Pattern to match <think> tags and their content
    const thinkPattern = /<think>.*?<\/think>/gs;
    
    // Remove all think tags
    let cleaned = responseText.replace(thinkPattern, '');
    
    // Find the first valid JSON object in the response
    const jsonCandidates = cleaned.match(/\{.*\}/gs);
    
    if (jsonCandidates) {
      // Try parsing each candidate from longest to shortest
      const sortedCandidates = jsonCandidates.sort((a, b) => b.length - a.length);
      for (const candidate of sortedCandidates) {
        try {
          JSON.parse(candidate);
          return candidate;
        } catch (error) {
          continue;
        }
      }
    }
    
    // Fallback: return cleaned text
    return cleaned.trim();
  }
}

export default new AIService();