import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants';
import userPreferencesService, { CustomInstructions } from '../services/userPreferencesService';

interface OptionSelectorProps {
  title: string;
  subtitle?: string;
  value: string;
  options: { value: string; label: string }[];
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
              <Text style={[
                styles.optionItemText,
                value === option.value && styles.selectedOptionText
              ]}>
                {option.label}
              </Text>
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
            {value.length > 0 ? `${value.length} selected` : 'None selected'}
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

export default function CustomInstructionsScreen() {
  const [instructions, setInstructions] = useState<CustomInstructions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadInstructions();
  }, []);

  const loadInstructions = async () => {
    try {
      const loadedInstructions = await userPreferencesService.getCustomInstructions();
      setInstructions(loadedInstructions);
    } catch (error) {
      Alert.alert('Error', 'Failed to load custom instructions');
    } finally {
      setIsLoading(false);
    }
  };

  const saveInstructions = async () => {
    if (!instructions) return;
    
    setIsSaving(true);
    try {
      const success = await userPreferencesService.saveCustomInstructions(instructions);
      if (success) {
        Alert.alert('Success', 'Custom instructions saved successfully');
      } else {
        Alert.alert('Error', 'Failed to save custom instructions');
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
      'Are you sure you want to reset all custom instructions to their default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await userPreferencesService.resetCustomInstructions();
            loadInstructions();
          },
        },
      ]
    );
  };

  if (isLoading || !instructions) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const toneOptions = [
    { value: 'formal', label: 'Formal' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'casual', label: 'Casual' },
    { value: 'professional', label: 'Professional' },
  ];

  const detailOptions = [
    { value: 'minimal', label: 'Minimal' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'detailed', label: 'Detailed' },
    { value: 'comprehensive', label: 'Comprehensive' },
  ];

  const learningStyleOptions = [
    { value: 'visual', label: 'Visual' },
    { value: 'auditory', label: 'Auditory' },
    { value: 'kinesthetic', label: 'Kinesthetic' },
    { value: 'reading_writing', label: 'Reading/Writing' },
    { value: 'mixed', label: 'Mixed' },
  ];

  const difficultyOptions = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'adaptive', label: 'Adaptive' },
  ];

  const formatOptions = [
    { value: 'text_only', label: 'Text Only' },
    { value: 'bullet_points', label: 'Bullet Points' },
    { value: 'numbered_lists', label: 'Numbered Lists' },
    { value: 'mixed', label: 'Mixed' },
  ];

  const focusAreaOptions = [
    { value: 'key_concepts', label: 'Key Concepts' },
    { value: 'problem_solving', label: 'Problem Solving' },
    { value: 'memorization', label: 'Memorization' },
    { value: 'understanding', label: 'Understanding' },
    { value: 'application', label: 'Application' },
    { value: 'analysis', label: 'Analysis' },
    { value: 'synthesis', label: 'Synthesis' },
    { value: 'evaluation', label: 'Evaluation' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Communication Style</Text>
          
          <OptionSelector
            title="Tone"
            subtitle="How should AI respond to you?"
            value={instructions.tone}
            options={toneOptions}
            onSelect={(value) => setInstructions({...instructions, tone: value as any})}
          />

          <OptionSelector
            title="Detail Level"
            subtitle="How much detail do you want in responses?"
            value={instructions.detail_level}
            options={detailOptions}
            onSelect={(value) => setInstructions({...instructions, detail_level: value as any})}
          />

          <OptionSelector
            title="Learning Style"
            subtitle="What's your preferred learning approach?"
            value={instructions.learning_style}
            options={learningStyleOptions}
            onSelect={(value) => setInstructions({...instructions, learning_style: value as any})}
          />

          <OptionSelector
            title="Difficulty Level"
            subtitle="What difficulty level works best for you?"
            value={instructions.difficulty_preference}
            options={difficultyOptions}
            onSelect={(value) => setInstructions({...instructions, difficulty_preference: value as any})}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content Preferences</Text>
          
          <View style={styles.switchContainer}>
            <View style={styles.switchContent}>
              <Text style={styles.switchTitle}>Use Examples</Text>
              <Text style={styles.switchSubtitle}>Include examples in explanations</Text>
            </View>
            <Switch
              value={instructions.use_examples}
              onValueChange={(value) => setInstructions({...instructions, use_examples: value})}
              trackColor={{false: THEME.colors.border, true: THEME.colors.primary}}
            />
          </View>

          <View style={styles.switchContainer}>
            <View style={styles.switchContent}>
              <Text style={styles.switchTitle}>Use Analogies</Text>
              <Text style={styles.switchSubtitle}>Include analogies to explain concepts</Text>
            </View>
            <Switch
              value={instructions.use_analogies}
              onValueChange={(value) => setInstructions({...instructions, use_analogies: value})}
              trackColor={{false: THEME.colors.border, true: THEME.colors.primary}}
            />
          </View>

          <OptionSelector
            title="Response Format"
            subtitle="How should responses be structured?"
            value={instructions.format_preference}
            options={formatOptions}
            onSelect={(value) => setInstructions({...instructions, format_preference: value as any})}
          />

          <MultiSelect
            title="Focus Areas"
            subtitle="What areas should AI prioritize?"
            value={instructions.focus_areas}
            options={focusAreaOptions}
            onSelect={(values) => setInstructions({...instructions, focus_areas: values})}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Custom Instructions</Text>
          <Text style={styles.fieldLabel}>Additional Instructions</Text>
          <Text style={styles.fieldSubtitle}>
            Add any specific instructions for how you'd like AI to help you study
          </Text>
          <TextInput
            style={styles.textArea}
            value={instructions.custom_prompt}
            onChangeText={(value) => setInstructions({...instructions, custom_prompt: value})}
            placeholder="e.g., Always ask follow-up questions to check my understanding..."
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={saveInstructions}
            disabled={isSaving}
          >
            <Text style={styles.primaryButtonText}>
              {isSaving ? 'Saving...' : 'Save Instructions'}
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
  optionItemText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text,
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
  fieldLabel: {
    fontSize: THEME.fontSize.md,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.xs,
  },
  fieldSubtitle: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.md,
  },
  textArea: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text,
    minHeight: 120,
    borderWidth: 1,
    borderColor: THEME.colors.border,
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