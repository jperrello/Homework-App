/**
 * StudyAssistantService - Comprehensive integration of all auto_student.py algorithms
 * 
 * This service demonstrates how to use:
 * - contentProcessingService: File reading, material extraction, processing
 * - enhancedCanvasService: Enhanced Canvas integration with content processing
 * - aiService: Specialized prompts for different purposes (homework vs flashcards vs coaching)
 */

import { APIResponse, CanvasAssignment, Flashcard } from '../types';
import enhancedCanvasService, { AssignmentSolutionData } from './enhancedCanvasService';
import contentProcessingService, { ProcessedContent } from './contentProcessingService';
import aiService from './aiService';
import canvasService from './canvasService';

export interface StudySession {
  id: string;
  courseId: number;
  courseName: string;
  assignments: AssignmentSolutionData[];
  processedFiles: ProcessedContent[];
  flashcards: Flashcard[];
  studyMaterials: string[];
  createdAt: Date;
}

export interface HomeworkAssistanceOptions {
  assignmentId: number;
  courseId: number;
  includeReflectiveQuestions?: boolean;
  generateFlashcards?: boolean;
}

export interface StudyMaterialExtractionOptions {
  courseId: number;
  includeAssignments?: boolean;
  includeFiles?: boolean;
  includeModules?: boolean;
  maxItems?: number;
}

class StudyAssistantService {
  
  // Complete homework assistance workflow (replicates auto_student.py functionality)
  async provideHomeworkAssistance(options: HomeworkAssistanceOptions): Promise<APIResponse<{
    solutionData: AssignmentSolutionData;
    homeworkSolution: string;
    reflectiveQuestions?: string[];
    flashcards?: Flashcard[];
  }>> {
    try {
      console.log(`🔍 Starting homework assistance for assignment ${options.assignmentId}...`);

      // Step 1: Process the assignment with enhanced Canvas integration (like auto_student.py)
      const solutionDataResponse = await enhancedCanvasService.generateAssignmentSolutionData(
        options.assignmentId, 
        options.courseId
      );

      if (!solutionDataResponse.success) {
        return {
          success: false,
          error: `Failed to process assignment: ${solutionDataResponse.error}`,
          data: {} as any
        };
      }

      const solutionData = solutionDataResponse.data;
      console.log(`📊 Processed assignment: ${solutionData.assignment.name}`);
      console.log(`📄 Content sources: ${solutionData.contentSources.join(', ')}`);
      console.log(`📝 Prompt length: ${solutionData.promptLength} characters`);

      // Step 2: Generate homework solution using specialized prompt (auto_student.py approach)
      const homeworkSolutionResponse = await aiService.generateHomeworkSolution({
        content: solutionData.combinedContent,
        assignmentName: solutionData.assignment.name,
        dueDate: solutionData.assignment.due_at ? new Date(solutionData.assignment.due_at).toLocaleDateString() : undefined,
        points: solutionData.assignment.points_possible,
        courseContext: {
          courseName: solutionData.assignment.course_id ? 'Course' : 'Unknown Course',
          courseId: solutionData.assignment.course_id || 0
        }
      });

      if (!homeworkSolutionResponse.success) {
        return {
          success: false,
          error: `Failed to generate homework solution: ${homeworkSolutionResponse.error}`,
          data: {} as any
        };
      }

      const result: any = {
        solutionData,
        homeworkSolution: homeworkSolutionResponse.data
      };

      // Step 3: Generate reflective questions if requested (auto_student.py ethics approach)
      if (options.includeReflectiveQuestions) {
        console.log('🤔 Generating reflective questions...');
        const courseResponse = await canvasService.getAllCourseContent(options.courseId);
        const courseName = courseResponse.success && courseResponse.course ? courseResponse.course.name : 'Unknown Course';

        const reflectiveQuestionsResponse = await aiService.generateReflectiveQuestions({
          content: solutionData.assignment.description || solutionData.assignment.name,
          className: courseName,
          assignmentType: 'Assignment'
        });

        if (reflectiveQuestionsResponse.success) {
          result.reflectiveQuestions = reflectiveQuestionsResponse.data;
          console.log(`❓ Generated ${reflectiveQuestionsResponse.data.length} reflective questions`);
        }
      }

      // Step 4: Generate flashcards from the processed content if requested
      if (options.generateFlashcards) {
        console.log('📚 Generating flashcards from processed content...');
        const flashcardResponse = await aiService.generateFlashcards({
          content: solutionData.combinedContent,
          courseContext: {
            courseName: 'Course',
            courseId: options.courseId,
            topic: solutionData.assignment.name
          },
          count: 8
        });

        if (flashcardResponse.success) {
          result.flashcards = flashcardResponse.data;
          console.log(`🃏 Generated ${flashcardResponse.data.length} flashcards`);
        }
      }

      console.log('✅ Homework assistance completed successfully');
      return {
        success: true,
        data: result
      };

    } catch (error) {
      console.error('❌ Error in homework assistance:', error);
      return {
        success: false,
        error: `Homework assistance failed: ${error}`,
        data: {} as any
      };
    }
  }

