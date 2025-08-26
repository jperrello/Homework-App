import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Vibration,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Button, ProgressBar } from 'react-native-paper';
import { StudyStackParamList } from '../navigation/AppNavigator';
import { Flashcard } from '../types';
import { THEME, SPACED_REPETITION } from '../constants';
import flashcardStorage from '../services/flashcardStorage';

type FlashcardStudyScreenRouteProp = RouteProp<StudyStackParamList, 'FlashcardStudy'>;

export default function FlashcardStudyScreen() {
  const route = useRoute<FlashcardStudyScreenRouteProp>();
  const navigation = useNavigation();
  const { flashcardIds, courseId } = route.params || {};

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studiedCount, setStudiedCount] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);

  // Mock data for demonstration - in real app, this would load from storage/API
  useEffect(() => {
    loadFlashcards();
  }, [flashcardIds]);

  const loadFlashcards = async () => {
    try {
      if (flashcardIds && flashcardIds.length > 0) {
        // Load flashcards by IDs from storage
        const storedFlashcards = await flashcardStorage.getFlashcardsByIds(flashcardIds);
        if (storedFlashcards.length > 0) {
          setFlashcards(storedFlashcards);
          return;
        }
      }

      // Fallback to mock data for demonstration
      const mockFlashcards: Flashcard[] = [
        {
          id: '1',
          question: 'What is a database transaction?',
          answer: 'A database transaction is a sequence of operations performed as a single logical unit of work. It must be atomic, consistent, isolated, and durable (ACID properties).',
          course_id: courseId || 1,
          topic: 'Database Systems',
          difficulty: 'medium',
          next_review: new Date(),
          interval: 1,
          ease_factor: 2.5,
          source_material: 'Database Systems Lecture Notes',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '2',
          question: 'What does ACID stand for in database systems?',
          answer: 'ACID stands for Atomicity, Consistency, Isolation, and Durability - the four key properties that guarantee reliable database transactions.',
          course_id: courseId || 1,
          topic: 'Database Systems',
          difficulty: 'easy',
          next_review: new Date(),
          interval: 1,
          ease_factor: 2.5,
          source_material: 'Database Systems Lecture Notes',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '3',
          question: 'What is the difference between a clustered and non-clustered index?',
          answer: 'A clustered index determines the physical order of data in a table and can only have one per table. A non-clustered index is a separate structure that points to data rows and you can have multiple per table.',
          course_id: courseId || 1,
          topic: 'Database Systems',
          difficulty: 'hard',
          next_review: new Date(),
          interval: 1,
          ease_factor: 2.5,
          source_material: 'Database Systems Lecture Notes',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];
      setFlashcards(mockFlashcards);
    } catch (error) {
      console.error('Error loading flashcards:', error);
      // Still show mock data on error
      setFlashcards([]);
    }
  };

  const flipCard = () => {
    if (isFlipped) return; // Prevent multiple flips
    
    // Light haptic feedback on flip
    Vibration.vibrate(50);
    setIsFlipped(true);
  };

  const handleQualityRating = (quality: number) => {
    setStudiedCount(prev => prev + 1);
    
    // In a real app, you would update spaced repetition data here
    updateSpacedRepetition(currentCard, quality);
    
    // Move to next card
    nextCard();
  };

  const updateSpacedRepetition = (flashcard: Flashcard, quality: number) => {
    // Implementation of SM-2 spaced repetition algorithm would go here
    console.log(`Updated flashcard ${flashcard.id} with quality ${quality}`);
  };

  const nextCard = () => {
    if (currentIndex >= flashcards.length - 1) {
      setSessionComplete(true);
      return;
    }
    
    setCurrentIndex(prev => prev + 1);
    resetCard();
  };

  const resetCard = () => {
    setIsFlipped(false);
  };

  const restartSession = () => {
    setCurrentIndex(0);
    setStudiedCount(0);
    setSessionComplete(false);
    resetCard();
  };

  const goBack = () => {
    Alert.alert(
      'End Study Session',
      'Are you sure you want to end this study session?',
      [
        { text: 'Continue Studying', style: 'cancel' },
        { text: 'End Session', onPress: () => navigation.goBack() },
      ]
    );
  };

  const currentCard = flashcards[currentIndex];
  const progress = flashcards.length > 0 ? (currentIndex + 1) / flashcards.length : 0;

  if (!flashcards.length) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="school-outline" size={64} color={THEME.colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Flashcards Available</Text>
          <Text style={styles.emptySubtitle}>
            Generate some flashcards first using the study assistant!
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (sessionComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.completionContainer}>
          <Ionicons name="trophy" size={64} color={THEME.colors.success} />
          <Text style={styles.completionTitle}>Session Complete!</Text>
          <Text style={styles.completionSubtitle}>
            You studied {studiedCount} flashcards
          </Text>
          <View style={styles.completionStats}>
            <Text style={styles.statText}>Cards reviewed: {studiedCount}</Text>
            <Text style={styles.statText}>Time spent: Great job!</Text>
          </View>
          <View style={styles.completionButtons}>
            <Button
              mode="contained"
              onPress={restartSession}
              style={[styles.actionButton, { backgroundColor: THEME.colors.primary }]}
            >
              Study Again
            </Button>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.actionButton}
            >
              Back to Menu
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={24} color={THEME.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Flashcard Study</Text>
          <Text style={styles.headerSubtitle}>
            Card {currentIndex + 1} of {flashcards.length}
          </Text>
        </View>
        <View style={styles.backIcon} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <ProgressBar
          progress={progress}
          color={THEME.colors.primary}
          style={styles.progressBar}
        />
        <Text style={styles.progressText}>
          {Math.round(progress * 100)}% Complete
        </Text>
      </View>

      {/* Flashcard */}
      <View style={styles.cardContainer}>
        <TouchableOpacity 
          style={styles.cardWrapper}
          onPress={flipCard}
          activeOpacity={0.8}
          disabled={isFlipped}
        >
          {!isFlipped ? (
            // Front of card (Question)
            <View style={[styles.flashcard, styles.questionCard]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardType}>Question</Text>
                <View style={[styles.difficultyBadge, {
                  backgroundColor: currentCard?.difficulty === 'easy' ? THEME.colors.success + '20' :
                                   currentCard?.difficulty === 'medium' ? THEME.colors.warning + '20' :
                                   THEME.colors.error + '20'
                }]}>
                  <Text style={[styles.difficultyText, { 
                    color: currentCard?.difficulty === 'easy' ? THEME.colors.success :
                           currentCard?.difficulty === 'medium' ? THEME.colors.warning :
                           THEME.colors.error 
                  }]}>
                    {currentCard?.difficulty?.toUpperCase()}
                  </Text>
                </View>
              </View>
              
              <View style={styles.cardContentContainer}>
                <Text style={styles.cardText}>{currentCard?.question}</Text>
              </View>
              
              <View style={styles.flipHint}>
                <Ionicons name="hand-left-outline" size={20} color={THEME.colors.textSecondary} />
                <Text style={styles.flipHintText}>Tap to reveal answer</Text>
              </View>
            </View>
          ) : (
            // Back of card (Answer)
            <View style={[styles.flashcard, styles.answerCard]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardType}>Answer</Text>
                <Text style={styles.topicText}>{currentCard?.topic}</Text>
              </View>
              
              <View style={styles.cardContentContainer}>
                <Text style={styles.cardText}>{currentCard?.answer}</Text>
                {currentCard?.source_material && (
                  <Text style={styles.sourceText}>
                    Source: {currentCard.source_material}
                  </Text>
                )}
              </View>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Rating Buttons (only show when answer is revealed) */}
      {isFlipped && (
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingTitle}>How well did you know this?</Text>
          <View style={styles.ratingButtons}>
            <TouchableOpacity
              style={[styles.ratingButton, styles.ratingButtonHard]}
              onPress={() => handleQualityRating(SPACED_REPETITION.QUALITY_RATINGS.INCORRECT)}
            >
              <Ionicons name="close" size={24} color="white" />
              <Text style={styles.ratingButtonText}>Hard</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.ratingButton, styles.ratingButtonMedium]}
              onPress={() => handleQualityRating(SPACED_REPETITION.QUALITY_RATINGS.CORRECT_HESITANT)}
            >
              <Ionicons name="remove" size={24} color="white" />
              <Text style={styles.ratingButtonText}>Good</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.ratingButton, styles.ratingButtonEasy]}
              onPress={() => handleQualityRating(SPACED_REPETITION.QUALITY_RATINGS.CORRECT_EASY)}
            >
              <Ionicons name="checkmark" size={24} color="white" />
              <Text style={styles.ratingButtonText}>Easy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  backIcon: {
    width: 40,
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: 'bold',
    color: THEME.colors.text,
  },
  headerSubtitle: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  progressContainer: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    backgroundColor: THEME.colors.surface,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: THEME.spacing.xs,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
  },
  cardWrapper: {
    flex: 1,
    maxHeight: 500,
    minHeight: 350,
  },
  flashcard: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.lg,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  questionCard: {
    borderLeftWidth: 4,
    borderLeftColor: THEME.colors.primary,
  },
  answerCard: {
    borderLeftWidth: 4,
    borderLeftColor: THEME.colors.success,
  },
  cardContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: THEME.spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  cardType: {
    fontSize: THEME.fontSize.sm,
    fontWeight: 'bold',
    color: THEME.colors.primary,
    textTransform: 'uppercase',
  },
  difficultyBadge: {
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.sm,
  },
  difficultyText: {
    fontSize: THEME.fontSize.xs,
    fontWeight: 'bold',
  },
  topicText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    fontStyle: 'italic',
  },
  cardText: {
    fontSize: THEME.fontSize.xl,
    lineHeight: 28,
    color: THEME.colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  flipHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: THEME.spacing.sm,
    marginTop: THEME.spacing.md,
  },
  flipHintText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    marginLeft: THEME.spacing.xs,
    fontStyle: 'italic',
  },
  sourceText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: THEME.spacing.md,
    textAlign: 'center',
  },
  ratingContainer: {
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  ratingTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: '600',
    color: THEME.colors.text,
    textAlign: 'center',
    marginBottom: THEME.spacing.md,
  },
  ratingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  ratingButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: THEME.spacing.lg,
    marginHorizontal: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.lg,
    minHeight: 70,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ratingButtonHard: {
    backgroundColor: THEME.colors.error,
  },
  ratingButtonMedium: {
    backgroundColor: THEME.colors.warning,
  },
  ratingButtonEasy: {
    backgroundColor: THEME.colors.success,
  },
  ratingButtonText: {
    fontSize: THEME.fontSize.sm,
    fontWeight: '600',
    color: 'white',
    marginTop: THEME.spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.lg,
  },
  emptyTitle: {
    fontSize: THEME.fontSize.xl,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginTop: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
  },
  emptySubtitle: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginBottom: THEME.spacing.lg,
  },
  backButton: {
    marginTop: THEME.spacing.md,
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.lg,
  },
  completionTitle: {
    fontSize: THEME.fontSize.xxl,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginTop: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
  },
  completionSubtitle: {
    fontSize: THEME.fontSize.lg,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginBottom: THEME.spacing.lg,
  },
  completionStats: {
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.lg,
    minWidth: 200,
  },
  statText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text,
    textAlign: 'center',
    marginVertical: THEME.spacing.xs,
  },
  completionButtons: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});