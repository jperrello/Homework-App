// Screen Component - Provides consistent layout wrapper for all screens
import React from 'react';
import { 
  View, 
  ScrollView, 
  SafeAreaView, 
  StyleSheet, 
  ViewStyle,
  ScrollViewProps 
} from 'react-native';
import { theme } from '../../theme';

interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padding?: keyof typeof theme.spacing;
  backgroundColor?: string;
  safe?: boolean;
  style?: ViewStyle;
  scrollViewProps?: ScrollViewProps;
}

export function Screen({
  children,
  scrollable = false,
  padding = 'lg',
  backgroundColor = theme.colors.background,
  safe = true,
  style,
  scrollViewProps,
}: ScreenProps) {
  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor,
    ...style,
  };

  const contentStyle: ViewStyle = {
    flex: scrollable ? 0 : 1,
    padding: theme.spacing[padding],
  };

  const content = (
    <View style={contentStyle}>
      {children}
    </View>
  );

  if (safe) {
    return (
      <SafeAreaView style={containerStyle}>
        {scrollable ? (
          <ScrollView 
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            {...scrollViewProps}
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </SafeAreaView>
    );
  }

  return (
    <View style={containerStyle}>
      {scrollable ? (
        <ScrollView 
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          {...scrollViewProps}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </View>
  );
}

export default Screen;