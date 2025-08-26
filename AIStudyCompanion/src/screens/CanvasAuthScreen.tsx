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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ROUTES, THEME } from '../constants';
import canvasService from '../services/canvasService';

type CanvasAuthNavigationProp = StackNavigationProp<RootStackParamList, typeof ROUTES.CANVAS_AUTH>;

export default function CanvasAuthScreen() {
  const navigation = useNavigation<CanvasAuthNavigationProp>();
  const [isLoading, setIsLoading] = useState(false);
  const [canvasUrl, setCanvasUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');

  const handleCanvasLogin = async () => {
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
    
    // Remove trailing slash if present
    formattedUrl = formattedUrl.replace(/\/$/, '');
    
    setIsLoading(true);
    
    try {
      // Set the Canvas configuration
      await canvasService.setCanvasConfig(formattedUrl, accessToken.trim());
      
      // Test the connection
      const testResult = await canvasService.testConnection();
      
      if (testResult) {
        // Get user info to confirm connection
        const userResponse = await canvasService.getCurrentUser();
        
        if (userResponse.success) {
          // Success! Navigate to account creation with Canvas info
          navigation.navigate('CreateAccount' as any, {
            canvasUrl: formattedUrl,
            accessToken: accessToken.trim(),
            userInfo: userResponse.data,
          });
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

  const handleBackToWelcome = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToWelcome}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <Text style={styles.title}>Connect to Canvas</Text>
          <Text style={styles.description}>
            Enter your Canvas institution URL and access token to connect your account.
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
              Enter your Canvas URL without "https://" (we'll add it automatically)
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
              multiline={false}
              editable={!isLoading}
            />
            <Text style={styles.inputHint}>
              You can generate an access token in Canvas Settings → Approved Integrations
            </Text>
          </View>

          <View style={styles.permissionsContainer}>
            <Text style={styles.permissionsTitle}>We'll access:</Text>
            <Text style={styles.permissionItem}>• Your enrolled courses</Text>
            <Text style={styles.permissionItem}>• Course assignments and modules</Text>
            <Text style={styles.permissionItem}>• Course files and materials</Text>
            <Text style={styles.permissionItem}>• Your basic profile information</Text>
          </View>

          <View style={styles.securityNote}>
            <Text style={styles.securityText}>
              🔒 Your access token is stored securely on your device. We never store your Canvas password.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.loginButton, isLoading && styles.disabledButton]} 
            onPress={handleCanvasLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Connect to Canvas</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.helpButton}>
            <Text style={styles.helpButtonText}>Need help getting your access token?</Text>
          </TouchableOpacity>
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
  },
  title: {
    fontSize: THEME.fontSize.xxl,
    fontWeight: 'bold',
    color: THEME.colors.text,
    textAlign: 'center',
    marginBottom: THEME.spacing.lg,
  },
  description: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
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
    marginBottom: THEME.spacing.xs,
  },
  inputHint: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.textSecondary,
    lineHeight: 16,
  },
  permissionsContainer: {
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.lg,
    marginBottom: THEME.spacing.lg,
  },
  permissionsTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.sm,
  },
  permissionItem: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.xs,
  },
  securityNote: {
    backgroundColor: '#E8F5E8',
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.xl,
  },
  securityText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.success,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingBottom: THEME.spacing.xl,
  },
  loginButton: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    marginBottom: THEME.spacing.md,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: THEME.fontSize.lg,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  helpButton: {
    paddingVertical: THEME.spacing.sm,
  },
  helpButtonText: {
    color: THEME.colors.primary,
    fontSize: THEME.fontSize.sm,
    textAlign: 'center',
  },
});