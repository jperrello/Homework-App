import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export default function SkillsCoachScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! I'm your AI study coach. I'm here to help you learn more effectively through reflection and thoughtful questions. What would you like to study today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');

  const handleSendMessage = () => {
    if (inputText.trim() === '') return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "That's a great question! Let me help you think through this. Can you tell me more about what specifically you'd like to understand better?",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const renderMessage = (message: Message) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.isUser ? styles.userMessage : styles.aiMessage,
      ]}
    >
      {!message.isUser && (
        <View style={styles.aiAvatar}>
          <Text style={styles.aiAvatarText}>🤖</Text>
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          message.isUser ? styles.userMessageBubble : styles.aiMessageBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            message.isUser ? styles.userMessageText : styles.aiMessageText,
          ]}
        >
          {message.content}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Skills Coach</Text>
        <Text style={styles.headerSubtitle}>Your AI learning companion</Text>
      </View>

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map(renderMessage)}
        </ScrollView>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask me anything about your studies..."
              placeholderTextColor={THEME.colors.textSecondary}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                inputText.trim() === '' && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={inputText.trim() === ''}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={inputText.trim() ? '#fff' : THEME.colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    padding: THEME.spacing.lg,
    backgroundColor: THEME.colors.primary,
  },
  headerTitle: {
    fontSize: THEME.fontSize.xxl,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: THEME.spacing.xs,
  },
  headerSubtitle: {
    fontSize: THEME.fontSize.md,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: THEME.spacing.lg,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: THEME.spacing.md,
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  aiMessage: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: THEME.spacing.sm,
    alignSelf: 'flex-end',
  },
  aiAvatarText: {
    fontSize: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.lg,
  },
  userMessageBubble: {
    backgroundColor: THEME.colors.primary,
    marginLeft: 'auto',
  },
  aiMessageBubble: {
    backgroundColor: THEME.colors.surface,
  },
  messageText: {
    fontSize: THEME.fontSize.md,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  aiMessageText: {
    color: THEME.colors.text,
  },
  inputContainer: {
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: THEME.colors.background,
    borderRadius: THEME.borderRadius.lg,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text,
    maxHeight: 100,
    marginRight: THEME.spacing.sm,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: THEME.colors.border,
  },
});