import { 
  CanvasAssignment, 
  CanvasCourse, 
  CanvasModule,
  APIResponse 
} from '../types';
import canvasService from './canvasService';
import contentProcessingService, { ProcessedContent } from './contentProcessingService';

export interface EnhancedAssignment extends CanvasAssignment {
  processedContent?: ProcessedContent;
  extractedLinks: string[];
  youtubeVideoIds: string[];
  processedFiles: ProcessedContent[];
}

export interface AssignmentSolutionData {
  assignment: EnhancedAssignment;
  combinedContent: string;
  supplementaryContent: string[];
  promptLength: number;
  contentSources: string[];
}

class EnhancedCanvasService {
  // Process assignment description and extract all content (adapted from auto_student.py)
  async processAssignment(assignmentId: number, courseId: number): Promise<APIResponse<EnhancedAssignment>> {
    try {
      // Get assignment data from Canvas
      const assignmentResponse = await canvasService.getCourseAssignments(courseId);
      if (!assignmentResponse.success) {
        return {
          success: false,
          error: assignmentResponse.error || 'Failed to fetch assignment',
          data: {} as EnhancedAssignment
        };
      }

      const assignment = assignmentResponse.data.find(a => a.id === assignmentId);
      if (!assignment) {
        return {
          success: false,
          error: 'Assignment not found',
          data: {} as EnhancedAssignment
        };
      }

      // Process assignment description HTML
      let processedContent: ProcessedContent | undefined;
      let extractedLinks: string[] = [];
      let youtubeVideoIds: string[] = [];

      if (assignment.description && assignment.description.trim()) {
        const canvasBaseUrl = await this.getCanvasBaseUrl(courseId);
        const contentResult = await contentProcessingService.processContent(
          assignment.description,
          false, // isUrl = false (processing HTML content directly)
          canvasBaseUrl
        );

        if (contentResult.success) {
          processedContent = contentResult.data;
          extractedLinks = processedContent.links;
          youtubeVideoIds = processedContent.youtubeVideoIds;
        }
      }

      // Process linked files from assignment description
      const processedFiles: ProcessedContent[] = [];
      if (extractedLinks.length > 0) {
        const fileProcessingResult = await contentProcessingService.processMultipleContents(extractedLinks);
        if (fileProcessingResult.success) {
          processedFiles.push(...fileProcessingResult.data);
        }
      }

      const enhancedAssignment: EnhancedAssignment = {
        ...assignment,
        processedContent,
        extractedLinks,
        youtubeVideoIds,
        processedFiles
      };

      return {
        success: true,
        data: enhancedAssignment
      };

    } catch (error) {
      console.error('Error processing assignment:', error);
      return {
        success: false,
        error: `Failed to process assignment: ${error}`,
        data: {} as EnhancedAssignment
      };
    }
  }

  // Get Canvas base URL for relative link resolution
  private async getCanvasBaseUrl(courseId: number): Promise<string> {
    try {
      // Try to get Canvas API URL from existing canvasService configuration
      // This would depend on how your Canvas service is configured
      return 'https://canvas.instructure.com'; // Default fallback
    } catch (error) {
      return 'https://canvas.instructure.com';
    }
  }

  // Generate comprehensive solution data for assignments (adapted from auto_student.py generate_solution)
  async generateAssignmentSolutionData(assignmentId: number, courseId: number): Promise<APIResponse<AssignmentSolutionData>> {
    try {
      // Process the assignment
      const enhancedAssignmentResponse = await this.processAssignment(assignmentId, courseId);
      if (!enhancedAssignmentResponse.success) {
        return {
          success: false,
          error: enhancedAssignmentResponse.error,
          data: {} as AssignmentSolutionData
        };
      }

      const assignment = enhancedAssignmentResponse.data;
      
      // Build supplementary content parts (similar to auto_student.py structure)
      const supplementaryContent: string[] = [];
      const contentSources: string[] = [];

      // Add processed assignment description
      if (assignment.processedContent) {
        const contentSection = `--- Assignment Description Content ---\n${assignment.processedContent.extractedText}\n--- End Assignment Description ---`;
        supplementaryContent.push(contentSection);
        contentSources.push('Assignment Description');
      }

      // Add processed files content
      assignment.processedFiles.forEach((processedFile, index) => {
        const fileSection = `--- Content from ${processedFile.fileName} (${processedFile.originalUrl}) ---\n${processedFile.extractedText}\n--- End Content from ${processedFile.fileName} ---`;
        supplementaryContent.push(fileSection);
        contentSources.push(`File: ${processedFile.fileName}`);
      });

      // Add YouTube video placeholders (transcripts would need separate implementation)
      assignment.youtubeVideoIds.forEach(videoId => {
        const transcriptSection = `--- YouTube Video Transcript (Video ID: ${videoId}) ---\n[Transcript extraction not implemented - would require YouTube API or transcript library]\n--- End Transcript (Video ID: ${videoId}) ---`;
        supplementaryContent.push(transcriptSection);
        contentSources.push(`YouTube Video: ${videoId}`);
      });

      // Combine all content for AI processing
      const combinedContent = supplementaryContent.length > 0 
        ? supplementaryContent.join('\n\n')
        : '[No supplementary content processed.]';

      // Build the comprehensive prompt (similar to auto_student.py format)
      const assignmentPrompt = this.buildAssignmentPrompt(assignment, combinedContent);

      const solutionData: AssignmentSolutionData = {
        assignment,
        combinedContent,
        supplementaryContent,
        promptLength: assignmentPrompt.length,
        contentSources
      };

      return {
        success: true,
        data: solutionData
      };

    } catch (error) {
      console.error('Error generating assignment solution data:', error);
      return {
        success: false,
        error: `Failed to generate assignment solution data: ${error}`,
        data: {} as AssignmentSolutionData
      };
    }
  }

