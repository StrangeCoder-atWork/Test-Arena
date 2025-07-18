import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function HomeScreen() {
  const router = useRouter();

  const switchExam = async () => {
    // await AsyncStorage.removeItem('@selectedExam');
    router.replace('/launch');
  };

  return (
    <SafeAreaView style={styles.container}>
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
          <Text style={styles.buttonText}>Dashboard</Text>
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
          <Text style={styles.buttonText}>🔖 Bookmarked</Text>
          <Text style={styles.buttonSub}>Saved questions with notes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/history')}
        >
          <Text style={styles.buttonText}>📊 Test History</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E0E',
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
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 15,
    color: '#A1A1A1',
    marginTop: 6,
  },
  buttons: {
    width: '90%',
    gap: 16,
  },
  button: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 18,
    elevation: 4,
    shadowColor: '#000',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonSub: {
    fontSize: 13,
    color: '#AAAAAA',
    marginTop: 4,
  },
  switchBtn: {
    backgroundColor: '#333',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 16,
    color: '#ccc',
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
    color: '#777',
    fontStyle: 'italic',
  },
});
