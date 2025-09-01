// Redesigned Custom Instructions Screen with progressive disclosure
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  Alert,
  Animated 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { 
  Screen, 
  Header, 
  Card, 
  Button, 
  Input, 
  Select, 
  Toggle,
  SelectOption 
} from '../components/ui';
import { theme } from '../theme';
import { resolveEmoji } from '../lib/emoji';
import { usePreferences } from '../store/preferencesStore';
import { buildPromptContext } from '../lib/prompt/buildContext';
import {
  getReadingLevelLabel,
  getToneLabel,
  getDifficultyLabel,
  getStudyModeLabel,
  getQuizTypeLabel,
  getSourceTypeLabel,
} from '../models/preferences';

interface SectionProps {
  title: string;
  emoji?: string;
  children: React.ReactNode;
  expanded?: boolean;
  onToggle?: () => void;
}

function Section({ title, emoji, children, expanded = true, onToggle }: SectionProps) {
  const [animation] = useState(new Animated.Value(expanded ? 1 : 0));

  useEffect(() => {
    Animated.timing(animation, {
      toValue: expanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [expanded]);

  return (
    <Card variant="cosmic" style={styles.section}>
      <Button
        title={title}
        emoji={emoji}
        variant="ghost"
        onPress={onToggle}
        icon={expanded ? 'chevron-up' : 'chevron-down'}
        iconPosition="right"
        style={styles.sectionHeader}
        textStyle={styles.sectionTitle}
      />
      
      {expanded && (
        <Animated.View style={{
          opacity: animation,
          maxHeight: animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1000],
          }),
        }}>
          <View style={styles.sectionContent}>
            {children}
          </View>
        </Animated.View>
      )}
    </Card>
  );
}

