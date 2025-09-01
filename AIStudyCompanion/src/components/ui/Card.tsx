// Card Component - Flexible container component
import React from 'react';
import { 
  View, 
  StyleSheet, 
  ViewStyle, 
  TouchableOpacity 
} from 'react-native';
import { theme } from '../../theme';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'cosmic' | 'success' | 'warning' | 'danger';
export type CardPadding = keyof typeof theme.spacing;

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export function Card({
  children,
  variant = 'default',
  padding = 'lg',
  onPress,
  style,
  disabled = false,
  accessibilityLabel,
}: CardProps) {
  const cardStyles = [
    styles.base,
    styles[variant],
    { padding: theme.spacing[padding] },
    disabled && styles.disabled,
    style,
  ];

  const content = (
    <View style={cardStyles}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        activeOpacity={0.8}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surface,
  },

  // Variants
  default: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  elevated: {
    backgroundColor: theme.colors.surface,
    ...theme.shadows.lg,
    borderWidth: 0,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  cosmic: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
    ...theme.shadows.cosmic,
  },
  success: {
    backgroundColor: theme.colors.success + '10',
    borderWidth: 1,
    borderColor: theme.colors.success + '30',
  },
  warning: {
    backgroundColor: theme.colors.warning + '10',
    borderWidth: 1,
    borderColor: theme.colors.warning + '30',
  },
  danger: {
    backgroundColor: theme.colors.error + '10',
    borderWidth: 1,
    borderColor: theme.colors.error + '30',
  },

  // States
  disabled: {
    opacity: 0.6,
  },
});

export default Card;