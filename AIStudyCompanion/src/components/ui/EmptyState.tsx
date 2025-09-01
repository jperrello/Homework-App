// EmptyState Component - Consistent empty state messaging
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ViewStyle 
} from 'react-native';
import { theme } from '../../theme';
import { resolveEmoji, EmojiContext } from '../../lib/emoji';
import Button from './Button';

interface EmptyStateProps {
  emoji?: string;
  emojiContext?: EmojiContext;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'cosmic' | 'minimal';
}

export function EmptyState({
  emoji,
  emojiContext = 'study',
  title,
  description,
  actionLabel,
  onAction,
  style,
  variant = 'default',
}: EmptyStateProps) {
  const displayEmoji = emoji || resolveEmoji(emojiContext);

  return (
    <View style={[styles.container, styles[variant], style]}>
      <Text style={[styles.emoji, styles[`${variant}Emoji` as keyof typeof styles]]}>
        {displayEmoji}
      </Text>
      
      <Text style={[styles.title, styles[`${variant}Title` as keyof typeof styles]]}>
        {title}
      </Text>
      
      <Text style={[styles.description, styles[`${variant}Description` as keyof typeof styles]]}>
        {description}
      </Text>
      
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant={variant === 'cosmic' ? 'cosmic' : 'primary'}
          style={styles.actionButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing['8'],
    paddingVertical: theme.spacing['12'],
  },
  
  // Variants
  default: {
    backgroundColor: 'transparent',
  },
  cosmic: {
    backgroundColor: theme.colors.cosmic,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  minimal: {
    paddingVertical: theme.spacing['6'],
  },

  // Emoji styles
  emoji: {
    fontSize: 64,
    marginBottom: theme.spacing['6'],
  },
  defaultEmoji: {},
  cosmicEmoji: {
    textShadowColor: theme.colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  minimalEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing['4'],
  },

  // Title styles
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing['3'],
    lineHeight: theme.typography.lineHeights.tight * theme.typography.sizes.xl,
  },
  defaultTitle: {},
  cosmicTitle: {
    color: theme.colors.text,
  },
  minimalTitle: {
    fontSize: theme.typography.sizes.lg,
    marginBottom: theme.spacing['2'],
  },

  // Description styles
  description: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeights.normal * theme.typography.sizes.base,
    marginBottom: theme.spacing['8'],
    maxWidth: 280,
  },
  defaultDescription: {},
  cosmicDescription: {
    color: theme.colors.textSecondary,
  },
  minimalDescription: {
    fontSize: theme.typography.sizes.sm,
    marginBottom: theme.spacing['6'],
  },

  // Action button
  actionButton: {
    minWidth: 200,
  },
});

export default EmptyState;