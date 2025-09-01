// Preferences Store - Zustand store for study preferences and custom instructions
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { 
  StudyPreferences, 
  defaultPreferences, 
  validatePreferences,
  migratePreferences,
  VersionedPreferences,
  PREFERENCES_VERSION
} from '../models/preferences';

interface PreferencesState {
  preferences: StudyPreferences;
  isLoading: boolean;
  error: string | null;
  isDirty: boolean; // Track if preferences have unsaved changes
}

interface PreferencesActions {
  updatePreferences: (updates: Partial<StudyPreferences>) => void;
  resetPreferences: () => void;
  validateAndUpdate: (updates: Partial<StudyPreferences>) => string[];
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  markClean: () => void;
  
  // Selectors for common use cases
  getPromptContext: () => string;
  getCurrentDifficulty: () => number;
  getQuizSettings: () => { numQuestions: number; types: string[] };
}

type PreferencesStore = PreferencesState & PreferencesActions;

// Custom storage adapter for sensitive data (custom instructions)
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch (error) {
      console.warn('SecureStore not available, falling back to AsyncStorage:', error);
      return await AsyncStorage.getItem(name);
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (error) {
      console.warn('SecureStore not available, falling back to AsyncStorage:', error);
      await AsyncStorage.setItem(name, value);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch (error) {
      console.warn('SecureStore not available, falling back to AsyncStorage:', error);
      await AsyncStorage.removeItem(name);
    }
  },
};

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set, get) => ({
      // Initial state
      preferences: { ...defaultPreferences },
      isLoading: false,
      error: null,
      isDirty: false,

      // Actions
      updatePreferences: (updates) => {
        const current = get().preferences;
        const newPreferences = { ...current, ...updates };
        
        // Validate updates
        const errors = validatePreferences(updates);
        if (errors.length > 0) {
          set({ error: errors[0] });
          return;
        }
        
        set({ 
          preferences: newPreferences, 
          isDirty: true,
          error: null 
        });
      },

      resetPreferences: () => {
        set({ 
          preferences: { ...defaultPreferences },
          isDirty: true,
          error: null
        });
      },

      validateAndUpdate: (updates) => {
        const errors = validatePreferences(updates);
        if (errors.length === 0) {
          get().updatePreferences(updates);
        } else {
          set({ error: errors[0] });
        }
        return errors;
      },

      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
      
      markClean: () => set({ isDirty: false }),

      // Selectors
      getPromptContext: () => {
        const prefs = get().preferences;
        
        // Build a summary of user preferences for LLM context
        const context = [
          `Reading level: ${prefs.readingLevel}`,
          `Tone: ${prefs.tone}`,
          `Difficulty level: ${prefs.difficulty}/5`,
          `Preferred study mode: ${prefs.studyMode}`,
          `Session length: ${prefs.timePerSessionMins} minutes`,
          prefs.allowHints ? 'Provide hints when needed' : 'No hints',
          prefs.includeExplanations ? 'Include detailed explanations' : 'Brief responses only',
        ];
        
        if (prefs.customInstructions.trim()) {
          context.push(`Custom instructions: ${prefs.customInstructions}`);
        }
        
        return context.join('. ');
      },

      getCurrentDifficulty: () => get().preferences.difficulty,

      getQuizSettings: () => ({
        numQuestions: get().preferences.quizConfig.numQuestions,
        types: get().preferences.quizConfig.types,
      }),
    }),
    {
      name: 'study-preferences',
      storage: createJSONStorage(() => secureStorage),
      
      // Custom serializer to handle versioning
      serialize: (state) => {
        const versionedState: VersionedPreferences = {
          version: PREFERENCES_VERSION,
          preferences: state.preferences,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return JSON.stringify(versionedState);
      },
      
      deserialize: (str) => {
        try {
          const stored = JSON.parse(str);
          const migratedPreferences = migratePreferences(stored);
          
          return {
            preferences: migratedPreferences,
            isLoading: false,
            error: null,
            isDirty: false,
          };
        } catch (error) {
          console.error('Failed to deserialize preferences:', error);
          return {
            preferences: { ...defaultPreferences },
            isLoading: false,
            error: 'Failed to load saved preferences',
            isDirty: false,
          };
        }
      },
      
      // Only persist the preferences, not the UI state
      partialize: (state) => ({
        preferences: state.preferences,
      }),
      
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
          state.isDirty = false;
        }
      },
    }
  )
);

// Selectors for external use (with proper typing)
export const selectPreferences = (state: PreferencesStore) => state.preferences;
export const selectIsLoading = (state: PreferencesStore) => state.isLoading;
export const selectError = (state: PreferencesStore) => state.error;
export const selectIsDirty = (state: PreferencesStore) => state.isDirty;
export const selectPromptContext = (state: PreferencesStore) => state.getPromptContext();
export const selectDifficulty = (state: PreferencesStore) => state.getCurrentDifficulty();
export const selectQuizSettings = (state: PreferencesStore) => state.getQuizSettings();

// Hook for accessing preferences in a type-safe way
export const usePreferences = () => {
  const preferences = usePreferencesStore(selectPreferences);
  const updatePreferences = usePreferencesStore((state) => state.updatePreferences);
  const resetPreferences = usePreferencesStore((state) => state.resetPreferences);
  const validateAndUpdate = usePreferencesStore((state) => state.validateAndUpdate);
  const isLoading = usePreferencesStore(selectIsLoading);
  const error = usePreferencesStore(selectError);
  const isDirty = usePreferencesStore(selectIsDirty);
  
  return {
    preferences,
    updatePreferences,
    resetPreferences,
    validateAndUpdate,
    isLoading,
    error,
    isDirty,
  };
};

// Hook for accessing prompt context (for LLM integration)
export const usePromptContext = () => {
  return usePreferencesStore(selectPromptContext);
};

export default usePreferencesStore;