import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ROUTES, THEME, APP_CONFIG } from '../constants';

type WelcomeScreenNavigationProp = StackNavigationProp<RootStackParamList, typeof ROUTES.WELCOME>;

export default function WelcomeScreen() {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();

  const handleGetStarted = () => {
    navigation.navigate(ROUTES.CANVAS_AUTH);
  };

  const handleSignIn = () => {
    navigation.navigate(ROUTES.LOGIN);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* App Logo/Icon */}
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>🧠</Text>
          </View>
        </View>

        {/* Welcome Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{APP_CONFIG.name}</Text>
          <Text style={styles.subtitle}>
            Your AI-powered study companion integrated with Canvas
          </Text>
          
          <View style={styles.featuresContainer}>
            <Text style={styles.featureText}>📚 Generate flashcards and quizzes from your courses</Text>
            <Text style={styles.featureText}>🎯 Smart spaced repetition for better retention</Text>
            <Text style={styles.featureText}>🤖 AI coach for reflective learning</Text>
            <Text style={styles.featureText}>⚙️ Personalized learning experience</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
            <Text style={styles.getStartedButtonText}>Connect to Canvas</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
            <Text style={styles.signInButtonText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
          
          <Text style={styles.disclaimer}>
            Connect your Canvas account to get started with AI-powered study materials
          </Text>
        </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: THEME.spacing.xl,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: THEME.colors.primary,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  logoText: {
    fontSize: 60,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: THEME.fontSize.xxl + 4,
    fontWeight: 'bold',
    color: THEME.colors.text,
    textAlign: 'center',
    marginBottom: THEME.spacing.md,
  },
  subtitle: {
    fontSize: THEME.fontSize.lg,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: THEME.spacing.xl,
  },
  featuresContainer: {
    alignSelf: 'stretch',
    paddingHorizontal: THEME.spacing.md,
  },
  featureText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text,
    marginBottom: THEME.spacing.md,
    lineHeight: 22,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  getStartedButton: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: THEME.spacing.xl,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    minWidth: 200,
    marginBottom: THEME.spacing.md,
  },
  getStartedButtonText: {
    color: '#fff',
    fontSize: THEME.fontSize.lg,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  signInButton: {
    paddingVertical: THEME.spacing.sm,
    marginBottom: THEME.spacing.lg,
  },
  signInButtonText: {
    color: THEME.colors.primary,
    fontSize: THEME.fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  disclaimer: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});