import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SettingsStackParamList } from '../navigation/AppNavigator';
import { THEME, ROUTES } from '../constants';
import canvasService from '../services/canvasService';
import { CanvasUser } from '../types';

type CanvasSettingsNavigationProp = StackNavigationProp<SettingsStackParamList, typeof ROUTES.CANVAS_SETTINGS>;

export default function CanvasSettingsScreen() {
  const navigation = useNavigation<CanvasSettingsNavigationProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [userInfo, setUserInfo] = useState<CanvasUser | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    setIsLoading(true);
    setConnectionError(null);
    
    try {
      if (canvasService.isAuthenticated()) {
        const testResult = await canvasService.testConnection();
        
        if (testResult) {
          const userResponse = await canvasService.getCurrentUser();
          if (userResponse.success) {
            setIsConnected(true);
            setUserInfo(userResponse.data);
          } else {
            setIsConnected(false);
            setConnectionError(userResponse.error || 'Failed to get user information');
          }
        } else {
          setIsConnected(false);
          setConnectionError('Connection test failed');
        }
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Error checking Canvas connection:', error);
      setIsConnected(false);
      setConnectionError('Error checking connection');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Canvas',
      'Are you sure you want to disconnect from Canvas? This will remove your access token and you\'ll need to reconnect to access your courses.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Disconnect', 
          style: 'destructive',
          onPress: async () => {
            try {
              await canvasService.removeAccessToken();
              setIsConnected(false);
              setUserInfo(null);
              setConnectionError(null);
              Alert.alert('Success', 'Disconnected from Canvas successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to disconnect from Canvas');
            }
          }
        }
      ]
    );
  };

  const handleReconnect = () => {
    // Navigate to Canvas auth screen
    navigation.navigate(ROUTES.CANVAS_AUTH as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Canvas Settings</Text>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.colors.primary} />
            <Text style={styles.loadingText}>Checking connection...</Text>
          </View>
        ) : (
          <View style={styles.statusContainer}>
            {isConnected && userInfo ? (
              <View>
                <View style={styles.statusCard}>
                  <Text style={styles.statusTitle}>✅ Connected to Canvas</Text>
                  <Text style={styles.statusText}>Welcome, {userInfo.name}!</Text>
                  {userInfo.email && (
                    <Text style={styles.statusSubtext}>{userInfo.email}</Text>
                  )}
                </View>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={checkConnectionStatus}
                >
                  <Text style={styles.actionButtonText}>Test Connection</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.disconnectButton]}
                  onPress={handleDisconnect}
                >
                  <Text style={[styles.actionButtonText, styles.disconnectButtonText]}>
                    Disconnect from Canvas
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={styles.statusCard}>
                  <Text style={styles.statusTitle}>❌ Not Connected to Canvas</Text>
                  {connectionError ? (
                    <Text style={styles.errorText}>Error: {connectionError}</Text>
                  ) : (
                    <Text style={styles.statusText}>
                      Connect your Canvas account to access courses and generate study materials.
                    </Text>
                  )}
                </View>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handleReconnect}
                >
                  <Text style={styles.actionButtonText}>Connect to Canvas</Text>
                </TouchableOpacity>
                
                {connectionError && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.secondaryButton]}
                    onPress={checkConnectionStatus}
                  >
                    <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
                      Retry Connection
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
        
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About Canvas Integration</Text>
          <Text style={styles.infoText}>
            • Access your enrolled courses and assignments
          </Text>
          <Text style={styles.infoText}>
            • Generate personalized study materials
          </Text>
          <Text style={styles.infoText}>
            • Your access token is stored securely on your device
          </Text>
          <Text style={styles.infoText}>
            • We never store your Canvas password
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: THEME.colors.background 
  },
  content: { 
    flex: 1, 
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.lg,
  },
  title: { 
    fontSize: THEME.fontSize.xxl, 
    fontWeight: 'bold', 
    color: THEME.colors.text, 
    marginBottom: THEME.spacing.xl,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: THEME.spacing.xl,
  },
  loadingText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.textSecondary,
    marginTop: THEME.spacing.md,
  },
  statusContainer: {
    marginBottom: THEME.spacing.xl,
  },
  statusCard: {
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.lg,
    marginBottom: THEME.spacing.lg,
  },
  statusTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.sm,
  },
  statusText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text,
    marginBottom: THEME.spacing.xs,
  },
  statusSubtext: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
  },
  errorText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.error,
    marginTop: THEME.spacing.xs,
  },
  actionButton: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.lg,
    marginBottom: THEME.spacing.md,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: THEME.fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  disconnectButton: {
    backgroundColor: THEME.colors.error,
  },
  disconnectButtonText: {
    color: '#fff',
  },
  secondaryButton: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  secondaryButtonText: {
    color: THEME.colors.text,
  },
  infoSection: {
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.lg,
    marginTop: THEME.spacing.lg,
  },
  infoTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.md,
  },
  infoText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.xs,
    lineHeight: 20,
  },
});