  // Extract and process study materials from course (replicates auto_student.py content extraction)
  async extractStudyMaterials(options: StudyMaterialExtractionOptions): Promise<APIResponse<{
    processedContent: ProcessedContent[];
    studySummary: string;
    flashcards: Flashcard[];
    contentSources: string[];
  }>> {
    try {
      console.log(`📖 Starting study material extraction for course ${options.courseId}...`);

      const processedContent: ProcessedContent[] = [];
      const contentSources: string[] = [];
      const allContent: string[] = [];

      // Extract from assignments if requested
      if (options.includeAssignments !== false) {
        console.log('📝 Processing assignments...');
        const enhancedAssignmentsResponse = await enhancedCanvasService.getEnhancedCourseAssignments(options.courseId);
        
        if (enhancedAssignmentsResponse.success) {
          enhancedAssignmentsResponse.data.slice(0, options.maxItems || 3).forEach(assignment => {
            if (assignment.processedContent) {
              processedContent.push(assignment.processedContent);
              contentSources.push(`Assignment: ${assignment.name}`);
              allContent.push(assignment.processedContent.extractedText);
            }
            
            assignment.processedFiles.forEach((file, index) => {
              processedContent.push(file);
              contentSources.push(`Assignment File: ${file.fileName} (from ${assignment.name})`);
              allContent.push(file.extractedText);
            });
          });
        }
      }

      // Extract from course files if requested
      if (options.includeFiles !== false) {
        console.log('📁 Processing course files...');
        const filesResponse = await enhancedCanvasService.processCourseFiles(options.courseId, options.maxItems || 5);
        
        if (filesResponse.success) {
          processedContent.push(...filesResponse.data);
          filesResponse.data.forEach(file => {
            contentSources.push(`Course File: ${file.fileName}`);
            allContent.push(file.extractedText);
          });
        }
      }

      // Extract from modules if requested
      if (options.includeModules !== false) {
        console.log('📚 Processing course modules...');
        const moduleResponse = await enhancedCanvasService.extractStudyMaterialFromModules(options.courseId);
        
        if (moduleResponse.success) {
          processedContent.push(...moduleResponse.data.moduleContent);
          moduleResponse.data.moduleContent.forEach(content => {
            contentSources.push(`Module Content: ${content.fileName || 'Module Item'}`);
            allContent.push(content.extractedText);
          });
        }
      }

      // Create comprehensive study summary
      const combinedContent = allContent.join('\n\n');
      let studySummary = `Study materials extracted from ${processedContent.length} sources: ${contentSources.join(', ')}`;
      
      if (combinedContent.length > 1000) {
        console.log('📄 Creating study summary...');
        const summaryResponse = await aiService.summarizeAcademicContent(combinedContent, 800);
        if (summaryResponse.success) {
          studySummary = summaryResponse.data;
        }
      } else {
        studySummary = combinedContent || studySummary;
      }

      // Generate flashcards from all processed content
      console.log('🃏 Generating flashcards from study materials...');
      const flashcardResponse = await aiService.generateFlashcards({
        content: combinedContent || 'No content available',
        courseContext: {
          courseName: 'Course Study Materials',
          courseId: options.courseId
        },
        count: Math.min(15, processedContent.length * 2) // Scale with content amount
      });

      const flashcards = flashcardResponse.success ? flashcardResponse.data : [];

      console.log(`✅ Study material extraction completed:`);
      console.log(`  📊 ${processedContent.length} content items processed`);
      console.log(`  📝 ${studySummary.length} character summary created`);
      console.log(`  🃏 ${flashcards.length} flashcards generated`);

      return {
        success: true,
        data: {
          processedContent,
          studySummary,
          flashcards,
          contentSources
        }
      };

    } catch (error) {
      console.error('❌ Error extracting study materials:', error);
      return {
        success: false,
        error: `Study material extraction failed: ${error}`,
        data: {
          processedContent: [],
          studySummary: '',
          flashcards: [],
          contentSources: []
        }
      };
    }
  }

