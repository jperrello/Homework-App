// Toggle Component - Enhanced switch with labels and descriptions
import React from 'react';
import { 
  View, 
  Text, 
  Switch, 
  StyleSheet, 
  ViewStyle, 
  TouchableOpacity 
} from 'react-native';
import { theme } from '../../theme';

interface ToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  style?: ViewStyle;
  variant?: 'default' | 'card';
  emoji?: string;
}

export function Toggle({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
  style,
  variant = 'default',
  emoji,
}: ToggleProps) {
  const containerStyles = [
    styles.container,
    variant === 'card' && styles.cardContainer,
    disabled && styles.disabled,
    style,
  ];

  const handlePress = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  const Container = variant === 'card' ? TouchableOpacity : View;

  return (
    <Container 
      style={containerStyles}
      onPress={variant === 'card' ? handlePress : undefined}
      activeOpacity={variant === 'card' ? 0.8 : 1}
    >
      <View style={styles.content}>
        {emoji && <Text style={styles.emoji}>{emoji}</Text>}
        <View style={styles.textContent}>
          <Text style={[styles.label, disabled && styles.disabledText]}>
            {label}
          </Text>
          {description && (
            <Text style={[styles.description, disabled && styles.disabledText]}>
              {description}
            </Text>
          )}
        </View>
      </View>
      
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{
          false: theme.colors.border,
          true: theme.colors.primary + '80',
        }}
        thumbColor={value ? theme.colors.primary : theme.colors.textSecondary}
        ios_backgroundColor={theme.colors.border}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing['3'],
  },
  cardContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing['4'],
    marginVertical: theme.spacing['1'],
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  disabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: theme.spacing['3'],
  },
  emoji: {
    fontSize: 20,
    marginRight: theme.spacing['3'],
  },
  textContent: {
    flex: 1,
  },
  label: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    lineHeight: theme.typography.lineHeights.tight * theme.typography.sizes.base,
  },
  description: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing['1'],
    lineHeight: theme.typography.lineHeights.normal * theme.typography.sizes.sm,
  },
  disabledText: {
    opacity: 0.6,
  },
});

export default Toggle;