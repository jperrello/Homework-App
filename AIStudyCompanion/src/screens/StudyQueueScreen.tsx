import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { THEME } from '../constants';

export default function StudyQueueScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Study Queue</Text>
        <Text style={styles.headerSubtitle}>Your daily study items</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Due Today</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Total Cards</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Study Items</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No study items due today</Text>
            <Text style={styles.emptyStateSubtext}>
              Generate some flashcards or quizzes from your courses to get started!
            </Text>
            <TouchableOpacity style={styles.createContentButton}>
              <Text style={styles.createContentButtonText}>Create Study Content</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    padding: THEME.spacing.lg,
    backgroundColor: THEME.colors.primary,
  },
  headerTitle: {
    fontSize: THEME.fontSize.xxl,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: THEME.spacing.xs,
  },
  headerSubtitle: {
    fontSize: THEME.fontSize.md,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: THEME.colors.surface,
    marginHorizontal: THEME.spacing.lg,
    marginTop: -THEME.spacing.lg,
    borderRadius: THEME.borderRadius.lg,
    paddingVertical: THEME.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: THEME.fontSize.xxl,
    fontWeight: 'bold',
    color: THEME.colors.primary,
    marginBottom: THEME.spacing.xs,
  },
  statLabel: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
  },
  section: {
    marginTop: THEME.spacing.xl,
    paddingHorizontal: THEME.spacing.lg,
  },
  sectionTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.xl * 2,
  },
  emptyStateText: {
    fontSize: THEME.fontSize.lg,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginBottom: THEME.spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: THEME.spacing.lg,
  },
  createContentButton: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
  },
  createContentButtonText: {
    color: '#fff',
    fontSize: THEME.fontSize.md,
    fontWeight: 'bold',
  },
});