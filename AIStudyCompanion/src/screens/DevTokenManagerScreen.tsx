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
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants';
import authService from '../services/authService';

interface AccountInfo {
  username: string;
  createdAt: string;
  lastLogin: string;
}

export default function DevTokenManagerScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isDevMode, setIsDevMode] = useState(false);
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [totalAccounts, setTotalAccounts] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const devModeEnabled = await authService.isDevModeEnabled();
      setIsDevMode(devModeEnabled);

      const stats = await authService.getAccountStats();
      setAccounts(stats.accounts);
      setTotalAccounts(stats.totalAccounts);
    } catch (error) {
      console.error('Error loading dev data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDevMode = async () => {
    try {
      if (isDevMode) {
        await authService.disableDevMode();
        Alert.alert('Dev Mode Disabled', 'Development features are now hidden.');
      } else {
        await authService.enableDevMode();
        Alert.alert('Dev Mode Enabled', 'Development features are now available.');
      }
      setIsDevMode(!isDevMode);
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle dev mode');
    }
  };

  const clearAllData = () => {
    Alert.alert(
      '⚠️ Clear All Data',
      'This will permanently delete ALL stored accounts, passwords, and Canvas tokens. This action cannot be undone.\n\nAre you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.clearAllData();
              await loadData();
              Alert.alert('Success', 'All stored data has been cleared.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const deleteSpecificAccount = (username: string) => {
    Alert.alert(
      'Delete Account',
      `Delete account "${username}" and all associated data?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await authService.deleteAccount(username);
              if (success) {
                await loadData();
                Alert.alert('Success', `Account "${username}" deleted.`);
              } else {
                Alert.alert('Error', 'Account not found or failed to delete.');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
          <Text style={styles.loadingText}>Loading development data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="build" size={32} color={THEME.colors.warning} />
          <Text style={styles.headerTitle}>Development Token Manager</Text>
          <Text style={styles.headerSubtitle}>
            Manage stored tokens and accounts during development
          </Text>
        </View>

        {/* Warning Banner */}
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={24} color={THEME.colors.warning} />
          <View style={styles.warningTextContainer}>
            <Text style={styles.warningTitle}>Development Only</Text>
            <Text style={styles.warningText}>
              This screen is for development purposes only. Use with caution.
            </Text>
          </View>
        </View>

        {/* Dev Mode Toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Development Mode</Text>
          <TouchableOpacity style={styles.toggleCard} onPress={toggleDevMode}>
            <View style={styles.toggleContent}>
              <Text style={styles.toggleTitle}>
                Dev Mode: {isDevMode ? 'Enabled' : 'Disabled'}
              </Text>
              <Text style={styles.toggleDescription}>
                {isDevMode 
                  ? 'Development features are visible'
                  : 'Development features are hidden'
                }
              </Text>
            </View>
            <View style={[
              styles.toggleIndicator,
              { backgroundColor: isDevMode ? THEME.colors.success : THEME.colors.textSecondary }
            ]} />
          </TouchableOpacity>
        </View>

        {/* Account Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Statistics</Text>
          <View style={styles.statsCard}>
            <Text style={styles.statsNumber}>{totalAccounts}</Text>
            <Text style={styles.statsLabel}>Total Accounts Stored</Text>
          </View>
        </View>

        {/* Stored Accounts */}
        {accounts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stored Accounts</Text>
            {accounts.map((account, index) => (
              <View key={index} style={styles.accountCard}>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountUsername}>@{account.username}</Text>
                  <Text style={styles.accountDetail}>
                    Created: {formatDate(account.createdAt)}
                  </Text>
                  <Text style={styles.accountDetail}>
                    Last Login: {formatDate(account.lastLogin)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteSpecificAccount(account.username)}
                >
                  <Ionicons name="trash" size={20} color={THEME.colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Danger Zone */}
        <View style={styles.dangerSection}>
          <Text style={styles.dangerTitle}>⚠️ Danger Zone</Text>
          
          <TouchableOpacity style={styles.dangerButton} onPress={clearAllData}>
            <Ionicons name="nuclear" size={24} color="#fff" />
            <View style={styles.dangerButtonContent}>
              <Text style={styles.dangerButtonTitle}>Clear All Data</Text>
              <Text style={styles.dangerButtonDescription}>
                Delete all accounts, passwords, and tokens
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>What gets stored securely:</Text>
          <Text style={styles.infoItem}>• Canvas access tokens (encrypted)</Text>
          <Text style={styles.infoItem}>• Canvas institution URLs (encrypted)</Text>
          <Text style={styles.infoItem}>• User passwords (hashed with salt)</Text>
          <Text style={styles.infoItem}>• Account metadata (encrypted)</Text>
          <Text style={styles.infoNote}>
            All sensitive data is stored using Expo SecureStore with hardware-backed encryption when available.
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.textSecondary,
    marginTop: THEME.spacing.md,
  },
  content: {
    flex: 1,
    paddingHorizontal: THEME.spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.xl,
  },
  headerTitle: {
    fontSize: THEME.fontSize.xl,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginTop: THEME.spacing.sm,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: THEME.spacing.xs,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    marginBottom: THEME.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: THEME.colors.warning,
  },
  warningTextContainer: {
    flex: 1,
    marginLeft: THEME.spacing.sm,
  },
  warningTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: 'bold',
    color: '#856404',
  },
  warningText: {
    fontSize: THEME.fontSize.sm,
    color: '#856404',
    marginTop: THEME.spacing.xs,
  },
  section: {
    marginBottom: THEME.spacing.xl,
  },
  sectionTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.md,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  toggleContent: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: 'bold',
    color: THEME.colors.text,
  },
  toggleDescription: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    marginTop: THEME.spacing.xs,
  },
  toggleIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  statsCard: {
    backgroundColor: THEME.colors.primary,
    padding: THEME.spacing.xl,
    borderRadius: THEME.borderRadius.lg,
    alignItems: 'center',
  },
  statsNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsLabel: {
    fontSize: THEME.fontSize.md,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: THEME.spacing.xs,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    marginBottom: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  accountInfo: {
    flex: 1,
  },
  accountUsername: {
    fontSize: THEME.fontSize.md,
    fontWeight: 'bold',
    color: THEME.colors.text,
  },
  accountDetail: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.textSecondary,
    marginTop: THEME.spacing.xs,
  },
  deleteButton: {
    padding: THEME.spacing.sm,
  },
  dangerSection: {
    backgroundColor: '#FADBD8',
    padding: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.lg,
    marginBottom: THEME.spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: THEME.colors.error,
  },
  dangerTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: 'bold',
    color: THEME.colors.error,
    marginBottom: THEME.spacing.md,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.error,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
  },
  dangerButtonContent: {
    flex: 1,
    marginLeft: THEME.spacing.sm,
  },
  dangerButtonTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: 'bold',
    color: '#fff',
  },
  dangerButtonDescription: {
    fontSize: THEME.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: THEME.spacing.xs,
  },
  infoSection: {
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.lg,
    marginBottom: THEME.spacing.xl,
  },
  infoTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.md,
  },
  infoItem: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text,
    marginBottom: THEME.spacing.xs,
  },
  infoNote: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.textSecondary,
    marginTop: THEME.spacing.md,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});