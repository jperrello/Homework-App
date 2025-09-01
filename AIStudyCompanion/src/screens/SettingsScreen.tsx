import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { SettingsStackParamList } from '../navigation/AppNavigator';
import { ROUTES, THEME, APP_CONFIG } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';

type SettingsScreenNavigationProp = StackNavigationProp<SettingsStackParamList, typeof ROUTES.SETTINGS>;

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: keyof SettingsStackParamList;
  onPress?: () => void;
}

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { currentUser, logout } = useAuth();
  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    checkDevMode();
  }, []);

  const checkDevMode = async () => {
    const devModeEnabled = await authService.isDevModeEnabled();
    setIsDevMode(devModeEnabled);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            // AuthContext will handle navigation automatically
          },
        },
      ]
    );
  };

  const settingsItems: SettingItem[] = [
    {
      id: 'custom-instructions',
      title: 'Custom Instructions',
      subtitle: 'Personalize how AI responds to you',
      icon: 'options',
      route: ROUTES.CUSTOM_INSTRUCTIONS,
    },
    {
      id: 'study-preferences',
      title: 'Study Preferences',
      subtitle: 'Set your daily goals and notification settings',
      icon: 'book',
      route: ROUTES.STUDY_PREFERENCES,
    },
    {
      id: 'openai-settings',
      title: 'AI Settings',
      subtitle: 'Configure OpenAI API for enhanced AI features',
      icon: 'hardware-chip',
      route: ROUTES.OPENAI_SETTINGS,
    },
    {
      id: 'canvas-settings',
      title: 'Canvas Settings',
      subtitle: 'Manage your Canvas connection',
      icon: 'link',
      route: ROUTES.CANVAS_SETTINGS,
    },
  ];

  const developerItems: SettingItem[] = isDevMode ? [
    {
      id: 'dev-token-manager',
      title: 'Dev Token Manager',
      subtitle: 'Manage stored tokens and accounts (Dev Only)',
      icon: 'build',
      route: ROUTES.DEV_TOKEN_MANAGER,
    },
  ] : [];

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data including:\n\n• All flashcards and study sets\n• Study history and progress\n• Canvas integration settings\n• Custom preferences\n\nThis action cannot be undone. Are you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'Are you absolutely sure? This will permanently delete all your data.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const result = await authService.deleteCurrentAccount();
                      if (result.success) {
                        Alert.alert(
                          'Account Deleted', 
                          'Your account and all data have been permanently deleted. You will now be returned to the sign up screen.',
                          [
                            {
                              text: 'OK',
                              onPress: async () => {
                                await logout();
                              },
                            },
                          ]
                        );
                      } else {
                        Alert.alert('Error', result.error || 'Failed to delete account. Please try again.');
                      }
                    } catch (error) {
                      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const accountItems: SettingItem[] = [
    {
      id: 'sync-data',
      title: 'Sync Data',
      subtitle: 'Sync your study progress across devices',
      icon: 'sync',
      onPress: () => console.log('Sync data'),
    },
    {
      id: 'export-data',
      title: 'Export Data',
      subtitle: 'Export your flashcards and study history',
      icon: 'download',
      onPress: () => console.log('Export data'),
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      subtitle: 'Manage your data and privacy settings',
      icon: 'shield-checkmark',
      onPress: () => console.log('Privacy settings'),
    },
  ];

  const supportItems: SettingItem[] = [
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'Get help using the app',
      icon: 'help-circle',
      onPress: () => console.log('Help'),
    },
    {
      id: 'feedback',
      title: 'Send Feedback',
      subtitle: 'Help us improve the app',
      icon: 'chatbubble-ellipses',
      onPress: () => console.log('Feedback'),
    },
    {
      id: 'about',
      title: 'About',
      subtitle: `Version ${APP_CONFIG.version}`,
      icon: 'information-circle',
      onPress: () => console.log('About'),
    },
  ];

  const handleItemPress = (item: SettingItem) => {
    if (item.route) {
      navigation.navigate(item.route);
    } else if (item.onPress) {
      item.onPress();
    }
  };

  const renderSettingItem = (item: SettingItem) => {
    const isDangerous = item.id === 'delete-account';
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.settingItem, isDangerous && styles.dangerousSettingItem]}
        onPress={() => handleItemPress(item)}
      >
        <View style={styles.settingIcon}>
          <Ionicons 
            name={item.icon} 
            size={24} 
            color={isDangerous ? THEME.colors.error : THEME.colors.primary} 
          />
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, isDangerous && styles.dangerousSettingTitle]}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          )}
        </View>
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={isDangerous ? THEME.colors.error : THEME.colors.textSecondary} 
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>
          {currentUser ? `Signed in as @${currentUser.username}` : 'Customize your study experience'}
        </Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personalization</Text>
          {settingsItems.map(renderSettingItem)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account & Data</Text>
          {accountItems.map(renderSettingItem)}
        </View>

        {isDevMode && developerItems.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, styles.devSectionTitle]}>Developer</Text>
            {developerItems.map(renderSettingItem)}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          {supportItems.map(renderSettingItem)}
        </View>

        <View style={styles.dangerSection}>
          <TouchableOpacity style={styles.dangerItem} onPress={handleSignOut}>
            <Ionicons name="log-out" size={24} color={THEME.colors.error} />
            <Text style={styles.dangerText}>Sign Out</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dangerItem, { marginTop: THEME.spacing.sm }]} onPress={handleDeleteAccount}>
            <Ionicons name="trash" size={24} color={THEME.colors.error} />
            <Text style={styles.dangerText}>Delete Account</Text>
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
  section: {
    marginTop: THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.lg,
  },
  sectionTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: 'bold',
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.md,
    textTransform: 'uppercase',
  },
  devSectionTitle: {
    color: THEME.colors.warning,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    marginBottom: THEME.spacing.sm,
  },
  settingIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: THEME.spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.xs,
  },
  settingSubtitle: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
  },
  dangerousSettingItem: {
    borderColor: THEME.colors.error,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
  },
  dangerousSettingTitle: {
    color: THEME.colors.error,
  },
  dangerSection: {
    marginTop: THEME.spacing.xl,
    paddingHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.xl,
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    justifyContent: 'center',
  },
  dangerText: {
    fontSize: THEME.fontSize.md,
    fontWeight: 'bold',
    color: THEME.colors.error,
    marginLeft: THEME.spacing.sm,
  },
});