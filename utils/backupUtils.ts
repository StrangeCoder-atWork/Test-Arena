// utils/backupUtils.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

const STORAGE_KEYS = [
  '@correctAnswers',
  '@bookmarks',
  '@xp',
  '@money',
  '@tasks',
  '@calendarData',
  '@userProfile',
  '@memory',
  '@streak',
  '@paperHistory',
  '@selectedExam1',
  '@lastScore',
  '@settings',
  '@level',
  '@xpHistory',
  '@dailyGoal',
];

interface BackupData {
  version: number;
  exportedAt: string;
  appVersion: string;
  payload: Record<string, any>;
}

export async function backupAppData(): Promise<void> {
  try {
    // Collect all data
    const payload: Record<string, any> = {};
    
    for (const key of STORAGE_KEYS) {
      try {
        const value = await AsyncStorage.getItem(key);
        payload[key] = value ? JSON.parse(value) : null;
      } catch (parseError) {
        console.warn(`Failed to parse ${key}:`, parseError);
        // Store as raw string if JSON parse fails
        payload[key] = await AsyncStorage.getItem(key);
      }
    }

    // Create backup object with metadata
    const backup: BackupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      appVersion: '1.0.0',
      payload,
    };

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `test_arena_backup_${timestamp}.json`;
    const filePath = FileSystem.documentDirectory + filename;

    // Write backup file
    await FileSystem.writeAsStringAsync(
      filePath, 
      JSON.stringify(backup, null, 2),
      {
        encoding: FileSystem.EncodingType.UTF8,
      }
    );

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert(
        'Backup Created',
        `File saved to: ${filePath}\n\nPlease manually copy this file to share it.`
      );
      return;
    }

    // Share the backup file
    await Sharing.shareAsync(filePath, {
      mimeType: 'application/json',
      dialogTitle: 'Export Test Arena Backup',
      UTI: 'public.json',
    });

  } catch (error) {
    console.error('Backup failed:', error);
    throw new Error(`Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function restoreAppData(): Promise<void> {
  try {
    // Pick the backup file
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/plain', '*/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      throw new Error('No file selected');
    }

    const fileUri = result.assets[0].uri;
    const fileName = result.assets[0].name || 'unknown';

    // Validate file extension
    if (!fileName.toLowerCase().includes('backup') && !fileName.endsWith('.json')) {
      Alert.alert(
        'Invalid File',
        'Please select a valid Test Arena backup file (.json)'
      );
      return;
    }

    // Read file content
    const fileContent = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Parse and validate backup data
    let backupData: BackupData;
    try {
      backupData = JSON.parse(fileContent);
    } catch (parseError) {
      throw new Error('Invalid backup file format. File may be corrupted.');
    }

    // Validate backup structure
    if (!backupData.payload || typeof backupData.payload !== 'object') {
      throw new Error('Invalid backup file structure');
    }

    // Version compatibility check
    if (backupData.version && backupData.version > 1) {
      Alert.alert(
        'Version Mismatch',
        'This backup was created with a newer version of the app. Please update the app to restore this backup.'
      );
      return;
    }

    // Confirm restore operation
    const confirmRestore = await new Promise<boolean>((resolve) => {
      Alert.alert(
        'Confirm Restore',
        `This will replace all current data with backup from:\n${backupData.exportedAt ? new Date(backupData.exportedAt).toLocaleString() : 'Unknown date'}\n\nAre you sure?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Restore', style: 'destructive', onPress: () => resolve(true) },
        ]
      );
    });

    if (!confirmRestore) return;

    // Backup current data before restore (safety measure)
    const currentBackup: Record<string, any> = {};
    for (const key of STORAGE_KEYS) {
      const value = await AsyncStorage.getItem(key);
      if (value) currentBackup[key] = value;
    }

    try {
      // Restore data
      const restoredKeys: string[] = [];
      for (const key of STORAGE_KEYS) {
        if (key in backupData.payload) {
          const value = backupData.payload[key];
          if (value !== null && value !== undefined) {
            await AsyncStorage.setItem(
              key, 
              typeof value === 'string' ? value : JSON.stringify(value)
            );
            restoredKeys.push(key);
          }
        }
      }

      Alert.alert(
        'Restore Complete',
        `Successfully restored ${restoredKeys.length} data items.\n\nPlease restart the app to see changes.`,
        [{ text: 'OK' }]
      );

    } catch (restoreError) {
      // Rollback on failure
      console.error('Restore failed, rolling back:', restoreError);
      for (const key of STORAGE_KEYS) {
        if (currentBackup[key]) {
          await AsyncStorage.setItem(key, currentBackup[key]);
        } else {
          await AsyncStorage.removeItem(key);
        }
      }
      throw new Error('Restore failed. Original data has been preserved.');
    }

  } catch (error) {
    console.error('Restore operation failed:', error);
    throw new Error(`Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Utility function to validate backup file
export async function validateBackupFile(fileUri: string): Promise<boolean> {
  try {
    const content = await FileSystem.readAsStringAsync(fileUri);
    const parsed = JSON.parse(content);
    return !!(parsed.payload && typeof parsed.payload === 'object');
  } catch {
    return false;
  }
}

// Get backup info without restoring
export async function getBackupInfo(fileUri: string): Promise<BackupData | null> {
  try {
    const content = await FileSystem.readAsStringAsync(fileUri);
    return JSON.parse(content) as BackupData;
  } catch {
    return null;
  }
}