  // Process external URLs (like auto_student.py link processing)
  async processExternalUrls(urls: string[]): Promise<APIResponse<{
    processedContent: ProcessedContent[];
    summary: string;
    youtubeVideos: string[];
  }>> {
    try {
      console.log(`🔗 Processing ${urls.length} external URLs...`);

      // Process all URLs using the content processing service
      const processingResponse = await contentProcessingService.processMultipleContents(urls);
      
      if (!processingResponse.success) {
        return {
          success: false,
          error: processingResponse.error,
          data: {
            processedContent: [],
            summary: '',
            youtubeVideos: []
          }
        };
      }

      const processedContent = processingResponse.data;
      
      // Collect all YouTube video IDs
      const youtubeVideos = processedContent
        .flatMap(content => content.youtubeVideoIds)
        .filter((id, index, array) => array.indexOf(id) === index); // Remove duplicates

      // Create summary of all processed content
      const allText = processedContent
        .map(content => content.extractedText)
        .join('\n\n');

      let summary = `Processed ${processedContent.length} URLs, found ${youtubeVideos.length} YouTube videos`;
      
      if (allText.length > 500) {
        const summaryResponse = await aiService.summarizeAcademicContent(allText, 600);
        if (summaryResponse.success) {
          summary = summaryResponse.data;
        }
      } else if (allText.length > 0) {
        summary = allText;
      }

      console.log(`✅ External URL processing completed:`);
      console.log(`  🔗 ${processedContent.length} URLs processed`);
      console.log(`  📺 ${youtubeVideos.length} YouTube videos found`);
      console.log(`  📝 ${summary.length} character summary created`);

      return {
        success: true,
        data: {
          processedContent,
          summary,
          youtubeVideos
        }
      };

    } catch (error) {
      console.error('❌ Error processing external URLs:', error);
      return {
        success: false,
        error: `External URL processing failed: ${error}`,
        data: {
          processedContent: [],
          summary: '',
          youtubeVideos: []
        }
      };
    }
  }

