import { useRouter } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInUp, SlideInDown } from 'react-native-reanimated';
import { Colors } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const colors = Colors[theme];

  // Dynamic logo selection based on theme
  const getAppLogo = () => {
    return theme === 'light' 
      ? require('../assets/app_logo1.png')  // White mode logo
      : require('../assets/app_logo.png');  // Dark mode logo
  };

  const getMyLogo = () => {
    return require('../assets/logo.png');  // Your personal logo
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* Theme Toggle */}
          <TouchableOpacity style={[styles.themeToggle, { backgroundColor: colors.switchBtnBackground }]} onPress={toggleTheme}>
            <Text style={[styles.themeToggleText, { color: colors.switchBtnText }]}>
              {theme === 'light' ? '🌙' : '☀️'}
            </Text>
          </TouchableOpacity>

          {/* Premium Header Section */}
          <Animated.View entering={FadeInUp.duration(800)} style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <View style={[ { backgroundColor: colors.buttonBackground }]}>
                <Image
                  source={getAppLogo()}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
            </View>
            
            <View style={styles.titleContainer}>
              <Text style={[styles.appName, { color: colors.text }]}>Test Arena</Text>
              <Text style={[styles.tagline, { color: colors.subtitle }]}>Your Arena For Exam Victory</Text>
              <View style={[styles.accentLine, { backgroundColor: colors.buttonBackground }]} />
            </View>
          </Animated.View>

          {/* Main Action Cards */}
          <Animated.View entering={FadeIn.duration(1000).delay(200)} style={styles.mainSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
            
            <View style={styles.primaryGrid}>
              <TouchableOpacity
                style={[styles.primaryCard, { backgroundColor: colors.buttonBackground }]}
                onPress={() => router.push('/DashboardScreen')}
                activeOpacity={0.8}
              >
                <View style={styles.cardIcon}>
                  <Text style={styles.cardEmoji}>📊</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, { color: colors.buttonText }]}>Dashboard</Text>
                  <Text style={[styles.cardSubtitle, { color: colors.buttonSubText }]}>Track Progress & Analytics</Text>
                </View>
                <View style={styles.cardArrow}>
                  <Text style={[styles.arrowText, { color: colors.buttonSubText }]}>→</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryCard, { backgroundColor: colors.buttonBackground }]}
                onPress={() => router.push('/test-setup')}
                activeOpacity={0.8}
              >
                <View style={styles.cardIcon}>
                  <Text style={styles.cardEmoji}>📝</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, { color: colors.buttonText }]}>Start Test</Text>
                  <Text style={[styles.cardSubtitle, { color: colors.buttonSubText }]}>Start Practice Session</Text>
                </View>
                <View style={styles.cardArrow}>
                  <Text style={[styles.arrowText, { color: colors.buttonSubText }]}>→</Text>
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Feature Grid */}
          <Animated.View entering={SlideInDown.duration(800).delay(400)} style={styles.featuresSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Learning Tools</Text>
            
            <View style={styles.featureGrid}>
              <TouchableOpacity
                style={[styles.featureCard, { backgroundColor: colors.switchBtnBackground }]}
                onPress={() => router.push('/bookmarks')}
                activeOpacity={0.7}
              >
                <Text style={styles.featureEmoji}>🔖</Text>
                <Text style={[styles.featureTitle, { color: colors.switchBtnText }]}>Bookmarks</Text>
                <Text style={[styles.featureSubtext, { color: colors.subtitle }]}>Saved Notes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.featureCard, { backgroundColor: colors.switchBtnBackground }]}
                onPress={() => router.push('/history')}
                activeOpacity={0.7}
              >
                <Text style={styles.featureEmoji}>⌛</Text>
                <Text style={[styles.featureTitle, { color: colors.switchBtnText }]}>History</Text>
                <Text style={[styles.featureSubtext, { color: colors.subtitle }]}>Past Results</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.featureCard, { backgroundColor: colors.switchBtnBackground }]}
                onPress={() => router.push('/BacklogTracker')}
                activeOpacity={0.7}
              >
                <Text style={styles.featureEmoji}>📋</Text>
                <Text style={[styles.featureTitle, { color: colors.switchBtnText }]}>Productivity Hub</Text>
                <Text style={[styles.featureSubtext, { color: colors.subtitle }]}>Smart Task & Habit Manager</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.featureCard, { backgroundColor: colors.switchBtnBackground }]}
                onPress={() => router.push('/launch')}
                activeOpacity={0.7}
              >
                <Text style={styles.featureEmoji}>⚙️</Text>
                <Text style={[styles.featureTitle, { color: colors.switchBtnText }]}>Settings</Text>
                <Text style={[styles.featureSubtext, { color: colors.subtitle }]}>Switch Exam</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Data Management Section */}
          <Animated.View entering={FadeIn.duration(800).delay(600)} style={styles.dataSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Management</Text>
            
            <View style={styles.dataGrid}>
              <TouchableOpacity
                style={[styles.dataCard, { backgroundColor: colors.buttonBackground, borderColor: '#4CAF50' }]}
                onPress={() => router.push('/backup')}
                activeOpacity={0.8}
              >
                <View style={styles.dataIconContainer}>
                  <View style={[styles.dataIcon, { backgroundColor: '#4CAF5020' }]}>
                    <Text style={[styles.dataIconText, { color: '#4CAF50' }]}>💾</Text>
                  </View>
                </View>
                <View style={styles.dataContent}>
                  <Text style={[styles.dataTitle, { color: colors.buttonText }]}>Backup Data</Text>
                  <Text style={[styles.dataSubtitle, { color: colors.buttonSubText }]}>
                    Save your progress securely to device storage
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: '#4CAF5020' }]}>
                  <Text style={[styles.statusText, { color: '#4CAF50' }]}>Export</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dataCard, { backgroundColor: colors.buttonBackground, borderColor: '#2196F3' }]}
                onPress={() => router.push('/restore')}
                activeOpacity={0.8}
              >
                <View style={styles.dataIconContainer}>
                  <View style={[styles.dataIcon, { backgroundColor: '#2196F320' }]}>
                    <Text style={[styles.dataIconText, { color: '#2196F3' }]}>📥</Text>
                  </View>
                </View>
                <View style={styles.dataContent}>
                  <Text style={[styles.dataTitle, { color: colors.buttonText }]}>Restore Data</Text>
                  <Text style={[styles.dataSubtitle, { color: colors.buttonSubText }]}>
                    Import your saved progress from backup files
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: '#2196F320' }]}>
                  <Text style={[styles.statusText, { color: '#2196F3' }]}>Import</Text>
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Enhanced Premium Footer with Your Logo */}
          <Animated.View entering={FadeIn.duration(800).delay(800)} style={styles.footerSection}>
            <View style={styles.footerContent}>
              {/* Your Personal Logo */}
              <Image
                source={getMyLogo()}
                style={styles.footerLogo}
                resizeMode="contain"
              />
              <Text style={[styles.footerText, { color: colors.subtitle }]}>
               by The Strange Coder
              </Text>
              <Text style={[styles.versionText, { color: colors.subtitle }]}>
                Version 1.0.0 • Test Arena Pro
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  themeToggle: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  themeToggleText: {
    fontSize: 20,
  },

  headerSection: {
    paddingTop: 100,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 40,
  },

  logoContainer: {
    marginBottom: 1,
  },

  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },

  logo: {
    width: 90,      // Increased size for better visibility
    height: 90, 
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 6 },    // Increased size for better visibility
  },

  titleContainer: {
    alignItems: 'center',
  },

  appName: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 1,
  },

  tagline: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center',
  },

  accentLine: {
    width: 60,
    height: 4,
    borderRadius: 2,
  },

  mainSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    letterSpacing: 0.5,
  },

  primaryGrid: {
    gap: 16,
  },

  primaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 12,
  },

  cardIcon: {
    marginRight: 16,
  },

  cardEmoji: {
    fontSize: 32,
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },

  cardSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },

  cardArrow: {
    marginLeft: 12,
  },

  arrowText: {
    fontSize: 20,
    fontWeight: '300',
  },

  featuresSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },

  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },

  featureCard: {
    width: '47%',
    padding: 20,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },

  featureEmoji: {
    fontSize: 28,
    marginBottom: 12,
  },

  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },

  featureSubtext: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },

  dataSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },

  dataGrid: {
    gap: 16,
  },

  dataCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 12,
  },

  dataIconContainer: {
    marginRight: 16,
  },

  dataIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  dataIconText: {
    fontSize: 24,
  },

  dataContent: {
    flex: 1,
  },

  dataTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },

  dataSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  footerSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    alignItems: 'center',
  },

  footerContent: {
    alignItems: 'center',
  },

  footerLogo: {
    width: 38,      // Increased size for your personal logo
    height: 38,     // Increased size for your personal logo
    marginBottom: 12,
    opacity: 0.9,   // Slightly more visible
  },

  footerText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    textAlign: 'center',
  },

  versionText: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
  },
});
