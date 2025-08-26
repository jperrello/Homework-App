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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ROUTES, THEME } from '../constants';
import { useAuth } from '../contexts/AuthContext';

type LoginNavigationProp = StackNavigationProp<RootStackParamList>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginNavigationProp>();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter your username');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await login(username.trim(), password);

      if (result.success) {
        // Login successful - AuthContext will handle navigation automatically
        console.log('Login successful, navigating to main app');
      } else {
        Alert.alert('Error', result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToCanvasAuth = () => {
    navigation.navigate(ROUTES.CANVAS_AUTH);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="lock-closed" size={64} color={THEME.colors.primary} />
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to access your Canvas courses</Text>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.loginButton, isLoading && styles.disabledButton]} 
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.alternativeOptions}>
            <Text style={styles.alternativeText}>Don't have an account?</Text>
            <TouchableOpacity 
              style={styles.newAccountButton} 
              onPress={navigateToCanvasAuth}
              disabled={isLoading}
            >
              <Text style={styles.newAccountButtonText}>Connect to Canvas & Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Text style={styles.securityText}>
            🔒 Your login credentials are securely encrypted and stored locally on your device.
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
    paddingHorizontal: THEME.spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: THEME.spacing.xl * 2,
  },
  title: {
    fontSize: THEME.fontSize.xxl,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.sm,
  },
  subtitle: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: THEME.spacing.xl,
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
    marginBottom: THEME.spacing.xl,
  },
  loginButton: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    marginBottom: THEME.spacing.lg,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: THEME.fontSize.lg,
    fontWeight: 'bold',
  },
  alternativeOptions: {
    alignItems: 'center',
  },
  alternativeText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.sm,
  },
  newAccountButton: {
    backgroundColor: THEME.colors.surface,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.primary,
    alignItems: 'center',
  },
  newAccountButtonText: {
    color: THEME.colors.primary,
    fontSize: THEME.fontSize.sm,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  securityNote: {
    backgroundColor: '#E8F5E8',
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
  },
  securityText: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.success,
    textAlign: 'center',
    lineHeight: 18,
  },
});