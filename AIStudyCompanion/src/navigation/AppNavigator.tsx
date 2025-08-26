import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, Text } from 'react-native';
import { ROUTES, THEME } from '../constants';
import { useAuth } from '../contexts/AuthContext';

// Import screen components (we'll create these)
import WelcomeScreen from '../screens/WelcomeScreen';
import CanvasAuthScreen from '../screens/CanvasAuthScreen';
import CreateAccountScreen from '../screens/CreateAccountScreen';
import LoginScreen from '../screens/LoginScreen';
import StudyQueueScreen from '../screens/StudyQueueScreen';
import ContentCreatorScreen from '../screens/ContentCreatorScreen';
import SkillsCoachScreen from '../screens/SkillsCoachScreen';
import SettingsScreen from '../screens/SettingsScreen';
import FlashcardStudyScreen from '../screens/FlashcardStudyScreen';
import QuizStudyScreen from '../screens/QuizStudyScreen';
import ContentViewerScreen from '../screens/ContentViewerScreen';
import CustomInstructionsScreen from '../screens/CustomInstructionsScreen';
import StudyPreferencesScreen from '../screens/StudyPreferencesScreen';
import CanvasSettingsScreen from '../screens/CanvasSettingsScreen';
import DevTokenManagerScreen from '../screens/DevTokenManagerScreen';

// Type definitions for navigation
export type RootStackParamList = {
  [ROUTES.WELCOME]: undefined;
  [ROUTES.LOGIN]: undefined;
  [ROUTES.CANVAS_AUTH]: undefined;
  [ROUTES.CREATE_ACCOUNT]: {
    canvasUrl: string;
    accessToken: string;
    userInfo: {
      id: number;
      name: string;
      email: string;
      avatar_url?: string;
    };
  };
  MainApp: undefined;
};

export type MainTabParamList = {
  [ROUTES.STUDY_QUEUE]: undefined;
  [ROUTES.CONTENT_CREATOR]: undefined;
  [ROUTES.SKILLS_COACH]: undefined;
  [ROUTES.SETTINGS]: undefined;
};

export type StudyStackParamList = {
  [ROUTES.STUDY_QUEUE]: undefined;
  [ROUTES.FLASHCARD_STUDY]: { flashcardIds: string[]; courseId?: number };
  [ROUTES.QUIZ_STUDY]: { quizId: string };
  [ROUTES.CONTENT_VIEWER]: { contentType: string; contentId: string };
};

export type SettingsStackParamList = {
  [ROUTES.SETTINGS]: undefined;
  [ROUTES.CUSTOM_INSTRUCTIONS]: undefined;
  [ROUTES.STUDY_PREFERENCES]: undefined;
  [ROUTES.CANVAS_SETTINGS]: undefined;
  [ROUTES.DEV_TOKEN_MANAGER]: undefined;
};

const RootStack = createStackNavigator<RootStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const StudyStack = createStackNavigator<StudyStackParamList>();
const SettingsStack = createStackNavigator<SettingsStackParamList>();

// Study Stack Navigator
function StudyStackNavigator() {
  return (
    <StudyStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: THEME.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <StudyStack.Screen 
        name={ROUTES.STUDY_QUEUE} 
        component={StudyQueueScreen}
        options={{ title: 'Study Queue' }}
      />
      <StudyStack.Screen 
        name={ROUTES.FLASHCARD_STUDY} 
        component={FlashcardStudyScreen}
        options={{ title: 'Flashcard Study' }}
      />
      <StudyStack.Screen 
        name={ROUTES.QUIZ_STUDY} 
        component={QuizStudyScreen}
        options={{ title: 'Quiz Study' }}
      />
      <StudyStack.Screen 
        name={ROUTES.CONTENT_VIEWER} 
        component={ContentViewerScreen}
        options={{ title: 'Study Content' }}
      />
    </StudyStack.Navigator>
  );
}

// Settings Stack Navigator
function SettingsStackNavigator() {
  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: THEME.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <SettingsStack.Screen 
        name={ROUTES.SETTINGS} 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <SettingsStack.Screen 
        name={ROUTES.CUSTOM_INSTRUCTIONS} 
        component={CustomInstructionsScreen}
        options={{ title: 'Custom Instructions' }}
      />
      <SettingsStack.Screen 
        name={ROUTES.STUDY_PREFERENCES} 
        component={StudyPreferencesScreen}
        options={{ title: 'Study Preferences' }}
      />
      <SettingsStack.Screen 
        name={ROUTES.CANVAS_SETTINGS} 
        component={CanvasSettingsScreen}
        options={{ title: 'Canvas Settings' }}
      />
      <SettingsStack.Screen 
        name={ROUTES.DEV_TOKEN_MANAGER} 
        component={DevTokenManagerScreen}
        options={{ title: 'Dev Token Manager' }}
      />
    </SettingsStack.Navigator>
  );
}

// Main Tab Navigator
function MainAppNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case ROUTES.STUDY_QUEUE:
              iconName = focused ? 'library' : 'library-outline';
              break;
            case ROUTES.CONTENT_CREATOR:
              iconName = focused ? 'create' : 'create-outline';
              break;
            case ROUTES.SKILLS_COACH:
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case ROUTES.SETTINGS:
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: THEME.colors.primary,
        tabBarInactiveTintColor: THEME.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: THEME.colors.surface,
          borderTopColor: THEME.colors.border,
        },
        headerShown: false, // We handle headers in individual stack navigators
      })}
    >
      <MainTab.Screen 
        name={ROUTES.STUDY_QUEUE} 
        component={StudyStackNavigator}
        options={{ title: 'Study Queue' }}
      />
      <MainTab.Screen 
        name={ROUTES.CONTENT_CREATOR} 
        component={ContentCreatorScreen}
        options={{ title: 'Create Content' }}
      />
      <MainTab.Screen 
        name={ROUTES.SKILLS_COACH} 
        component={SkillsCoachScreen}
        options={{ title: 'Skills Coach' }}
      />
      <MainTab.Screen 
        name={ROUTES.SETTINGS} 
        component={SettingsStackNavigator}
        options={{ title: 'Settings' }}
      />
    </MainTab.Navigator>
  );
}

// Authentication Navigator Component
function AuthNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading screen while checking auth status
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.colors.background }}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={{ marginTop: 16, fontSize: 16, color: THEME.colors.textSecondary }}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!isAuthenticated ? (
        // Authentication screens - Always start with Welcome screen
        <>
          <RootStack.Screen name={ROUTES.WELCOME} component={WelcomeScreen} />
          <RootStack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
          <RootStack.Screen name={ROUTES.CANVAS_AUTH} component={CanvasAuthScreen} />
          <RootStack.Screen name={ROUTES.CREATE_ACCOUNT} component={CreateAccountScreen} />
        </>
      ) : (
        // Main app screens
        <RootStack.Screen name="MainApp" component={MainAppNavigator} />
      )}
    </RootStack.Navigator>
  );
}

// Root Navigator with Authentication Flow
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <AuthNavigator />
    </NavigationContainer>
  );
}