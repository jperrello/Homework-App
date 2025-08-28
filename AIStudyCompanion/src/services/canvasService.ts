import axios, { AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  CanvasUser, 
  CanvasCourse, 
  CanvasAssignment, 
  CanvasModule,
  CanvasModuleItem,
  APIResponse,
  PaginatedResponse 
} from '../types';
import { CANVAS_CONFIG, STORAGE_KEYS, ERROR_MESSAGES } from '../constants';
import authService from './authService';

class CanvasService {
  private baseURL: string;
  private accessToken: string | null = null;

  constructor() {
    this.baseURL = CANVAS_CONFIG.BASE_URL;
    this.initializeConfiguration();
  }

  private async initializeConfiguration(): Promise<void> {
    try {
      // Try to get credentials from new auth service first
      const canvasCredentials = await authService.getCurrentUserCanvasCredentials();
      
      if (canvasCredentials) {
        this.baseURL = canvasCredentials.canvasUrl + '/api/v1';
        this.accessToken = canvasCredentials.accessToken;
      } else {
        // Fallback to old storage method for backwards compatibility
        this.accessToken = await AsyncStorage.getItem(STORAGE_KEYS.CANVAS_TOKEN);
        
        const savedUrl = await AsyncStorage.getItem(STORAGE_KEYS.CANVAS_URL);
        if (savedUrl) {
          this.baseURL = savedUrl;
        }
      }
    } catch (error) {
      console.error('Error loading Canvas configuration:', error);
    }
  }

