import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Text, Card, Button, Chip, Avatar, ActivityIndicator, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessage, CanvasCourse, CustomInstructions } from '../types';
import chatbotService, { ChatbotResponse } from '../services/chatbotService';
import aiService from '../services/aiService';
import canvasService from '../services/canvasService';
import spacedRepetitionService from '../services/spacedRepetitionService';
import flashcardStorage from '../services/flashcardStorage';
import userPreferencesService from '../services/userPreferencesService';
import { useAuth } from '../contexts/AuthContext';
import { THEME } from '../constants';

const ChatbotScreen: React.FC = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [canvasData, setCanvasData] = useState<string>('');
  const [courses, setCourses] = useState<CanvasCourse[]>([]);
  const [studyStats, setStudyStats] = useState<any>(null);
  const [customInstructions, setCustomInstructions] = useState<CustomInstructions | null>(null);
  const [suggestedActions, setSuggestedActions] = useState<string[]>([
    'What should I study today?',
    'How am I progressing in my courses?',
    'Help me understand a difficult concept',
    'What assignments are due soon?'
  ]);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    initializeChatbot();
  }, []);
  
  const initializeChatbot = async () => {
    setIsInitializing(true);
    
    try {
      // Initialize chatbot service
      chatbotService.initialize();
      
      // Load user preferences and custom instructions
      await loadUserPreferences();
      
      // Load Canvas data if available
      await loadCanvasContext();
      
      // Load study statistics
      await loadStudyStats();
      
      // Add personalized welcome message
      const welcomeMessage: ChatMessage = {
        id: `welcome_${Date.now()}`,
        content: studyStats 
          ? `Hi! I'm your AI study coach. I see you have ${studyStats.dueToday} cards due for review today and you're on a ${studyStats.streakDays}-day study streak! What would you like to work on?`
          : "Hi! I'm your AI study coach. I can help you with your courses, study planning, and understanding difficult concepts. I use Socratic questioning to help you learn more effectively. What would you like to explore?",
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
      
    } catch (error) {
      console.error('Error initializing chatbot:', error);
      const errorMessage: ChatMessage = {
        id: `welcome_${Date.now()}`,
        content: "Hi! I'm your AI study coach. I'm ready to help you learn! What would you like to work on today?",
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages([errorMessage]);
    } finally {
      setIsInitializing(false);
    }
  };
  
  const loadCanvasContext = async () => {
    try {
      if (canvasService.isAuthenticated()) {
        // Get user courses
        const coursesResponse = await canvasService.getUserCourses();
        if (coursesResponse.success) {
          setCourses(coursesResponse.data);
          
          // Create context summary for AI
          const contextSummary = `Canvas Context:\n` +
            `Active Courses (${coursesResponse.data.length}): ${coursesResponse.data.map(c => c.name).join(', ')}\n` +
            `Recent Course Activity: Available for detailed queries`;
          
          setCanvasData(contextSummary);
        }
      }
    } catch (error) {
      console.error('Error loading Canvas context:', error);
    }
  };
  
  const loadUserPreferences = async () => {
    try {
      const instructions = await userPreferencesService.getCustomInstructions();
      setCustomInstructions(instructions);
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };
  
  const loadStudyStats = async () => {
    try {
      const memoryData = await flashcardStorage.getMemoryData();
      const stats = spacedRepetitionService.getStudyStats(memoryData);
      const analytics = await flashcardStorage.getStudyAnalytics(7); // Last 7 days
      
      setStudyStats({ ...stats, ...analytics });
    } catch (error) {
      console.error('Error loading study stats:', error);
    }
  };

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      content: inputText.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      // Use AI coaching service directly for more sophisticated responses
      const response = await aiService.generateCoachingResponse(
        currentInput,
        {
          previousMessages: messages.slice(-5),
          courseContext: courses.length > 0 ? {
            courseName: courses.map(c => c.name).join(', '),
            courseId: courses[0]?.id || 0
          } : undefined,
          canvasData: canvasData || undefined,
          customInstructions: customInstructions || undefined
        }
      );

      if (response.success) {
        const assistantMessage: ChatMessage = {
          id: `assistant_${Date.now()}`,
          content: response.data,
          role: 'assistant',
          timestamp: new Date(),
          metadata: {
            coaching: true,
            hasCanvasContext: !!canvasData
          },
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        // Update suggested actions based on conversation context
        updateSuggestedActions(currentInput, response.data);
      } else {
        throw new Error(response.error || 'Failed to get coaching response');
      }
    } catch (error) {
      console.error('AI Coaching error:', error);
      
      // Fallback to basic chatbot if AI coaching fails
      try {
        const fallbackResponse = await chatbotService.processMessage(
          currentInput,
          undefined,
          messages.slice(-3)
        );
        
        if (fallbackResponse.success) {
          const assistantMessage: ChatMessage = {
            id: `assistant_${Date.now()}`,
            content: fallbackResponse.data.message,
            role: 'assistant',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, assistantMessage]);
        } else {
          throw new Error('Both AI coaching and fallback failed');
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        const errorMessage: ChatMessage = {
          id: `error_${Date.now()}`,
          content: "I'm having trouble connecting right now. Please check your internet connection and try again. In the meantime, try reviewing your due flashcards!",
          role: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateSuggestedActions = (userInput: string, aiResponse: string) => {
    const input = userInput.toLowerCase();
    const response = aiResponse.toLowerCase();
    
    let newActions: string[] = [];
    
    if (input.includes('study') || input.includes('review')) {
      newActions = [
        'What study techniques work best for me?',
        'How can I improve my retention?',
        'Show me my weak areas'
      ];
    } else if (input.includes('assignment') || input.includes('due')) {
      newActions = [
        'Help me prioritize my assignments',
        'Break down this assignment for me',
        'What should I focus on first?'
      ];
    } else if (input.includes('concept') || input.includes('understand')) {
      newActions = [
        'Can you explain this differently?',
        'What are some real-world examples?',
        'How does this connect to what I already know?'
      ];
    } else {
      // Default coaching actions
      newActions = [
        'What should I study next?',
        'How am I progressing overall?',
        'Help me set a study goal',
        'What learning strategies should I try?'
      ];
    }
    
    setSuggestedActions(newActions);
  };

  const handleSuggestedAction = (action: string) => {
    setInputText(action);
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    
    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
        ]}
      >
        {!isUser && (
          <Avatar.Icon
            size={32}
            icon={message.metadata?.coaching ? "school" : "robot"}
            style={[styles.avatar, message.metadata?.coaching ? styles.coachAvatar : null]}
          />
        )}
        <Card
          style={[
            styles.messageCard,
            isUser ? styles.userMessageCard : styles.assistantMessageCard,
          ]}
        >
          <Card.Content style={styles.messageContent}>
            <Text
              style={[
                styles.messageText,
                isUser ? styles.userMessageText : styles.assistantMessageText,
              ]}
            >
              {message.content}
            </Text>
            {message.metadata?.coaching && (
              <View style={styles.messageFooter}>
                <Chip
                  mode="outlined"
                  compact
                  style={styles.coachingChip}
                  textStyle={styles.coachingChipText}
                  icon="school"
                >
                  AI Coach
                </Chip>
                {message.metadata.hasCanvasContext && (
                  <Chip
                    mode="outlined"
                    compact
                    style={styles.canvasChip}
                    textStyle={styles.canvasChipText}
                    icon="link"
                  >
                    Canvas
                  </Chip>
                )}
              </View>
            )}
            {message.metadata?.course_id && (
              <Chip
                mode="outlined"
                compact
                style={styles.courseChip}
                textStyle={styles.courseChipText}
              >
                {message.metadata.topic}
              </Chip>
            )}
          </Card.Content>
        </Card>
        {isUser && (
          <Avatar.Icon
            size={32}
            icon="account"
            style={styles.avatar}
          />
        )}
      </View>
    );
  };

  const renderSuggestedActions = () => {
    if (suggestedActions.length === 0) return null;

    return (
      <View style={styles.suggestedActionsContainer}>
        <Text style={styles.suggestedActionsTitle}>Try asking:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestedActionsScroll}
        >
          {suggestedActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleSuggestedAction(action)}
              style={styles.suggestedActionButton}
            >
              <Text style={styles.suggestedActionText}>{action}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>AI Study Coach</Text>
            <Text style={styles.headerSubtitle}>
              {canvasData ? `Connected to ${courses.length} courses` : 'Ready to help you learn'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {studyStats && (
              <View style={styles.statsPreview}>
                <Text style={styles.statsText}>{studyStats.dueToday} due</Text>
                <Text style={styles.statsText}>{studyStats.streakDays}🔥</Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Reset Conversation',
                  'This will clear all messages. Are you sure?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Reset', 
                      style: 'destructive',
                      onPress: () => initializeChatbot()
                    }
                  ]
                );
              }}
              style={styles.headerButton}
            >
              <Ionicons name="refresh" size={20} color={THEME.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Study Stats Banner */}
        {studyStats && studyStats.dueToday > 0 && (
          <View style={styles.statsBanner}>
            <Ionicons name="time-outline" size={16} color={THEME.colors.warning} />
            <Text style={styles.statsBannerText}>
              You have {studyStats.dueToday} cards due for review today!
            </Text>
            <TouchableOpacity 
              style={styles.reviewButton}
              onPress={() => handleSuggestedAction('Show me my due flashcards')}
            >
              <Text style={styles.reviewButtonText}>Review Now</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {isInitializing ? (
            <View style={styles.initializingContainer}>
              <ActivityIndicator size="large" color={THEME.colors.primary} />
              <Text style={styles.initializingText}>Loading your study data...</Text>
            </View>
          ) : (
            messages.map(renderMessage)
          )}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <Avatar.Icon size={32} icon="school" style={[styles.avatar, styles.coachAvatar]} />
              <Card style={styles.loadingCard}>
                <Card.Content style={styles.loadingContent}>
                  <ActivityIndicator size="small" color={THEME.colors.primary} />
                  <Text style={styles.loadingText}>Thinking like a coach...</Text>
                </Card.Content>
              </Card>
            </View>
          )}
        </ScrollView>

        {/* Suggested Actions */}
        {renderSuggestedActions()}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about your courses, assignments, or study materials..."
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            style={[
              styles.sendButton,
              { opacity: inputText.trim() ? 1 : 0.5 },
            ]}
            disabled={!inputText.trim() || isLoading}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: 'bold',
    color: THEME.colors.primary,
  },
  headerSubtitle: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsPreview: {
    alignItems: 'center',
    marginRight: THEME.spacing.sm,
  },
  statsText: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.primary,
    fontWeight: '500',
  },
  headerButton: {
    padding: THEME.spacing.xs,
  },
  statsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.warning + '20',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  statsBannerText: {
    flex: 1,
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.warning,
    marginLeft: THEME.spacing.xs,
    fontWeight: '500',
  },
  reviewButton: {
    backgroundColor: THEME.colors.warning,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.md,
  },
  reviewButtonText: {
    color: 'white',
    fontSize: THEME.fontSize.sm,
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  assistantMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    marginHorizontal: 8,
  },
  messageCard: {
    maxWidth: '80%',
    elevation: 2,
  },
  userMessageCard: {
    backgroundColor: THEME.colors.primary,
  },
  assistantMessageCard: {
    backgroundColor: THEME.colors.surface,
  },
  coachAvatar: {
    backgroundColor: THEME.colors.primary,
  },
  messageContent: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  messageText: {
    fontSize: THEME.fontSize.md,
    lineHeight: 22,
  },
  userMessageText: {
    color: 'white',
  },
  assistantMessageText: {
    color: THEME.colors.text,
  },
  messageFooter: {
    flexDirection: 'row',
    marginTop: THEME.spacing.sm,
    gap: THEME.spacing.xs,
  },
  coachingChip: {
    alignSelf: 'flex-start',
    backgroundColor: THEME.colors.primary + '20',
  },
  coachingChipText: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.primary,
  },
  canvasChip: {
    alignSelf: 'flex-start',
    backgroundColor: THEME.colors.success + '20',
  },
  canvasChipText: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.success,
  },
  courseChip: {
    marginTop: THEME.spacing.sm,
    alignSelf: 'flex-start',
  },
  courseChipText: {
    fontSize: THEME.fontSize.xs,
  },
  initializingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: THEME.spacing.xl,
  },
  initializingText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.textSecondary,
    marginTop: THEME.spacing.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: THEME.spacing.md,
  },
  loadingCard: {
    backgroundColor: THEME.colors.surface,
    elevation: 2,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.textSecondary,
    fontStyle: 'italic',
    marginLeft: THEME.spacing.sm,
  },
  suggestedActionsContainer: {
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  suggestedActionsTitle: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.sm,
    fontWeight: '500',
  },
  suggestedActionsScroll: {
    flexDirection: 'row',
  },
  suggestedActionButton: {
    backgroundColor: THEME.colors.primary + '20',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.lg,
    marginRight: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.primary + '40',
  },
  suggestedActionText: {
    color: THEME.colors.primary,
    fontSize: THEME.fontSize.sm,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.xl,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    fontSize: THEME.fontSize.md,
    maxHeight: 100,
    marginRight: THEME.spacing.sm,
    backgroundColor: THEME.colors.background,
    color: THEME.colors.text,
  },
  sendButton: {
    backgroundColor: THEME.colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});

export default ChatbotScreen;