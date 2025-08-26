import React, { useState, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ROUTES, THEME } from '../constants';
import canvasService from '../services/canvasService';
import authService from '../services/authService';

type CanvasAuthNavigationProp = StackNavigationProp<RootStackParamList, typeof ROUTES.CANVAS_AUTH>;

type AuthMode = 'initial_setup' | 'login' | 'create_account';

export default function EnhancedCanvasAuthScreen() {
  const navigation = useNavigation<CanvasAuthNavigationProp>();
  
  // Screen state
  const [authMode, setAuthMode] = useState<AuthMode>('initial_setup');
  const [isLoading, setIsLoading] = useState(false);
  const [hasExistingUsers, setHasExistingUsers] = useState(false);

  // Initial setup fields
  const [canvasUrl, setCanvasUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');

  // Account creation fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Login fields
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  useEffect(() => {
    checkForExistingUsers();
  }, []);

  const checkForExistingUsers = async () => {
    try {
      const usernames = await authService.getAllUsernames();
      const hasUsers = usernames.length > 0;
      setHasExistingUsers(hasUsers);
      
      if (hasUsers) {
        setAuthMode('login');
      }
    } catch (error) {
      console.error('Error checking for existing users:', error);
    }
  };

  const handleInitialSetup = async () => {
    if (!canvasUrl.trim()) {
      Alert.alert('Error', 'Please enter your Canvas URL');
      return;
    }

    if (!accessToken.trim()) {
      Alert.alert('Error', 'Please enter your Canvas access token');
      return;
    }

    // Validate and format Canvas URL
    let formattedUrl = canvasUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }
    
    formattedUrl = formattedUrl.replace(/\/$/, '');
    
    setIsLoading(true);
    
    try {
      // Test Canvas connection first
      await canvasService.setCanvasConfig(formattedUrl, accessToken.trim());
      const testResult = await canvasService.testConnection();
      
      if (testResult) {
        const userResponse = await canvasService.getCurrentUser();
        
        if (userResponse.success) {
          // Canvas connection successful, now create account
          setAuthMode('create_account');
        } else {
          Alert.alert('Error', userResponse.error || 'Failed to get user information');
        }
      } else {
        Alert.alert('Error', 'Failed to connect to Canvas. Please check your URL and access token.');
      }
    } catch (error) {
      console.error('Canvas connection error:', error);
      Alert.alert('Error', 'Failed to connect to Canvas. Please check your URL and access token.');
    } finally {
      setIsLoading(false);
    }
  };

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
      const result = await authService.createAccount(
        username.trim(),
        password,
        canvasUrl,
        accessToken
      );

      if (result.success) {
        Alert.alert('Success', `Account created successfully!\nWelcome, ${result.user?.username}!`, [
          { text: 'OK', onPress: () => {
            // TODO: Navigate to main app when navigation is implemented
            Alert.alert('Account Ready', 'Your account is set up and you can now use the app!');
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

  const handleLogin = async () => {
    if (!loginUsername.trim()) {
      Alert.alert('Error', 'Please enter your username');
      return;
    }

    if (!loginPassword.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await authService.login(loginUsername.trim(), loginPassword);

      if (result.success && result.user) {
        // Get Canvas credentials and test connection
        const canvasCredentials = await authService.getCurrentUserCanvasCredentials();
        
        if (canvasCredentials) {
          await canvasService.setCanvasConfig(canvasCredentials.canvasUrl, canvasCredentials.accessToken);
          const testResult = await canvasService.testConnection();
          
          if (testResult) {
            Alert.alert('Success', `Welcome back, ${result.user.username}!`, [
              { text: 'OK', onPress: () => {
                // TODO: Navigate to main app when navigation is implemented
                Alert.alert('Login Successful', 'You can now access your courses and assignments!');
              }}
            ]);
          } else {
            Alert.alert('Warning', 'Logged in successfully, but Canvas connection failed. Please check your Canvas token in settings.');
          }
        } else {
          Alert.alert('Error', 'Canvas credentials not found. Please contact support.');
        }
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

  const renderInitialSetup = () => (
    <>
      <View style={styles.mainContent}>
        <Text style={styles.title}>Connect to Canvas</Text>
        <Text style={styles.description}>
          Enter your Canvas institution URL and access token to get started.
        </Text>

        {/* Canvas URL Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Canvas Institution URL</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., yourschool.instructure.com"
            value={canvasUrl}
            onChangeText={setCanvasUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            editable={!isLoading}
          />
          <Text style={styles.inputHint}>
            Enter your Canvas URL without "https://"
          </Text>
        </View>

        {/* Access Token Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Access Token</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Paste your Canvas access token here"
            value={accessToken}
            onChangeText={setAccessToken}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={true}
            editable={!isLoading}
          />
          <Text style={styles.inputHint}>
            Generate in Canvas Settings → Approved Integrations
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.primaryButton, isLoading && styles.disabledButton]} 
          onPress={handleInitialSetup}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Test Connection</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  const renderCreateAccount = () => (
    <>
      <View style={styles.mainContent}>
        <Ionicons name="checkmark-circle" size={48} color={THEME.colors.success} />
        <Text style={styles.title}>Canvas Connected!</Text>
        <Text style={styles.description}>
          Now create a username and password so you won't need to enter your Canvas token again.
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

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.primaryButton, isLoading && styles.disabledButton]} 
          onPress={handleCreateAccount}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={() => setAuthMode('initial_setup')}
          disabled={isLoading}
        >
          <Text style={styles.secondaryButtonText}>Back to Canvas Setup</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderLogin = () => (
    <>
      <View style={styles.mainContent}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.description}>
          Sign in with your username and password to access your Canvas courses.
        </Text>

        {/* Username Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Username</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your username"
            value={loginUsername}
            onChangeText={setLoginUsername}
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
            placeholder="Enter your password"
            value={loginPassword}
            onChangeText={setLoginPassword}
            secureTextEntry={true}
            editable={!isLoading}
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.primaryButton, isLoading && styles.disabledButton]} 
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={() => setAuthMode('initial_setup')}
          disabled={isLoading}
        >
          <Text style={styles.secondaryButtonText}>Add New Canvas Account</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Content based on mode */}
        {authMode === 'initial_setup' && renderInitialSetup()}
        {authMode === 'create_account' && renderCreateAccount()}
        {authMode === 'login' && renderLogin()}

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Text style={styles.securityText}>
            🔒 All credentials are encrypted and stored securely on your device using hardware-backed security when available.
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
  mainContent: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: THEME.spacing.xl,
  },
  title: {
    fontSize: THEME.fontSize.xxl,
    fontWeight: 'bold',
    color: THEME.colors.text,
    textAlign: 'center',
    marginBottom: THEME.spacing.lg,
    marginTop: THEME.spacing.lg,
  },
  description: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: THEME.spacing.xl,
    paddingHorizontal: THEME.spacing.md,
  },
  inputContainer: {
    width: '100%',
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
    marginBottom: THEME.spacing.xs,
  },
  inputHint: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.textSecondary,
    lineHeight: 16,
  },
  buttonContainer: {
    paddingBottom: THEME.spacing.xl,
    width: '100%',
  },
  primaryButton: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    marginBottom: THEME.spacing.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: THEME.fontSize.lg,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: THEME.spacing.sm,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: THEME.colors.primary,
    fontSize: THEME.fontSize.sm,
  },
  disabledButton: {
    opacity: 0.6,
  },
  securityNote: {
    backgroundColor: '#E8F5E8',
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    marginTop: THEME.spacing.lg,
  },
  securityText: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.success,
    textAlign: 'center',
    lineHeight: 18,
  },
});