export default function NewCustomInstructionsScreen() {
  const navigation = useNavigation();
  const { preferences, updatePreferences, validateAndUpdate, error, isDirty } = usePreferences();
  
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    studyStyle: false,
    quizSettings: false,
    sources: false,
    languageTone: false,
    advanced: false,
  });
  
  const [previewContext, setPreviewContext] = useState('');

  // Update preview when preferences change
  useEffect(() => {
    const context = buildPromptContext(preferences);
    setPreviewContext(context.summary);
  }, [preferences]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSave = () => {
    if (isDirty) {
      Alert.alert(
        resolveEmoji('success') + ' Settings Saved!',
        'Your study preferences have been updated and will be applied to all AI assistants.',
        [{ text: 'Great!', style: 'default' }]
      );
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Preferences',
      'This will reset all your study preferences to defaults. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            // resetPreferences(); // This will be handled by the store
            Alert.alert('Reset Complete', 'All preferences have been reset to defaults.');
          }
        }
      ]
    );
  };

  // Option definitions
  const readingLevelOptions: SelectOption[] = [
    { 
      value: 'concise', 
      label: 'Concise', 
      description: 'Brief, to-the-point explanations',
      emoji: '⚡'
    },
    { 
      value: 'detailed', 
      label: 'Detailed', 
      description: 'Comprehensive explanations with examples',
      emoji: '📖'
    },
  ];

  const toneOptions: SelectOption[] = [
    { 
      value: 'neutral', 
      label: 'Neutral', 
      description: 'Formal, academic tone',
      emoji: '🎓'
    },
    { 
      value: 'friendly', 
      label: 'Friendly', 
      description: 'Conversational and encouraging',
      emoji: '😊'
    },
    { 
      value: 'challenging', 
      label: 'Challenging', 
      description: 'Direct, focused on mastery',
      emoji: '💪'
    },
  ];

  const difficultyOptions: SelectOption[] = [
    { value: '1', label: 'Beginner', description: 'Foundations and basics', emoji: '🌱' },
    { value: '2', label: 'Elementary', description: 'Building understanding', emoji: '🌿' },
    { value: '3', label: 'Intermediate', description: 'Standard college level', emoji: '🌳' },
    { value: '4', label: 'Advanced', description: 'Challenging applications', emoji: '🏔️' },
    { value: '5', label: 'Expert', description: 'Complex problem solving', emoji: '🚀' },
  ];

  const studyModeOptions: SelectOption[] = [
    { value: 'flashcards', label: 'Flashcards Only', emoji: '💳' },
    { value: 'quizzes', label: 'Quizzes Only', emoji: '📝' },
    { value: 'notes', label: 'Study Notes Only', emoji: '📋' },
    { value: 'mixed', label: 'Mixed Approach', emoji: '🔀' },
  ];

  return (
    <Screen scrollable>
      <Header 
        title="Study Preferences"
        variant="cosmic"
        subtitle="Configure your AI learning experience"
        rightAction={{
          emoji: resolveEmoji('sync'),
          onPress: handleSave,
          label: 'Save preferences'
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {error && (
          <Card variant="danger" style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        )}

        {/* Overview Section */}
        <Section 
          title="Overview" 
          emoji={resolveEmoji('analytics')}
          expanded={expandedSections.overview}
          onToggle={() => toggleSection('overview')}
        >
          <Card variant="outlined" style={styles.previewCard}>
            <Text style={styles.previewLabel}>Current Configuration:</Text>
            <Text style={styles.previewText}>{previewContext}</Text>
          </Card>
        </Section>

        {/* Study Style Section */}
        <Section 
          title="Study Style" 
          emoji={resolveEmoji('study')}
          expanded={expandedSections.studyStyle}
          onToggle={() => toggleSection('studyStyle')}
        >
          <Select
            label="Reading Level"
            value={preferences.readingLevel}
            options={readingLevelOptions}
            onSelect={(value) => updatePreferences({ readingLevel: value as any })}
            variant="cosmic"
          />
          
          <Select
            label="Communication Tone"
            value={preferences.tone}
            options={toneOptions}
            onSelect={(value) => updatePreferences({ tone: value as any })}
            variant="cosmic"
          />
          
          <Select
            label="Difficulty Level"
            value={preferences.difficulty.toString()}
            options={difficultyOptions}
            onSelect={(value) => updatePreferences({ difficulty: parseInt(value) as any })}
            variant="cosmic"
          />
          
          <Input
            label="Study Session Length (minutes)"
            value={preferences.timePerSessionMins.toString()}
            onChangeText={(text) => {
              const mins = parseInt(text) || 30;
              updatePreferences({ timePerSessionMins: mins });
            }}
            keyboardType="numeric"
            leftEmoji="⏱️"
            helper="Recommended: 25-45 minutes"
          />

          <Select
            label="Preferred Study Mode"
            value={preferences.studyMode}
            options={studyModeOptions}
            onSelect={(value) => updatePreferences({ studyMode: value as any })}
            variant="cosmic"
          />
        </Section>

        {/* Quiz Settings Section */}
        <Section 
          title="Quiz Settings" 
          emoji={resolveEmoji('quiz')}
          expanded={expandedSections.quizSettings}
          onToggle={() => toggleSection('quizSettings')}
        >
          <Input
            label="Number of Quiz Questions"
            value={preferences.quizConfig.numQuestions.toString()}
            onChangeText={(text) => {
              const num = Math.max(1, Math.min(50, parseInt(text) || 10));
              updatePreferences({ 
                quizConfig: { 
                  ...preferences.quizConfig, 
                  numQuestions: num 
                }
              });
            }}
            keyboardType="numeric"
            leftEmoji="🔢"
            helper="1-50 questions per quiz"
          />

          <Text style={styles.fieldLabel}>Quiz Question Types</Text>
          {[
            { value: 'mcq', label: 'Multiple Choice', emoji: '📋' },
            { value: 'short', label: 'Short Answer', emoji: '✏️' },
            { value: 'code', label: 'Code Problems', emoji: '💻' },
          ].map((type) => (
            <Toggle
              key={type.value}
              label={type.label}
              emoji={type.emoji}
              value={preferences.quizConfig.types.includes(type.value as any)}
              onValueChange={(enabled) => {
                const types = enabled
                  ? [...preferences.quizConfig.types, type.value as any]
                  : preferences.quizConfig.types.filter(t => t !== type.value);
                updatePreferences({ 
                  quizConfig: { 
                    ...preferences.quizConfig, 
                    types 
                  }
                });
              }}
              variant="card"
            />
          ))}
        </Section>

        {/* Sources Section */}
        <Section 
          title="Content Sources" 
          emoji={resolveEmoji('file')}
          expanded={expandedSections.sources}
          onToggle={() => toggleSection('sources')}
        >
          <Text style={styles.fieldLabel}>Include content from:</Text>
          {[
            { value: 'files', label: 'Course Files & Documents', emoji: '📎' },
            { value: 'modules', label: 'Course Modules & Lessons', emoji: '📚' },
            { value: 'assignments', label: 'Assignments & Projects', emoji: '📋' },
          ].map((source) => (
            <Toggle
              key={source.value}
              label={source.label}
              emoji={source.emoji}
              value={preferences.sourcesInclude.includes(source.value as any)}
              onValueChange={(enabled) => {
                const sources = enabled
                  ? [...preferences.sourcesInclude, source.value as any]
                  : preferences.sourcesInclude.filter(s => s !== source.value);
                updatePreferences({ sourcesInclude: sources });
              }}
              variant="card"
            />
          ))}
        </Section>

        {/* Language & Tone Section */}
        <Section 
          title="Learning Assistance" 
          emoji={resolveEmoji('ai')}
          expanded={expandedSections.languageTone}
          onToggle={() => toggleSection('languageTone')}
        >
          <Toggle
            label="Allow Hints"
            description="Provide hints when you seem stuck"
            emoji="💡"
            value={preferences.allowHints}
            onValueChange={(value) => updatePreferences({ allowHints: value })}
            variant="card"
          />

          <Toggle
            label="Include Explanations"
            description="Always explain answers and reasoning"
            emoji="🧠"
            value={preferences.includeExplanations}
            onValueChange={(value) => updatePreferences({ includeExplanations: value })}
            variant="card"
          />
        </Section>

        {/* Advanced Section */}
        <Section 
          title="Advanced Settings" 
          emoji={resolveEmoji('settings')}
          expanded={expandedSections.advanced}
          onToggle={() => toggleSection('advanced')}
        >
          <Input
            label="Custom Instructions"
            value={preferences.customInstructions}
            onChangeText={(text) => updatePreferences({ customInstructions: text })}
            placeholder="e.g., Always ask follow-up questions to check my understanding..."
            multiline
            style={styles.textArea}
            helper="Additional specific instructions for AI assistants (max 1000 characters)"
          />

          <Text style={styles.characterCount}>
            {preferences.customInstructions.length}/1000 characters
          </Text>
        </Section>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <Button
            title={isDirty ? "Save Changes" : "All Saved!"}
            onPress={handleSave}
            variant="cosmic"
            size="lg"
            fullWidth
            disabled={!isDirty}
            emoji={resolveEmoji('success')}
          />
          
          <Button
            title="Reset to Defaults"
            onPress={handleReset}
            variant="outline"
            size="md"
            fullWidth
            style={styles.resetButton}
            emoji={resolveEmoji('sync')}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  section: {
    marginBottom: theme.spacing['4'],
  },
  sectionHeader: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    textAlign: 'left',
  },
  sectionContent: {
    paddingTop: theme.spacing['4'],
  },
  previewCard: {
    backgroundColor: theme.colors.cosmic,
    marginBottom: theme.spacing['4'],
  },
  previewLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
    marginBottom: theme.spacing['2'],
  },
  previewText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    lineHeight: theme.typography.lineHeights.normal * theme.typography.sizes.sm,
  },
  fieldLabel: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing['3'],
  },
  textArea: {
    minHeight: 100,
  },
  characterCount: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginTop: theme.spacing['1'],
  },
  actionContainer: {
    paddingTop: theme.spacing['6'],
    paddingBottom: theme.spacing['8'],
  },
  resetButton: {
    marginTop: theme.spacing['3'],
  },
  errorCard: {
    marginBottom: theme.spacing['4'],
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.sizes.sm,
    textAlign: 'center',
  },
});