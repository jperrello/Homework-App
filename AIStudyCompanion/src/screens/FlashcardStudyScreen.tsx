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
import spacedRepetitionService, { 
  FlashcardMemoryData, 
  StudyResult, 
  StudySession 
} from '../services/spacedRepetitionService';

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
  const [memoryData, setMemoryData] = useState<FlashcardMemoryData[]>([]);
  const [studySession, setStudySession] = useState<StudySession | null>(null);
  const [sessionStartTime] = useState(new Date());
  const [cardStartTime, setCardStartTime] = useState<Date>(new Date());
  const [studyStats, setStudyStats] = useState({ dueToday: 0, newCards: 0, totalCards: 0 });

  useEffect(() => {
    loadFlashcards();
    initializeStudySession();
  }, [flashcardIds]);

  const initializeStudySession = async () => {
    try {
      // Load memory data for spaced repetition
      const savedMemoryData = await flashcardStorage.getMemoryData();
      setMemoryData(savedMemoryData);
      
      // Calculate study stats
      const stats = spacedRepetitionService.getStudyStats(savedMemoryData);
      setStudyStats(stats);
      
      // Create new study session
      const sessionData = spacedRepetitionService.createStudySession(
        flashcardIds || [],
        savedMemoryData,
        {
          maxCards: 20,
          newCardLimit: 5,
          reviewCardLimit: 15,
          includeNewCards: true
        }
      );
      
      const newSession: StudySession = {
        sessionId: sessionData.sessionId,
        startTime: sessionStartTime,
        cardsStudied: [],
        results: [],
        totalCards: sessionData.sessionCards.length,
        correctCards: 0
      };
      
      setStudySession(newSession);
      
      // Update flashcard IDs to match spaced repetition selection
      // This would normally update the flashcards state with the selected cards
      
    } catch (error) {
      console.error('Error initializing study session:', error);
    }
  };

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
    // Record when user reveals answer for response time calculation
    setCardStartTime(new Date());
  };

  const handleQualityRating = async (quality: number) => {
    if (!currentCard || !studySession) return;
    
    const responseTime = new Date().getTime() - cardStartTime.getTime();
    
    // Create study result
    const result: StudyResult = {
      cardId: currentCard.id,
      quality,
      responseTime,
      studiedAt: new Date()
    };
    
    // Update spaced repetition memory data
    const updatedMemoryData = spacedRepetitionService.processStudyResult(result, memoryData);
    setMemoryData(updatedMemoryData);
    
    // Save updated memory data
    await flashcardStorage.saveMemoryData(updatedMemoryData);
    
    // Update study session
    const updatedSession = {
      ...studySession,
      cardsStudied: [...studySession.cardsStudied, currentCard.id],
      results: [...studySession.results, result],
      correctCards: quality >= 3 ? studySession.correctCards + 1 : studySession.correctCards
    };
    setStudySession(updatedSession);
    
    // Update studied count
    setStudiedCount(prev => prev + 1);
    
    // Move to next card
    nextCard();
  };

  const nextCard = () => {
    if (currentIndex >= flashcards.length - 1) {
      completeSession();
      return;
    }
    
    setCurrentIndex(prev => prev + 1);
    resetCard();
  };
  
  const completeSession = async () => {
    if (!studySession) return;
    
    const endTime = new Date();
    const sessionDuration = endTime.getTime() - sessionStartTime.getTime();
    const averageResponseTime = studySession.results.length > 0 
      ? studySession.results.reduce((sum, r) => sum + (r.responseTime || 0), 0) / studySession.results.length
      : 0;
    
    const completedSession = {
      ...studySession,
      endTime,
      sessionDuration,
      averageResponseTime
    };
    
    // Save session data
    await flashcardStorage.saveStudySession(completedSession);
    
    setStudySession(completedSession);
    setSessionComplete(true);
  };

  const resetCard = () => {
    setIsFlipped(false);
  };

  const restartSession = () => {
    setCurrentIndex(0);
    setStudiedCount(0);
    setSessionComplete(false);
    resetCard();
    // Re-initialize study session
    initializeStudySession();
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

  // Helper functions for spaced repetition UI
  const getCardMemoryInfo = (cardId?: string) => {
    if (!cardId) return null;
    return memoryData.find(m => m.cardId === cardId);
  };
  
  const getNextReviewText = (cardId?: string) => {
    const memory = getCardMemoryInfo(cardId);
    if (!memory) return 'New card';
    
    const days = Math.ceil((memory.nextReviewDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'Due now';
    if (days === 1) return 'Due tomorrow';
    return `Due in ${days} days`;
  };
  
  const getNextIntervalText = (quality: number) => {
    if (!currentCard) return '';
    const memory = getCardMemoryInfo(currentCard.id) || spacedRepetitionService.initializeCardMemory(currentCard.id);
    const simulatedUpdate = spacedRepetitionService.calculateNextReview(memory, quality);
    const days = simulatedUpdate.interval;
    
    if (days === 1) return '1d';
    if (days < 30) return `${days}d`;
    if (days < 365) return `${Math.round(days / 30)}mo`;
    return `${Math.round(days / 365)}y`;
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
            <Text style={styles.statText}>Correct: {studySession?.correctCards || 0}</Text>
            <Text style={styles.statText}>Accuracy: {studiedCount > 0 ? Math.round(((studySession?.correctCards || 0) / studiedCount) * 100) : 0}%</Text>
            {studySession?.sessionDuration && (
              <Text style={styles.statText}>
                Time: {Math.round(studySession.sessionDuration / 60000)} minutes
              </Text>
            )}
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
          <Text style={styles.studyStats}>
            Due Today: {studyStats.dueToday} • New: {studyStats.newCards}
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
                <View style={styles.cardInfoContainer}>
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
                  {getCardMemoryInfo(currentCard?.id) && (
                    <Text style={styles.memoryInfo}>
                      {getNextReviewText(currentCard?.id)}
                    </Text>
                  )}
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
              <Text style={styles.ratingButtonText}>Again</Text>
              <Text style={styles.ratingButtonSubtext}>&lt;1d</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.ratingButton, styles.ratingButtonMedium]}
              onPress={() => handleQualityRating(SPACED_REPETITION.QUALITY_RATINGS.CORRECT_HESITANT)}
            >
              <Ionicons name="remove" size={24} color="white" />
              <Text style={styles.ratingButtonText}>Hard</Text>
              <Text style={styles.ratingButtonSubtext}>{getNextIntervalText(SPACED_REPETITION.QUALITY_RATINGS.CORRECT_HESITANT)}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.ratingButton, styles.ratingButtonGood]}
              onPress={() => handleQualityRating(SPACED_REPETITION.QUALITY_RATINGS.CORRECT_HARD)}
            >
              <Ionicons name="checkmark-outline" size={24} color="white" />
              <Text style={styles.ratingButtonText}>Good</Text>
              <Text style={styles.ratingButtonSubtext}>{getNextIntervalText(SPACED_REPETITION.QUALITY_RATINGS.CORRECT_HARD)}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.ratingButton, styles.ratingButtonEasy]}
              onPress={() => handleQualityRating(SPACED_REPETITION.QUALITY_RATINGS.CORRECT_EASY)}
            >
              <Ionicons name="checkmark" size={24} color="white" />
              <Text style={styles.ratingButtonText}>Easy</Text>
              <Text style={styles.ratingButtonSubtext}>{getNextIntervalText(SPACED_REPETITION.QUALITY_RATINGS.CORRECT_EASY)}</Text>
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
  studyStats: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.primary,
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
  cardInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  memoryInfo: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.textSecondary,
    fontStyle: 'italic',
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
    justifyContent: 'space-between',
    gap: THEME.spacing.xs,
  },
  ratingButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    minHeight: 80,
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
  ratingButtonGood: {
    backgroundColor: THEME.colors.primary,
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
  ratingButtonSubtext: {
    fontSize: THEME.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
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