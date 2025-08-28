import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { THEME, ROUTES } from '../constants';
import { useAuth } from '../contexts/AuthContext';

type CreateAccountRouteProp = RouteProp<RootStackParamList, 'CreateAccount'>;
type CreateAccountNavigationProp = StackNavigationProp<RootStackParamList, 'CreateAccount'>;

export default function CreateAccountScreen() {
  const navigation = useNavigation<CreateAccountNavigationProp>();
  const route = useRoute<CreateAccountRouteProp>();
  const { createAccount } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Get Canvas credentials from navigation params
  const { canvasUrl, accessToken, userInfo } = route.params;

  const handleCreateAccount = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await createAccount(username.trim(), password, canvasUrl, accessToken);

      if (result.success) {
        Alert.alert('Success', `Account created successfully!\nLet's set up your study preferences to personalize your experience.`, [
          { text: 'Continue', onPress: () => {
            // The navigation will automatically show AccountSetup since needsSetup = true
          }}
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to create account');
      }
    } catch (error) {
      console.error('Account creation error:', error);
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToCanvas = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToCanvas}>
            <Text style={styles.backButtonText}>← Back to Canvas Setup</Text>
          </TouchableOpacity>
        </View>

        {/* Success Indicator */}
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={64} color={THEME.colors.success} />
          <Text style={styles.title}>Canvas Connected!</Text>
          <Text style={styles.subtitle}>
            Great! You're connected to Canvas as {userInfo?.name || 'a Canvas user'}.
          </Text>
        </View>

        {/* Account Creation Form */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Create Your Account</Text>
          <Text style={styles.formDescription}>
            Create a username and password so you won't need to enter your Canvas token again.
          </Text>

          {/* Username Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Choose a username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Create a password (min 6 characters)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
              editable={!isLoading}
            />
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={true}
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.createButton, isLoading && styles.disabledButton]} 
            onPress={handleCreateAccount}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.createButtonText}>Create Account & Get Started</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Text style={styles.securityText}>
            🔒 Your Canvas token and password are encrypted and stored securely on your device using hardware-backed security.
          </Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: THEME.spacing.lg,
  },
  header: {
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.primary,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.xl,
  },
  title: {
    fontSize: THEME.fontSize.xxl,
    fontWeight: 'bold',
    color: THEME.colors.text,
    textAlign: 'center',
    marginTop: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
  },
  subtitle: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
    paddingVertical: THEME.spacing.lg,
  },
  formTitle: {
    fontSize: THEME.fontSize.xl,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.sm,
  },
  formDescription: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.xl,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: THEME.spacing.lg,
  },
  inputLabel: {
    fontSize: THEME.fontSize.md,
    fontWeight: '600',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.sm,
  },
  textInput: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  buttonContainer: {
    paddingVertical: THEME.spacing.lg,
  },
  createButton: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: THEME.fontSize.lg,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  securityNote: {
    backgroundColor: '#E8F5E8',
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.xl,
  },
  securityText: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.success,
    textAlign: 'center',
    lineHeight: 18,
  },
});