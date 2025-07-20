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
import { backupAppData } from '../utils/backupUtils';

export default function BackupScreen() {
  const router = useRouter();
  const [status, setStatus] = useState('Preparing backup...');

  useEffect(() => {
    performBackup();
  }, []);

  const performBackup = async () => {
    try {
      setStatus('Collecting your data...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // UX delay
      
      setStatus('Creating backup file...');
      await backupAppData();
      
      Alert.alert(
        '✅ Backup Complete', 
        'Your app data has been successfully backed up and is ready to share.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Backup error:', error);
      Alert.alert(
        '❌ Backup Failed', 
        error instanceof Error ? error.message : 'An unknown error occurred during backup.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.duration(500)} style={styles.content}>
        <ActivityIndicator size="large" color="#00E5FF" style={styles.spinner} />
        <Text style={styles.title}>Creating Backup</Text>
        <Text style={styles.status}>{status}</Text>
        <Text style={styles.subtitle}>
          This may take a few moments depending on your data size
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
