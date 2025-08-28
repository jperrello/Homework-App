import AsyncStorage from '@react-native-async-storage/async-storage';
import { Flashcard, FlashcardSet } from '../types';
import { STORAGE_KEYS } from '../constants';
import { FlashcardMemoryData, StudySession } from './spacedRepetitionService';

class FlashcardStorage {
  private flashcards: Map<string, Flashcard[]> = new Map();
  private flashcardSets: Map<string, FlashcardSet> = new Map();
  private memoryCache: FlashcardMemoryData[] | null = null;
  
  private readonly MEMORY_DATA_KEY = 'spaced_repetition_memory_data';
  private readonly STUDY_SESSIONS_KEY = 'study_sessions';
  private readonly FLASHCARD_SETS_KEY = 'flashcard_sets';

  async saveFlashcards(sessionId: string, flashcards: Flashcard[]): Promise<void> {
    try {
      this.flashcards.set(sessionId, flashcards);
      // Also save to persistent storage
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.FLASHCARDS}_${sessionId}`,
        JSON.stringify(flashcards)
      );
    } catch (error) {
      console.error('Error saving flashcards:', error);
    }
  }

  async getFlashcards(sessionId: string): Promise<Flashcard[]> {
    try {
      // First check memory cache
      if (this.flashcards.has(sessionId)) {
        return this.flashcards.get(sessionId)!;
      }

      // Then check persistent storage
      const stored = await AsyncStorage.getItem(`${STORAGE_KEYS.FLASHCARDS}_${sessionId}`);
      if (stored) {
        const flashcards = JSON.parse(stored) as Flashcard[];
        this.flashcards.set(sessionId, flashcards);
        return flashcards;
      }

      return [];
    } catch (error) {
      console.error('Error loading flashcards:', error);
      return [];
    }
  }

  async getFlashcardsByIds(flashcardIds: string[]): Promise<Flashcard[]> {
    try {
      const allFlashcards: Flashcard[] = [];
      
      // Search through all stored sessions
      for (const [sessionId, flashcards] of this.flashcards) {
        flashcards.forEach(flashcard => {
          if (flashcardIds.includes(flashcard.id)) {
            allFlashcards.push(flashcard);
          }
        });
      }

      // If not found in memory, search persistent storage
      if (allFlashcards.length === 0) {
        const keys = await AsyncStorage.getAllKeys();
        const flashcardKeys = keys.filter(key => key.startsWith(STORAGE_KEYS.FLASHCARDS));
        
        for (const key of flashcardKeys) {
          const stored = await AsyncStorage.getItem(key);
          if (stored) {
            const flashcards = JSON.parse(stored) as Flashcard[];
            flashcards.forEach(flashcard => {
              if (flashcardIds.includes(flashcard.id)) {
                allFlashcards.push(flashcard);
              }
            });
          }
        }
      }

      return allFlashcards;
    } catch (error) {
      console.error('Error loading flashcards by IDs:', error);
      return [];
    }
  }

  generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  clearSession(sessionId: string): void {
    this.flashcards.delete(sessionId);
    AsyncStorage.removeItem(`${STORAGE_KEYS.FLASHCARDS}_${sessionId}`);
  }

  // Memory data methods for spaced repetition
  async saveMemoryData(memoryData: FlashcardMemoryData[]): Promise<void> {
    try {
      this.memoryCache = memoryData;
      await AsyncStorage.setItem(
        this.MEMORY_DATA_KEY,
        JSON.stringify(memoryData.map(data => ({
          ...data,
          nextReviewDate: data.nextReviewDate.toISOString(),
          lastReviewDate: data.lastReviewDate.toISOString(),
          created: data.created.toISOString(),
          updated: data.updated.toISOString()
        })))
      );
    } catch (error) {
      console.error('Error saving memory data:', error);
    }
  }

  async getMemoryData(): Promise<FlashcardMemoryData[]> {
    try {
      // Return cached data if available
      if (this.memoryCache) {
        return this.memoryCache;
      }

      const stored = await AsyncStorage.getItem(this.MEMORY_DATA_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const memoryData: FlashcardMemoryData[] = parsed.map((data: any) => ({
          ...data,
          nextReviewDate: new Date(data.nextReviewDate),
          lastReviewDate: new Date(data.lastReviewDate),
          created: new Date(data.created),
          updated: new Date(data.updated)
        }));
        
        this.memoryCache = memoryData;
        return memoryData;
      }

      return [];
    } catch (error) {
      console.error('Error loading memory data:', error);
      return [];
    }
  }

  async clearMemoryData(): Promise<void> {
    try {
      this.memoryCache = null;
      await AsyncStorage.removeItem(this.MEMORY_DATA_KEY);
    } catch (error) {
      console.error('Error clearing memory data:', error);
    }
  }

  // Study session methods
  async saveStudySession(session: StudySession): Promise<void> {
    try {
      const existingSessions = await this.getStudySessions();
      const updatedSessions = existingSessions.filter(s => s.sessionId !== session.sessionId);
      updatedSessions.push({
        ...session,
        startTime: session.startTime.toISOString(),
        endTime: session.endTime?.toISOString(),
        results: session.results.map(result => ({
          ...result,
          studiedAt: result.studiedAt.toISOString()
        }))
      } as any);
      
      await AsyncStorage.setItem(
        this.STUDY_SESSIONS_KEY,
        JSON.stringify(updatedSessions)
      );
    } catch (error) {
      console.error('Error saving study session:', error);
    }
  }

  async getStudySessions(): Promise<StudySession[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STUDY_SESSIONS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((session: any) => ({
          ...session,
          startTime: new Date(session.startTime),
          endTime: session.endTime ? new Date(session.endTime) : undefined,
          results: session.results.map((result: any) => ({
            ...result,
            studiedAt: new Date(result.studiedAt)
          }))
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading study sessions:', error);
      return [];
    }
  }

  async getRecentSessions(limit: number = 10): Promise<StudySession[]> {
    const sessions = await this.getStudySessions();
    return sessions
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  async clearStudySessions(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STUDY_SESSIONS_KEY);
    } catch (error) {
      console.error('Error clearing study sessions:', error);
    }
  }

  // Flashcard Set methods
  async saveFlashcardSet(flashcardSet: FlashcardSet): Promise<void> {
    try {
      this.flashcardSets.set(flashcardSet.id, flashcardSet);
      const existingSets = await this.getFlashcardSets();
      const updatedSets = existingSets.filter(s => s.id !== flashcardSet.id);
      updatedSets.push({
        ...flashcardSet,
        created_at: flashcardSet.created_at.toISOString(),
        updated_at: flashcardSet.updated_at.toISOString(),
        next_practice_date: flashcardSet.next_practice_date.toISOString(),
        last_practiced: flashcardSet.last_practiced?.toISOString()
      } as any);
      
      await AsyncStorage.setItem(this.FLASHCARD_SETS_KEY, JSON.stringify(updatedSets));
    } catch (error) {
      console.error('Error saving flashcard set:', error);
    }
  }

  async getFlashcardSets(): Promise<FlashcardSet[]> {
    try {
      const stored = await AsyncStorage.getItem(this.FLASHCARD_SETS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((set: any) => ({
          ...set,
          created_at: new Date(set.created_at),
          updated_at: new Date(set.updated_at),
          next_practice_date: new Date(set.next_practice_date),
          last_practiced: set.last_practiced ? new Date(set.last_practiced) : undefined
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading flashcard sets:', error);
      return [];
    }
  }

  async getFlashcardSet(setId: string): Promise<FlashcardSet | null> {
    try {
      if (this.flashcardSets.has(setId)) {
        return this.flashcardSets.get(setId)!;
      }

      const sets = await this.getFlashcardSets();
      const set = sets.find(s => s.id === setId);
      if (set) {
        this.flashcardSets.set(setId, set);
        return set;
      }
      return null;
    } catch (error) {
      console.error('Error loading flashcard set:', error);
      return null;
    }
  }

  async deleteFlashcardSet(setId: string): Promise<void> {
    try {
      this.flashcardSets.delete(setId);
      const existingSets = await this.getFlashcardSets();
      const updatedSets = existingSets.filter(s => s.id !== setId);
      await AsyncStorage.setItem(this.FLASHCARD_SETS_KEY, JSON.stringify(updatedSets));
    } catch (error) {
      console.error('Error deleting flashcard set:', error);
    }
  }

  async updateFlashcardSetPracticeDate(setId: string, lastPracticed: Date, nextPracticeDate: Date): Promise<void> {
    try {
      const set = await this.getFlashcardSet(setId);
      if (set) {
        const updatedSet: FlashcardSet = {
          ...set,
          last_practiced: lastPracticed,
          next_practice_date: nextPracticeDate,
          updated_at: new Date()
        };
        await this.saveFlashcardSet(updatedSet);
      }
    } catch (error) {
      console.error('Error updating flashcard set practice date:', error);
    }
  }

  async getFlashcardSetsDueForPractice(): Promise<FlashcardSet[]> {
    try {
      const sets = await this.getFlashcardSets();
      const now = new Date();
      return sets.filter(set => set.is_active && set.next_practice_date <= now);
    } catch (error) {
      console.error('Error getting due flashcard sets:', error);
      return [];
    }
  }

  generateFlashcardSetId(): string {
    return `set_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  calculateNextPracticeDate(frequency: FlashcardSet['practice_frequency'], customDays?: number): Date {
    const now = new Date();
    const nextDate = new Date(now);
    
    switch (frequency) {
      case 'daily':
        nextDate.setDate(now.getDate() + 1);
        break;
      case 'every_2_days':
        nextDate.setDate(now.getDate() + 2);
        break;
      case 'weekly':
        nextDate.setDate(now.getDate() + 7);
        break;
      case 'bi_weekly':
        nextDate.setDate(now.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(now.getMonth() + 1);
        break;
      case 'custom':
        nextDate.setDate(now.getDate() + (customDays || 7));
        break;
      default:
        nextDate.setDate(now.getDate() + 7); // Default to weekly
    }
    
    return nextDate;
  }

  // Analytics methods
  async getStudyAnalytics(days: number = 30): Promise<{
    sessionsCount: number;
    totalCardsStudied: number;
    averageAccuracy: number;
    totalStudyTime: number;
    streakDays: number;
  }> {
    try {
      const sessions = await this.getStudySessions();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const recentSessions = sessions.filter(session => 
        session.startTime >= cutoffDate && session.endTime
      );

      if (recentSessions.length === 0) {
        return {
          sessionsCount: 0,
          totalCardsStudied: 0,
          averageAccuracy: 0,
          totalStudyTime: 0,
          streakDays: 0
        };
      }

      const totalCardsStudied = recentSessions.reduce((sum, session) => 
        sum + session.cardsStudied.length, 0
      );
      
      const totalCorrectCards = recentSessions.reduce((sum, session) => 
        sum + session.correctCards, 0
      );
      
      const totalStudyTime = recentSessions.reduce((sum, session) => 
        sum + (session.sessionDuration || 0), 0
      );
      
      const averageAccuracy = totalCardsStudied > 0 
        ? (totalCorrectCards / totalCardsStudied) * 100 
        : 0;

      // Calculate streak (simplified - consecutive days with sessions)
      const studyDates = new Set(
        recentSessions.map(session => 
          session.startTime.toDateString()
        )
      );
      
      let streakDays = 0;
      const today = new Date();
      for (let i = 0; i < days; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        if (studyDates.has(checkDate.toDateString())) {
          streakDays++;
        } else {
          break;
        }
      }

      return {
        sessionsCount: recentSessions.length,
        totalCardsStudied,
        averageAccuracy: Math.round(averageAccuracy),
        totalStudyTime: Math.round(totalStudyTime / 60000), // Convert to minutes
        streakDays
      };
    } catch (error) {
      console.error('Error calculating study analytics:', error);
      return {
        sessionsCount: 0,
        totalCardsStudied: 0,
        averageAccuracy: 0,
        totalStudyTime: 0,
        streakDays: 0
      };
    }
  }
}

export default new FlashcardStorage();