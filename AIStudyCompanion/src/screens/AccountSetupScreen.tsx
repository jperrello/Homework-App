import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ROUTES, THEME } from '../constants';
import { UserPreferences } from '../types';
import { useAuth } from '../contexts/AuthContext';

type AccountSetupNavigationProp = StackNavigationProp<RootStackParamList, typeof ROUTES.ACCOUNT_SETUP>;

interface SetupStep {
  id: string;
  title: string;
  subtitle: string;
  component: React.ComponentType<StepProps>;
}

interface StepProps {
  preferences: Partial<UserPreferences>;
  onUpdate: (updates: Partial<UserPreferences>) => void;
  onNext: () => void;
  onBack: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

// Step 1: Academic Interests
function AcademicInterestsStep({ preferences, onUpdate, onNext, onBack, isFirstStep }: StepProps) {
  const commonSubjects = [
    'Mathematics', 'Science', 'History', 'Literature', 'Art', 'Music',
    'Computer Science', 'Psychology', 'Business', 'Philosophy', 'Languages',
    'Engineering', 'Biology', 'Chemistry', 'Physics', 'Economics'
  ];

  const toggleSubject = (subject: string, type: 'favorite' | 'difficult') => {
    const key = type === 'favorite' ? 'favorite_subjects' : 'difficult_subjects';
    const current = preferences[key] || [];
    const updated = current.includes(subject)
      ? current.filter(s => s !== subject)
      : [...current, subject];
    onUpdate({ [key]: updated });
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.questionText}>What subjects do you enjoy studying?</Text>
      <Text style={styles.subText}>Select all that apply</Text>
      <View style={styles.chipContainer}>
        {commonSubjects.map(subject => (
          <TouchableOpacity
            key={subject}
            style={[
              styles.chip,
              (preferences.favorite_subjects || []).includes(subject) && styles.chipSelected
            ]}
            onPress={() => toggleSubject(subject, 'favorite')}
          >
            <Text style={[
              styles.chipText,
              (preferences.favorite_subjects || []).includes(subject) && styles.chipTextSelected
            ]}>
              {subject}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.questionText, { marginTop: 32 }]}>
        Which subjects do you find most challenging?
      </Text>
      <Text style={styles.subText}>This helps us provide better support</Text>
      <View style={styles.chipContainer}>
        {commonSubjects.map(subject => (
          <TouchableOpacity
            key={subject}
            style={[
              styles.chip,
              styles.chipDifficult,
              (preferences.difficult_subjects || []).includes(subject) && styles.chipDifficultSelected
            ]}
            onPress={() => toggleSubject(subject, 'difficult')}
          >
            <Text style={[
              styles.chipText,
              (preferences.difficult_subjects || []).includes(subject) && styles.chipTextSelected
            ]}>
              {subject}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.stepButtons}>
        <TouchableOpacity style={styles.nextButton} onPress={onNext}>
          <Text style={styles.nextButtonText}>Next</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Step 2: Study Schedule
function StudyScheduleStep({ preferences, onUpdate, onNext, onBack }: StepProps) {
  const timeOptions = [
    { key: 'morning', label: 'Morning (6AM - 12PM)', icon: 'sunny' },
    { key: 'afternoon', label: 'Afternoon (12PM - 6PM)', icon: 'partly-sunny' },
    { key: 'evening', label: 'Evening (6PM - 10PM)', icon: 'moon' },
    { key: 'night', label: 'Night (10PM - 6AM)', icon: 'moon-outline' },
  ];

  const durationOptions = [15, 30, 45, 60, 90, 120];

  const toggleTime = (timeKey: string) => {
    const current = preferences.preferred_study_times || [];
    const updated = current.includes(timeKey as any)
      ? current.filter(t => t !== timeKey)
      : [...current, timeKey as any];
    onUpdate({ preferred_study_times: updated });
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.questionText}>When do you prefer to study?</Text>
      <Text style={styles.subText}>Select your ideal study times</Text>
      <View style={styles.timeOptions}>
        {timeOptions.map(option => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.timeOption,
              (preferences.preferred_study_times || []).includes(option.key as any) && styles.timeOptionSelected
            ]}
            onPress={() => toggleTime(option.key)}
          >
            <Ionicons 
              name={option.icon as any} 
              size={24} 
              color={(preferences.preferred_study_times || []).includes(option.key as any) 
                ? THEME.colors.primary 
                : THEME.colors.textSecondary
              } 
            />
            <Text style={[
              styles.timeOptionText,
              (preferences.preferred_study_times || []).includes(option.key as any) && styles.timeOptionTextSelected
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.questionText, { marginTop: 32 }]}>
        How long can you typically focus in one session?
      </Text>
      <View style={styles.durationOptions}>
        {durationOptions.map(duration => (
          <TouchableOpacity
            key={duration}
            style={[
              styles.durationOption,
              preferences.optimal_study_duration === duration && styles.durationOptionSelected
            ]}
            onPress={() => onUpdate({ optimal_study_duration: duration })}
          >
            <Text style={[
              styles.durationText,
              preferences.optimal_study_duration === duration && styles.durationTextSelected
            ]}>
              {duration} min
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.stepButtons}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color={THEME.colors.textSecondary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={onNext}>
          <Text style={styles.nextButtonText}>Next</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Step 3: Personal Context
function PersonalContextStep({ preferences, onUpdate, onNext, onBack }: StepProps) {
  const [customHobby, setCustomHobby] = useState('');
  const [customGoal, setCustomGoal] = useState('');

  const commonHobbies = [
    'Reading', 'Sports', 'Music', 'Gaming', 'Cooking', 'Travel',
    'Photography', 'Art', 'Technology', 'Fitness', 'Movies', 'Crafts'
  ];

  const careerFields = [
    'Healthcare', 'Technology', 'Education', 'Business', 'Engineering',
    'Arts & Design', 'Science & Research', 'Law', 'Finance', 'Media'
  ];

  const toggleItem = (item: string, type: 'hobbies' | 'career_goals') => {
    const current = preferences[type] || [];
    const updated = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
    onUpdate({ [type]: updated });
  };

  const addCustomItem = (item: string, type: 'hobbies' | 'career_goals', setter: (value: string) => void) => {
    if (item.trim()) {
      const current = preferences[type] || [];
      if (!current.includes(item.trim())) {
        onUpdate({ [type]: [...current, item.trim()] });
      }
      setter('');
    }
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.questionText}>What are your hobbies and interests?</Text>
      <Text style={styles.subText}>This helps us create more engaging study materials</Text>
      <View style={styles.chipContainer}>
        {commonHobbies.map(hobby => (
          <TouchableOpacity
            key={hobby}
            style={[
              styles.chip,
              (preferences.hobbies || []).includes(hobby) && styles.chipSelected
            ]}
            onPress={() => toggleItem(hobby, 'hobbies')}
          >
            <Text style={[
              styles.chipText,
              (preferences.hobbies || []).includes(hobby) && styles.chipTextSelected
            ]}>
              {hobby}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.customInput}>
        <TextInput
          style={styles.textInput}
          placeholder="Add your own hobby..."
          value={customHobby}
          onChangeText={setCustomHobby}
          onSubmitEditing={() => addCustomItem(customHobby, 'hobbies', setCustomHobby)}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => addCustomItem(customHobby, 'hobbies', setCustomHobby)}
        >
          <Ionicons name="add" size={20} color={THEME.colors.primary} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.questionText, { marginTop: 32 }]}>
        What are your career goals or interests?
      </Text>
      <Text style={styles.subText}>We'll relate study content to your professional interests</Text>
      <View style={styles.chipContainer}>
        {careerFields.map(field => (
          <TouchableOpacity
            key={field}
            style={[
              styles.chip,
              (preferences.career_goals || []).includes(field) && styles.chipSelected
            ]}
            onPress={() => toggleItem(field, 'career_goals')}
          >
            <Text style={[
              styles.chipText,
              (preferences.career_goals || []).includes(field) && styles.chipTextSelected
            ]}>
              {field}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.customInput}>
        <TextInput
          style={styles.textInput}
          placeholder="Add your career goal..."
          value={customGoal}
          onChangeText={setCustomGoal}
          onSubmitEditing={() => addCustomItem(customGoal, 'career_goals', setCustomGoal)}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => addCustomItem(customGoal, 'career_goals', setCustomGoal)}
        >
          <Ionicons name="add" size={20} color={THEME.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.stepButtons}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color={THEME.colors.textSecondary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={onNext}>
          <Text style={styles.nextButtonText}>Next</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Step 4: Learning Style
function LearningStyleStep({ preferences, onUpdate, onNext, onBack, isLastStep }: StepProps) {
  const learningStyles = [
    { key: 'visual', label: 'Visual', description: 'Learn best with charts, diagrams, and images', icon: 'eye' },
    { key: 'auditory', label: 'Auditory', description: 'Learn best by listening and discussing', icon: 'volume-high' },
    { key: 'kinesthetic', label: 'Kinesthetic', description: 'Learn best through hands-on activities', icon: 'hand-left' },
    { key: 'reading_writing', label: 'Reading/Writing', description: 'Learn best through written text and notes', icon: 'book' },
    { key: 'mixed', label: 'Mixed', description: 'Learn well through multiple approaches', icon: 'apps' },
  ];

  const contentFormats = [
    { key: 'flashcards', label: 'Flashcards', icon: 'layers' },
    { key: 'quizzes', label: 'Quizzes', icon: 'help-circle' },
    { key: 'summaries', label: 'Summaries', icon: 'document-text' },
    { key: 'videos', label: 'Videos', icon: 'play-circle' },
    { key: 'audio', label: 'Audio', icon: 'headset' },
    { key: 'interactive', label: 'Interactive', icon: 'game-controller' },
  ];

  const toggleContentFormat = (format: string) => {
    const current = preferences.content_format_preference || [];
    const updated = current.includes(format as any)
      ? current.filter(f => f !== format)
      : [...current, format as any];
    onUpdate({ content_format_preference: updated });
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.questionText}>What's your preferred learning style?</Text>
      <Text style={styles.subText}>Choose the one that best describes how you learn</Text>
      <View style={styles.learningStyles}>
        {learningStyles.map(style => (
          <TouchableOpacity
            key={style.key}
            style={[
              styles.learningStyleOption,
              preferences.preferred_learning_style === style.key && styles.learningStyleSelected
            ]}
            onPress={() => onUpdate({ preferred_learning_style: style.key as any })}
          >
            <Ionicons 
              name={style.icon as any} 
              size={24} 
              color={preferences.preferred_learning_style === style.key 
                ? THEME.colors.primary 
                : THEME.colors.textSecondary
              } 
            />
            <View style={styles.learningStyleText}>
              <Text style={[
                styles.learningStyleLabel,
                preferences.preferred_learning_style === style.key && styles.learningStyleLabelSelected
              ]}>
                {style.label}
              </Text>
              <Text style={styles.learningStyleDescription}>
                {style.description}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.questionText, { marginTop: 32 }]}>
        Which content formats do you prefer?
      </Text>
      <Text style={styles.subText}>Select all that you find helpful</Text>
      <View style={styles.contentFormats}>
        {contentFormats.map(format => (
          <TouchableOpacity
            key={format.key}
            style={[
              styles.contentFormatChip,
              (preferences.content_format_preference || []).includes(format.key as any) && styles.contentFormatSelected
            ]}
            onPress={() => toggleContentFormat(format.key)}
          >
            <Ionicons 
              name={format.icon as any} 
              size={20} 
              color={(preferences.content_format_preference || []).includes(format.key as any) 
                ? '#fff' 
                : THEME.colors.textSecondary
              } 
            />
            <Text style={[
              styles.contentFormatText,
              (preferences.content_format_preference || []).includes(format.key as any) && styles.contentFormatTextSelected
            ]}>
              {format.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.stepButtons}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color={THEME.colors.textSecondary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.finishButton} onPress={onNext}>
          <Text style={styles.finishButtonText}>Complete Setup</Text>
          <Ionicons name="checkmark" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AccountSetupScreen() {
  const navigation = useNavigation<AccountSetupNavigationProp>();
  const { completeSetup } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<Partial<UserPreferences>>({
    favorite_subjects: [],
    difficult_subjects: [],
    preferred_study_times: [],
    optimal_study_duration: 30,
    hobbies: [],
    career_goals: [],
    preferred_learning_style: 'mixed',
    content_format_preference: ['flashcards', 'quizzes'],
    explanation_style: 'detailed',
    difficulty_preference: 'gradual',
    feedback_frequency: 'after_session',
    encouragement_level: 'moderate',
    progress_tracking: 'summary',
  });

  const steps: SetupStep[] = [
    {
      id: 'academic',
      title: 'Academic Interests',
      subtitle: 'Tell us about your favorite subjects',
      component: AcademicInterestsStep,
    },
    {
      id: 'schedule',
      title: 'Study Schedule',
      subtitle: 'When and how long do you like to study?',
      component: StudyScheduleStep,
    },
    {
      id: 'personal',
      title: 'Personal Context',
      subtitle: 'Share your interests and goals',
      component: PersonalContextStep,
    },
    {
      id: 'learning',
      title: 'Learning Style',
      subtitle: 'How do you learn best?',
      component: LearningStyleStep,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Save preferences to AsyncStorage
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('user_preferences', JSON.stringify(preferences));
      
      Alert.alert(
        'Setup Complete!',
        'Your preferences have been saved. You can always change them later in settings.',
        [
          {
            text: 'Get Started',
            onPress: async () => {
              // Complete the setup process, which will trigger navigation to MainApp
              await completeSetup();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    }
  };

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Account Setup</Text>
          <Text style={styles.stepIndicator}>
            {currentStep + 1} of {steps.length}
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((currentStep + 1) / steps.length) * 100}%` }]} />
        </View>
        <Text style={styles.stepTitle}>{steps[currentStep].title}</Text>
        <Text style={styles.stepSubtitle}>{steps[currentStep].subtitle}</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        <CurrentStepComponent
          preferences={preferences}
          onUpdate={updatePreferences}
          onNext={handleNext}
          onBack={handleBack}
          isFirstStep={currentStep === 0}
          isLastStep={currentStep === steps.length - 1}
        />
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
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  headerTitle: {
    fontSize: THEME.fontSize.xl,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepIndicator: {
    fontSize: THEME.fontSize.md,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: THEME.spacing.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  stepTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: THEME.spacing.xs,
  },
  stepSubtitle: {
    fontSize: THEME.fontSize.md,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: THEME.spacing.lg,
  },
  questionText: {
    fontSize: THEME.fontSize.lg,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.sm,
  },
  subText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.lg,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.sm,
  },
  chip: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.lg,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  chipSelected: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  chipDifficult: {
    borderColor: THEME.colors.warning,
  },
  chipDifficultSelected: {
    backgroundColor: THEME.colors.warning,
    borderColor: THEME.colors.warning,
  },
  chipText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text,
  },
  chipTextSelected: {
    color: '#fff',
  },
  timeOptions: {
    gap: THEME.spacing.sm,
  },
  timeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  timeOptionSelected: {
    borderColor: THEME.colors.primary,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  timeOptionText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text,
    marginLeft: THEME.spacing.md,
  },
  timeOptionTextSelected: {
    color: THEME.colors.primary,
    fontWeight: '600',
  },
  durationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.sm,
  },
  durationOption: {
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  durationOptionSelected: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  durationText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text,
  },
  durationTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  customInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  textInput: {
    flex: 1,
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    fontSize: THEME.fontSize.md,
  },
  addButton: {
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.primary,
  },
  learningStyles: {
    gap: THEME.spacing.sm,
  },
  learningStyleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  learningStyleSelected: {
    borderColor: THEME.colors.primary,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  learningStyleText: {
    marginLeft: THEME.spacing.md,
    flex: 1,
  },
  learningStyleLabel: {
    fontSize: THEME.fontSize.md,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  learningStyleLabelSelected: {
    color: THEME.colors.primary,
  },
  learningStyleDescription: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  contentFormats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.sm,
  },
  contentFormatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.lg,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  contentFormatSelected: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  contentFormatText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text,
    marginLeft: THEME.spacing.xs,
  },
  contentFormatTextSelected: {
    color: '#fff',
  },
  stepButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: THEME.spacing.xl,
    paddingTop: THEME.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
  },
  backButtonText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.textSecondary,
    marginLeft: THEME.spacing.xs,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
  },
  nextButtonText: {
    fontSize: THEME.fontSize.md,
    color: '#fff',
    fontWeight: '600',
    marginRight: THEME.spacing.xs,
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.success,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
  },
  finishButtonText: {
    fontSize: THEME.fontSize.md,
    color: '#fff',
    fontWeight: '600',
    marginRight: THEME.spacing.xs,
  },
});