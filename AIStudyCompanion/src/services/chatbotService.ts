import { 
  ChatMessage, 
  CanvasCourse, 
  CanvasAssignment, 
  CanvasModule,
  APIResponse,
  CustomInstructions,
  UserPreferences
} from '../types';
import aiService from './aiService';
import canvasService from './canvasService';
import userPreferencesService from './userPreferencesService';

export interface CourseContext {
  course: CanvasCourse;
  assignments: CanvasAssignment[];
  modules: CanvasModule[];
  files: any[];
  pages: any[];
  discussions: any[];
}

export interface ChatbotResponse {
  message: string;
  suggestedActions?: string[];
  relatedAssignments?: CanvasAssignment[];
  courseContext?: CanvasCourse;
}

class ChatbotService {
  private courseCache: Map<number, CourseContext> = new Map();
  private userCourses: CanvasCourse[] = [];
  private completedCourses: CanvasCourse[] = [];
  private allCourses: CanvasCourse[] = [];

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
      console.error('Error loading user preferences in chatbot:', error);
      return null;
    }
  }

  async initialize(): Promise<void> {
    try {
      // Fetch both active and completed courses
      const [activeCourses, completedCoursesResponse] = await Promise.all([
        canvasService.getUserCourses(),
        canvasService.getCompletedCourses()
      ]);
      
      if (activeCourses.success) {
        this.userCourses = activeCourses.data;
      }
      
      if (completedCoursesResponse.success) {
        this.completedCourses = completedCoursesResponse.data;
      }
      
      // Combine all courses for comprehensive searching
      this.allCourses = [...this.userCourses, ...this.completedCourses];
      
      console.log(`Chatbot initialized with ${this.userCourses.length} active courses and ${this.completedCourses.length} completed courses`);
    } catch (error) {
      console.error('Error initializing chatbot service:', error);
    }
  }

  // Course Recognition Methods
  private extractCourseReferences(message: string): {
    courseName?: string;
    courseCode?: string;
    topic?: string;
  } {
    const lowerMessage = message.toLowerCase();
    
    // Look for course patterns
    const coursePatterns = [
      /(?:in|for|about|from)\s+([a-z]+\s*\d+)/gi, // "in CS101", "for MATH200"
      /(?:in|for|about|from)\s+"([^"]+)"/gi,     // "in "Data Structures""
      /(?:in|for|about|from)\s+([a-z\s]+\d+[a-z\s]*)/gi, // "in Computer Science 101"
      /(my|this|the)\s+([a-z\s]+)\s+(?:class|course)/gi,  // "my biology class"
    ];

    let courseName: string | undefined;
    let courseCode: string | undefined;

    for (const pattern of coursePatterns) {
      const matches = [...message.matchAll(pattern)];
      if (matches.length > 0) {
        const match = matches[0][1] || matches[0][2];
        if (match) {
          if (/[A-Z]+\s*\d+/.test(match)) {
            courseCode = match.trim();
          } else {
            courseName = match.trim();
          }
          break;
        }
      }
    }

    // Extract topic if present
    const topicPatterns = [
      /about\s+([^?\.]+)/gi,
      /studying\s+([^?\.]+)/gi,
      /learning\s+([^?\.]+)/gi,
    ];

    let topic: string | undefined;
    for (const pattern of topicPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        topic = match[1].trim();
        break;
      }
    }

    return { courseName, courseCode, topic };
  }

  private async findBestMatchingCourse(
    courseName?: string, 
    courseCode?: string
  ): Promise<CanvasCourse | null> {
    if (!this.allCourses.length) {
      await this.initialize();
    }

    if (!courseName && !courseCode) {
      return null;
    }

    // Search in all courses (both active and completed)
    // Exact matches first
    if (courseCode) {
      const exactMatch = this.allCourses.find(course => 
        course.course_code.toLowerCase() === courseCode.toLowerCase()
      );
      if (exactMatch) return exactMatch;
    }

    if (courseName) {
      const exactMatch = this.allCourses.find(course =>
        course.name.toLowerCase() === courseName.toLowerCase()
      );
      if (exactMatch) return exactMatch;
    }

    // Partial matches
    if (courseCode) {
      const partialMatch = this.allCourses.find(course =>
        course.course_code.toLowerCase().includes(courseCode.toLowerCase()) ||
        courseCode.toLowerCase().includes(course.course_code.toLowerCase())
      );
      if (partialMatch) return partialMatch;
    }

    if (courseName) {
      const partialMatch = this.allCourses.find(course =>
        course.name.toLowerCase().includes(courseName.toLowerCase()) ||
        courseName.toLowerCase().includes(course.name.toLowerCase())
      );
      if (partialMatch) return partialMatch;
    }

    return null;
  }

  private async getCourseContext(courseId: number): Promise<CourseContext | null> {
    // Check cache first
    if (this.courseCache.has(courseId)) {
      return this.courseCache.get(courseId)!;
    }

    try {
      const courseData = await canvasService.getAllCourseContent(courseId);
      
      if (!courseData.success || !courseData.course) {
        return null;
      }

      const context: CourseContext = {
        course: courseData.course,
        assignments: courseData.assignments,
        modules: courseData.modules,
        files: courseData.files,
        pages: courseData.pages,
        discussions: courseData.discussions,
      };

      // Cache the context
      this.courseCache.set(courseId, context);
      return context;
    } catch (error) {
      console.error(`Error fetching course context for ${courseId}:`, error);
      return null;
    }
  }

  // Assignment-related query handlers
  private async handleAssignmentQuery(
    message: string, 
    courseContext: CourseContext
  ): Promise<ChatbotResponse> {
    const assignments = courseContext.assignments;
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('what assignments') || lowerMessage.includes('assignments do i have')) {
      const upcomingAssignments = assignments
        .filter(assignment => {
          if (!assignment.due_at) return true;
          return new Date(assignment.due_at) > new Date();
        })
        .sort((a, b) => {
          if (!a.due_at && !b.due_at) return 0;
          if (!a.due_at) return 1;
          if (!b.due_at) return -1;
          return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
        });

      let response = `Here are your upcoming assignments for ${courseContext.course.name}:\n\n`;
      
      upcomingAssignments.slice(0, 10).forEach((assignment, index) => {
        const dueDate = assignment.due_at ? 
          new Date(assignment.due_at).toLocaleDateString() : 
          'No due date';
        response += `${index + 1}. ${assignment.name}\n   Due: ${dueDate}\n   Points: ${assignment.points_possible}\n\n`;
      });

      if (upcomingAssignments.length === 0) {
        response = `Great news! You don't have any upcoming assignments in ${courseContext.course.name}.`;
      }

      return {
        message: response,
        relatedAssignments: upcomingAssignments.slice(0, 5),
        courseContext: courseContext.course,
        suggestedActions: [
          'Show assignment details',
          'View upcoming deadlines',
          'Create study schedule'
        ]
      };
    }

    if (lowerMessage.includes('due') || lowerMessage.includes('deadline')) {
      const dueSoon = assignments
        .filter(assignment => {
          if (!assignment.due_at) return false;
          const dueDate = new Date(assignment.due_at);
          const now = new Date();
          const daysDiff = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff >= 0 && daysDiff <= 7;
        })
        .sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime());

      if (dueSoon.length === 0) {
        return {
          message: `No assignments are due in the next week for ${courseContext.course.name}.`,
          courseContext: courseContext.course
        };
      }

      let response = `Assignments due this week in ${courseContext.course.name}:\n\n`;
      dueSoon.forEach((assignment, index) => {
        const dueDate = new Date(assignment.due_at!);
        const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        response += `${index + 1}. ${assignment.name}\n   Due: ${dueDate.toLocaleDateString()} (${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''})\n\n`;
      });

      return {
        message: response,
        relatedAssignments: dueSoon,
        courseContext: courseContext.course,
        suggestedActions: ['Set reminders', 'Create study plan', 'View assignment details']
      };
    }

    return {
      message: `I found ${assignments.length} assignments in ${courseContext.course.name}. What would you like to know about them?`,
      courseContext: courseContext.course,
      suggestedActions: ['Show all assignments', 'Show due dates', 'Filter by status']
    };
  }

  // Flashcard generation handler
  private async handleFlashcardQuery(
    message: string,
    courseContext: CourseContext
  ): Promise<ChatbotResponse> {
    try {
      // Prepare content from course context
      let content = `Course: ${courseContext.course.name} (${courseContext.course.course_code})\n\n`;
      
      // Add recent assignments
      if (courseContext.assignments.length > 0) {
        content += 'Recent Assignments:\n';
        courseContext.assignments.slice(0, 3).forEach(assignment => {
          content += `- ${assignment.name}\n`;
          if (assignment.description) {
            const cleanDescription = assignment.description.replace(/<[^>]*>/g, '');
            content += `  ${cleanDescription.substring(0, 150)}...\n`;
          }
        });
      }
      
      // Add module information
      if (courseContext.modules.length > 0) {
        content += '\nKey Modules:\n';
        courseContext.modules.slice(0, 3).forEach(module => {
          content += `- ${module.name}\n`;
          if (module.items && module.items.length > 0) {
            module.items.slice(0, 2).forEach(item => {
              content += `  • ${item.title}\n`;
            });
          }
        });
      }
      
      // Generate flashcards using AI service
      const flashcardResponse = await aiService.generateFlashcards({
        content,
        courseContext: {
          courseName: courseContext.course.name,
          courseId: courseContext.course.id,
        },
        count: 8,
      });
      
      // For flashcard requests, direct user to Content Creator
      return {
        message: `I can help you understand your course material for ${courseContext.course.name}, but for generating flashcards, you'll want to use the Content Creator tab. \n\nThere you can:\n• Select your course\n• Generate AI-powered flashcards from your assignments and materials\n• Study them with our interactive flashcard system\n\nMeanwhile, I can help answer questions about your course content, assignments, and study strategies!`,
        courseContext: courseContext.course,
        suggestedActions: [
          'Show me my assignments',
          'What should I study first?',
          'Help me understand this topic'
        ]
      };
    } catch (error) {
      console.error('Error generating flashcards in chatbot:', error);
      return {
        message: `I encountered an error while trying to generate flashcards for ${courseContext.course.name}. Please try again in a moment.`,
        courseContext: courseContext.course,
        suggestedActions: ['Try again', 'Show assignments', 'Get help']
      };
    }
  }

  // Study material query handlers
  private async handleStudyQuery(
    message: string,
    courseContext: CourseContext,
    topic?: string
  ): Promise<ChatbotResponse> {
    const { modules, files, pages } = courseContext;
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('main points') || lowerMessage.includes('what to study')) {
      let studyContent = '';
      
      // Get first few modules to understand course structure
      const firstModules = modules.slice(0, 3);
      
      studyContent += `## Key Study Areas for ${courseContext.course.name}\n\n`;
      
      firstModules.forEach((module, index) => {
        studyContent += `### Module ${index + 1}: ${module.name}\n`;
        if (module.items && module.items.length > 0) {
          module.items.slice(0, 5).forEach(item => {
            studyContent += `- ${item.title}\n`;
          });
        }
        studyContent += '\n';
      });

      // Add recent assignments as study topics
      const recentAssignments = courseContext.assignments
        .filter(a => a.workflow_state === 'published')
        .slice(0, 3);
      
      if (recentAssignments.length > 0) {
        studyContent += `### Important Assignments\n`;
        recentAssignments.forEach(assignment => {
          studyContent += `- ${assignment.name}\n`;
        });
      }

      return {
        message: studyContent,
        courseContext: courseContext.course,
        suggestedActions: [
          'Generate flashcards',
          'Create study guide', 
          'Schedule study sessions'
        ]
      };
    }

    if (lowerMessage.includes('first few weeks') || lowerMessage.includes('beginning') || lowerMessage.includes('start')) {
      const earlyModules = modules
        .filter(module => module.position <= 3)
        .sort((a, b) => a.position - b.position);

      let response = `## What to focus on in the first few weeks of ${courseContext.course.name}:\n\n`;
      
      earlyModules.forEach(module => {
        response += `### ${module.name}\n`;
        if (module.items && module.items.length > 0) {
          const keyItems = module.items.slice(0, 4);
          keyItems.forEach(item => {
            response += `- ${item.title}\n`;
          });
          response += '\n';
        }
      });

      // Add early assignments (first 3 since position property doesn't exist on CanvasAssignment)
      const earlyAssignments = courseContext.assignments.slice(0, 3);

      if (earlyAssignments.length > 0) {
        response += `### Early Assignments to Prepare For:\n`;
        earlyAssignments.forEach(assignment => {
          response += `- ${assignment.name}\n`;
        });
      }

      return {
        message: response,
        courseContext: courseContext.course,
        relatedAssignments: earlyAssignments,
        suggestedActions: [
          'Create study schedule',
          'Generate flashcards for basics',
          'Set up study reminders'
        ]
      };
    }

    return {
      message: `I can help you study ${courseContext.course.name}. I found ${modules.length} modules and ${files.length} files. What specific topics would you like to focus on?`,
      courseContext: courseContext.course,
      suggestedActions: [
        'Show all topics',
        'Create study guide',
        'Generate practice questions'
      ]
    };
  }

  // Main chatbot response method
  async processMessage(
    message: string,
    customInstructions?: CustomInstructions,
    conversationHistory?: ChatMessage[]
  ): Promise<APIResponse<ChatbotResponse>> {
    try {
      const lowerMessage = message.toLowerCase();
      
      // Extract course references from the message early for use in various handlers
      const { courseName, courseCode, topic } = this.extractCourseReferences(message);
      
      // Handle course listing queries first
      if (lowerMessage.includes('list my courses') || 
          lowerMessage.includes('show my courses') || 
          lowerMessage.includes('what courses') ||
          lowerMessage.includes('my courses') ||
          lowerMessage.includes('which courses') ||
          (lowerMessage.includes('courses') && (lowerMessage.includes('have') || lowerMessage.includes('enrolled') || lowerMessage.includes('taking')))) {
        
        await this.initialize(); // Ensure we have latest course data
        
        if (this.allCourses.length === 0) {
          return {
            data: {
              message: "I couldn't find any courses in your Canvas account. Make sure you're enrolled in courses and that your Canvas integration is working properly.",
              suggestedActions: ['Check Canvas connection', 'Contact support']
            },
            success: true
          };
        }
        
        let response = "";
        
        // Show active courses first
        if (this.userCourses.length > 0) {
          response += "Your Current Courses:\n\n";
          this.userCourses.forEach((course, index) => {
            response += `${index + 1}. ${course.name}`;
            if (course.course_code) {
              response += ` (${course.course_code})`;
            }
            response += ` - ${course.workflow_state}\n`;
          });
          response += "\n";
        }
        
        // Show completed courses if any
        if (this.completedCourses.length > 0) {
          response += "Your Completed Courses:\n\n";
          this.completedCourses.forEach((course, index) => {
            response += `${index + 1}. ${course.name}`;
            if (course.course_code) {
              response += ` (${course.course_code})`;
            }
            response += ` - Completed\n`;
          });
          response += "\n";
        }
        
        response += `I have access to all ${this.allCourses.length} of your courses (active and completed) and can help you with assignments, study materials, and questions about any of them. Just ask me anything!`;
        
        return {
          data: {
            message: response,
            suggestedActions: [
              'What assignments do I have?',
              'Show me recent files from my courses',
              'Help me study for my next exam'
            ]
          },
          success: true
        };
      }
      
      // Handle comprehensive assignment queries across all courses
      if ((lowerMessage.includes('assignments') || lowerMessage.includes('homework') || lowerMessage.includes('assignment')) && 
          (lowerMessage.includes('do i have') || lowerMessage.includes('have') || lowerMessage.includes('due') || 
           lowerMessage.includes('upcoming') || lowerMessage.includes('what assignments') || lowerMessage.includes('my assignments')) &&
          !courseName && !courseCode) {
        
        await this.initialize(); // Ensure we have latest course data
        let allAssignments: { assignment: CanvasAssignment; courseName: string; courseId: number; isCompleted: boolean }[] = [];
        
        // Fetch assignments from ALL courses (both active and completed for comprehensive view)
        const coursesToCheck = this.allCourses;
        
        const assignmentPromises = coursesToCheck.map(async (course) => {
          try {
            const assignmentsResponse = await canvasService.getCourseAssignments(course.id);
            if (assignmentsResponse.success && assignmentsResponse.data.length > 0) {
              return assignmentsResponse.data.map(assignment => ({ 
                assignment, 
                courseName: course.name, 
                courseId: course.id,
                isCompleted: course.workflow_state === 'completed'
              }));
            }
          } catch (error) {
            console.error(`Error fetching assignments for ${course.name}:`, error);
          }
          return [];
        });
        
        const assignmentResults = await Promise.all(assignmentPromises);
        allAssignments = assignmentResults.flat();
        
        if (allAssignments.length === 0) {
          return {
            data: {
              message: "I couldn't find any assignments in your Canvas courses. This might mean your courses don't have assignments yet, or there may be an issue with Canvas access.",
              suggestedActions: ['List my courses', 'Check Canvas connection', 'Help me study existing materials']
            },
            success: true
          };
        }
        
        // Separate upcoming vs overdue vs completed assignments
        const now = new Date();
        const upcomingAssignments = allAssignments.filter(item => {
          if (!item.assignment.due_at) return !item.isCompleted; // No due date, include if course is active
          return new Date(item.assignment.due_at) > now && !item.isCompleted;
        });
        
        const overdueAssignments = allAssignments.filter(item => {
          if (!item.assignment.due_at) return false;
          return new Date(item.assignment.due_at) <= now && !item.isCompleted;
        });
        
        // Sort by due date (earliest first)
        upcomingAssignments.sort((a, b) => {
          if (!a.assignment.due_at && !b.assignment.due_at) return 0;
          if (!a.assignment.due_at) return 1;
          if (!b.assignment.due_at) return -1;
          return new Date(a.assignment.due_at).getTime() - new Date(b.assignment.due_at).getTime();
        });
        
        overdueAssignments.sort((a, b) => {
          if (!a.assignment.due_at && !b.assignment.due_at) return 0;
          if (!a.assignment.due_at) return 1;
          if (!b.assignment.due_at) return -1;
          return new Date(b.assignment.due_at).getTime() - new Date(a.assignment.due_at).getTime(); // Most recent overdue first
        });
        
        let response = `I found ${allAssignments.length} assignments across all your courses.\n\n`;
        
        // Show overdue assignments first (priority!)
        if (overdueAssignments.length > 0) {
          response += `🚨 OVERDUE ASSIGNMENTS (${overdueAssignments.length}):\n\n`;
          overdueAssignments.slice(0, 5).forEach((item, index) => {
            const dueDate = new Date(item.assignment.due_at!);
            const daysOverdue = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            response += `${index + 1}. ${item.assignment.name} (${item.courseName})\n`;
            response += `   📅 Was due: ${dueDate.toLocaleDateString()} (${daysOverdue} days ago)\n`;
            response += `   📝 Points: ${item.assignment.points_possible}\n`;
            if (item.assignment.description) {
              const cleanDesc = item.assignment.description.replace(/<[^>]*>/g, '').substring(0, 100);
              response += `   📋 ${cleanDesc}${cleanDesc.length >= 100 ? '...' : ''}\n`;
            }
            response += '\n';
          });
        }
        
        // Show upcoming assignments
        if (upcomingAssignments.length > 0) {
          response += `📚 UPCOMING ASSIGNMENTS (${upcomingAssignments.length}):\n\n`;
          upcomingAssignments.slice(0, 8).forEach((item, index) => {
            const dueDate = item.assignment.due_at ? new Date(item.assignment.due_at) : null;
            response += `${index + 1}. ${item.assignment.name} (${item.courseName})\n`;
            
            if (dueDate) {
              const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              let urgency = '';
              if (daysUntilDue <= 1) urgency = '🔴 ';
              else if (daysUntilDue <= 3) urgency = '🟡 ';
              else if (daysUntilDue <= 7) urgency = '🟢 ';
              
              response += `   📅 ${urgency}Due: ${dueDate.toLocaleDateString()} (${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''})\n`;
            } else {
              response += `   📅 No due date specified\n`;
            }
            
            response += `   📝 Points: ${item.assignment.points_possible}\n`;
            if (item.assignment.description) {
              const cleanDesc = item.assignment.description.replace(/<[^>]*>/g, '').substring(0, 100);
              response += `   📋 ${cleanDesc}${cleanDesc.length >= 100 ? '...' : ''}\n`;
            }
            response += '\n';
          });
          
          if (upcomingAssignments.length > 8) {
            response += `...and ${upcomingAssignments.length - 8} more upcoming assignments.\n\n`;
          }
        }
        
        if (upcomingAssignments.length === 0 && overdueAssignments.length === 0) {
          response += "🎉 Great news! You don't have any upcoming assignments right now.\n\n";
        }
        
        response += "💡 I can provide more details about any specific assignment, help you prioritize your work, or assist with study materials for these courses.";
        
        return {
          data: {
            message: response,
            suggestedActions: [
              'Help me prioritize my assignments',
              'Show me study materials for these courses',
              'What should I work on first?'
            ]
          },
          success: true
        };
      }
      
      // Handle file and material queries across all courses
      if ((lowerMessage.includes('files') || lowerMessage.includes('materials') || lowerMessage.includes('documents') || 
           lowerMessage.includes('recent files') || lowerMessage.includes('show me files')) &&
          !courseName && !courseCode) {
        
        await this.initialize();
        let allFiles: { file: any; courseName: string; courseId: number }[] = [];
        
        // Fetch files from active courses
        const filePromises = this.userCourses.slice(0, 10).map(async (course) => {
          try {
            const filesResponse = await canvasService.getCourseFiles(course.id);
            if (filesResponse.success && filesResponse.data.length > 0) {
              return filesResponse.data.slice(0, 5).map(file => ({ 
                file, 
                courseName: course.name, 
                courseId: course.id
              }));
            }
          } catch (error) {
            console.error(`Error fetching files for ${course.name}:`, error);
          }
          return [];
        });
        
        const fileResults = await Promise.all(filePromises);
        allFiles = fileResults.flat();
        
        if (allFiles.length === 0) {
          return {
            data: {
              message: "I didn't find any files in your current courses. Files might not be uploaded yet, or they may be in course modules instead.",
              suggestedActions: ['Show me course modules', 'List my courses', 'Help me with assignments']
            },
            success: true
          };
        }
        
        // Sort by most recent
        allFiles.sort((a, b) => {
          const aDate = a.file.updated_at ? new Date(a.file.updated_at).getTime() : 0;
          const bDate = b.file.updated_at ? new Date(b.file.updated_at).getTime() : 0;
          return bDate - aDate;
        });
        
        let response = `📁 Recent Files from Your Courses (${allFiles.length} total):\n\n`;
        
        allFiles.slice(0, 15).forEach((item, index) => {
          response += `${index + 1}. ${item.file.display_name || item.file.filename}`;
          
          // Add file type emoji
          const fileName = item.file.display_name || item.file.filename;
          const extension = fileName.split('.').pop()?.toLowerCase();
          let emoji = '📄';
          if (extension === 'pdf') emoji = '📄';
          else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) emoji = '🖼️';
          else if (['mp4', 'mov', 'avi'].includes(extension || '')) emoji = '🎥';
          else if (['mp3', 'wav'].includes(extension || '')) emoji = '🎵';
          else if (['zip', 'rar'].includes(extension || '')) emoji = '📦';
          
          response += ` ${emoji}\n`;
          response += `   📚 Course: ${item.courseName}\n`;
          
          if (item.file.updated_at) {
            const updatedDate = new Date(item.file.updated_at);
            response += `   📅 Updated: ${updatedDate.toLocaleDateString()}\n`;
          }
          
          if (item.file.size) {
            const sizeKB = Math.round(item.file.size / 1024);
            const sizeMB = (sizeKB / 1024).toFixed(1);
            const sizeStr = sizeKB > 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;
            response += `   💾 Size: ${sizeStr}\n`;
          }
          
          response += '\n';
        });
        
        if (allFiles.length > 15) {
          response += `...and ${allFiles.length - 15} more files available.\n\n`;
        }
        
        response += "💡 I can help you find specific files, explain course materials, or create study guides from these resources.";
        
        return {
          data: {
            message: response,
            suggestedActions: [
              'Help me organize these files',
              'Create study materials from course files',
              'Find files for a specific course'
            ]
          },
          success: true
        };
      }
      
      // Find the matching course
      const matchedCourse = await this.findBestMatchingCourse(courseName, courseCode);
      
      if (matchedCourse) {
        // Get full course context
        const courseContext = await this.getCourseContext(matchedCourse.id);
        
        if (!courseContext) {
          return {
            data: {
              message: `I found the course ${matchedCourse.name}, but couldn't load its content. Please try again.`,
            },
            success: false,
            error: 'Failed to load course content'
          };
        }

        // Handle different types of queries
        const lowerMessage = message.toLowerCase();
        
        // Assignment-related queries
        if (lowerMessage.includes('assignment') || lowerMessage.includes('due') || lowerMessage.includes('homework')) {
          const response = await this.handleAssignmentQuery(message, courseContext);
          return { data: response, success: true };
        }
        
        // Flashcard generation queries
        if (lowerMessage.includes('flashcard') || lowerMessage.includes('flash card') || lowerMessage.includes('generate flashcards')) {
          const response = await this.handleFlashcardQuery(message, courseContext);
          return { data: response, success: true };
        }

        // Study-related queries
        if (lowerMessage.includes('study') || lowerMessage.includes('learn') || lowerMessage.includes('main points') || lowerMessage.includes('focus on')) {
          const response = await this.handleStudyQuery(message, courseContext, topic);
          return { data: response, success: true };
        }
        
        // General course query - use AI with comprehensive Canvas context
        await this.enrichCourseContextForAI(courseContext, message);
        
        const aiResponse = await aiService.generateCoachingResponse(message, {
          courseContext: {
            courseName: matchedCourse.name,
            courseId: matchedCourse.id,
            topic
          },
          canvasData: this.formatCanvasDataForAI(courseContext),
          customInstructions,
          previousMessages: conversationHistory
        });

        if (aiResponse.success) {
          return {
            data: {
              message: aiResponse.data,
              courseContext: matchedCourse,
              suggestedActions: [
                'Show assignments',
                'Tell me about upcoming deadlines',
                'What topics should I focus on?'
              ]
            },
            success: true
          };
        }
      }

      // No course context found or general query
      if (courseName || courseCode) {
        await this.initialize();
        const availableCourses = this.allCourses.map(c => `${c.name} (${c.course_code})`).join(', ');
        return {
          data: {
            message: `I couldn't find a course matching "${courseName || courseCode}". Your available courses are: ${availableCourses}\n\nI can help with any of these courses - just ask me about assignments, materials, or study help!`,
            suggestedActions: ['List my courses', 'What assignments do I have?', 'Show me recent files']
          },
          success: true
        };
      }

      // General AI response with comprehensive Canvas context
      await this.initialize();
      
      // Build comprehensive Canvas context for AI
      let canvasContext = '';
      if (this.allCourses.length > 0) {
        canvasContext += `\n## Student's Canvas Context\n\n`;
        canvasContext += `Active Courses (${this.userCourses.length}): ${this.userCourses.map(c => c.name).join(', ')}\n`;
        if (this.completedCourses.length > 0) {
          canvasContext += `Completed Courses (${this.completedCourses.length}): ${this.completedCourses.map(c => c.name).join(', ')}\n`;
        }
        canvasContext += '\nI have full access to all course assignments, files, modules, and materials. I can provide specific details about due dates, assignment descriptions, course content, and study materials without the student needing to provide those details.\n';
      }

      const generalResponse = await aiService.generateCoachingResponse(message, {
        customInstructions,
        previousMessages: conversationHistory,
        canvasData: canvasContext
      });

      if (generalResponse.success) {
        return {
          data: {
            message: generalResponse.data,
            suggestedActions: ['What assignments do I have?', 'List my courses', 'Show me recent files']
          },
          success: true
        };
      }

      return {
        data: {
          message: "I'm here to help with your studies! I have access to all your Canvas courses, assignments, and materials. Try asking me about your coursework!",
          suggestedActions: ['What assignments do I have?', 'List my courses', 'Show me recent files']
        },
        success: true
      };

    } catch (error) {
      console.error('Chatbot processing error:', error);
      return {
        data: {
          message: "I'm having trouble processing your request right now. Please try again."
        },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Canvas data enrichment for AI
  private async enrichCourseContextForAI(courseContext: CourseContext, userMessage: string): Promise<void> {
    // Based on the user's message, we might need additional Canvas data
    const lowerMessage = userMessage.toLowerCase();
    
    // If they're asking about recent activity, files, discussions, etc., fetch more data
    if (lowerMessage.includes('recent') || lowerMessage.includes('latest') || 
        lowerMessage.includes('file') || lowerMessage.includes('discussion')) {
      
      try {
        // Fetch additional Canvas data if not already loaded
        if (!courseContext.files || courseContext.files.length === 0) {
          const filesResponse = await canvasService.getCourseFiles(courseContext.course.id);
          if (filesResponse.success) {
            courseContext.files = filesResponse.data.slice(0, 10); // Limit to recent files
          }
        }

        if (!courseContext.discussions || courseContext.discussions.length === 0) {
          const discussionsResponse = await canvasService.getCourseDiscussions(courseContext.course.id);
          if (discussionsResponse.success) {
            courseContext.discussions = discussionsResponse.data.slice(0, 5); // Limit to recent discussions
          }
        }
      } catch (error) {
        console.error('Error enriching course context:', error);
      }
    }
  }

  private formatCanvasDataForAI(courseContext: CourseContext): string {
    let canvasData = `## Canvas Course Data for ${courseContext.course.name}\n\n`;
    
    // Add course info
    canvasData += `Course Code: ${courseContext.course.course_code}\n`;
    canvasData += `Course ID: ${courseContext.course.id}\n`;
    canvasData += `Workflow State: ${courseContext.course.workflow_state}\n\n`;

    // Add assignments
    if (courseContext.assignments && courseContext.assignments.length > 0) {
      canvasData += `Assignments (${courseContext.assignments.length} total):\n`;
      courseContext.assignments.slice(0, 10).forEach((assignment, index) => {
        const dueDate = assignment.due_at ? 
          new Date(assignment.due_at).toLocaleDateString() : 'No due date';
        canvasData += `${index + 1}. ${assignment.name}\n`;
        canvasData += `   - Due: ${dueDate}\n`;
        canvasData += `   - Points: ${assignment.points_possible}\n`;
        canvasData += `   - Status: ${assignment.workflow_state}\n`;
        if (assignment.description) {
          const cleanDesc = assignment.description.replace(/<[^>]*>/g, '').substring(0, 150);
          canvasData += `   - Description: ${cleanDesc}...\n`;
        }
        canvasData += '\n';
      });
    }

    // Add modules
    if (courseContext.modules && courseContext.modules.length > 0) {
      canvasData += `Course Modules (${courseContext.modules.length} total):\n`;
      courseContext.modules.slice(0, 8).forEach((module, index) => {
        canvasData += `${index + 1}. ${module.name} (Position: ${module.position})\n`;
        if (module.items && module.items.length > 0) {
          canvasData += `   Items: `;
          module.items.slice(0, 3).forEach((item, i) => {
            canvasData += `${item.title}${i < module.items!.length - 1 && i < 2 ? ', ' : ''}`;
          });
          if (module.items.length > 3) {
            canvasData += ` and ${module.items.length - 3} more`;
          }
          canvasData += '\n';
        }
        canvasData += '\n';
      });
    }

    // Add files if available
    if (courseContext.files && courseContext.files.length > 0) {
      canvasData += `Recent Files (${courseContext.files.length} shown):\n`;
      courseContext.files.slice(0, 5).forEach((file, index) => {
        canvasData += `${index + 1}. ${file.display_name || file.filename}\n`;
        if (file.updated_at) {
          canvasData += `   - Updated: ${new Date(file.updated_at).toLocaleDateString()}\n`;
        }
        canvasData += '\n';
      });
    }

    // Add discussions if available
    if (courseContext.discussions && courseContext.discussions.length > 0) {
      canvasData += `Recent Discussions (${courseContext.discussions.length} shown):\n`;
      courseContext.discussions.slice(0, 3).forEach((discussion, index) => {
        canvasData += `${index + 1}. ${discussion.title}\n`;
        if (discussion.posted_at) {
          canvasData += `   - Posted: ${new Date(discussion.posted_at).toLocaleDateString()}\n`;
        }
        canvasData += '\n';
      });
    }

    canvasData += '\nInstructions: Use this Canvas course data to provide accurate, helpful responses about the student\'s course. Reference specific assignments, modules, or deadlines when relevant to their question.';
    
    return canvasData;
  }

  // Utility methods
  async listUserCourses(): Promise<CanvasCourse[]> {
    if (!this.userCourses.length) {
      await this.initialize();
    }
    return this.userCourses;
  }

  async listAllCourses(): Promise<CanvasCourse[]> {
    if (!this.allCourses.length) {
      await this.initialize();
    }
    return this.allCourses;
  }

  clearCourseCache(): void {
    this.courseCache.clear();
  }
}

export default new ChatbotService();