  // Create a complete study session (combines all functionality)
  async createStudySession(courseId: number, options: {
    includeAssignments?: boolean;
    includeFiles?: boolean;
    includeModules?: boolean;
    generateFlashcards?: boolean;
    maxItemsPerCategory?: number;
  } = {}): Promise<APIResponse<StudySession>> {
    try {
      console.log(`🎯 Creating comprehensive study session for course ${courseId}...`);

      // Get course information
      const courseResponse = await canvasService.getAllCourseContent(courseId);
      const courseName = courseResponse.success && courseResponse.course 
        ? courseResponse.course.name 
        : `Course ${courseId}`;

      // Extract study materials
      const studyMaterialsResponse = await this.extractStudyMaterials({
        courseId,
        includeAssignments: options.includeAssignments,
        includeFiles: options.includeFiles,
        includeModules: options.includeModules,
        maxItems: options.maxItemsPerCategory || 3
      });

      if (!studyMaterialsResponse.success) {
        return {
          success: false,
          error: studyMaterialsResponse.error,
          data: {} as StudySession
        };
      }

      // Get assignment solution data for first few assignments
      const assignments: AssignmentSolutionData[] = [];
      if (options.includeAssignments !== false && courseResponse.success) {
        const assignmentPromises = courseResponse.assignments.slice(0, 2).map(assignment => 
          enhancedCanvasService.generateAssignmentSolutionData(assignment.id, courseId)
        );
        
        const assignmentResults = await Promise.allSettled(assignmentPromises);
        assignmentResults.forEach(result => {
          if (result.status === 'fulfilled' && result.value.success) {
            assignments.push(result.value.data);
          }
        });
      }

      const studySession: StudySession = {
        id: `study_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        courseId,
        courseName,
        assignments,
        processedFiles: studyMaterialsResponse.data.processedContent,
        flashcards: studyMaterialsResponse.data.flashcards,
        studyMaterials: [studyMaterialsResponse.data.studySummary],
        createdAt: new Date()
      };

      console.log(`✅ Study session created successfully:`);
      console.log(`  📚 Course: ${courseName}`);
      console.log(`  📝 ${assignments.length} assignments processed`);
      console.log(`  📄 ${studySession.processedFiles.length} files processed`);
      console.log(`  🃏 ${studySession.flashcards.length} flashcards generated`);

      return {
        success: true,
        data: studySession
      };

    } catch (error) {
      console.error('❌ Error creating study session:', error);
      return {
        success: false,
        error: `Study session creation failed: ${error}`,
        data: {} as StudySession
      };
    }
  }

  // Demo function showing different AI prompt purposes (coaching vs homework vs flashcards)
  async demonstratePromptDifferences(content: string, courseContext: { courseName: string; courseId: number }): Promise<APIResponse<{
    coachingResponse: string;
    homeworkSolution: string;
    flashcards: Flashcard[];
    reflectiveQuestions: string[];
  }>> {
    try {
      console.log('🎭 Demonstrating different AI prompt purposes...');

      // 1. Coaching/guidance response (ask questions, guide learning)
      const coachingResponse = await aiService.generateCoachingResponse(
        `Help me understand this material: ${content.substring(0, 500)}`,
        { courseContext }
      );

      // 2. Homework solution response (provide direct answers)
      const homeworkResponse = await aiService.generateHomeworkSolution({
        content,
        assignmentName: 'Study Material Analysis',
        courseContext
      });

      // 3. Flashcard generation (create study materials)
      const flashcardsResponse = await aiService.generateFlashcards({
        content,
        courseContext,
        count: 5
      });

      // 4. Reflective questions (ethical considerations)
      const reflectiveResponse = await aiService.generateReflectiveQuestions({
        content,
        className: courseContext.courseName,
        assignmentType: 'Study Material'
      });

      console.log('✅ Prompt differences demonstrated:');
      console.log('  🤝 Coaching: Asks guiding questions');
      console.log('  📝 Homework: Provides direct solutions');
      console.log('  🃏 Flashcards: Creates study materials');
      console.log('  🤔 Reflective: Encourages ethical thinking');

      return {
        success: true,
        data: {
          coachingResponse: coachingResponse.success ? coachingResponse.data : 'Coaching response failed',
          homeworkSolution: homeworkResponse.success ? homeworkResponse.data : 'Homework solution failed',
          flashcards: flashcardsResponse.success ? flashcardsResponse.data : [],
          reflectiveQuestions: reflectiveResponse.success ? reflectiveResponse.data : []
        }
      };

    } catch (error) {
      console.error('❌ Error demonstrating prompt differences:', error);
      return {
        success: false,
        error: `Prompt demonstration failed: ${error}`,
        data: {
          coachingResponse: '',
          homeworkSolution: '',
          flashcards: [],
          reflectiveQuestions: []
        }
      };
    }
  }
}

export default new StudyAssistantService();