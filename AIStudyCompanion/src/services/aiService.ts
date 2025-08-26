import axios from 'axios';
import { 
  Flashcard, 
  Quiz, 
  QuizQuestion,
  StudySummary,
  CustomInstructions,
  ReflectionPrompt,
  ChatMessage,
  APIResponse 
} from '../types';
import { CONTENT_GENERATION, DEFAULT_CUSTOM_INSTRUCTIONS } from '../constants';
import aiConfig, { AIProvider } from '../utils/aiConfig';

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

  getProvider(): AIProvider {
    return this.provider;
  }

  isReady(): boolean {
    return this.isConfigured;
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
      
      let errorMessage = `Failed to generate AI content using ${this.provider}`;
      if (error.response?.status === 401) {
        errorMessage = `${this.provider} API authentication failed. Check your API key.`;
      } else if (error.response?.status === 429) {
        errorMessage = `${this.provider} API rate limit exceeded. Please try again later.`;
      } else if (error.response?.status >= 500) {
        errorMessage = `${this.provider} service temporarily unavailable`;
      } else if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR') {
        errorMessage = `Network error connecting to ${this.provider} service`;
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
    const customPrompt = options.customInstructions ? 
      this.buildCustomInstructionsPrompt(options.customInstructions) : 
      this.buildCustomInstructionsPrompt(DEFAULT_CUSTOM_INSTRUCTIONS);

    const systemPrompt = `You are an expert educational content creator specializing in creating effective flashcards for student learning. ${customPrompt}

Create flashcards that follow these principles:
- Questions should test understanding, not just memorization
- Answers should be concise but complete
- Include the source concept or topic for context
- Vary difficulty appropriately
- Focus on key concepts, definitions, and important facts

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

  // Quiz Generation
  async generateQuiz(options: QuizGenerationOptions): Promise<APIResponse<Quiz>> {
    const customPrompt = options.customInstructions ? 
      this.buildCustomInstructionsPrompt(options.customInstructions) : 
      this.buildCustomInstructionsPrompt(DEFAULT_CUSTOM_INSTRUCTIONS);

    const systemPrompt = `You are an expert educational assessment creator. ${customPrompt}

Create engaging quiz questions that test comprehension and application of knowledge. Follow these guidelines:
- Multiple choice questions should have 4 options with only one correct answer
- True/false questions should test important concepts
- Short answer questions should require brief but thoughtful responses
- Include explanations for correct answers
- Vary question difficulty and types

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

    const systemPrompt = `You are an expert at creating clear, comprehensive study summaries. ${customPrompt}

Create summaries that:
- Identify and highlight key concepts and main points
- Organize information logically
- Use clear headings and structure
- Include important definitions and explanations
- Connect related concepts
- Are concise but comprehensive

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
    }
  ): Promise<APIResponse<string>> {
    const customPrompt = context.customInstructions ? 
      this.buildCustomInstructionsPrompt(context.customInstructions) : 
      this.buildCustomInstructionsPrompt(DEFAULT_CUSTOM_INSTRUCTIONS);

    const systemPrompt = `You are an AI study coach who helps students learn effectively. ${customPrompt}

Your role is to:
- Ask thought-provoking questions that encourage deeper thinking
- Guide students to discover answers rather than giving them directly
- Provide encouragement and motivation
- Help students develop metacognitive skills
- Connect concepts to real-world applications
- Suggest effective study strategies

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

    const userPrompt = `${courseContext}${conversationContext}Student: ${message}

Respond as a helpful study coach. Ask questions that help the student think more deeply about the topic.`;

    const model = aiConfig.getModelForTask('chat');
    return this.callLLM(systemPrompt, userPrompt, model, 0.8); // Slightly higher temperature for more conversational responses
  }
}

export default new AIService();