// Button Component - Consistent button styling across the app
import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextStyle, 
  ActivityIndicator,
  View 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'cosmic' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  emoji?: string;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  accessibilityLabel?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  emoji,
  iconPosition = 'left',
  style,
  textStyle,
  fullWidth = false,
  accessibilityLabel,
}: ButtonProps) {
  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    loading && styles.loading,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text` as keyof typeof styles],
    styles[`${size}Text` as keyof typeof styles],
    disabled && styles.disabledText,
    textStyle,
  ];

  const renderIcon = () => {
    if (loading) {
      return (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' || variant === 'cosmic' ? '#fff' : theme.colors.primary}
          style={styles.loadingIndicator}
        />
      );
    }

    if (emoji) {
      return (
        <Text 
          style={[
            styles.iconText,
            iconPosition === 'right' && styles.iconRight,
            styles[`${size}Icon` as keyof typeof styles],
          ]}
        >
          {emoji}
        </Text>
      );
    }

    if (icon) {
      return (
        <Ionicons
          name={icon}
          size={size === 'sm' ? 16 : size === 'lg' ? 24 : size === 'xl' ? 28 : 20}
          color={variant === 'primary' || variant === 'cosmic' ? '#fff' : theme.colors.primary}
          style={[
            styles.icon,
            iconPosition === 'right' && styles.iconRight,
          ]}
        />
      );
    }

    return null;
  };

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      <View style={styles.content}>
        {(icon || emoji) && iconPosition === 'left' && renderIcon()}
        {loading && !icon && !emoji ? (
          <ActivityIndicator 
            size="small" 
            color={variant === 'primary' || variant === 'cosmic' ? '#fff' : theme.colors.primary}
          />
        ) : (
          <Text style={textStyles}>{title}</Text>
        )}
        {(icon || emoji) && iconPosition === 'right' && renderIcon()}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...theme.shadows.sm,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Variants
  primary: {
    backgroundColor: theme.colors.primary,
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
    borderWidth: 0,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  cosmic: {
    backgroundColor: theme.colors.rocket,
    borderWidth: 2,
    borderColor: theme.colors.stars + '40',
    ...theme.shadows.cosmic,
  },
  danger: {
    backgroundColor: theme.colors.error,
    borderWidth: 0,
  },

  // Sizes
  sm: {
    paddingHorizontal: theme.spacing['3'],
    paddingVertical: theme.spacing['2'],
    minHeight: 32,
  },
  md: {
    paddingHorizontal: theme.spacing['4'],
    paddingVertical: theme.spacing['3'],
    minHeight: 40,
  },
  lg: {
    paddingHorizontal: theme.spacing['6'],
    paddingVertical: theme.spacing['4'],
    minHeight: 48,
  },
  xl: {
    paddingHorizontal: theme.spacing['8'],
    paddingVertical: theme.spacing['5'],
    minHeight: 56,
  },

  // States
  disabled: {
    opacity: 0.5,
  },
  loading: {
    opacity: 0.8,
  },

  // Text styles
  text: {
    fontWeight: theme.typography.weights.semibold,
    textAlign: 'center',
  },
  primaryText: {
    color: '#fff',
  },
  secondaryText: {
    color: '#fff',
  },
  outlineText: {
    color: theme.colors.primary,
  },
  ghostText: {
    color: theme.colors.primary,
  },
  cosmicText: {
    color: '#fff',
    textShadowColor: theme.colors.rocket,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dangerText: {
    color: '#fff',
  },
  disabledText: {
    opacity: 0.6,
  },

  // Text sizes
  smText: {
    fontSize: theme.typography.sizes.sm,
  },
  mdText: {
    fontSize: theme.typography.sizes.base,
  },
  lgText: {
    fontSize: theme.typography.sizes.lg,
  },
  xlText: {
    fontSize: theme.typography.sizes.xl,
  },

  // Icons
  icon: {
    marginHorizontal: theme.spacing['1'],
  },
  iconRight: {
    marginLeft: theme.spacing['2'],
  },
  iconText: {
    marginHorizontal: theme.spacing['1'],
  },
  loadingIndicator: {
    marginRight: theme.spacing['2'],
  },

  // Icon sizes
  smIcon: {
    fontSize: 14,
  },
  mdIcon: {
    fontSize: 16,
  },
  lgIcon: {
    fontSize: 20,
  },
  xlIcon: {
    fontSize: 24,
  },
});

export default Button;