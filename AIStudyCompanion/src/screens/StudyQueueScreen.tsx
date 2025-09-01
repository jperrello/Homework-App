import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  Animated,
  Easing,
} from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants';
import flashcardStorage from '../services/flashcardStorage';
import spacedRepetitionService, { FlashcardMemoryData } from '../services/spacedRepetitionService';
import { Flashcard, FlashcardSet } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function StudyQueueScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [isLoading, setIsLoading] = useState(true);
  const [studyStats, setStudyStats] = useState({
    dueToday: 0,
    newCards: 0,
    totalCards: 0,
    completed: 0,
    streak: 0
  });
  const [recentFlashcards, setRecentFlashcards] = useState<Flashcard[]>([]);
  const [availableFlashcards, setAvailableFlashcards] = useState<Flashcard[]>([]);
  const [memoryData, setMemoryData] = useState<FlashcardMemoryData[]>([]);
  const [studySessions, setStudySessions] = useState<any[]>([]);
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);
  const [dueFlashcardSets, setDueFlashcardSets] = useState<FlashcardSet[]>([]);
  const [showNewCardsNotification, setShowNewCardsNotification] = useState(false);
  const [newCardsInfo, setNewCardsInfo] = useState<{count: number, courseName: string} | null>(null);
  const [groupedCards, setGroupedCards] = useState<{[key: string]: Flashcard[]}>({});
  const [activeFilter, setActiveFilter] = useState<'all' | 'due' | 'new' | 'course'>('all');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('');
  const [summerStudyMode, setSummerStudyMode] = useState(false);
  
  // Journey animations
  const rocketAnimation = useRef(new Animated.Value(0)).current;
  const journeyProgress = useRef(new Animated.Value(0)).current;
  const starsAnimation = useRef(new Animated.Value(0)).current;

  // Initialize cosmic animations
  useEffect(() => {
    // Rocket hover animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(rocketAnimation, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(rocketAnimation, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Twinkling stars
    Animated.loop(
      Animated.timing(starsAnimation, {
        toValue: 1,
        duration: 3000,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Handle navigation params for new cards
  useEffect(() => {
    if (route.params?.newCardsGenerated && route.params?.newCardsCount) {
      setNewCardsInfo({
        count: route.params.newCardsCount,
        courseName: route.params.courseName || 'course'
      });
      setShowNewCardsNotification(true);
      // Clear the params to prevent showing on subsequent visits
      navigation.setParams({
        newCardsGenerated: false,
        newCardsCount: 0,
        courseName: ''
      });
    }
  }, [route.params]);

  // Load data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadStudyData();
      // Also check for route params indicating new cards
      if (route.params?.refresh) {
        setTimeout(() => {
          loadStudyData();
        }, 500); // Small delay to ensure AsyncStorage has been updated
      }
    }, [route.params])
  );

  useEffect(() => {
    loadStudyData();
  }, []);

  const loadStudyData = async () => {
    setIsLoading(true);
    try {
      // Load memory data, study sessions, and flashcard sets
      const [memoryDataResult, sessionsResult, flashcardSetsResult, dueFlashcardSetsResult] = await Promise.all([
        flashcardStorage.getMemoryData(),
        flashcardStorage.getRecentSessions(7),
        flashcardStorage.getFlashcardSets(),
        flashcardStorage.getFlashcardSetsDueForPractice()
      ]);
      
      setMemoryData(memoryDataResult);
      setStudySessions(sessionsResult);
      setFlashcardSets(flashcardSetsResult);
      setDueFlashcardSets(dueFlashcardSetsResult);
      
      // Calculate study stats using spaced repetition service
      const stats = spacedRepetitionService.getStudyStats(memoryDataResult);
      
      // Calculate today's completed sessions
      const today = new Date().toDateString();
      const todaysSessions = sessionsResult.filter(session => 
        session.startTime.toDateString() === today && session.endTime
      );
      const completedToday = todaysSessions.reduce((sum, session) => sum + session.cardsStudied.length, 0);
      
      // Calculate streak
      const analytics = await flashcardStorage.getStudyAnalytics(30);
      
      const newStats = {
        dueToday: stats.dueToday,
        newCards: stats.newCards,
        totalCards: stats.totalCards,
        completed: completedToday,
        streak: analytics.streakDays
      };
      setStudyStats(newStats);
      
      // Animate journey progress based on completion
      const progressValue = Math.min(completedToday / 30, 1); // Max 30 cards to reach moon
      Animated.timing(journeyProgress, {
        toValue: progressValue,
        duration: 1500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
      
      // Show cosmic achievements
      if (completedToday >= 30 && !showNewCardsNotification) {
        Alert.alert(
          '🎆 DAILY GOAL COMPLETE! 🎆',
          '🎉 Congratulations! You\'ve completed your daily study goal! Your dedication to learning has paid off. Ready for tomorrow\'s session?',
          [{ text: '🚀 Awesome!', style: 'default' }]
        );
      } else if (completedToday >= 15 && completedToday < 30) {
        // Mid-journey encouragement - only show once
        setTimeout(() => {
          if (Math.random() > 0.7) { // 30% chance to avoid spam
            Alert.alert(
              '⚡ Halfway There!',
              '📚 Amazing progress! You\'re halfway through your daily goal. Keep going!',
              [{ text: '🎆 Full speed ahead!', style: 'default' }]
            );
          }
        }, 2000);
      }
      
      // Load all available flashcards for manual queue management
      await loadAvailableFlashcards();
      
      // Organize cards by course and topic
      organizeCourseCards();
      
    } catch (error) {
      console.error('Error loading study data:', error);
      Alert.alert('Error', 'Failed to load study data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableFlashcards = async () => {
    try {
      // Get all flashcard session keys from AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const flashcardKeys = keys.filter((key: string) => key.startsWith('flashcards_'));
      
      const allFlashcards: Flashcard[] = [];
      
      for (const key of flashcardKeys.slice(0, 10)) { // Limit to recent 10 sessions
        const sessionId = key.replace('flashcards_', '');
        const flashcards = await flashcardStorage.getFlashcards(sessionId);
        allFlashcards.push(...flashcards);
      }
      
      // Remove duplicates and sort by creation date
      const uniqueFlashcards = allFlashcards.filter((card, index, array) => 
        array.findIndex(c => c.id === card.id) === index
      ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setAvailableFlashcards(uniqueFlashcards);
      setRecentFlashcards(uniqueFlashcards.slice(0, 5)); // Show 5 most recent
      
      // Organize cards after loading
      organizeCourseCards(uniqueFlashcards);
      
    } catch (error) {
      console.error('Error loading available flashcards:', error);
    }
  };

  const startStudySession = (flashcards: Flashcard[], sessionType: string = 'review') => {
    if (flashcards.length === 0) {
      Alert.alert('No Cards Available', `No ${sessionType} cards available right now.`);
      return;
    }
    
    navigation.navigate('FlashcardStudy', {
      flashcardIds: flashcards.map(card => card.id),
      courseId: flashcards[0]?.course_id
    });
  };

  const getDueCards = (): Flashcard[] => {
    const dueCardIds = memoryData
      .filter(memory => memory.nextReviewDate <= new Date())
      .map(memory => memory.cardId);
    
    return availableFlashcards.filter(card => dueCardIds.includes(card.id));
  };

  const getNewCards = (): Flashcard[] => {
    const studiedCardIds = new Set(memoryData.map(memory => memory.cardId));
    return availableFlashcards.filter(card => !studiedCardIds.has(card.id)).slice(0, 10);
  };

  const addCardsToQueue = () => {
    Alert.alert(
      'Add Cards to Queue',
      'Choose how to add cards to your study queue:',
      [
        {
          text: 'Add Recent Cards (5)',
          onPress: () => startStudySession(recentFlashcards, 'recent')
        },
        {
          text: 'Add Random Cards (10)',
          onPress: () => {
            const randomCards = availableFlashcards
              .sort(() => Math.random() - 0.5)
              .slice(0, 10);
            startStudySession(randomCards, 'random');
          }
        },
        {
          text: 'Browse All Cards',
          onPress: () => navigation.navigate('FlashcardCreation')
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const startFlashcardSetPractice = async (flashcardSet: FlashcardSet) => {
    try {
      // Find flashcards that belong to this set
      const setFlashcards = availableFlashcards.filter(card => 
        card.flashcard_set_id === flashcardSet.id
      );
      
      if (setFlashcards.length === 0) {
        Alert.alert('No Cards Found', 'No flashcards found for this set.');
        return;
      }

      // Update the practice date when starting
      const now = new Date();
      const nextPracticeDate = flashcardStorage.calculateNextPracticeDate(
        flashcardSet.practice_frequency,
        flashcardSet.custom_frequency_days
      );
      
      await flashcardStorage.updateFlashcardSetPracticeDate(
        flashcardSet.id,
        now,
        nextPracticeDate
      );

      // Refresh due sets
      const updatedDueSets = await flashcardStorage.getFlashcardSetsDueForPractice();
      setDueFlashcardSets(updatedDueSets);

      // Start study session
      startStudySession(setFlashcards, `${flashcardSet.name} practice`);
    } catch (error) {
      console.error('Error starting flashcard set practice:', error);
      Alert.alert('Error', 'Failed to start practice session.');
    }
  };

  const getPracticeFrequencyLabel = (frequency: FlashcardSet['practice_frequency'], customDays?: number): string => {
    switch (frequency) {
      case 'daily': return 'Daily';
      case 'every_2_days': return 'Every 2 days';
      case 'weekly': return 'Weekly';
      case 'bi_weekly': return 'Bi-weekly';
      case 'monthly': return 'Monthly';
      case 'custom': return `Every ${customDays || 7} days`;
      default: return 'Weekly';
    }
  };

  const organizeCourseCards = (cards = availableFlashcards) => {
    const grouped: {[key: string]: Flashcard[]} = {};
    
    cards.forEach(card => {
      const courseKey = `course_${card.course_id}`;
      const topicKey = card.topic || 'General';
      const fullKey = `${courseKey}_${topicKey}`;
      
      if (!grouped[fullKey]) {
        grouped[fullKey] = [];
      }
      grouped[fullKey].push(card);
    });
    
    setGroupedCards(grouped);
  };

  const getFilteredCards = (): Flashcard[] => {
    let filtered = availableFlashcards;
    
    switch (activeFilter) {
      case 'due':
        const dueCardIds = memoryData
          .filter(memory => memory.nextReviewDate <= new Date())
          .map(memory => memory.cardId);
        filtered = filtered.filter(card => dueCardIds.includes(card.id));
        break;
      case 'new':
        const studiedCardIds = new Set(memoryData.map(memory => memory.cardId));
        filtered = filtered.filter(card => !studiedCardIds.has(card.id));
        break;
      case 'course':
        if (selectedCourseFilter) {
          filtered = filtered.filter(card => 
            card.course_id.toString() === selectedCourseFilter ||
            card.topic === selectedCourseFilter
          );
        }
        break;
      default:
        // 'all' - no filtering
        break;
    }
    
    return filtered.sort((a, b) => {
      // Priority ordering: overdue > due today > future > new
      const aMemory = memoryData.find(m => m.cardId === a.id);
      const bMemory = memoryData.find(m => m.cardId === b.id);
      
      if (!aMemory && !bMemory) return 0;
      if (!aMemory) return 1; // New cards go after studied cards
      if (!bMemory) return -1;
      
      const now = new Date();
      const aDaysOverdue = Math.floor((now.getTime() - aMemory.nextReviewDate.getTime()) / (1000 * 60 * 60 * 24));
      const bDaysOverdue = Math.floor((now.getTime() - bMemory.nextReviewDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return bDaysOverdue - aDaysOverdue; // Most overdue first
    });
  };

  const getCourseOptions = () => {
    const courses = new Set<string>();
    const topics = new Set<string>();
    
    availableFlashcards.forEach(card => {
      courses.add(card.course_id.toString());
      if (card.topic) topics.add(card.topic);
    });
    
    return {
      courses: Array.from(courses),
      topics: Array.from(topics)
    };
  };

  const toggleSummerStudyMode = () => {
    setSummerStudyMode(!summerStudyMode);
    if (!summerStudyMode) {
      Alert.alert(
        'Summer Study Mode Activated! ☀️',
        'Perfect for reviewing old courses without due dates. You can now bulk-select cards and create custom study sessions.',
        [{ text: 'Got it!', style: 'default' }]
      );
    }
  };

  const bulkAddCourseCards = (courseId: string, courseName?: string) => {
    const courseCards = availableFlashcards.filter(card => 
      card.course_id.toString() === courseId
    ).slice(0, 20); // Limit to 20 cards max
    
    if (courseCards.length > 0) {
      Alert.alert(
        'Add Course Cards',
        `Add ${courseCards.length} cards from ${courseName || `Course ${courseId}`} to your study queue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Add Cards', 
            onPress: () => startStudySession(courseCards, `${courseName || 'course'} review`)
          }
        ]
      );
    } else {
      Alert.alert('No Cards', 'No cards found for this course.');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.cosmicLoadingContainer}>
          <View style={styles.loadingStarsField}>
            {[...Array(6)].map((_, i) => (
              <Animated.Text key={i} style={[
                styles.loadingStar, 
                {
                  left: `${15 + (i * 15)}%`,
                  top: `${30 + (i % 2) * 20}%`,
                  opacity: starsAnimation.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.3, 1, 0.3],
                  }),
                }
              ]}>
                {i % 3 === 0 ? '✨' : i % 3 === 1 ? '⭐' : '💫'}
              </Animated.Text>
            ))}
          </View>
          <Text style={styles.loadingRocket}>🚀</Text>
          <ActivityIndicator size="large" color={THEME.colors.primary} style={{marginVertical: THEME.spacing.lg}} />
          <Text style={styles.cosmicLoadingText}>🛰️ Loading your study queue...</Text>
          <Text style={styles.loadingSubtext}>Loading your study progress</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Study Dashboard Header */}
      <View style={styles.missionControlHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🛰️ Study Dashboard</Text>
          <Text style={styles.headerSubtitle}>Daily Study Progress</Text>
        </View>
        <TouchableOpacity onPress={loadStudyData} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Study Progress */}
        <View style={styles.journeyContainer}>
          {/* Stars background */}
          <Animated.View style={[
            styles.starsField,
            {
              opacity: starsAnimation.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.4, 1, 0.4],
              }),
            }
          ]}>
            {[...Array(8)].map((_, i) => (
              <Text key={i} style={[styles.fieldStar, {
                left: `${10 + (i * 12)}%`,
                top: `${20 + (i % 3) * 15}%`,
              }]}>{i % 3 === 0 ? '✨' : i % 3 === 1 ? '⭐' : '💫'}</Text>
            ))}
          </Animated.View>
          
          {/* Journey Path */}
          <View style={styles.journeyPath}>
            {/* Earth Start */}
            <View style={styles.earthStart}>
              <Text style={styles.celestialBody}>🌍</Text>
              <Text style={styles.locationLabel}>Earth</Text>
            </View>
            
            {/* Progress Trail */}
            <View style={styles.progressTrail}>
              <Animated.View style={[
                styles.progressFill,
                {
                  transform: [{
                    scaleX: journeyProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    })
                  }]
                }
              ]} />
              
              {/* Animated Rocket */}
              <Animated.View style={[
                styles.rocketJourney,
                {
                  transform: [
                    {
                      translateX: journeyProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 250], // Approximate pixel value instead of percentage
                      })
                    },
                    {
                      translateY: rocketAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -8],
                      }),
                    },
                    {
                      rotate: rocketAnimation.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: ['0deg', '3deg', '0deg'],
                      }),
                    },
                  ],
                }
              ]}>
                <Text style={styles.journeyRocket}>🚀</Text>
              </Animated.View>
            </View>
            
            {/* Moon Destination */}
            <View style={styles.moonDestination}>
              <Text style={styles.celestialBody}>🌙</Text>
              <Text style={styles.locationLabel}>Moon</Text>
            </View>
          </View>
          
          {/* Journey Stats */}
          <View style={styles.journeyStats}>
            <Text style={styles.progressText}>
              ⚡ Progress: {Math.round(journeyProgress._value * 100)}% Complete
            </Text>
            <Text style={styles.statsText}>
              🏆 {studyStats.completed}/30 cards completed today
            </Text>
          </View>
        </View>
        <View style={styles.missionStatsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>⏰</Text>
            <Text style={styles.statNumber}>{studyStats.dueToday}</Text>
            <Text style={styles.statLabel}>Due Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>✅</Text>
            <Text style={styles.statNumber}>{studyStats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>📚</Text>
            <Text style={styles.statNumber}>{studyStats.totalCards}</Text>
            <Text style={styles.statLabel}>Total Cards</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statNumber}>{studyStats.streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>

        {/* Study Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Due Today ({studyStats.dueToday})</Text>
          {studyStats.dueToday > 0 ? (
            <View style={styles.missionCard}>
              <View style={styles.missionCardContent}>
                <Text style={styles.missionEmoji}>🚨</Text>
                <Text style={styles.missionCardTitle}>Priority Review</Text>
                <Text style={styles.missionCardSubtitle}>
                  {studyStats.dueToday} cards need your attention today
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.missionButton, styles.urgentButton]}
                onPress={() => startStudySession(getDueCards(), 'due')}
              >
                <Text style={styles.missionButtonText}>📖 Start Review</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.successCard}>
              <Text style={styles.successEmoji}>✅</Text>
              <Text style={styles.successText}>Great work! You're all caught up 🎆</Text>
            </View>
          )}
        </View>

        {/* New Discovery Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌠 New Discoveries ({studyStats.newCards})</Text>
          {studyStats.newCards > 0 ? (
            <View style={styles.missionCard}>
              <View style={styles.missionCardContent}>
                <Text style={styles.missionEmoji}>✨</Text>
                <Text style={styles.missionCardTitle}>New Material</Text>
                <Text style={styles.missionCardSubtitle}>
                  {studyStats.newCards} new knowledge modules discovered and ready for exploration
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.missionButton, styles.discoveryButton]}
                onPress={() => startStudySession(getNewCards(), 'new')}
              >
                <Text style={styles.missionButtonText}>🔍 Explore Now</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.neutralCard}>
              <Text style={styles.neutralEmoji}>🛰️</Text>
              <Text style={styles.neutralText}>No new territories to explore</Text>
            </View>
          )}
        </View>

        {/* Flashcard Sets Due for Practice */}
        {dueFlashcardSets.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Flashcard Sets Due ({dueFlashcardSets.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {dueFlashcardSets.map((flashcardSet) => (
                <TouchableOpacity
                  key={flashcardSet.id}
                  style={styles.flashcardSetCard}
                  onPress={() => startFlashcardSetPractice(flashcardSet)}
                  activeOpacity={0.7}
                >
                  <View style={styles.flashcardSetHeader}>
                    <Ionicons name="library" size={24} color={THEME.colors.warning} />
                    <View style={styles.overdueSetIndicator}>
                      <Text style={styles.overdueSetText}>DUE</Text>
                    </View>
                  </View>
                  <Text style={styles.flashcardSetName} numberOfLines={2}>
                    {flashcardSet.name}
                  </Text>
                  {flashcardSet.description && (
                    <Text style={styles.flashcardSetDescription} numberOfLines={2}>
                      {flashcardSet.description}
                    </Text>
                  )}
                  <View style={styles.flashcardSetFooter}>
                    <Text style={styles.flashcardSetCount}>
                      {flashcardSet.flashcard_count} cards
                    </Text>
                    <Text style={styles.flashcardSetFrequency}>
                      {getPracticeFrequencyLabel(flashcardSet.practice_frequency, flashcardSet.custom_frequency_days)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* All Flashcard Sets */}
        {flashcardSets.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Flashcard Sets</Text>
              <Text style={styles.sectionCount}>({flashcardSets.length})</Text>
            </View>
            <FlatList
              data={flashcardSets.filter(set => set.is_active)}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item: flashcardSet }) => {
                const isDue = dueFlashcardSets.some(dueSet => dueSet.id === flashcardSet.id);
                return (
                  <TouchableOpacity
                    style={[styles.flashcardSetPreview, isDue && styles.flashcardSetDue]}
                    onPress={() => startFlashcardSetPractice(flashcardSet)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.flashcardSetPreviewHeader}>
                      <Ionicons 
                        name="library" 
                        size={20} 
                        color={isDue ? THEME.colors.warning : THEME.colors.primary} 
                      />
                      {isDue && (
                        <View style={styles.dueIndicator}>
                          <Text style={styles.dueText}>DUE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.flashcardSetPreviewName} numberOfLines={2}>
                      {flashcardSet.name}
                    </Text>
                    <Text style={styles.flashcardSetPreviewMeta}>
                      {flashcardSet.flashcard_count} cards
                    </Text>
                    <Text style={styles.flashcardSetPreviewFrequency}>
                      {getPracticeFrequencyLabel(flashcardSet.practice_frequency, flashcardSet.custom_frequency_days)}
                    </Text>
                    <Text style={styles.flashcardSetPreviewDate}>
                      Next: {flashcardSet.next_practice_date.toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={styles.flashcardsList}
            />
          </View>
        )}

        {/* Filter Controls */}
        <View style={styles.section}>
          <View style={styles.filterHeader}>
            <Text style={styles.sectionTitle}>Study Options</Text>
            <TouchableOpacity 
              style={[styles.summerModeButton, summerStudyMode && styles.summerModeActive]}
              onPress={toggleSummerStudyMode}
            >
              <Ionicons 
                name={summerStudyMode ? "sunny" : "sunny-outline"} 
                size={16} 
                color={summerStudyMode ? '#fff' : THEME.colors.warning} 
              />
              <Text style={[styles.summerModeText, summerStudyMode && styles.summerModeTextActive]}>
                Summer Mode
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.filterTabs}>
            <TouchableOpacity 
              style={[styles.filterTab, activeFilter === 'all' && styles.filterTabActive]}
              onPress={() => setActiveFilter('all')}
            >
              <Text style={[styles.filterTabText, activeFilter === 'all' && styles.filterTabTextActive]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterTab, activeFilter === 'due' && styles.filterTabActive]}
              onPress={() => setActiveFilter('due')}
            >
              <Text style={[styles.filterTabText, activeFilter === 'due' && styles.filterTabTextActive]}>Due</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterTab, activeFilter === 'new' && styles.filterTabActive]}
              onPress={() => setActiveFilter('new')}
            >
              <Text style={[styles.filterTabText, activeFilter === 'new' && styles.filterTabTextActive]}>New</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterTab, activeFilter === 'course' && styles.filterTabActive]}
              onPress={() => {
                setActiveFilter('course');
                const options = getCourseOptions();
                if (options.courses.length > 0) {
                  Alert.alert(
                    'Filter by Course/Topic',
                    'Choose a filter option:',
                    [
                      ...options.courses.map(courseId => ({
                        text: `Course ${courseId}`,
                        onPress: () => setSelectedCourseFilter(courseId)
                      })),
                      ...options.topics.map(topic => ({
                        text: topic,
                        onPress: () => setSelectedCourseFilter(topic)
                      })),
                      { text: 'Cancel', style: 'cancel' }
                    ]
                  );
                }
              }}
            >
              <Text style={[styles.filterTabText, activeFilter === 'course' && styles.filterTabTextActive]}>Course</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.studyOptionsContainer}>
            {summerStudyMode && (
              <TouchableOpacity 
                style={styles.studyOptionSummer}
                onPress={() => {
                  const options = getCourseOptions();
                  Alert.alert(
                    'Bulk Add by Course',
                    'Choose a course to add all its cards:',
                    [
                      ...options.courses.map(courseId => ({
                        text: `Course ${courseId} (${availableFlashcards.filter(c => c.course_id.toString() === courseId).length} cards)`,
                        onPress: () => bulkAddCourseCards(courseId)
                      })),
                      { text: 'Cancel', style: 'cancel' }
                    ]
                  );
                }}
              >
                <Ionicons name="albums" size={32} color={THEME.colors.warning} />
                <Text style={styles.studyOptionTitle}>Bulk Add Course</Text>
                <Text style={styles.studyOptionSubtitle}>Add all cards from a course</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.studyOption}
              onPress={addCardsToQueue}
            >
              <Ionicons name="add-circle" size={32} color={THEME.colors.primary} />
              <Text style={styles.studyOptionTitle}>Add Cards to Queue</Text>
              <Text style={styles.studyOptionSubtitle}>Manually add cards for review</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.studyOption}
              onPress={() => navigation.navigate('FlashcardCreation')}
            >
              <Ionicons name="create" size={32} color={THEME.colors.success} />
              <Text style={styles.studyOptionTitle}>Create New Cards</Text>
              <Text style={styles.studyOptionSubtitle}>Generate flashcards from courses</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filtered Cards Display */}
        {getFilteredCards().length > 0 && activeFilter !== 'all' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {activeFilter === 'due' ? 'Due Cards' :
                 activeFilter === 'new' ? 'New Cards' :
                 activeFilter === 'course' ? `Filtered Cards` : 'Cards'}
              </Text>
              <Text style={styles.sectionCount}>({getFilteredCards().length})</Text>
            </View>
            <FlatList
              data={getFilteredCards().slice(0, 10)} // Show first 10 filtered cards
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const memory = memoryData.find(m => m.cardId === item.id);
                const isOverdue = memory && memory.nextReviewDate < new Date();
                const daysOverdue = memory ? Math.floor((new Date().getTime() - memory.nextReviewDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                
                return (
                  <TouchableOpacity 
                    style={[styles.flashcardPreview, isOverdue && styles.flashcardOverdue]}
                    onPress={() => startStudySession([item], 'single card')}
                    activeOpacity={0.7}
                  >
                    {isOverdue && daysOverdue > 0 && (
                      <View style={styles.overdueIndicator}>
                        <Text style={styles.overdueText}>{daysOverdue}d overdue</Text>
                      </View>
                    )}
                    <Text style={styles.flashcardQuestion} numberOfLines={3}>
                      {item.question}
                    </Text>
                    <Text style={styles.flashcardTopic}>{item.topic}</Text>
                    <View style={styles.cardMetadata}>
                      <View style={[styles.difficultyBadge, {
                        backgroundColor: item.difficulty === 'easy' ? THEME.colors.success + '20' :
                                       item.difficulty === 'medium' ? THEME.colors.warning + '20' :
                                       THEME.colors.error + '20'
                      }]}>
                        <Text style={[styles.difficultyText, {
                          color: item.difficulty === 'easy' ? THEME.colors.success :
                                 item.difficulty === 'medium' ? THEME.colors.warning :
                                 THEME.colors.error
                        }]}>
                          {item.difficulty?.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.cardDate}>
                        Course {item.course_id}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={styles.flashcardsList}
            />
            <View style={styles.recentCardsActions}>
              <TouchableOpacity 
                style={styles.actionButtonSecondary}
                onPress={() => startStudySession(getFilteredCards().slice(0, 10), 'filtered selection')}
              >
                <Ionicons name="play" size={16} color={THEME.colors.primary} />
                <Text style={styles.actionButtonSecondaryText}>Study Filtered ({Math.min(10, getFilteredCards().length)})</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButtonSecondary}
                onPress={() => {
                  const randomCards = getFilteredCards()
                    .sort(() => Math.random() - 0.5)
                    .slice(0, Math.min(5, getFilteredCards().length));
                  startStudySession(randomCards, 'random filtered');
                }}
              >
                <Ionicons name="shuffle" size={16} color={THEME.colors.primary} />
                <Text style={styles.actionButtonSecondaryText}>Random Mix (5)</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* New Cards Notification */}
        {showNewCardsNotification && newCardsInfo && (
          <View style={styles.section}>
            <View style={styles.newCardsNotification}>
              <View style={styles.notificationContent}>
                <Ionicons name="checkmark-circle" size={24} color={THEME.colors.success} />
                <View style={styles.notificationText}>
                  <Text style={styles.notificationTitle}>New Flashcards Added! 🎉</Text>
                  <Text style={styles.notificationSubtitle}>
                    {newCardsInfo.count} new cards from {newCardsInfo.courseName} are ready for study
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.dismissButton}
                onPress={() => setShowNewCardsNotification(false)}
              >
                <Ionicons name="close" size={20} color={THEME.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Recent Cards Section */}
        {recentFlashcards.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Flashcards</Text>
              <Text style={styles.sectionCount}>({recentFlashcards.length})</Text>
            </View>
            <FlatList
              data={recentFlashcards}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.flashcardPreview}
                  onPress={() => startStudySession([item], 'single card')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.flashcardQuestion} numberOfLines={3}>
                    {item.question}
                  </Text>
                  <Text style={styles.flashcardTopic}>{item.topic}</Text>
                  <View style={styles.cardMetadata}>
                    <View style={[styles.difficultyBadge, {
                      backgroundColor: item.difficulty === 'easy' ? THEME.colors.success + '20' :
                                     item.difficulty === 'medium' ? THEME.colors.warning + '20' :
                                     THEME.colors.error + '20'
                    }]}>
                      <Text style={[styles.difficultyText, {
                        color: item.difficulty === 'easy' ? THEME.colors.success :
                               item.difficulty === 'medium' ? THEME.colors.warning :
                               THEME.colors.error
                      }]}>
                        {item.difficulty?.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.cardDate}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.flashcardsList}
            />
            <View style={styles.recentCardsActions}>
              <TouchableOpacity 
                style={styles.actionButtonSecondary}
                onPress={() => startStudySession(recentFlashcards, 'recent')}
              >
                <Ionicons name="play" size={16} color={THEME.colors.primary} />
                <Text style={styles.actionButtonSecondaryText}>Study All ({recentFlashcards.length})</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButtonSecondary}
                onPress={() => {
                  const randomCards = recentFlashcards
                    .sort(() => Math.random() - 0.5)
                    .slice(0, Math.min(3, recentFlashcards.length));
                  startStudySession(randomCards, 'random selection');
                }}
              >
                <Ionicons name="shuffle" size={16} color={THEME.colors.primary} />
                <Text style={styles.actionButtonSecondaryText}>Quick Review (3)</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Study Progress Summary */}
        {studySessions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Study Activity</Text>
            <View style={styles.progressSummary}>
              <View style={styles.progressItem}>
                <Ionicons name="calendar" size={20} color={THEME.colors.primary} />
                <Text style={styles.progressLabel}>This Week</Text>
                <Text style={styles.progressValue}>
                  {studySessions.filter(session => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return session.startTime >= weekAgo;
                  }).length} sessions
                </Text>
              </View>
              
              <View style={styles.progressItem}>
                <Ionicons name="trending-up" size={20} color={THEME.colors.success} />
                <Text style={styles.progressLabel}>Streak</Text>
                <Text style={styles.progressValue}>{studyStats.streak} days</Text>
              </View>
              
              <View style={styles.progressItem}>
                <Ionicons name="checkmark-done" size={20} color={THEME.colors.warning} />
                <Text style={styles.progressLabel}>Total Cards</Text>
                <Text style={styles.progressValue}>
                  {studySessions.reduce((sum, session) => sum + session.cardsStudied.length, 0)}
                </Text>
              </View>
            </View>
            
            {studySessions.length > 0 && (
              <TouchableOpacity 
                style={styles.viewProgressButton}
                onPress={() => {
                  Alert.alert(
                    'Study Analytics',
                    `Recent Study Sessions:\\n\\n${studySessions.slice(0, 3).map(session => 
                      `${session.startTime.toLocaleDateString()}: ${session.cardsStudied.length} cards (${Math.round(((session.correctCards || 0) / session.cardsStudied.length) * 100)}% accuracy)`
                    ).join('\\n')}\\n\\nKeep up the great work! \ud83d\udcaa`
                  );
                }}
              >
                <Text style={styles.viewProgressText}>View Detailed Analytics</Text>
                <Ionicons name="analytics" size={16} color={THEME.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
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
  cosmicLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  loadingStarsField: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  loadingStar: {
    position: 'absolute',
    fontSize: 16,
  },
  loadingRocket: {
    fontSize: 48,
    marginBottom: THEME.spacing.lg,
    textShadowColor: THEME.colors.rocket,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  cosmicLoadingText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text,
    marginTop: THEME.spacing.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    marginTop: THEME.spacing.xs,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  missionControlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: THEME.spacing.lg,
    backgroundColor: THEME.colors.primary,
    borderBottomWidth: 2,
    borderBottomColor: THEME.colors.rocket + '60',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: THEME.fontSize.xxl,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: THEME.spacing.xs,
    textShadowColor: THEME.colors.rocket,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  headerSubtitle: {
    fontSize: THEME.fontSize.md,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  refreshButton: {
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flex: 1,
  },
  // Journey Progress Styles
  journeyContainer: {
    backgroundColor: THEME.colors.surface,
    marginHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: THEME.colors.primary + '30',
    position: 'relative',
    overflow: 'hidden',
  },
  starsField: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },
  fieldStar: {
    position: 'absolute',
    fontSize: 12,
    opacity: 0.6,
  },
  journeyPath: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: THEME.spacing.md,
    zIndex: 1,
  },
  earthStart: {
    alignItems: 'center',
    marginRight: THEME.spacing.sm,
  },
  moonDestination: {
    alignItems: 'center',
    marginLeft: THEME.spacing.sm,
  },
  celestialBody: {
    fontSize: 32,
    marginBottom: THEME.spacing.xs,
  },
  locationLabel: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  progressTrail: {
    flex: 1,
    height: 6,
    backgroundColor: THEME.colors.border + '60',
    borderRadius: 3,
    position: 'relative',
    marginHorizontal: THEME.spacing.sm,
  },
  progressFill: {
    height: '100%',
    width: '100%',
    backgroundColor: THEME.colors.rocket,
    borderRadius: 3,
    shadowColor: THEME.colors.rocket,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    transformOrigin: 'left',
  },
  rocketJourney: {
    position: 'absolute',
    top: -12,
    zIndex: 2,
  },
  journeyRocket: {
    fontSize: 24,
    textShadowColor: THEME.colors.rocket,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  journeyStats: {
    alignItems: 'center',
    marginTop: THEME.spacing.md,
  },
  progressText: {
    fontSize: THEME.fontSize.md,
    fontWeight: 'bold',
    color: THEME.colors.primary,
    marginBottom: THEME.spacing.xs,
  },
  statsText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
  
  // Mission Stats Grid
  missionStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: THEME.colors.surface,
    marginHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.lg,
    paddingVertical: THEME.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: THEME.spacing.xs,
  },
  statNumber: {
    fontSize: THEME.fontSize.xl,
    fontWeight: 'bold',
    color: THEME.colors.primary,
    marginBottom: THEME.spacing.xs,
  },
  statLabel: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    marginTop: THEME.spacing.xl,
    paddingHorizontal: THEME.spacing.lg,
  },
  sectionTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.md,
  },
  // Mission Card Styles
  missionCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: THEME.colors.primary + '30',
  },
  missionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  missionEmoji: {
    fontSize: 28,
    marginRight: THEME.spacing.md,
  },
  missionCardTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: 'bold',
    color: THEME.colors.text,
    flex: 1,
    marginBottom: THEME.spacing.xs,
  },
  missionCardSubtitle: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    lineHeight: 20,
    flex: 1,
  },
  missionButton: {
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.xl,
    borderRadius: THEME.borderRadius.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  urgentButton: {
    backgroundColor: THEME.colors.warning,
  },
  discoveryButton: {
    backgroundColor: THEME.colors.primary,
  },
  missionButtonText: {
    color: '#fff',
    fontSize: THEME.fontSize.md,
    fontWeight: 'bold',
  },
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.success + '20',
    borderWidth: 1,
    borderColor: THEME.colors.success + '40',
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
  },
  successEmoji: {
    fontSize: 28,
    marginRight: THEME.spacing.md,
  },
  successText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.success,
    fontWeight: '600',
    flex: 1,
  },
  neutralCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  neutralEmoji: {
    fontSize: 28,
    marginRight: THEME.spacing.md,
  },
  neutralText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.textSecondary,
    flex: 1,
    fontStyle: 'italic',
  },
  studyOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: THEME.spacing.md,
  },
  studyOption: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  studyOptionTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginTop: THEME.spacing.sm,
    textAlign: 'center',
  },
  studyOptionSubtitle: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    marginTop: THEME.spacing.xs,
    textAlign: 'center',
  },
  flashcardPreview: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginRight: THEME.spacing.sm,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  flashcardQuestion: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text,
    fontWeight: '500',
    marginBottom: THEME.spacing.sm,
    lineHeight: 18,
  },
  flashcardTopic: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.sm,
  },
  difficultyBadge: {
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  difficultyText: {
    fontSize: THEME.fontSize.xs,
    fontWeight: 'bold',
  },
  flashcardsList: {
    paddingVertical: THEME.spacing.sm,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.primary + '20',
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginTop: THEME.spacing.sm,
  },
  viewAllButtonText: {
    color: THEME.colors.primary,
    fontSize: THEME.fontSize.md,
    fontWeight: '600',
    marginRight: THEME.spacing.xs,
  },
  newCardsNotification: {
    backgroundColor: THEME.colors.success + '20',
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.success + '40',
    padding: THEME.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.md,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationText: {
    marginLeft: THEME.spacing.sm,
    flex: 1,
  },
  notificationTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: 'bold',
    color: THEME.colors.success,
    marginBottom: THEME.spacing.xs,
  },
  notificationSubtitle: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text,
    lineHeight: 18,
  },
  dismissButton: {
    padding: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  sectionCount: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    marginLeft: THEME.spacing.xs,
    fontWeight: '500',
  },
  cardMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: THEME.spacing.xs,
  },
  cardDate: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.textSecondary,
    fontStyle: 'italic',
  },
  recentCardsActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: THEME.spacing.md,
    marginTop: THEME.spacing.md,
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.primary + '10',
    borderWidth: 1,
    borderColor: THEME.colors.primary + '30',
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    gap: THEME.spacing.xs,
  },
  actionButtonSecondaryText: {
    color: THEME.colors.primary,
    fontSize: THEME.fontSize.sm,
    fontWeight: '600',
  },
  progressSummary: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  progressLabel: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text,
    marginLeft: THEME.spacing.sm,
    flex: 1,
    fontWeight: '500',
  },
  progressValue: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.primary,
    fontWeight: 'bold',
  },
  viewProgressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.background,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: THEME.spacing.xs,
  },
  viewProgressText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  summerModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.warning + '20',
    borderWidth: 1,
    borderColor: THEME.colors.warning + '40',
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    gap: THEME.spacing.xs,
  },
  summerModeActive: {
    backgroundColor: THEME.colors.warning,
    borderColor: THEME.colors.warning,
  },
  summerModeText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.warning,
    fontWeight: '600',
  },
  summerModeTextActive: {
    color: '#fff',
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.xs,
    marginBottom: THEME.spacing.md,
  },
  filterTab: {
    flex: 1,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: THEME.colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  studyOptionSummer: {
    flex: 1,
    backgroundColor: THEME.colors.warning + '20',
    borderWidth: 1,
    borderColor: THEME.colors.warning + '40',
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  flashcardOverdue: {
    borderLeftWidth: 3,
    borderLeftColor: THEME.colors.error,
  },
  overdueIndicator: {
    position: 'absolute',
    top: THEME.spacing.xs,
    right: THEME.spacing.xs,
    backgroundColor: THEME.colors.error,
    borderRadius: THEME.borderRadius.sm,
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: 2,
  },
  overdueText: {
    fontSize: THEME.fontSize.xs,
    color: '#fff',
    fontWeight: 'bold',
  },
  flashcardSetCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    marginRight: THEME.spacing.sm,
    width: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 3,
    borderLeftColor: THEME.colors.warning,
  },
  flashcardSetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  overdueSetIndicator: {
    backgroundColor: THEME.colors.warning,
    borderRadius: THEME.borderRadius.sm,
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: 2,
  },
  overdueSetText: {
    fontSize: THEME.fontSize.xs,
    color: '#fff',
    fontWeight: 'bold',
  },
  flashcardSetName: {
    fontSize: THEME.fontSize.md,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.xs,
    lineHeight: 18,
  },
  flashcardSetDescription: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.sm,
    lineHeight: 16,
  },
  flashcardSetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: THEME.spacing.sm,
  },
  flashcardSetCount: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.primary,
    fontWeight: '600',
  },
  flashcardSetFrequency: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.textSecondary,
    fontStyle: 'italic',
  },
  flashcardSetPreview: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginRight: THEME.spacing.sm,
    width: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  flashcardSetDue: {
    borderLeftWidth: 3,
    borderLeftColor: THEME.colors.warning,
  },
  flashcardSetPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.xs,
  },
  dueIndicator: {
    backgroundColor: THEME.colors.warning,
    borderRadius: THEME.borderRadius.sm,
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: 1,
  },
  dueText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  flashcardSetPreviewName: {
    fontSize: THEME.fontSize.sm,
    fontWeight: '600',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.xs,
    lineHeight: 16,
  },
  flashcardSetPreviewMeta: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.primary,
    fontWeight: '600',
    marginBottom: THEME.spacing.xs,
  },
  flashcardSetPreviewFrequency: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.xs,
  },
  flashcardSetPreviewDate: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.textSecondary,
    fontStyle: 'italic',
  },
});