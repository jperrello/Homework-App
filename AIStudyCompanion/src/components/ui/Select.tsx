// Select Component - Dropdown selector with progressive disclosure
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ViewStyle, 
  ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import Card from './Card';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  emoji?: string;
}

interface SelectProps {
  label?: string;
  value: string;
  options: SelectOption[];
  onSelect: (value: string) => void;
  placeholder?: string;
  error?: string;
  helper?: string;
  style?: ViewStyle;
  disabled?: boolean;
  variant?: 'default' | 'cosmic';
}

export function Select({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Select an option',
  error,
  helper,
  style,
  disabled = false,
  variant = 'default',
}: SelectProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const selectedOption = options.find(opt => opt.value === value);
  const hasError = !!error;

  const toggleExpanded = () => {
    if (!disabled) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSelect = (optionValue: string) => {
    onSelect(optionValue);
    setIsExpanded(false);
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, hasError && styles.errorLabel]}>
          {label}
        </Text>
      )}
      
      <Card
        variant={variant === 'cosmic' ? 'cosmic' : 'outlined'}
        padding="md"
        onPress={toggleExpanded}
        disabled={disabled}
      >
        <View style={styles.selectHeader}>
          <View style={styles.selectedContent}>
            {selectedOption?.emoji && (
              <Text style={styles.selectedEmoji}>{selectedOption.emoji}</Text>
            )}
            <View style={styles.selectedText}>
              <Text style={[
                styles.selectedValue,
                !selectedOption && styles.placeholder,
                disabled && styles.disabled
              ]}>
                {selectedOption?.label || placeholder}
              </Text>
              {selectedOption?.description && (
                <Text style={styles.selectedDescription}>
                  {selectedOption.description}
                </Text>
              )}
            </View>
          </View>
          
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={disabled ? theme.colors.textSecondary : theme.colors.primary}
          />
        </View>
      </Card>

      {isExpanded && (
        <Card variant="outlined" style={styles.optionsContainer}>
          <ScrollView style={styles.optionsList} nestedScrollEnabled>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.option,
                  option.value === value && styles.selectedOption
                ]}
                onPress={() => handleSelect(option.value)}
              >
                <View style={styles.optionContent}>
                  {option.emoji && (
                    <Text style={styles.optionEmoji}>{option.emoji}</Text>
                  )}
                  <View style={styles.optionText}>
                    <Text style={[
                      styles.optionLabel,
                      option.value === value && styles.selectedOptionLabel
                    ]}>
                      {option.label}
                    </Text>
                    {option.description && (
                      <Text style={styles.optionDescription}>
                        {option.description}
                      </Text>
                    )}
                  </View>
                </View>
                
                {option.value === value && (
                  <Ionicons 
                    name="checkmark-circle" 
                    size={20} 
                    color={theme.colors.primary} 
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Card>
      )}

      {(error || helper) && (
        <Text style={[styles.helper, hasError && styles.errorText]}>
          {error || helper}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing['4'],
  },
  label: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing['2'],
  },
  errorLabel: {
    color: theme.colors.error,
  },
  selectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedEmoji: {
    fontSize: 20,
    marginRight: theme.spacing['2'],
  },
  selectedText: {
    flex: 1,
  },
  selectedValue: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.medium,
  },
  placeholder: {
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.regular,
  },
  disabled: {
    opacity: 0.6,
  },
  selectedDescription: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing['0.5'],
  },
  optionsContainer: {
    marginTop: theme.spacing['2'],
    maxHeight: 240,
    padding: 0,
  },
  optionsList: {
    flex: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing['3'],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  selectedOption: {
    backgroundColor: theme.colors.primary + '10',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionEmoji: {
    fontSize: 18,
    marginRight: theme.spacing['2'],
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.medium,
  },
  selectedOptionLabel: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold,
  },
  optionDescription: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing['0.5'],
  },
  helper: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing['1'],
  },
  errorText: {
    color: theme.colors.error,
  },
});

export default Select;