  // New method to set Canvas configuration dynamically
  async setCanvasConfig(canvasUrl: string, accessToken: string): Promise<void> {
    try {
      // Format the URL to include the API path
      let formattedUrl = canvasUrl.trim();
      if (!formattedUrl.endsWith('/api/v1')) {
        formattedUrl = formattedUrl + '/api/v1';
      }
      
      this.baseURL = formattedUrl;
      this.accessToken = accessToken;
      
      // Store both URL and token
      await AsyncStorage.setItem(STORAGE_KEYS.CANVAS_URL, formattedUrl);
      await AsyncStorage.setItem(STORAGE_KEYS.CANVAS_TOKEN, accessToken);
    } catch (error) {
      console.error('Error storing Canvas configuration:', error);
      throw new Error(ERROR_MESSAGES.STORAGE_ERROR);
    }
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  // Authentication Methods
  async setAccessToken(token: string): Promise<void> {
    this.accessToken = token;
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CANVAS_TOKEN, token);
    } catch (error) {
      console.error('Error storing Canvas token:', error);
      throw new Error(ERROR_MESSAGES.STORAGE_ERROR);
    }
  }

  async removeAccessToken(): Promise<void> {
    this.accessToken = null;
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.CANVAS_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.CANVAS_URL);
    } catch (error) {
      console.error('Error removing Canvas configuration:', error);
    }
  }

  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  // OAuth URL Generation
  getAuthorizationURL(): string {
    const params = new URLSearchParams({
      client_id: CANVAS_CONFIG.CLIENT_ID,
      response_type: 'code',
      redirect_uri: CANVAS_CONFIG.REDIRECT_URI,
      scope: CANVAS_CONFIG.SCOPES,
      state: Math.random().toString(36).substring(2, 15), // Simple state for CSRF protection
    });

    return `${this.baseURL.replace('/api/v1', '')}/login/oauth2/auth?${params.toString()}`;
  }

  // API Request Helper
  private async makeRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<APIResponse<T>> {
    try {
      if (!this.accessToken) {
        throw new Error('Not authenticated');
      }

      const response: AxiosResponse<T> = await axios({
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: this.getHeaders(),
        data,
        timeout: 30000, // 30 second timeout
      });

      return {
        data: response.data,
        success: true,
      };
    } catch (error: any) {
      console.error(`Canvas API Error (${endpoint}):`, error);
      
      let errorMessage = ERROR_MESSAGES.CANVAS_API_ERROR;
      if (error.response?.status === 401) {
        errorMessage = 'Authentication expired. Please log in again.';
        await this.removeAccessToken();
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. Check your Canvas permissions.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Canvas server error. Please try again later.';
      } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network')) {
        errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
      }

      return {
        data: null as any,
        success: false,
        error: errorMessage,
      };
    }
  }

  // User Methods
  async getCurrentUser(): Promise<APIResponse<CanvasUser>> {
    return this.makeRequest<CanvasUser>('/users/self');
  }

  // Course Methods
  async getUserCourses(): Promise<APIResponse<CanvasCourse[]>> {
    return this.makeRequest<CanvasCourse[]>('/courses?enrollment_state=active&per_page=100');
  }

  async getCompletedCourses(): Promise<APIResponse<CanvasCourse[]>> {
    return this.makeRequest<CanvasCourse[]>('/courses?enrollment_state=completed&per_page=100');
  }

  async getCourse(courseId: number): Promise<APIResponse<CanvasCourse>> {
    return this.makeRequest<CanvasCourse>(`/courses/${courseId}`);
  }

  // Assignment Methods
  async getCourseAssignments(courseId: number): Promise<APIResponse<CanvasAssignment[]>> {
    return this.makeRequest<CanvasAssignment[]>(`/courses/${courseId}/assignments?per_page=100`);
  }

  async getAssignment(courseId: number, assignmentId: number): Promise<APIResponse<CanvasAssignment>> {
    return this.makeRequest<CanvasAssignment>(`/courses/${courseId}/assignments/${assignmentId}`);
  }

  // Module Methods
  async getCourseModules(courseId: number): Promise<APIResponse<CanvasModule[]>> {
    return this.makeRequest<CanvasModule[]>(`/courses/${courseId}/modules?include[]=items&per_page=100`);
  }

  async getModuleItems(courseId: number, moduleId: number): Promise<APIResponse<CanvasModuleItem[]>> {
    return this.makeRequest<CanvasModuleItem[]>(`/courses/${courseId}/modules/${moduleId}/items?per_page=100`);
  }

  // File Methods
  async getCourseFiles(courseId: number): Promise<APIResponse<any[]>> {
    return this.makeRequest<any[]>(`/courses/${courseId}/files?per_page=100`);
  }

  async getFileContent(fileId: number): Promise<APIResponse<string>> {
    try {
      const fileResponse = await this.makeRequest<any>(`/files/${fileId}`);
      if (!fileResponse.success) {
        return fileResponse as any;
      }

      // Get the download URL
      const downloadUrl = fileResponse.data.url;
      
      // Fetch the actual file content
      const contentResponse = await axios.get(downloadUrl, {
        timeout: 60000, // 60 seconds for file downloads
      });

      return {
        data: contentResponse.data,
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching file content:', error);
      return {
        data: '',
        success: false,
        error: 'Failed to download file content',
      };
    }
  }

  // Page Methods
  async getCoursePage(courseId: number, pageUrl: string): Promise<APIResponse<any>> {
    return this.makeRequest<any>(`/courses/${courseId}/pages/${pageUrl}`);
  }

  async getCoursePages(courseId: number): Promise<APIResponse<any[]>> {
    return this.makeRequest<any[]>(`/courses/${courseId}/pages?per_page=100`);
  }

  // Discussion Methods
  async getCourseDiscussions(courseId: number): Promise<APIResponse<any[]>> {
    return this.makeRequest<any[]>(`/courses/${courseId}/discussion_topics?per_page=100`);
  }

  // Bulk Data Methods
  async getAllCourseContent(courseId: number): Promise<{
    course: CanvasCourse | null;
    assignments: CanvasAssignment[];
    modules: CanvasModule[];
    files: any[];
    pages: any[];
    discussions: any[];
    success: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let course: CanvasCourse | null = null;
    let assignments: CanvasAssignment[] = [];
    let modules: CanvasModule[] = [];
    let files: any[] = [];
    let pages: any[] = [];
    let discussions: any[] = [];

    // Fetch course details
    const courseResponse = await this.getCourse(courseId);
    if (courseResponse.success) {
      course = courseResponse.data;
    } else {
      errors.push(`Course: ${courseResponse.error}`);
    }

    // Fetch assignments
    const assignmentsResponse = await this.getCourseAssignments(courseId);
    if (assignmentsResponse.success) {
      assignments = assignmentsResponse.data;
    } else {
      errors.push(`Assignments: ${assignmentsResponse.error}`);
    }

    // Fetch modules
    const modulesResponse = await this.getCourseModules(courseId);
    if (modulesResponse.success) {
      modules = modulesResponse.data;
    } else {
      errors.push(`Modules: ${modulesResponse.error}`);
    }

    // Fetch files
    const filesResponse = await this.getCourseFiles(courseId);
    if (filesResponse.success) {
      files = filesResponse.data;
    } else {
      errors.push(`Files: ${filesResponse.error}`);
    }

    // Fetch pages
    const pagesResponse = await this.getCoursePages(courseId);
    if (pagesResponse.success) {
      pages = pagesResponse.data;
    } else {
      errors.push(`Pages: ${pagesResponse.error}`);
    }

    // Fetch discussions
    const discussionsResponse = await this.getCourseDiscussions(courseId);
    if (discussionsResponse.success) {
      discussions = discussionsResponse.data;
    } else {
      errors.push(`Discussions: ${discussionsResponse.error}`);
    }

    return {
      course,
      assignments,
      modules,
      files,
      pages,
      discussions,
      success: errors.length === 0,
      errors,
    };
  }

  // Test Connection
  async testConnection(): Promise<boolean> {
    const response = await this.getCurrentUser();
    return response.success;
  }

  // Clear all cached Canvas data
  async clearCachedData(): Promise<void> {
    try {
      await this.removeAccessToken();
      
      // Clear any other Canvas-related data from AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      const canvasKeys = allKeys.filter(key => 
        key.includes('canvas_') ||
        key.includes('courses') ||
        key.includes('assignments') ||
        key.includes('modules')
      );
      
      for (const key of canvasKeys) {
        await AsyncStorage.removeItem(key);
      }
      
      console.log('Canvas cached data cleared');
    } catch (error) {
      console.error('Error clearing Canvas cached data:', error);
    }
  }
}

export default new CanvasService();