  // Build comprehensive assignment prompt (adapted from auto_student.py prompt structure)
  private buildAssignmentPrompt(assignment: EnhancedAssignment, supplementaryContent: string): string {
    return `You are an expert academic assistant. Your task is to provide a comprehensive solution for the following university-level assignment.
Please analyze the assignment description and any supplementary content (files, transcripts) carefully and generate a complete response.
Only provide the answer to the question in an appropriate format. That means a proper MLA essay format for a question that wants an essay response, simple python code if the result is for a python notebook, or others as appropriate to the assignment's requirements. Do not restate my question or offer a follow up question.

--- ASSIGNMENT DETAILS ---
Assignment Name: ${assignment.name}
Due Date: ${assignment.due_at ? new Date(assignment.due_at).toLocaleDateString() : 'No due date'}
Points: ${assignment.points_possible || 'Not specified'}
Description (cleaned):
${assignment.processedContent?.extractedText || assignment.description || 'No description available'}
--- END OF ASSIGNMENT DETAILS ---

--- SUPPLEMENTARY CONTENT (Files & Transcripts) ---
${supplementaryContent}
--- END OF SUPPLEMENTARY CONTENT ---

Please provide your solution below:`;
  }

  // Process course files and extract content
  async processCourseFiles(courseId: number, limit: number = 10): Promise<APIResponse<ProcessedContent[]>> {
    try {
      // Get course files from Canvas
      const filesResponse = await canvasService.getCourseFiles(courseId);
      if (!filesResponse.success) {
        return {
          success: false,
          error: filesResponse.error || 'Failed to fetch course files',
          data: []
        };
      }

      // Process the files (limit to avoid overwhelming)
      const filesToProcess = filesResponse.data
        .filter(file => file.url) // Only files with URLs
        .slice(0, limit);

      const fileUrls = filesToProcess.map(file => file.url);
      const processingResult = await contentProcessingService.processMultipleContents(fileUrls);

      return processingResult;

    } catch (error) {
      console.error('Error processing course files:', error);
      return {
        success: false,
        error: `Failed to process course files: ${error}`,
        data: []
      };
    }
  }

  // Get all course assignments with enhanced content processing
  async getEnhancedCourseAssignments(courseId: number): Promise<APIResponse<EnhancedAssignment[]>> {
    try {
      const assignmentsResponse = await canvasService.getCourseAssignments(courseId);
      if (!assignmentsResponse.success) {
        return {
          success: false,
          error: assignmentsResponse.error,
          data: []
        };
      }

      // Process each assignment (limit to first 5 to avoid overwhelming)
      const assignmentsToProcess = assignmentsResponse.data.slice(0, 5);
      const processingPromises = assignmentsToProcess.map(assignment => 
        this.processAssignment(assignment.id, courseId)
      );

      const results = await Promise.allSettled(processingPromises);
      const enhancedAssignments: EnhancedAssignment[] = [];
      const errors: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          enhancedAssignments.push(result.value.data);
        } else {
          const error = result.status === 'rejected' ? result.reason : result.value.error;
          errors.push(`Assignment ${assignmentsToProcess[index].name}: ${error}`);
        }
      });

      return {
        success: true,
        data: enhancedAssignments,
        error: errors.length > 0 ? `Some assignments failed to process: ${errors.join('; ')}` : undefined
      };

    } catch (error) {
      console.error('Error getting enhanced course assignments:', error);
      return {
        success: false,
        error: `Failed to get enhanced course assignments: ${error}`,
        data: []
      };
    }
  }

  // Extract study material from course modules
  async extractStudyMaterialFromModules(courseId: number): Promise<APIResponse<{ moduleContent: ProcessedContent[]; summary: string }>> {
    try {
      // Get course modules
      const course = await canvasService.getAllCourseContent(courseId);
      if (!course.success || !course.modules) {
        return {
          success: false,
          error: 'Failed to fetch course modules',
          data: { moduleContent: [], summary: '' }
        };
      }

      const moduleContent: ProcessedContent[] = [];
      const contentSources: string[] = [];

      // Process module items that have URLs
      for (const module of course.modules.slice(0, 5)) { // Limit to first 5 modules
        if (module.items) {
          for (const item of module.items.slice(0, 3)) { // Limit to first 3 items per module
            if (item.external_url || item.html_url) {
              const url = item.external_url || item.html_url;
              const contentResult = await contentProcessingService.processContent(url, true);
              
              if (contentResult.success) {
                moduleContent.push(contentResult.data);
                contentSources.push(`Module: ${module.name} - Item: ${item.title}`);
              }
            }
          }
        }
      }

      // Create a summary of all module content
      const allContent = moduleContent.map(content => content.extractedText).join('\n\n');
      const summary = allContent.length > 500 
        ? `Study material extracted from ${moduleContent.length} module items across ${course.modules.slice(0, 5).length} modules. Sources: ${contentSources.join(', ')}`
        : allContent;

      return {
        success: true,
        data: {
          moduleContent,
          summary
        }
      };

    } catch (error) {
      console.error('Error extracting study material from modules:', error);
      return {
        success: false,
        error: `Failed to extract study material: ${error}`,
        data: { moduleContent: [], summary: '' }
      };
    }
  }
}

export default new EnhancedCanvasService();