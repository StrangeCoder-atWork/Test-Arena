import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { restoreAppData } from '../utils/backupUtils';

export default function RestoreScreen() {
  const router = useRouter();
  const [status, setStatus] = useState('Opening file picker...');

  useEffect(() => {
    performRestore();
  }, []);

  const performRestore = async () => {
    try {
      setStatus('Please select your backup file...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setStatus('Reading backup file...');
      await restoreAppData();
      
      // Success is handled in the utility function
      router.back();
    } catch (error) {
      console.error('Restore error:', error);
      
      if (error instanceof Error && error.message.includes('No file selected')) {
        // User cancelled file selection
        router.back();
        return;
      }
      
      Alert.alert(
        '❌ Restore Failed', 
        error instanceof Error ? error.message : 'An unknown error occurred during restore.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.duration(500)} style={styles.content}>
        <ActivityIndicator size="large" color="#00E5FF" style={styles.spinner} />
        <Text style={styles.title}>Restoring Data</Text>
        <Text style={styles.status}>{status}</Text>
        <Text style={styles.subtitle}>
          Select a valid Test Arena backup file to restore your data
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  spinner: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  status: {
    fontSize: 16,
    color: '#00E5FF',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#AAA',
    textAlign: 'center',
    lineHeight: 20,
  },
});
