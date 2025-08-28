import { SPACED_REPETITION } from '../constants';

export interface StudyResult {
  cardId: string;
  quality: number; // 0-5 rating
  responseTime?: number; // milliseconds
  studiedAt: Date;
}

export interface FlashcardMemoryData {
  cardId: string;
  interval: number; // days until next review
  easeFactor: number; // how easy the card is (1.3 - 2.5)
  repetitions: number; // number of successful recalls in a row
  nextReviewDate: Date;
  lastReviewDate: Date;
  totalReviews: number;
  averageQuality: number;
  streak: number; // current correct answers in a row
  created: Date;
  updated: Date;
}

export interface StudySession {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  cardsStudied: string[];
  results: StudyResult[];
  totalCards: number;
  correctCards: number;
  averageResponseTime?: number;
  sessionDuration?: number; // milliseconds
}

class SpacedRepetitionService {
  // Calculate next review using SM-2 algorithm
  calculateNextReview(
    currentData: FlashcardMemoryData, 
    quality: number
  ): FlashcardMemoryData {
    const { 
      MIN_EASE_FACTOR, 
      MAX_EASE_FACTOR, 
      EASE_FACTOR_CHANGE,
      MIN_INTERVAL,
      MAX_INTERVAL 
    } = SPACED_REPETITION;

    let newInterval = currentData.interval;
    let newEaseFactor = currentData.easeFactor;
    let newRepetitions = currentData.repetitions;
    let newStreak = currentData.streak;

    // SM-2 Algorithm Implementation
    if (quality >= 3) {
      // Correct answer
      newStreak = currentData.streak + 1;
      
      if (newRepetitions === 0) {
        newInterval = 1;
      } else if (newRepetitions === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(currentData.interval * newEaseFactor);
      }
      
      newRepetitions = currentData.repetitions + 1;
    } else {
      // Incorrect answer - reset repetitions and set short interval
      newRepetitions = 0;
      newInterval = 1;
      newStreak = 0;
    }

    // Adjust ease factor based on quality
    newEaseFactor = newEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    
    // Ensure ease factor stays within bounds
    if (newEaseFactor < MIN_EASE_FACTOR) {
      newEaseFactor = MIN_EASE_FACTOR;
    }
    if (newEaseFactor > MAX_EASE_FACTOR) {
      newEaseFactor = MAX_EASE_FACTOR;
    }

    // Ensure interval stays within bounds
    if (newInterval < MIN_INTERVAL) {
      newInterval = MIN_INTERVAL;
    }
    if (newInterval > MAX_INTERVAL) {
      newInterval = MAX_INTERVAL;
    }

    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

    // Update average quality
    const totalQualityPoints = (currentData.averageQuality * currentData.totalReviews) + quality;
    const newTotalReviews = currentData.totalReviews + 1;
    const newAverageQuality = totalQualityPoints / newTotalReviews;

    return {
      ...currentData,
      interval: newInterval,
      easeFactor: newEaseFactor,
      repetitions: newRepetitions,
      nextReviewDate,
      lastReviewDate: new Date(),
      totalReviews: newTotalReviews,
      averageQuality: newAverageQuality,
      streak: newStreak,
      updated: new Date()
    };
  }

  // Initialize memory data for a new flashcard
  initializeCardMemory(cardId: string): FlashcardMemoryData {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    return {
      cardId,
      interval: SPACED_REPETITION.INITIAL_INTERVAL,
      easeFactor: SPACED_REPETITION.INITIAL_EASE_FACTOR,
      repetitions: 0,
      nextReviewDate: tomorrow,
      lastReviewDate: now,
      totalReviews: 0,
      averageQuality: 0,
      streak: 0,
      created: now,
      updated: now
    };
  }

  // Get cards that are due for review
  getCardsDueForReview(
    memoryData: FlashcardMemoryData[], 
    limit: number = 20
  ): FlashcardMemoryData[] {
    const now = new Date();
    
    return memoryData
      .filter(card => card.nextReviewDate <= now)
      .sort((a, b) => {
        // Prioritize by: 1) Overdue time, 2) Lower ease factor (harder cards first)
        const aOverdue = now.getTime() - a.nextReviewDate.getTime();
        const bOverdue = now.getTime() - b.nextReviewDate.getTime();
        
        if (aOverdue !== bOverdue) {
          return bOverdue - aOverdue; // More overdue first
        }
        
        return a.easeFactor - b.easeFactor; // Harder cards first
      })
      .slice(0, limit);
  }

  // Get new cards to introduce
  getNewCards(
    allCards: string[], 
    memoryData: FlashcardMemoryData[], 
    limit: number = 5
  ): string[] {
    const studiedCardIds = new Set(memoryData.map(m => m.cardId));
    
    return allCards
      .filter(cardId => !studiedCardIds.has(cardId))
      .slice(0, limit);
  }

  // Create study session with optimal card selection
  createStudySession(
    allCards: string[],
    memoryData: FlashcardMemoryData[],
    options: {
      maxCards?: number;
      newCardLimit?: number;
      reviewCardLimit?: number;
      includeNewCards?: boolean;
    } = {}
  ): {
    sessionCards: string[];
    newCards: string[];
    reviewCards: string[];
    sessionId: string;
  } {
    const {
      maxCards = 20,
      newCardLimit = 5,
      reviewCardLimit = 15,
      includeNewCards = true
    } = options;

    const reviewCards = this.getCardsDueForReview(memoryData, reviewCardLimit)
      .map(m => m.cardId);
    
    const newCards = includeNewCards 
      ? this.getNewCards(allCards, memoryData, newCardLimit)
      : [];

    const sessionCards = [...reviewCards, ...newCards].slice(0, maxCards);
    
    // Shuffle cards for better learning
    this.shuffleArray(sessionCards);

    return {
      sessionCards,
      newCards,
      reviewCards,
      sessionId: this.generateSessionId()
    };
  }

