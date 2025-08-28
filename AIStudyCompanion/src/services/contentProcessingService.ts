import axios from 'axios';
import { JSDOM } from 'jsdom';
import { APIResponse } from '../types';
import aiService from './aiService';

export interface ProcessedContent {
  id: string;
  originalUrl: string;
  fileName?: string;
  contentType: 'html' | 'text' | 'pdf' | 'word' | 'unknown';
  extractedText: string;
  summary?: string;
  links: string[];
  youtubeVideoIds: string[];
  processedAt: Date;
}

export interface YouTubeTranscript {
  videoId: string;
  transcript: string;
  summary?: string;
}

class ContentProcessingService {
  private maxFileSize = 50 * 1024 * 1024; // 50MB
  private downloadTimeout = 30000; // 30 seconds

  // Extract YouTube video ID from URL (adapted from auto_student.py)
  private extractYouTubeVideoId(url: string): string | null {
    if (!url || typeof url !== 'string' || !url.trim()) {
      return null;
    }

    // Basic URL validation
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return null;
    }

    // Check for YouTube domains
    if (!['youtube.com', 'youtu.be', 'googleusercontent.com'].some(domain => 
      url.toLowerCase().includes(domain))) {
      return null;
    }

    const patterns = [
      /(?:youtube\.com\/(?:watch\?(?:[^&]*&)*v=|embed\/|v\/|shorts\/|live\/))([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:googleusercontent\.com\/youtube\.com\/(?:watch\?(?:[^&]*&)*v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/.*[?&]v=)([a-zA-Z0-9_-]{11})/,
      /(?:googleusercontent\.com\/youtube\.com\/.*[?&]v=)([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  // Extract links and YouTube videos from HTML content (adapted from auto_student.py)
  private extractLinksAndYTFromHtml(
    htmlContent: string, 
    baseUrl: string
  ): { cleanedText: string; links: string[]; youtubeVideoIds: string[] } {
    if (!htmlContent || !htmlContent.trim()) {
      return { cleanedText: '', links: [], youtubeVideoIds: [] };
    }

    try {
      const dom = new JSDOM(htmlContent);
      const document = dom.window.document;

      // Remove unwanted elements (adapted from BeautifulSoup logic)
      const unwantedSelectors = [
        'script', 'style', 'nav', 'footer', 'header', 
        'aside', 'form', 'button', 'input', 'noscript'
      ];
      
      unwantedSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => el.remove());
      });

      // Try to find main content using various selectors
      const contentSelectors = [
        // GitHub Gist selectors
        '.file-box .file-data',
        '.highlight',
        '.file .data',
        '.blob-code-content',
        // General content selectors
        'article.user_content',
        'div.user_content',
        'div#content',
        'main',
        'div.content',
        'div.assignment-description',
        '.markdown-body',
        '.post-content',
        '.entry-content'
      ];

      let mainContentElement: Element | null = null;
      for (const selector of contentSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          if (elements.length === 1) {
            mainContentElement = elements[0];
          } else {
            // Combine multiple elements
            const wrapper = document.createElement('div');
            elements.forEach(el => wrapper.appendChild(el.cloneNode(true)));
            mainContentElement = wrapper;
          }
          break;
        }
      }

      // Extract text content
      const textElement = mainContentElement || document.body || document.documentElement;
      const rawText = textElement.textContent || '';
      const cleanedText = rawText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');

      // Extract links and YouTube videos
      const links: string[] = [];
      const youtubeVideoIds = new Set<string>();

      // Process anchor tags
      const anchors = document.querySelectorAll('a[href]');
      anchors.forEach(anchor => {
        const href = anchor.getAttribute('href');
        if (!href || href.startsWith('#') || href.toLowerCase().startsWith('javascript:')) {
          return;
        }

        const videoId = this.extractYouTubeVideoId(href);
        if (videoId) {
          youtubeVideoIds.add(videoId);
        } else {
          try {
            const absoluteUrl = new URL(href, baseUrl).href;
            links.push(absoluteUrl);
          } catch (error) {
            console.warn(`Could not form absolute URL for link: ${href}`);
          }
        }
      });

      // Process iframe tags for YouTube embeds
      const iframes = document.querySelectorAll('iframe[src]');
      iframes.forEach(iframe => {
        const src = iframe.getAttribute('src');
        if (src) {
          const videoId = this.extractYouTubeVideoId(src);
          if (videoId) {
            youtubeVideoIds.add(videoId);
          }
        }
      });

      return {
        cleanedText,
        links,
        youtubeVideoIds: Array.from(youtubeVideoIds)
      };

    } catch (error) {
      console.error('Failed to parse HTML:', error);
      return { cleanedText: '', links: [], youtubeVideoIds: [] };
    }
  }

  // Download file from URL (adapted from auto_student.py)
  private async downloadFile(url: string): Promise<{ content: ArrayBuffer; contentType: string; fileName: string } | null> {
    if (this.extractYouTubeVideoId(url) || url.startsWith('data:') || url.startsWith('mailto:')) {
      return null;
    }

    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: this.downloadTimeout,
        maxContentLength: this.maxFileSize,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; StudyBot/1.0)'
        }
      });

      if (response.status >= 400) {
        console.error(`HTTP ${response.status} for ${url}`);
        return null;
      }

      const contentType = response.headers['content-type'] || '';
      let fileName = 'downloaded_file';

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = fileNameMatch[1].replace(/['"]/g, '');
        }
      }

      // If no filename, try to extract from URL
      if (fileName === 'downloaded_file') {
        try {
          const urlPath = new URL(url).pathname;
          const pathName = urlPath.split('/').pop();
          if (pathName && pathName.length > 0) {
            fileName = pathName;
          }
        } catch (error) {
          // Use default filename
        }
      }

      // Clean filename
      fileName = fileName.replace(/[^\w\-_.]/g, '_');

      // Add extension based on content type if missing
      if (!fileName.includes('.')) {
        const extensionMap: { [key: string]: string } = {
          'text/html': '.html',
          'application/json': '.json',
          'text/plain': '.txt',
          'application/pdf': '.pdf',
          'application/msword': '.doc',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
        };
        
        for (const [type, ext] of Object.entries(extensionMap)) {
          if (contentType.includes(type)) {
            fileName += ext;
            break;
          }
        }
        
        if (!fileName.includes('.')) {
          fileName += '.dat';
        }
      }

      return {
        content: response.data,
        contentType,
        fileName
      };

    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        console.error(`Timeout downloading ${url}`);
      } else if (error.response?.status) {
        console.error(`HTTP ${error.response.status} downloading ${url}`);
      } else {
        console.error(`Error downloading ${url}:`, error.message);
      }
      return null;
    }
  }

  // Read and process file content (adapted from auto_student.py)
  private async readFileContent(
    content: ArrayBuffer, 
    contentType: string, 
    fileName: string, 
    originalUrl: string
  ): Promise<string> {
    if (content.byteLength === 0) {
      return `[Empty file: ${fileName} from ${originalUrl}]`;
    }

    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    
    try {
      if (contentType.includes('text/html') || fileExtension === 'html') {
        const htmlContent = new TextDecoder('utf-8').decode(content);
        if (!htmlContent.trim()) {
          return `[Empty HTML file: ${fileName}]`;
        }

        const { cleanedText } = this.extractLinksAndYTFromHtml(htmlContent, originalUrl);
        if (!cleanedText.trim()) {
          return `[No text content extracted from HTML: ${fileName}. Raw HTML length: ${htmlContent.length}]`;
        }

        // Summarize if content is very long
        return await this.summarizeText(cleanedText);

      } else if (['txt', 'md', 'py', 'js', 'json', 'xml', 'css', 'csv', 'rtf'].includes(fileExtension) ||
                 contentType.includes('text/') || contentType.includes('application/json')) {
        const textContent = new TextDecoder('utf-8').decode(content);
        return textContent;

      } else if (contentType.includes('application/pdf') || fileExtension === 'pdf') {
        return `[PDF File: ${fileName} from ${originalUrl} - PDF extraction requires additional library]`;

      } else if (contentType.includes('application/msword') || 
                 contentType.includes('application/vnd.openxmlformats-officedocument') ||
                 ['doc', 'docx'].includes(fileExtension)) {
        return `[Word Document: ${fileName} from ${originalUrl} - Word extraction requires additional library]`;

      } else {
        // Try to read as text, provide sample for unknown types
        const textContent = new TextDecoder('utf-8').decode(content.slice(0, 2048));
        return `[Unknown file type content sample from ${fileName}]:\n${textContent}`;
      }

    } catch (error) {
      console.error(`Error processing file ${fileName}:`, error);
      return `[Error processing file: ${fileName} - ${error}]`;
    }
  }

  // Summarize text using AI (adapted from auto_student.py summarization logic)
  private async summarizeText(text: string, maxWords: number = 500): Promise<string> {
    if (!text || !text.trim()) {
      return '[No content to summarize]';
    }

    const wordCount = text.split(' ').length;
    if (wordCount <= maxWords) {
      return text;
    }

    const systemPrompt = 'You are a helpful assistant that summarizes academic materials concisely and accurately.';
    const userPrompt = `Please summarize the following text in no more than ${maxWords} words, focusing on key points relevant to an academic assignment. Only provide me the summary as a block of text, I do not want you to repeat your task or ask me any follow up questions:\n\n${text.substring(0, 10000)}`;

    try {
      const response = await aiService.generateCoachingResponse(userPrompt, {
        customInstructions: {
          tone: 'formal',
          detail_level: 'moderate',
          use_examples: false,
          use_analogies: false,
          format_preference: 'paragraphs'
        }
      });

      if (response.success && response.data.trim()) {
        return response.data.trim();
      } else {
        // Fallback: truncate to word limit
        const words = text.split(' ');
        return words.slice(0, maxWords).join(' ') + 
               (words.length > maxWords ? '... [truncated due to summarization error]' : '');
      }
    } catch (error) {
      console.error(`Error summarizing text (length: ${text.length}):`, error);
      // Fallback: truncate to word limit
      const words = text.split(' ');
      return words.slice(0, maxWords).join(' ') + 
             (words.length > maxWords ? '... [truncated due to summarization error]' : '');
    }
  }

  // Process content from URL or HTML string
  async processContent(
    input: string, // Either URL or HTML content
    isUrl: boolean = true,
    baseUrl?: string
  ): Promise<APIResponse<ProcessedContent>> {
    try {
      let processedContent: ProcessedContent;
      
      if (isUrl) {
        // Download and process file from URL
        const downloadResult = await this.downloadFile(input);
        if (!downloadResult) {
          return {
            success: false,
            error: `Failed to download content from ${input}`,
            data: {} as ProcessedContent
          };
        }

        const extractedText = await this.readFileContent(
          downloadResult.content,
          downloadResult.contentType,
          downloadResult.fileName,
          input
        );

        const contentType = this.determineContentType(downloadResult.contentType, downloadResult.fileName);
        
        // If HTML, extract links and YouTube videos
        let links: string[] = [];
        let youtubeVideoIds: string[] = [];
        
        if (contentType === 'html') {
          const htmlContent = new TextDecoder('utf-8').decode(downloadResult.content);
          const extracted = this.extractLinksAndYTFromHtml(htmlContent, input);
          links = extracted.links;
          youtubeVideoIds = extracted.youtubeVideoIds;
        }

        processedContent = {
          id: `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          originalUrl: input,
          fileName: downloadResult.fileName,
          contentType,
          extractedText,
          links,
          youtubeVideoIds,
          processedAt: new Date()
        };

      } else {
        // Process HTML content directly
        const extracted = this.extractLinksAndYTFromHtml(input, baseUrl || '');
        
        processedContent = {
          id: `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          originalUrl: baseUrl || 'direct_html',
          contentType: 'html',
          extractedText: extracted.cleanedText,
          links: extracted.links,
          youtubeVideoIds: extracted.youtubeVideoIds,
          processedAt: new Date()
        };
      }

      // Generate summary if content is long
      if (processedContent.extractedText.length > 2000) {
        processedContent.summary = await this.summarizeText(processedContent.extractedText);
      }

      return {
        success: true,
        data: processedContent
      };

    } catch (error) {
      console.error('Error processing content:', error);
      return {
        success: false,
        error: `Failed to process content: ${error}`,
        data: {} as ProcessedContent
      };
    }
  }

  // Determine content type from MIME type and filename
  private determineContentType(mimeType: string, fileName: string): ProcessedContent['contentType'] {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    if (mimeType.includes('text/html') || extension === 'html') {
      return 'html';
    } else if (mimeType.includes('application/pdf') || extension === 'pdf') {
      return 'pdf';
    } else if (mimeType.includes('application/msword') || 
               mimeType.includes('application/vnd.openxmlformats-officedocument') ||
               ['doc', 'docx'].includes(extension)) {
      return 'word';
    } else if (mimeType.includes('text/') || 
               ['txt', 'md', 'py', 'js', 'json', 'xml', 'css', 'csv'].includes(extension)) {
      return 'text';
    } else {
      return 'unknown';
    }
  }

  // Get YouTube transcript (placeholder - would need YouTube API or transcript library)
  async getYouTubeTranscript(videoId: string): Promise<APIResponse<YouTubeTranscript>> {
    try {
      // This would require a YouTube transcript API or library
      // For now, return a placeholder response
      return {
        success: false,
        error: 'YouTube transcript extraction not implemented. Would require YouTube API or transcript library.',
        data: {} as YouTubeTranscript
      };
    } catch (error) {
      console.error(`Error fetching transcript for ${videoId}:`, error);
      return {
        success: false,
        error: `Failed to fetch transcript: ${error}`,
        data: {} as YouTubeTranscript
      };
    }
  }

  // Process multiple URLs in parallel
  async processMultipleContents(urls: string[]): Promise<APIResponse<ProcessedContent[]>> {
    try {
      const processingPromises = urls.map(url => this.processContent(url, true));
      const results = await Promise.allSettled(processingPromises);
      
      const processedContents: ProcessedContent[] = [];
      const errors: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          processedContents.push(result.value.data);
        } else {
          const error = result.status === 'rejected' ? result.reason : result.value.error;
          errors.push(`URL ${index + 1} (${urls[index]}): ${error}`);
        }
      });

      return {
        success: true,
        data: processedContents,
        error: errors.length > 0 ? `Some URLs failed: ${errors.join('; ')}` : undefined
      };

    } catch (error) {
      console.error('Error processing multiple contents:', error);
      return {
        success: false,
        error: `Failed to process multiple contents: ${error}`,
        data: []
      };
    }
  }
}

export default new ContentProcessingService();