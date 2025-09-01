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
import AccountSetupScreen from '../screens/AccountSetupScreen';
import LoginScreen from '../screens/LoginScreen';
import StudyQueueScreen from '../screens/StudyQueueScreen';
import ContentCreatorScreen from '../screens/ContentCreatorScreen';
import ChatbotScreen from '../screens/ChatbotScreen';
import SettingsScreen from '../screens/SettingsScreen';
import FlashcardCreationScreen from '../screens/FlashcardCreationScreen';
import FlashcardStudyScreen from '../screens/FlashcardStudyScreen';
import QuizStudyScreen from '../screens/QuizStudyScreen';
import ContentViewerScreen from '../screens/ContentViewerScreen';
import CustomInstructionsScreen from '../screens/CustomInstructionsScreen';
import StudyPreferencesScreen from '../screens/StudyPreferencesScreen';
import CanvasSettingsScreen from '../screens/CanvasSettingsScreen';
import OpenAISettingsScreen from '../screens/OpenAISettingsScreen';
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
  [ROUTES.ACCOUNT_SETUP]: undefined;
  MainApp: undefined;
};

export type MainTabParamList = {
  [ROUTES.STUDY_QUEUE]: undefined;
  [ROUTES.CONTENT_CREATOR]: undefined;
  [ROUTES.CHATBOT]: undefined;
  [ROUTES.SETTINGS]: undefined;
};

export type ContentCreatorStackParamList = {
  [ROUTES.CONTENT_CREATOR]: undefined;
  [ROUTES.FLASHCARD_CREATION]: undefined;
};

export type StudyStackParamList = {
  [ROUTES.STUDY_QUEUE]: undefined;
  [ROUTES.FLASHCARD_CREATION]: undefined;
  [ROUTES.FLASHCARD_STUDY]: { flashcardIds: string[]; courseId?: number };
  [ROUTES.QUIZ_STUDY]: { quizId: string };
  [ROUTES.CONTENT_VIEWER]: { contentType: string; contentId: string };
};

export type SettingsStackParamList = {
  [ROUTES.SETTINGS]: undefined;
  [ROUTES.CUSTOM_INSTRUCTIONS]: undefined;
  [ROUTES.STUDY_PREFERENCES]: undefined;
  [ROUTES.CANVAS_SETTINGS]: undefined;
  [ROUTES.OPENAI_SETTINGS]: undefined;
  [ROUTES.DEV_TOKEN_MANAGER]: undefined;
};

const RootStack = createStackNavigator<RootStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const StudyStack = createStackNavigator<StudyStackParamList>();
const ContentCreatorStack = createStackNavigator<ContentCreatorStackParamList>();
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
        name={ROUTES.FLASHCARD_CREATION} 
        component={FlashcardCreationScreen}
        options={{ title: 'Create Flashcards', headerShown: false }}
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

// Content Creator Stack Navigator
function ContentCreatorStackNavigator() {
  return (
    <ContentCreatorStack.Navigator
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
      <ContentCreatorStack.Screen 
        name={ROUTES.CONTENT_CREATOR} 
        component={ContentCreatorScreen}
        options={{ title: 'Content Creator', headerShown: false }}
      />
      <ContentCreatorStack.Screen 
        name={ROUTES.FLASHCARD_CREATION} 
        component={FlashcardCreationScreen}
        options={{ title: 'Create Flashcards', headerShown: false }}
      />
    </ContentCreatorStack.Navigator>
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
        name={ROUTES.OPENAI_SETTINGS} 
        component={OpenAISettingsScreen}
        options={{ title: 'AI Settings' }}
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
          // Cosmic themed icons with emojis
          switch (route.name) {
            case ROUTES.STUDY_QUEUE:
              return (
                <View style={{ alignItems: 'center' }}>
                  {focused ? 
                    <Text style={{ fontSize: size + 2 }}>🚀</Text> : 
                    <Text style={{ fontSize: size, opacity: 0.7 }}>🛸</Text>
                  }
                </View>
              );
            case ROUTES.CONTENT_CREATOR:
              return (
                <View style={{ alignItems: 'center' }}>
                  {focused ? 
                    <Text style={{ fontSize: size + 2 }}>⭐</Text> : 
                    <Text style={{ fontSize: size, opacity: 0.7 }}>✨</Text>
                  }
                </View>
              );
            case ROUTES.CHATBOT:
              return (
                <View style={{ alignItems: 'center' }}>
                  {focused ? 
                    <Text style={{ fontSize: size + 2 }}>🤖</Text> : 
                    <Text style={{ fontSize: size, opacity: 0.7 }}>💬</Text>
                  }
                </View>
              );
            case ROUTES.SETTINGS:
              return (
                <View style={{ alignItems: 'center' }}>
                  {focused ? 
                    <Text style={{ fontSize: size + 2 }}>🛠️</Text> : 
                    <Text style={{ fontSize: size, opacity: 0.7 }}>⚙️</Text>
                  }
                </View>
              );
            default:
              return <Ionicons name={'help-outline'} size={size} color={color} />;
          }
        },
        tabBarActiveTintColor: THEME.colors.stars,
        tabBarInactiveTintColor: THEME.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: THEME.colors.surface,
          borderTopColor: THEME.colors.primary + '40',
          borderTopWidth: 2,
          paddingTop: 8,
          paddingBottom: 8,
          height: 70,
          shadowColor: THEME.colors.primary,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
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
        component={ContentCreatorStackNavigator}
        options={{ title: 'Create' }}
      />
      <MainTab.Screen 
        name={ROUTES.CHATBOT} 
        component={ChatbotScreen}
        options={{ title: 'AI Tutor' }}
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
  const { isAuthenticated, needsSetup, isLoading } = useAuth();

  // Show cosmic loading screen while checking auth status
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.colors.background }}>
        <Text style={{ fontSize: 60, marginBottom: 20 }}>🚀</Text>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={{ marginTop: 16, fontSize: 16, color: THEME.colors.textSecondary, fontWeight: '500' }}>
          🛰️ Loading...
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
      {isAuthenticated ? (
        // Main app screens - user is fully authenticated and setup is complete
        <RootStack.Screen name="MainApp" component={MainAppNavigator} />
      ) : needsSetup ? (
        // Setup screens - user has an account but needs to complete setup
        <>
          <RootStack.Screen 
            name={ROUTES.ACCOUNT_SETUP} 
            component={AccountSetupScreen}
            options={{ gestureEnabled: false }}
          />
          <RootStack.Screen 
            name={ROUTES.CREATE_ACCOUNT} 
            component={CreateAccountScreen} 
            options={{ gestureEnabled: false }}
          />
          <RootStack.Screen 
            name={ROUTES.CANVAS_AUTH} 
            component={CanvasAuthScreen} 
            options={{ gestureEnabled: false }}
          />
        </>
      ) : (
        // Authentication screens - no account or not logged in
        <>
          <RootStack.Screen name={ROUTES.WELCOME} component={WelcomeScreen} />
          <RootStack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
          <RootStack.Screen name={ROUTES.CANVAS_AUTH} component={CanvasAuthScreen} />
          <RootStack.Screen name={ROUTES.CREATE_ACCOUNT} component={CreateAccountScreen} />
          <RootStack.Screen name={ROUTES.ACCOUNT_SETUP} component={AccountSetupScreen} />
        </>
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