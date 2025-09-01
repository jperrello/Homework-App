// Header Component - Consistent header for all screens
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ViewStyle 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { resolveEmoji } from '../../lib/emoji';

interface HeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: {
    icon?: keyof typeof Ionicons.glyphMap;
    emoji?: string;
    onPress: () => void;
    label?: string;
  };
  leftAction?: {
    icon?: keyof typeof Ionicons.glyphMap;
    emoji?: string;
    onPress: () => void;
    label?: string;
  };
  style?: ViewStyle;
  variant?: 'default' | 'cosmic' | 'minimal';
}

export function Header({
  title,
  subtitle,
  rightAction,
  leftAction,
  style,
  variant = 'default',
}: HeaderProps) {
  const headerStyles = [
    styles.header,
    variant === 'cosmic' && styles.cosmicHeader,
    variant === 'minimal' && styles.minimalHeader,
    style,
  ];

  const renderAction = (action: HeaderProps['rightAction'] | HeaderProps['leftAction'], side: 'left' | 'right') => {
    if (!action) return null;

    return (
      <TouchableOpacity
        style={[styles.actionButton, side === 'right' && styles.rightAction]}
        onPress={action.onPress}
        accessibilityLabel={action.label || `${side} action`}
        accessibilityRole="button"
      >
        {action.emoji ? (
          <Text style={styles.actionEmoji}>{action.emoji}</Text>
        ) : action.icon ? (
          <Ionicons 
            name={action.icon} 
            size={20} 
            color={variant === 'cosmic' ? '#fff' : theme.colors.primary} 
          />
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={headerStyles}>
      <View style={styles.headerContent}>
        {leftAction && renderAction(leftAction, 'left')}
        
        <View style={styles.titleContainer}>
          <Text 
            style={[
              styles.title,
              variant === 'cosmic' && styles.cosmicTitle,
              variant === 'minimal' && styles.minimalTitle,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text 
              style={[
                styles.subtitle,
                variant === 'cosmic' && styles.cosmicSubtitle,
                variant === 'minimal' && styles.minimalSubtitle,
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>
        
        {rightAction && renderAction(rightAction, 'right')}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  cosmicHeader: {
    backgroundColor: theme.colors.primary,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.rocket + '60',
    ...theme.shadows.cosmic,
  },
  minimalHeader: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    paddingVertical: theme.spacing.sm,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  cosmicTitle: {
    color: '#fff',
    textShadowColor: theme.colors.rocket,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  minimalTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
  },
  subtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing['0.5'],
    textAlign: 'center',
  },
  cosmicSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  minimalSubtitle: {
    fontSize: theme.typography.sizes.xs,
  },
  actionButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.radii.md,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightAction: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionEmoji: {
    fontSize: 20,
  },
});

export default Header;