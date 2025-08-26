import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { THEME } from '../constants';
import canvasService from '../services/canvasService';

export default function ContentCreatorScreen() {
  const navigation = useNavigation<any>();
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    checkCanvasConnection();
  }, []);

  const checkCanvasConnection = async () => {
    setIsLoading(true);
    try {
      if (canvasService.isAuthenticated()) {
        const testResult = await canvasService.testConnection();
        setIsConnected(testResult);
      }
    } catch (error) {
      console.error('Error checking Canvas connection:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const contentTypes = [
    {
      id: 'flashcards',
      title: 'Generate Flashcards',
      description: 'Create Q&A cards for spaced repetition',
      icon: 'library' as keyof typeof Ionicons.glyphMap,
      color: THEME.colors.primary,
    },
    {
      id: 'quiz',
      title: 'Generate Quiz',
      description: 'Create practice quizzes with multiple choice questions',
      icon: 'help-circle' as keyof typeof Ionicons.glyphMap,
      color: THEME.colors.secondary,
    },
    {
      id: 'summary',
      title: 'Create Summary',
      description: 'Generate comprehensive study summaries',
      icon: 'document-text' as keyof typeof Ionicons.glyphMap,
      color: THEME.colors.success,
    },
    {
      id: 'video',
      title: 'Generate Video',
      description: 'Create short explainer videos (Coming Soon)',
      icon: 'videocam' as keyof typeof Ionicons.glyphMap,
      color: THEME.colors.warning,
    },
    {
      id: 'podcast',
      title: 'Generate Podcast',
      description: 'Create audio study sessions (Coming Soon)',
      icon: 'mic' as keyof typeof Ionicons.glyphMap,
      color: '#FF6B9D',
    },
  ];


  const handleContentTypePress = async (contentType: string) => {
    switch (contentType) {
      case 'flashcards':
        navigation.navigate('FlashcardCreation');
        break;
      case 'quiz':
      case 'summary':
        Alert.alert('Coming Soon', `${contentType} generation will be available soon!`);
        break;
      case 'video':
      case 'podcast':
        Alert.alert('Coming Soon', 'This feature is not yet available.');
        break;
      default:
        Alert.alert('Unknown Content Type', 'This content type is not supported.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Content Creator</Text>
        <Text style={styles.headerSubtitle}>
          {isConnected ? 'Generate AI-powered study materials' : 'Connect to Canvas to get started'}
        </Text>
      </View>
      
      <ScrollView style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.colors.primary} />
            <Text style={styles.loadingText}>Loading Canvas data...</Text>
          </View>
        ) : !isConnected ? (
          <View style={styles.disconnectedContainer}>
            <Ionicons name="cloud-offline" size={64} color={THEME.colors.textSecondary} />
            <Text style={styles.disconnectedTitle}>Canvas Not Connected</Text>
            <Text style={styles.disconnectedText}>
              Connect your Canvas account to access courses and generate study materials.
            </Text>
            <TouchableOpacity 
              style={styles.connectButton} 
              onPress={() => Alert.alert('Canvas Settings', 'Please go to Settings → Canvas Settings to connect your account.')}
            >
              <Text style={styles.connectButtonText}>Connect to Canvas</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Content Types</Text>
              {contentTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={styles.contentTypeCard}
                  onPress={() => handleContentTypePress(type.id)}
                >
                  <View style={[styles.iconContainer, { backgroundColor: type.color }]}>
                    <Ionicons name={type.icon} size={24} color="#fff" />
                  </View>
                  <View style={styles.contentTypeInfo}>
                    <Text style={styles.contentTypeTitle}>
                      {type.title}
                    </Text>
                    <Text style={styles.contentTypeDescription}>
                      {type.description}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={THEME.colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.recentSection}>
              <Text style={styles.sectionTitle}>Recent Generations</Text>
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No content generated yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Select a content type to get started
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

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
  content: {
    flex: 1,
    paddingHorizontal: THEME.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: THEME.spacing.xl * 2,
  },
  loadingText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.textSecondary,
    marginTop: THEME.spacing.md,
  },
  disconnectedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: THEME.spacing.xl * 2,
    paddingHorizontal: THEME.spacing.lg,
  },
  disconnectedTitle: {
    fontSize: THEME.fontSize.xl,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    textAlign: 'center',
  },
  disconnectedText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: THEME.spacing.xl,
  },
  connectButton: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.xl,
    borderRadius: THEME.borderRadius.lg,
  },
  connectButtonText: {
    color: '#fff',
    fontSize: THEME.fontSize.md,
    fontWeight: 'bold',
  },
  courseSelectorContainer: {
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.xl,
  },
  sectionTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.md,
  },
  courseSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  courseSelectorText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.textSecondary,
  },
  selectedCourseText: {
    color: THEME.colors.text,
    fontWeight: '600',
  },
  courseInfo: {
    marginTop: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
  },
  courseInfoText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.xs,
  },
  section: {
    marginBottom: THEME.spacing.xl,
  },
  contentTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    marginBottom: THEME.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contentTypeCardDisabled: {
    opacity: 0.7,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: THEME.spacing.md,
  },
  contentTypeInfo: {
    flex: 1,
  },
  contentTypeTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.xs,
  },
  contentTypeDescription: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
  },
  recentSection: {
    marginBottom: THEME.spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.xl,
  },
  emptyStateText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginBottom: THEME.spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  modalCancel: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.primary,
  },
  modalTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: 'bold',
    color: THEME.colors.text,
  },
  modalSpacer: {
    width: 50, // Same width as cancel button to center the title
  },
  coursesList: {
    flex: 1,
  },
  courseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.lg,
    marginHorizontal: THEME.spacing.lg,
    marginVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.lg,
  },
  courseItemTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: '600',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.xs,
  },
  courseItemSubtitle: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    marginHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: THEME.colors.primary,
  },
  tabText: {
    fontSize: THEME.fontSize.sm,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  activeTabText: {
    color: '#fff',
  },
  emptyTabState: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.xl * 2,
    paddingHorizontal: THEME.spacing.lg,
  },
  emptyTabStateText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginBottom: THEME.spacing.sm,
  },
  emptyTabStateSubtext: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});