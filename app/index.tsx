import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  KeyboardAvoidingView, Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';
export default function HomeScreen() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const colors = Colors[theme];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 40,
    },
    header: {
      alignItems: 'center',
    },
    logo: {
      width: 90,
      height: 90,
      marginBottom: 16,
    },
    title: {
      fontSize: 26,
      fontWeight: '700',
      color: colors.text,
    },
    subtitle: {
      fontSize: 15,
      color: colors.subtitle,
      marginTop: 6,
    },
    buttons: {
      width: '90%',
      gap: 16,
    },
    button: {
      backgroundColor: colors.buttonBackground,
      borderRadius: 14,
      padding: 18,
      elevation: 4,
      shadowColor: '#000',
    },
    buttonText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.buttonText,
    },
    buttonSub: {
      fontSize: 13,
      color: colors.buttonSubText,
      marginTop: 4,
    },
    switchBtn: {
      backgroundColor: colors.switchBtnBackground,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
    },
    switchText: {
      fontSize: 16,
      color: colors.switchBtnText,
      fontWeight: '600',
    },
    footer: {
      alignItems: 'center',
      marginTop: 30,
    },
    footerLogo: {
      width: 30,
      height: 30,
      marginBottom: 7,
      opacity: 0.95,
    },
    footerText: {
      fontSize: 12,
      color: colors.subtitle,
      fontStyle: 'italic',
    },
    themeToggle: {
      position: 'absolute',
      top: 40,
      right: 20,
      padding: 10,
      borderRadius: 20,
      backgroundColor: colors.switchBtnBackground,
    },
    themeToggleText: {
      color: colors.switchBtnText,
      fontSize: 16,
    },
  });

  return (
    <KeyboardAvoidingView
  style={{ flex: 1 }}
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
>
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
        <Text style={styles.themeToggleText}>
          {theme === 'light' ? '🌙' : '☀️'}
        </Text>
      </TouchableOpacity>

      <Animated.View entering={FadeIn.duration(800)} style={styles.header}>
        <Image
          source={require('../assets/app_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Test Arena</Text>
        <Text style={styles.subtitle}>Your Arena For Exam Victory</Text>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(300)} style={styles.buttons}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/DashboardScreen')}
        >
          <Text style={styles.buttonText}>📊 Dashboard</Text>
          <Text style={styles.buttonSub}>Track Your Progress</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/test-setup')}
        >
          <Text style={styles.buttonText}>📝 Start New Test</Text>
          <Text style={styles.buttonSub}>Customize subject & chapter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/bookmarks')}
        >
          <Text style={styles.buttonText}>🔖 Bookmarks</Text>
          <Text style={styles.buttonSub}>Saved questions with notes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/history')}
        >
          <Text style={styles.buttonText}>⌛ Test History</Text>
          <Text style={styles.buttonSub}>View past tests & stats</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/BacklogTracker')}
        >
          <Text style={styles.buttonText}>📋 Tracker </Text>
          <Text style={styles.buttonSub}>View past tests & stats</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.switchBtn} onPress={() => router.push('/launch')}>
          <Text style={styles.switchText}>⚙️ Switch Exam</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.footer}>
        <Image
          source={require('../assets/logo.png')} // Your personal logo
          style={styles.footerLogo}
          resizeMode="contain"
        />
        <Text style={styles.footerText}>by The Strange Coder</Text>
      </View>
    </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
