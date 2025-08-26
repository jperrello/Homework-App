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
import { Text, Card, Button, Chip, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessage } from '../types';
import chatbotService, { ChatbotResponse } from '../services/chatbotService';
import { useAuth } from '../contexts/AuthContext';

const ChatbotScreen: React.FC = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedActions, setSuggestedActions] = useState<string[]>([
    'What assignments do I have due?',
    'Show me my courses',
    'Help me study for my next exam'
  ]);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Initialize chatbot service
    chatbotService.initialize();
    
    // Add welcome message
    const welcomeMessage: ChatMessage = {
      id: `welcome_${Date.now()}`,
      content: "Hi! I'm your AI study companion. I can help you with your courses, assignments, and study materials. Try asking me about specific classes or what you need to study!",
      role: 'assistant',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

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
    setInputText('');
    setIsLoading(true);

    try {
      const response = await chatbotService.processMessage(
        userMessage.content,
        undefined, // custom_instructions not yet implemented on UserAccount
        messages.slice(-5) // Send last 5 messages for context
      );

      if (response.success) {
        const assistantMessage: ChatMessage = {
          id: `assistant_${Date.now()}`,
          content: response.data.message,
          role: 'assistant',
          timestamp: new Date(),
          metadata: {
            course_id: response.data.courseContext?.id,
            topic: response.data.courseContext?.name,
          },
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        if (response.data.suggestedActions) {
          setSuggestedActions(response.data.suggestedActions);
        }
      } else {
        throw new Error(response.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        content: "I'm having trouble right now. Please make sure you're connected to Canvas and try again.",
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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
            icon="robot"
            style={styles.avatar}
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
          <Text style={styles.headerTitle}>Study Assistant</Text>
          <TouchableOpacity
            onPress={() => {
              setMessages([]);
              setSuggestedActions([
                'What assignments do I have due?',
                'Show me my courses',
                'Help me study for my next exam'
              ]);
            }}
          >
            <Ionicons name="refresh" size={24} color="#6200EE" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map(renderMessage)}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <Avatar.Icon size={32} icon="robot" style={styles.avatar} />
              <Card style={styles.loadingCard}>
                <Card.Content>
                  <Text style={styles.loadingText}>Thinking...</Text>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6200EE',
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
    backgroundColor: '#6200EE',
  },
  assistantMessageCard: {
    backgroundColor: 'white',
  },
  messageContent: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: 'white',
  },
  assistantMessageText: {
    color: '#333',
  },
  courseChip: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  courseChipText: {
    fontSize: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  loadingCard: {
    backgroundColor: 'white',
    elevation: 2,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  suggestedActionsContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  suggestedActionsTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  suggestedActionsScroll: {
    flexDirection: 'row',
  },
  suggestedActionButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  suggestedActionText: {
    color: '#6200EE',
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#6200EE',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatbotScreen;