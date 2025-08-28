import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, DEFAULT_CUSTOM_INSTRUCTIONS, STUDY_SETTINGS } from '../constants';

export interface CustomInstructions {
  tone: 'formal' | 'friendly' | 'casual' | 'professional';
  detail_level: 'minimal' | 'moderate' | 'detailed' | 'comprehensive';
  use_examples: boolean;
  use_analogies: boolean;
  focus_areas: string[];
  language_preference: string;
  format_preference: 'text_only' | 'bullet_points' | 'numbered_lists' | 'mixed';
  learning_style: 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing' | 'mixed';
  difficulty_preference: 'beginner' | 'intermediate' | 'advanced' | 'adaptive';
  custom_prompt: string;
}

export interface StudyPreferences {
  daily_goal_minutes: number;
  session_length_minutes: number;
  break_reminders: boolean;
  break_interval_minutes: number;
  flashcards_per_session: number;
  quiz_questions_per_session: number;
  notifications_enabled: boolean;
  study_reminder_time: string;
  preferred_study_times: string[];
  difficulty_progression: 'gradual' | 'adaptive' | 'user_controlled';
  review_frequency: 'daily' | 'every_other_day' | 'weekly' | 'adaptive';
  motivation_messages: boolean;
}

class UserPreferencesService {
  private customInstructionsKey = `${STORAGE_KEYS.USER_DATA}_custom_instructions`;
  private studyPreferencesKey = `${STORAGE_KEYS.USER_DATA}_study_preferences`;

  async getCustomInstructions(): Promise<CustomInstructions> {
    try {
      const stored = await AsyncStorage.getItem(this.customInstructionsKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_CUSTOM_INSTRUCTIONS, ...parsed };
      }
      return {
        ...DEFAULT_CUSTOM_INSTRUCTIONS,
        learning_style: 'mixed',
        difficulty_preference: 'adaptive',
        custom_prompt: '',
      };
    } catch (error) {
      console.error('Error loading custom instructions:', error);
      return {
        ...DEFAULT_CUSTOM_INSTRUCTIONS,
        learning_style: 'mixed',
        difficulty_preference: 'adaptive',
        custom_prompt: '',
      };
    }
  }

  async saveCustomInstructions(instructions: CustomInstructions): Promise<boolean> {
    try {
      await AsyncStorage.setItem(this.customInstructionsKey, JSON.stringify(instructions));
      return true;
    } catch (error) {
      console.error('Error saving custom instructions:', error);
      return false;
    }
  }

  async getStudyPreferences(): Promise<StudyPreferences> {
    try {
      const stored = await AsyncStorage.getItem(this.studyPreferencesKey);
      if (stored) {
        return JSON.parse(stored);
      }
      return {
        daily_goal_minutes: STUDY_SETTINGS.DEFAULT_DAILY_GOAL,
        session_length_minutes: 25,
        break_reminders: true,
        break_interval_minutes: STUDY_SETTINGS.BREAK_REMINDER_INTERVAL,
        flashcards_per_session: STUDY_SETTINGS.DEFAULT_FLASHCARDS_PER_SESSION,
        quiz_questions_per_session: STUDY_SETTINGS.DEFAULT_QUIZ_QUESTIONS,
        notifications_enabled: true,
        study_reminder_time: '19:00',
        preferred_study_times: ['morning', 'evening'],
        difficulty_progression: 'adaptive',
        review_frequency: 'adaptive',
        motivation_messages: true,
      };
    } catch (error) {
      console.error('Error loading study preferences:', error);
      return {
        daily_goal_minutes: STUDY_SETTINGS.DEFAULT_DAILY_GOAL,
        session_length_minutes: 25,
        break_reminders: true,
        break_interval_minutes: STUDY_SETTINGS.BREAK_REMINDER_INTERVAL,
        flashcards_per_session: STUDY_SETTINGS.DEFAULT_FLASHCARDS_PER_SESSION,
        quiz_questions_per_session: STUDY_SETTINGS.DEFAULT_QUIZ_QUESTIONS,
        notifications_enabled: true,
        study_reminder_time: '19:00',
        preferred_study_times: ['morning', 'evening'],
        difficulty_progression: 'adaptive',
        review_frequency: 'adaptive',
        motivation_messages: true,
      };
    }
  }

  async saveStudyPreferences(preferences: StudyPreferences): Promise<boolean> {
    try {
      await AsyncStorage.setItem(this.studyPreferencesKey, JSON.stringify(preferences));
      return true;
    } catch (error) {
      console.error('Error saving study preferences:', error);
      return false;
    }
  }

  async resetCustomInstructions(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(this.customInstructionsKey);
      return true;
    } catch (error) {
      console.error('Error resetting custom instructions:', error);
      return false;
    }
  }

  async resetStudyPreferences(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(this.studyPreferencesKey);
      return true;
    } catch (error) {
      console.error('Error resetting study preferences:', error);
      return false;
    }
  }

  generateAIPromptFromInstructions(instructions: CustomInstructions): string {
    let prompt = `Please respond with the following preferences in mind:

Communication Style:
- Tone: ${instructions.tone}
- Detail level: ${instructions.detail_level}
- Learning style: ${instructions.learning_style}
- Difficulty level: ${instructions.difficulty_preference}

Content Preferences:
- ${instructions.use_examples ? 'Include' : 'Avoid'} examples
- ${instructions.use_analogies ? 'Include' : 'Avoid'} analogies
- Format: ${instructions.format_preference.replace('_', ' ')}
- Language: ${instructions.language_preference}

Focus Areas: ${instructions.focus_areas.join(', ')}`;

    if (instructions.custom_prompt.trim()) {
      prompt += `\n\nAdditional Instructions:\n${instructions.custom_prompt}`;
    }

    return prompt;
  }
}

export default new UserPreferencesService();