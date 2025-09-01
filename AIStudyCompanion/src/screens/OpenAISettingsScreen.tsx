import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { SettingsStackParamList } from '../navigation/AppNavigator';
import { ROUTES, THEME } from '../constants';
import aiService from '../services/aiService';
import openaiService from '../services/openaiService';

type OpenAISettingsNavigationProp = StackNavigationProp<SettingsStackParamList>;

export default function OpenAISettingsScreen() {
  const navigation = useNavigation<OpenAISettingsNavigationProp>();
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [modelInfo, setModelInfo] = useState({ name: 'Not configured', provider: 'None' });
  const [apiKeyStatus, setApiKeyStatus] = useState({ configured: false, source: 'Not configured' });
  const [config, setConfig] = useState({
    model: 'gpt-4o-mini',
    baseURL: 'https://api.openai.com/v1',
    maxRetries: 3,
    timeout: 30000,
  });

  useEffect(() => {
    loadCurrentSettings();
  }, []);

  const loadCurrentSettings = async () => {
    setIsLoading(true);
    try {
      const status = openaiService.getApiKeyStatus();
      setApiKeyStatus(status);
      setIsConfigured(status.configured);
      
      const info = aiService.getOpenAIModelInfo();
      setModelInfo(info);
      
      const currentConfig = openaiService.getConfig();
      setConfig(currentConfig);
    } catch (error) {
      console.error('Error loading OpenAI settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateConfiguration = async () => {
    setIsLoading(true);
    try {
      const validation = openaiService.validateApiKey();
      if (validation.valid) {
        Alert.alert('Success', 'OpenAI configuration is valid');
      } else {
        Alert.alert('Configuration Issue', validation.error || 'Configuration validation failed');
      }
    } catch (error) {
      console.error('Error validating OpenAI configuration:', error);
      Alert.alert('Error', 'An unexpected error occurred during validation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      const result = await aiService.testOpenAIConnection();
      if (result.success) {
        Alert.alert('Success', 'OpenAI connection is working properly');
      } else {
        Alert.alert('Connection Failed', result.error || 'Unable to connect to OpenAI');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to test connection');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>AI Configuration</Text>
        <Text style={styles.subtitle}>
          OpenAI integration is managed centrally by the app. This screen shows the current configuration status and allows you to test the connection.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status:</Text>
              <View style={[styles.statusBadge, isConfigured ? styles.statusConnected : styles.statusDisconnected]}>
                <Text style={styles.statusBadgeText}>
                  {isConfigured ? 'Ready' : 'Not configured'}
                </Text>
              </View>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>API Key Source:</Text>
              <Text style={styles.statusValue}>{apiKeyStatus.source}</Text>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Model:</Text>
              <Text style={styles.statusValue}>{modelInfo.name}</Text>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Provider:</Text>
              <Text style={styles.statusValue}>{modelInfo.provider}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuration Settings</Text>
          <View style={styles.configCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Model:</Text>
              <Text style={styles.statusValue}>{config.model}</Text>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Base URL:</Text>
              <Text style={styles.statusValue}>{config.baseURL}</Text>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Max Retries:</Text>
              <Text style={styles.statusValue}>{config.maxRetries}</Text>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Timeout:</Text>
              <Text style={styles.statusValue}>{config.timeout / 1000}s</Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleValidateConfiguration}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={THEME.colors.text} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={THEME.colors.text} />
                <Text style={styles.buttonText}>Validate Configuration</Text>
              </>
            )}
          </TouchableOpacity>

          {isConfigured && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleTestConnection}
              disabled={isLoading}
            >
              <Ionicons name="wifi" size={20} color={THEME.colors.primary} />
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>Test Connection</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About AI Integration</Text>
          <Text style={styles.infoText}>
            • OpenAI API key is managed centrally by the app{'\n'}
            • API calls are made directly to OpenAI from your device{'\n'}
            • Configuration is loaded from environment variables{'\n'}
            • All AI features automatically use the configured settings{'\n'}
            • Test connection to verify the integration is working
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
  content: {
    flex: 1,
    padding: THEME.spacing.md,
  },
  title: {
    fontSize: THEME.fontSize.xxl,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.sm,
  },
  subtitle: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.lg,
    lineHeight: 22,
  },
  section: {
    marginBottom: THEME.spacing.lg,
  },
  sectionTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: '600',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.md,
  },
  statusCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
  },
  configCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  statusLabel: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.textSecondary,
  },
  statusValue: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.sm,
  },
  statusConnected: {
    backgroundColor: THEME.colors.success + '20',
  },
  statusDisconnected: {
    backgroundColor: THEME.colors.error + '20',
  },
  statusBadgeText: {
    fontSize: THEME.fontSize.sm,
    fontWeight: '500',
  },
  buttonContainer: {
    gap: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    gap: THEME.spacing.sm,
  },
  primaryButton: {
    backgroundColor: THEME.colors.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: THEME.colors.primary,
  },
  dangerButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: THEME.colors.error,
  },
  buttonText: {
    fontSize: THEME.fontSize.md,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  secondaryButtonText: {
    color: THEME.colors.primary,
  },
  dangerButtonText: {
    color: THEME.colors.error,
  },
  infoSection: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
  },
  infoTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: '600',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.sm,
  },
  infoText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    lineHeight: 20,
  },
});