  // Process study result and update memory
  processStudyResult(
    result: StudyResult,
    currentMemoryData: FlashcardMemoryData[]
  ): FlashcardMemoryData[] {
    const cardMemory = currentMemoryData.find(m => m.cardId === result.cardId);
    
    if (!cardMemory) {
      // New card - initialize memory
      const newMemory = this.initializeCardMemory(result.cardId);
      const updatedMemory = this.calculateNextReview(newMemory, result.quality);
      return [...currentMemoryData, updatedMemory];
    } else {
      // Update existing card memory
      const updatedMemory = this.calculateNextReview(cardMemory, result.quality);
      return currentMemoryData.map(m => 
        m.cardId === result.cardId ? updatedMemory : m
      );
    }
  }

  // Get study statistics
  getStudyStats(memoryData: FlashcardMemoryData[]): {
    totalCards: number;
    dueToday: number;
    newCards: number;
    learning: number; // cards with interval < 21 days
    mature: number; // cards with interval >= 21 days
    averageEaseFactor: number;
    averageInterval: number;
    longestStreak: number;
  } {
    const now = new Date();
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const dueToday = memoryData.filter(m => m.nextReviewDate <= todayEnd).length;
    const learning = memoryData.filter(m => m.interval < 21).length;
    const mature = memoryData.filter(m => m.interval >= 21).length;
    
    const avgEaseFactor = memoryData.length > 0 
      ? memoryData.reduce((sum, m) => sum + m.easeFactor, 0) / memoryData.length 
      : 0;
    
    const avgInterval = memoryData.length > 0
      ? memoryData.reduce((sum, m) => sum + m.interval, 0) / memoryData.length
      : 0;
    
    const longestStreak = memoryData.length > 0
      ? Math.max(...memoryData.map(m => m.streak))
      : 0;

    return {
      totalCards: memoryData.length,
      dueToday,
      newCards: 0, // Would need to be calculated based on available cards
      learning,
      mature,
      averageEaseFactor: Number(avgEaseFactor.toFixed(2)),
      averageInterval: Number(avgInterval.toFixed(1)),
      longestStreak
    };
  }

  // Utility functions
  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Quality rating helpers
  getQualityRating(rating: keyof typeof SPACED_REPETITION.QUALITY_RATINGS): number {
    return SPACED_REPETITION.QUALITY_RATINGS[rating];
  }

  getQualityDescription(quality: number): string {
    const ratings = SPACED_REPETITION.QUALITY_RATINGS;
    switch (quality) {
      case ratings.BLACKOUT: return "Complete blackout - no memory";
      case ratings.INCORRECT: return "Incorrect, but correct answer remembered";
      case ratings.INCORRECT_EASY: return "Incorrect, but correct answer seemed easy";
      case ratings.CORRECT_HARD: return "Correct with serious difficulty";
      case ratings.CORRECT_HESITANT: return "Correct after hesitation";
      case ratings.CORRECT_EASY: return "Perfect response";
      default: return "Unknown rating";
    }
  }

  // Advanced features for AI coaching integration
  getStruggleCards(memoryData: FlashcardMemoryData[], limit: number = 10): FlashcardMemoryData[] {
    return memoryData
      .filter(m => m.averageQuality < 3 && m.totalReviews >= 3)
      .sort((a, b) => a.averageQuality - b.averageQuality)
      .slice(0, limit);
  }

  getMasteredCards(memoryData: FlashcardMemoryData[], limit: number = 10): FlashcardMemoryData[] {
    return memoryData
      .filter(m => m.averageQuality >= 4.5 && m.interval >= 30)
      .sort((a, b) => b.interval - a.interval)
      .slice(0, limit);
  }

  getRecentPerformance(memoryData: FlashcardMemoryData[], days: number = 7): {
    averageQuality: number;
    cardsStudied: number;
    streakTrend: 'improving' | 'stable' | 'declining';
  } {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - days);
    
    const recentCards = memoryData.filter(m => m.lastReviewDate >= recentDate);
    
    if (recentCards.length === 0) {
      return { averageQuality: 0, cardsStudied: 0, streakTrend: 'stable' };
    }

    const avgQuality = recentCards.reduce((sum, m) => sum + m.averageQuality, 0) / recentCards.length;
    
    // Simple trend analysis based on recent streaks
    const avgStreak = recentCards.reduce((sum, m) => sum + m.streak, 0) / recentCards.length;
    const overallAvgStreak = memoryData.reduce((sum, m) => sum + m.streak, 0) / memoryData.length;
    
    let streakTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (avgStreak > overallAvgStreak * 1.1) streakTrend = 'improving';
    else if (avgStreak < overallAvgStreak * 0.9) streakTrend = 'declining';

    return {
      averageQuality: Number(avgQuality.toFixed(2)),
      cardsStudied: recentCards.length,
      streakTrend
    };
  }
}

export default new SpacedRepetitionService();