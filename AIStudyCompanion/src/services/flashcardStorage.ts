import AsyncStorage from '@react-native-async-storage/async-storage';
import { Flashcard } from '../types';
import { STORAGE_KEYS } from '../constants';

class FlashcardStorage {
  private flashcards: Map<string, Flashcard[]> = new Map();

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
}

export default new FlashcardStorage();