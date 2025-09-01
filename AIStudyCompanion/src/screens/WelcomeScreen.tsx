import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ROUTES, THEME, APP_CONFIG } from '../constants';

type WelcomeScreenNavigationProp = StackNavigationProp<RootStackParamList, typeof ROUTES.WELCOME>;

export default function WelcomeScreen() {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const rocketAnimation = useRef(new Animated.Value(0)).current;
  const starsAnimation = useRef(new Animated.Value(0)).current;
  const moonAnimation = useRef(new Animated.Value(0)).current;
  const titleAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Rocket floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(rocketAnimation, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(rocketAnimation, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Twinkling stars
    Animated.loop(
      Animated.timing(starsAnimation, {
        toValue: 1,
        duration: 2000,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      })
    ).start();

    // Moon glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(moonAnimation, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(moonAnimation, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Title entrance
    Animated.timing(titleAnimation, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.back(1.7)),
      useNativeDriver: true,
    }).start();
  }, []);

  const handleGetStarted = () => {
    navigation.navigate(ROUTES.CANVAS_AUTH);
  };

  const handleSignIn = () => {
    navigation.navigate(ROUTES.LOGIN);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cosmic Journey Scene */}
        <View style={styles.cosmicScene}>
          {/* Animated Stars Background */}
          <Animated.View style={[
            styles.starsContainer,
            {
              opacity: starsAnimation.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.3, 1, 0.3],
              }),
            }
          ]}>
            <Text style={[styles.star, {top: '10%', left: '20%'}]}>✨</Text>
            <Text style={[styles.star, {top: '15%', right: '25%'}]}>⭐</Text>
            <Text style={[styles.star, {top: '25%', left: '10%'}]}>💫</Text>
            <Text style={[styles.star, {top: '20%', right: '15%'}]}>✨</Text>
            <Text style={[styles.star, {top: '5%', left: '70%'}]}>⭐</Text>
            <Text style={[styles.star, {top: '30%', left: '80%'}]}>💫</Text>
          </Animated.View>
          
          {/* Moon with Glow */}
          <Animated.View style={[
            styles.moonContainer,
            {
              shadowColor: THEME.colors.moon,
              shadowRadius: moonAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 35],
              }),
              shadowOpacity: moonAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.8],
              }),
            }
          ]}>
            <Text style={styles.moonEmoji}>🌙</Text>
          </Animated.View>
          
          {/* Animated Rocket */}
          <Animated.View style={[
            styles.rocketContainer,
            {
              transform: [
                {
                  translateY: rocketAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -15],
                  }),
                },
                {
                  rotate: rocketAnimation.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: ['0deg', '2deg', '0deg'],
                  }),
                },
              ],
            }
          ]}>
            <Text style={styles.rocketEmoji}>🚀</Text>
          </Animated.View>
          
          {/* Earth in corner */}
          <View style={styles.earthContainer}>
            <Text style={styles.earthEmoji}>🌍</Text>
          </View>
        </View>

        {/* Journey Mission Brief */}
        <Animated.View style={[
          styles.textContainer,
          {
            transform: [
              {
                scale: titleAnimation,
              },
              {
                translateY: titleAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
            opacity: titleAnimation,
          }
        ]}>
          <Text style={styles.title}>🚀 {APP_CONFIG.name}</Text>
          <Text style={styles.subtitle}>
            Begin your weekly learning journey with{'\n'}AI-powered study tools!
          </Text>
          
          <View style={styles.missionBriefing}>
            <View style={styles.journeyStep}>
              <Text style={styles.stepEmoji}>📚</Text>
              <Text style={styles.stepText}>Complete assignments and study goals</Text>
            </View>
            <View style={styles.journeyStep}>
              <Text style={styles.stepEmoji}>⚡</Text>
              <Text style={styles.stepText}>Learn with AI-generated study materials</Text>
            </View>
            <View style={styles.journeyStep}>
              <Text style={styles.stepEmoji}>🌙</Text>
              <Text style={styles.stepText}>Achieve your weekly study goals!</Text>
            </View>
          </View>
        </Animated.View>

        {/* Launch Controls */}
        <View style={styles.launchContainer}>
          <TouchableOpacity style={styles.launchButton} onPress={handleGetStarted}>
            <Text style={styles.launchButtonText}>🚀 Get Started</Text>
            <Text style={styles.launchButtonSubtext}>Connect to Canvas</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.returnButton} onPress={handleSignIn}>
            <Text style={styles.returnButtonText}>📚 Returning User? Sign In</Text>
          </TouchableOpacity>
          
          <Text style={styles.missionBrief}>
            📚 Connect your Canvas to begin your learning journey
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
  content: {
    flexGrow: 1,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.xl,
  },
  
  // Cosmic Scene Styles
  cosmicScene: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
  },
  starsContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  star: {
    position: 'absolute',
    fontSize: 16,
  },
  moonContainer: {
    position: 'absolute',
    top: 10,
    right: 30,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  moonEmoji: {
    fontSize: 40,
  },
  rocketContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  rocketEmoji: {
    fontSize: 80,
    textShadowColor: THEME.colors.rocket,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  earthContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
  },
  earthEmoji: {
    fontSize: 30,
  },
  
  // Mission Brief Styles
  textContainer: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.sm,
    marginBottom: THEME.spacing.lg,
  },
  title: {
    fontSize: THEME.fontSize.xxl + 4,
    fontWeight: 'bold',
    color: THEME.colors.text,
    textAlign: 'center',
    marginBottom: THEME.spacing.sm,
    textShadowColor: THEME.colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: THEME.fontSize.lg,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: THEME.spacing.lg,
    fontWeight: '500',
    maxWidth: '90%',
  },
  missionBriefing: {
    alignSelf: 'stretch',
    paddingHorizontal: THEME.spacing.lg,
    backgroundColor: THEME.colors.surface + '60',
    borderRadius: THEME.borderRadius.xl,
    paddingVertical: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.primary + '40',
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  journeyStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.xs,
  },
  stepEmoji: {
    fontSize: 20,
    marginRight: THEME.spacing.sm,
    width: 28,
  },
  stepText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text,
    lineHeight: 20,
    flex: 1,
    fontWeight: '500',
  },
  
  // Launch Controls Styles
  launchContainer: {
    alignItems: 'center',
    paddingTop: THEME.spacing.md,
    marginTop: 'auto',
    paddingBottom: THEME.spacing.md,
  },
  launchButton: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: THEME.spacing.xl,
    paddingVertical: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.xl,
    minWidth: 220,
    marginBottom: THEME.spacing.lg,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: THEME.colors.rocket + '40',
  },
  launchButtonText: {
    color: '#fff',
    fontSize: THEME.fontSize.lg + 2,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: THEME.spacing.xs,
  },
  launchButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: THEME.fontSize.sm,
    textAlign: 'center',
    fontWeight: '500',
  },
  returnButton: {
    paddingVertical: THEME.spacing.md,
    marginBottom: THEME.spacing.xl,
    paddingHorizontal: THEME.spacing.lg,
    backgroundColor: THEME.colors.cosmic,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.secondary + '50',
  },
  returnButtonText: {
    color: THEME.colors.secondary,
    fontSize: THEME.fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  missionBrief: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: THEME.spacing.md,
    fontStyle: 'italic',
  },
});