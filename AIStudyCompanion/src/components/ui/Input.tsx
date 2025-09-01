// Input Component - Consistent text input styling
import React, { forwardRef } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  TextInputProps, 
  ViewStyle, 
  TextStyle 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

export type InputVariant = 'default' | 'outlined' | 'minimal';
export type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  variant?: InputVariant;
  size?: InputSize;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  leftEmoji?: string;
  rightEmoji?: string;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  disabled?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(({
  label,
  error,
  helper,
  variant = 'default',
  size = 'md',
  leftIcon,
  rightIcon,
  leftEmoji,
  rightEmoji,
  onRightIconPress,
  containerStyle,
  inputStyle,
  disabled = false,
  style,
  ...textInputProps
}, ref) => {
  const hasError = !!error;
  const hasIcon = !!(leftIcon || rightIcon || leftEmoji || rightEmoji);

  const containerStyles = [
    styles.container,
    containerStyle,
  ];

  const inputContainerStyles = [
    styles.inputContainer,
    styles[variant],
    styles[size],
    hasError && styles.error,
    disabled && styles.disabled,
  ];

  const textInputStyles = [
    styles.input,
    styles[`${size}Input` as keyof typeof styles],
    leftIcon || leftEmoji ? styles.inputWithLeftIcon : null,
    rightIcon || rightEmoji ? styles.inputWithRightIcon : null,
    inputStyle,
    style,
  ];

  return (
    <View style={containerStyles}>
      {label && (
        <Text style={[styles.label, hasError && styles.errorLabel]}>
          {label}
        </Text>
      )}
      
      <View style={inputContainerStyles}>
        {(leftIcon || leftEmoji) && (
          <View style={styles.leftIconContainer}>
            {leftEmoji ? (
              <Text style={styles.iconEmoji}>{leftEmoji}</Text>
            ) : leftIcon ? (
              <Ionicons 
                name={leftIcon} 
                size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} 
                color={hasError ? theme.colors.error : theme.colors.textSecondary} 
              />
            ) : null}
          </View>
        )}
        
        <TextInput
          ref={ref}
          style={textInputStyles}
          placeholderTextColor={theme.colors.textSecondary}
          editable={!disabled}
          {...textInputProps}
        />
        
        {(rightIcon || rightEmoji) && (
          <View style={styles.rightIconContainer}>
            {rightEmoji ? (
              <Text style={styles.iconEmoji}>{rightEmoji}</Text>
            ) : rightIcon ? (
              <Ionicons 
                name={rightIcon} 
                size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} 
                color={hasError ? theme.colors.error : theme.colors.textSecondary}
                onPress={onRightIconPress}
              />
            ) : null}
          </View>
        )}
      </View>
      
      {(error || helper) && (
        <Text style={[styles.helper, hasError && styles.errorText]}>
          {error || helper}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing['4'],
  },
  label: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing['2'],
  },
  errorLabel: {
    color: theme.colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface,
  },
  
  // Variants
  default: {
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  outlined: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: 'transparent',
  },
  minimal: {
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    borderRadius: 0,
    backgroundColor: 'transparent',
  },

  // Sizes
  sm: {
    minHeight: 32,
    paddingHorizontal: theme.spacing['3'],
  },
  md: {
    minHeight: 40,
    paddingHorizontal: theme.spacing['4'],
  },
  lg: {
    minHeight: 48,
    paddingHorizontal: theme.spacing['5'],
  },

  // States
  error: {
    borderColor: theme.colors.error,
  },
  disabled: {
    opacity: 0.6,
    backgroundColor: theme.colors.gray[100],
  },

  // Input styles
  input: {
    flex: 1,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.regular,
  },
  smInput: {
    fontSize: theme.typography.sizes.sm,
  },
  mdInput: {
    fontSize: theme.typography.sizes.base,
  },
  lgInput: {
    fontSize: theme.typography.sizes.lg,
  },
  inputWithLeftIcon: {
    marginLeft: theme.spacing['2'],
  },
  inputWithRightIcon: {
    marginRight: theme.spacing['2'],
  },

  // Icon containers
  leftIconContainer: {
    marginLeft: theme.spacing['2'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconContainer: {
    marginRight: theme.spacing['2'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 16,
  },

  // Helper text
  helper: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing['1'],
  },
  errorText: {
    color: theme.colors.error,
  },
});

Input.displayName = 'Input';

export default Input;