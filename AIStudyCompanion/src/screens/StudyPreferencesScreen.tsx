import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { THEME } from '../constants';
import userPreferencesService, { StudyPreferences } from '../services/userPreferencesService';

interface NumberSelectorProps {
  title: string;
  subtitle?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onValueChange: (value: number) => void;
}

const NumberSelector: React.FC<NumberSelectorProps> = ({
  title,
  subtitle,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onValueChange,
}) => {
  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderTitle}>{title}</Text>
        {subtitle && <Text style={styles.sliderSubtitle}>{subtitle}</Text>}
        <Text style={styles.sliderValue}>
          {value} {unit}
        </Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        value={value}
        step={step}
        onValueChange={onValueChange}
        thumbStyle={{backgroundColor: THEME.colors.primary}}
        minimumTrackTintColor={THEME.colors.primary}
        maximumTrackTintColor={THEME.colors.border}
      />
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabel}>{min} {unit}</Text>
        <Text style={styles.sliderLabel}>{max} {unit}</Text>
      </View>
    </View>
  );
};

interface OptionSelectorProps {
  title: string;
  subtitle?: string;
  value: string;
  options: { value: string; label: string; description?: string }[];
  onSelect: (value: string) => void;
}

const OptionSelector: React.FC<OptionSelectorProps> = ({ title, subtitle, value, options, onSelect }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.optionContainer}>
      <TouchableOpacity 
        style={styles.optionHeader}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>{title}</Text>
          {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
          <Text style={styles.optionValue}>
            {options.find(opt => opt.value === value)?.label || value}
          </Text>
        </View>
        <Ionicons 
          name={expanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={THEME.colors.textSecondary} 
        />
      </TouchableOpacity>
      
      {expanded && (
        <View style={styles.optionsList}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionItem,
                value === option.value && styles.selectedOption
              ]}
              onPress={() => {
                onSelect(option.value);
                setExpanded(false);
              }}
            >
              <View style={styles.optionItemContent}>
                <Text style={[
                  styles.optionItemText,
                  value === option.value && styles.selectedOptionText
                ]}>
                  {option.label}
                </Text>
                {option.description && (
                  <Text style={styles.optionItemDescription}>
                    {option.description}
                  </Text>
                )}
              </View>
              {value === option.value && (
                <Ionicons name="checkmark" size={20} color={THEME.colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

interface MultiSelectProps {
  title: string;
  subtitle?: string;
  value: string[];
  options: { value: string; label: string }[];
  onSelect: (values: string[]) => void;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ title, subtitle, value, options, onSelect }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleOption = (optionValue: string) => {
    const newValues = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onSelect(newValues);
  };

  return (
    <View style={styles.optionContainer}>
      <TouchableOpacity 
        style={styles.optionHeader}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>{title}</Text>
          {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
          <Text style={styles.optionValue}>
            {value.length > 0 ? value.map(v => 
              options.find(opt => opt.value === v)?.label
            ).join(', ') : 'None selected'}
          </Text>
        </View>
        <Ionicons 
          name={expanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={THEME.colors.textSecondary} 
        />
      </TouchableOpacity>
      
      {expanded && (
        <View style={styles.optionsList}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={styles.optionItem}
              onPress={() => toggleOption(option.value)}
            >
              <Text style={styles.optionItemText}>{option.label}</Text>
              <View style={[
                styles.checkbox,
                value.includes(option.value) && styles.checkedBox
              ]}>
                {value.includes(option.value) && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

export default function StudyPreferencesScreen() {
  const [preferences, setPreferences] = useState<StudyPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const loadedPreferences = await userPreferencesService.getStudyPreferences();
      setPreferences(loadedPreferences);
    } catch (error) {
      Alert.alert('Error', 'Failed to load study preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;
    
    setIsSaving(true);
    try {
      const success = await userPreferencesService.saveStudyPreferences(preferences);
      if (success) {
        Alert.alert('Success', 'Study preferences saved successfully');
      } else {
        Alert.alert('Error', 'Failed to save study preferences');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset to Defaults',
      'Are you sure you want to reset all study preferences to their default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await userPreferencesService.resetStudyPreferences();
            loadPreferences();
          },
        },
      ]
    );
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime && preferences) {
      const timeString = selectedTime.toTimeString().substr(0, 5);
      setPreferences({
        ...preferences,
        study_reminder_time: timeString,
      });
    }
  };

  if (isLoading || !preferences) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const difficultyProgressionOptions = [
    { 
      value: 'gradual', 
      label: 'Gradual', 
      description: 'Slowly increase difficulty over time' 
    },
    { 
      value: 'adaptive', 
      label: 'Adaptive', 
      description: 'Automatically adjust based on performance' 
    },
    { 
      value: 'user_controlled', 
      label: 'Manual', 
      description: 'You control the difficulty level' 
    },
  ];

  const reviewFrequencyOptions = [
    { 
      value: 'daily', 
      label: 'Daily', 
      description: 'Review items every day' 
    },
    { 
      value: 'every_other_day', 
      label: 'Every Other Day', 
      description: 'Review items every 2 days' 
    },
    { 
      value: 'weekly', 
      label: 'Weekly', 
      description: 'Review items once per week' 
    },
    { 
      value: 'adaptive', 
      label: 'Adaptive', 
      description: 'Automatically adjust review timing' 
    },
  ];

  const studyTimeOptions = [
    { value: 'early_morning', label: 'Early Morning (6-8 AM)' },
    { value: 'morning', label: 'Morning (8-11 AM)' },
    { value: 'afternoon', label: 'Afternoon (1-5 PM)' },
    { value: 'evening', label: 'Evening (6-9 PM)' },
    { value: 'night', label: 'Night (9-11 PM)' },
  ];

  const reminderTime = new Date();
  const [hours, minutes] = preferences.study_reminder_time.split(':');
  reminderTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Goals</Text>
          
          <NumberSelector
            title="Daily Study Goal"
            subtitle="How many minutes do you want to study each day?"
            value={preferences.daily_goal_minutes}
            min={10}
            max={240}
            step={5}
            unit="minutes"
            onValueChange={(value) => setPreferences({...preferences, daily_goal_minutes: value})}
          />

          <NumberSelector
            title="Session Length"
            subtitle="How long should each study session be?"
            value={preferences.session_length_minutes}
            min={5}
            max={120}
            step={5}
            unit="minutes"
            onValueChange={(value) => setPreferences({...preferences, session_length_minutes: value})}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Study Sessions</Text>
          
          <NumberSelector
            title="Flashcards Per Session"
            subtitle="How many flashcards to review in one session"
            value={preferences.flashcards_per_session}
            min={5}
            max={100}
            step={5}
            unit="cards"
            onValueChange={(value) => setPreferences({...preferences, flashcards_per_session: value})}
          />

          <NumberSelector
            title="Quiz Questions Per Session"
            subtitle="How many quiz questions in one session"
            value={preferences.quiz_questions_per_session}
            min={5}
            max={50}
            step={5}
            unit="questions"
            onValueChange={(value) => setPreferences({...preferences, quiz_questions_per_session: value})}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Break Reminders</Text>
          
          <View style={styles.switchContainer}>
            <View style={styles.switchContent}>
              <Text style={styles.switchTitle}>Break Reminders</Text>
              <Text style={styles.switchSubtitle}>Get reminded to take breaks during long study sessions</Text>
            </View>
            <Switch
              value={preferences.break_reminders}
              onValueChange={(value) => setPreferences({...preferences, break_reminders: value})}
              trackColor={{false: THEME.colors.border, true: THEME.colors.primary}}
            />
          </View>

          {preferences.break_reminders && (
            <NumberSelector
              title="Break Interval"
              subtitle="How often to remind you to take a break"
              value={preferences.break_interval_minutes}
              min={10}
              max={60}
              step={5}
              unit="minutes"
              onValueChange={(value) => setPreferences({...preferences, break_interval_minutes: value})}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learning Progression</Text>
          
          <OptionSelector
            title="Difficulty Progression"
            subtitle="How should difficulty increase over time?"
            value={preferences.difficulty_progression}
            options={difficultyProgressionOptions}
            onSelect={(value) => setPreferences({...preferences, difficulty_progression: value as any})}
          />

          <OptionSelector
            title="Review Frequency"
            subtitle="How often should you review previously studied material?"
            value={preferences.review_frequency}
            options={reviewFrequencyOptions}
            onSelect={(value) => setPreferences({...preferences, review_frequency: value as any})}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications & Reminders</Text>
          
          <View style={styles.switchContainer}>
            <View style={styles.switchContent}>
              <Text style={styles.switchTitle}>Study Notifications</Text>
              <Text style={styles.switchSubtitle}>Receive notifications to study</Text>
            </View>
            <Switch
              value={preferences.notifications_enabled}
              onValueChange={(value) => setPreferences({...preferences, notifications_enabled: value})}
              trackColor={{false: THEME.colors.border, true: THEME.colors.primary}}
            />
          </View>

          {preferences.notifications_enabled && (
            <>
              <TouchableOpacity 
                style={styles.timePickerContainer}
                onPress={() => setShowTimePicker(true)}
              >
                <View style={styles.timePickerContent}>
                  <Text style={styles.timePickerTitle}>Study Reminder Time</Text>
                  <Text style={styles.timePickerSubtitle}>When do you want to be reminded to study?</Text>
                </View>
                <View style={styles.timeDisplay}>
                  <Text style={styles.timeText}>{preferences.study_reminder_time}</Text>
                  <Ionicons name="time" size={20} color={THEME.colors.primary} />
                </View>
              </TouchableOpacity>

              <MultiSelect
                title="Preferred Study Times"
                subtitle="When do you prefer to study?"
                value={preferences.preferred_study_times}
                options={studyTimeOptions}
                onSelect={(values) => setPreferences({...preferences, preferred_study_times: values})}
              />
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Motivation</Text>
          
          <View style={styles.switchContainer}>
            <View style={styles.switchContent}>
              <Text style={styles.switchTitle}>Motivation Messages</Text>
              <Text style={styles.switchSubtitle}>Receive encouraging messages during study sessions</Text>
            </View>
            <Switch
              value={preferences.motivation_messages}
              onValueChange={(value) => setPreferences({...preferences, motivation_messages: value})}
              trackColor={{false: THEME.colors.border, true: THEME.colors.primary}}
            />
          </View>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={savePreferences}
            disabled={isSaving}
          >
            <Text style={styles.primaryButtonText}>
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={resetToDefaults}
          >
            <Text style={styles.secondaryButtonText}>Reset to Defaults</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showTimePicker && (
        <DateTimePicker
          value={reminderTime}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={onTimeChange}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.lg,
  },
  sectionTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: 'bold',
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.md,
    textTransform: 'uppercase',
  },
  sliderContainer: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
  },
  sliderHeader: {
    marginBottom: THEME.spacing.md,
  },
  sliderTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.xs,
  },
  sliderSubtitle: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.sm,
  },
  sliderValue: {
    fontSize: THEME.fontSize.lg,
    color: THEME.colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: THEME.spacing.xs,
  },
  sliderLabel: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.textSecondary,
  },
  optionContainer: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    marginBottom: THEME.spacing.sm,
    overflow: 'hidden',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: THEME.spacing.md,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.xs,
  },
  optionSubtitle: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.xs,
  },
  optionValue: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.primary,
    fontWeight: '500',
  },
  optionsList: {
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  selectedOption: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  optionItemContent: {
    flex: 1,
  },
  optionItemText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text,
    marginBottom: THEME.spacing.xs,
  },
  optionItemDescription: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
  },
  selectedOptionText: {
    color: THEME.colors.primary,
    fontWeight: '500',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: THEME.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    marginBottom: THEME.spacing.sm,
  },
  switchContent: {
    flex: 1,
  },
  switchTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.xs,
  },
  switchSubtitle: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    marginBottom: THEME.spacing.sm,
  },
  timePickerContent: {
    flex: 1,
  },
  timePickerTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.xs,
  },
  timePickerSubtitle: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: THEME.fontSize.lg,
    color: THEME.colors.primary,
    fontWeight: 'bold',
    marginRight: THEME.spacing.sm,
  },
  actionSection: {
    padding: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xl,
  },
  button: {
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  primaryButton: {
    backgroundColor: THEME.colors.primary,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: THEME.fontSize.md,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  secondaryButtonText: {
    color: THEME.colors.text,
    fontSize: THEME.fontSize.md,
    fontWeight: '500',
  },
});