import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { THEME } from '../constants';

export default function FlashcardStudyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Flashcard Study</Text>
        <Text style={styles.subtitle}>This screen will implement flashcard study session</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.lg,
  },
  title: {
    fontSize: THEME.fontSize.xxl,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.md,
  },
  subtitle: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
  },
});