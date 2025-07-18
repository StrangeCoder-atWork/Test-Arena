import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

const filters = ['All', 'Correct', 'Wrong', 'Unattempted'];

export default function AnalysisScreen() {
  const { answers, timestamps } = useLocalSearchParams();
  const ua: string[] = JSON.parse(answers as string);
  const ts: number[] = JSON.parse(timestamps as string);
  const n = ua.length;
const router = useRouter();

  const [corrects, setCorrects] = useState<string[]>([]);
  const [qPhotos, setQPhotos] = useState<(string | null)[]>(Array(n).fill(null));
  const [sPhotos, setSPhotos] = useState<(string | null)[]>(Array(n).fill(null));
  const [showUpload, setShowUpload] = useState<boolean[]>(Array(n).fill(false));
  const [activeFilter, setActiveFilter] = useState('All');
useEffect(() => {
  (async () => {
    await ImagePicker.requestCameraPermissionsAsync();
    await ImagePicker.requestMediaLibraryPermissionsAsync();
  })();
}, []);

  useEffect(() => {
    (async () => {
      const saved = JSON.parse(await AsyncStorage.getItem('@correctAnswers') || '[]');
      const latest = saved.slice(-n);
      const correct = latest.map((q: any) => q.correctAnswer || '');
      setCorrects(correct);
    })();
  }, []);
const pickImageFromCameraOrGallery = async (): Promise<string | null> => {
  return new Promise((resolve) => {
    const openCamera = async () => {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: undefined,
        quality: 1,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        resolve(result.assets[0].uri);
      } else {
        resolve(null);
      }
    };

    const openGallery = async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: undefined,
        quality: 1,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        resolve(result.assets[0].uri);
      } else {
        resolve(null);
      }
    };

    Alert.alert('Upload Image', 'Choose image source:', [
      { text: 'Camera', onPress: openCamera },
      { text: 'Gallery', onPress: openGallery },
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
    ]);
  });
};
  const getFilteredIndices = () => {
    if (activeFilter === 'All') return ua.map((_, i) => i);
    if (activeFilter === 'Correct') return ua.map((a, i) => (a && a === corrects[i] ? i : -1)).filter(i => i !== -1);
    if (activeFilter === 'Wrong') return ua.map((a, i) => (a && a !== corrects[i] && corrects[i] ? i : -1)).filter(i => i !== -1);
    return ua.map((a, i) => (!a ? i : -1)).filter(i => i !== -1);
  };
  

  const pickAndBookmark = async (i: number) => {
  const qUri = await pickImageFromCameraOrGallery();
  if (!qUri) return Alert.alert('⚠️ Required', 'Question image is required to bookmark.');

  const saved = JSON.parse(await AsyncStorage.getItem('@correctAnswers') || '[]');
  const qData = saved[i];

  const entry = {
    exam: qData?.exam || 'N/A',
    subject: qData?.subject || 'N/A',
    chapter: qData?.chapter || 'N/A',
    chapterNumber: qData?.chapterNumber || '0',
    questionIndex: i,
    questionText: qData?.questionText || '',
    options: qData?.options || {
      A: 'Option A',
      B: 'Option B',
      C: 'Option C',
      D: 'Option D',
    },
    yourAnswer: ua[i],
    correctAnswer: corrects[i],
    timeTaken: ts[i],
    date: new Date().toISOString(),
    questionImage: qUri,
  };

  const list = JSON.parse((await AsyncStorage.getItem('@bookmarks')) || '[]');
  list.push(entry);
  await AsyncStorage.setItem('@bookmarks', JSON.stringify(list));

  const q = [...qPhotos];
  q[i] = qUri;
  setQPhotos(q);

  Alert.alert('✅ Bookmarked', `Q${i + 1} saved with question photo.`);
};


const saveBookmark = async (i: number, qUri: string) => {
  const saved = JSON.parse(await AsyncStorage.getItem('@correctAnswers') || '[]');
  const qData = saved[i];

  const entry = {
    exam: qData?.exam || 'N/A',
    subject: qData?.subject || 'N/A',
    chapter: qData?.chapter || 'N/A',
    chapterNumber: qData?.chapterNumber || '0',
    questionIndex: i,
    questionText: qData?.questionText || '',
    options: qData?.options || {
      A: 'Option A',
      B: 'Option B',
      C: 'Option C',
      D: 'Option D',
    },
    yourAnswer: ua[i],
    correctAnswer: corrects[i],
    timeTaken: ts[i],
    date: new Date().toISOString(),
    questionImage: qUri,
  };

  const list = JSON.parse((await AsyncStorage.getItem('@bookmarks')) || '[]');
  list.push(entry);
  await AsyncStorage.setItem('@bookmarks', JSON.stringify(list));

  const q = [...qPhotos];
  q[i] = qUri;
  setQPhotos(q);

  Alert.alert('✅ Bookmarked', `Q${i + 1} saved with question photo.`);
};


const uploadSolution = async (i: number) => {
  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    quality: 0.7,
    aspect: [4, 3],
  });

  if (result.canceled || !result.assets?.[0]?.uri) return;

  const sUri = result.assets[0].uri;

  const list = JSON.parse((await AsyncStorage.getItem('@bookmarks')) || '[]');

  const indexInBookmarks = list.findIndex((item: any) => item.questionIndex === i);
  if (indexInBookmarks === -1) {
    return Alert.alert('⚠️ Error', 'Bookmark not found. Upload question first.');
  }

  list[indexInBookmarks].solutionImage = sUri;
  await AsyncStorage.setItem('@bookmarks', JSON.stringify(list));

  const s = [...sPhotos];
  s[i] = sUri;
  setSPhotos(s);

  Alert.alert('✅ Solution Saved', `Solution added for Q${i + 1}.`);
};

const getCardStyle = (i: number) => {
  if (!ua[i]) return { borderLeftColor: '#9E9E9E' }; // Unattempted
  if (ua[i] === corrects[i]) return { borderLeftColor: '#00C853' }; // Correct
  return { borderLeftColor: '#D50000' }; // Wrong
};

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.page}>
        {/* Custom Navbar */}
        <View style={styles.navbar}>
          <Text style={styles.navTitle}>Paper Analysis</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Filters */}
        <View style={styles.filterRow}>
          {filters.map(f => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterBtn,
                activeFilter === f && styles.filterActive,
              ]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={styles.filterText}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ScrollView with Questions */}
        <ScrollView contentContainerStyle={styles.container}>
  {getFilteredIndices().map(i => (
    <Animated.View
      key={i}
      entering={FadeInUp.duration(500).delay(i * 60)}
      style={[styles.card, getCardStyle(i)]}

    >
      <View style={styles.cardHeader}>
        <Text style={styles.qTitle}>Q{i + 1}{ts[i] > 90 && (
  <Text style={styles.timeAlert}>
    ⏱️ {ts[i]}s
  </Text>
)}
</Text>
      </View>

      <Text style={styles.detail}>
        Your Answer: <Text style={{ color: '#FFF' }}>{ua[i] || '-'}</Text>
      </Text>
      <Text style={styles.detail}>
        Correct Answer:{' '}
        <Text
          style={{
            color:
              ua[i] === corrects[i]
                ? '#00E676'
                : ua[i]
                ? '#FF5252'
                : '#FFC107',
          }}
        >
          {corrects[i] || '-'}
        </Text>
      </Text>
      <Text style={styles.detail}>Time Taken: {ts[i]}s</Text>

      {/* Upload Buttons */}
      <TouchableOpacity
        style={styles.uploadBtn}
        onPress={() => pickAndBookmark(i)}
      >
        <Text style={styles.uploadTxt}>📸 Upload Question (required)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.uploadBtnSecondary}
        onPress={() => uploadSolution(i)}
      >
        <Text style={styles.uploadTxt}>📝 Upload Solution (optional)</Text>
      </TouchableOpacity>

      <View style={styles.imageRow}>
        {qPhotos[i] && (
          <Image source={{ uri: qPhotos[i]! }} style={styles.thumb} />
        )}
        {sPhotos[i] && (
          <Image source={{ uri: sPhotos[i]! }} style={styles.thumb} />
        )}
      </View>
    </Animated.View>
  ))}
</ScrollView>

      </View>
    </>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#0F0F0F' },
  container: { paddingBottom: 100, alignItems: 'center' },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  navTitle: { fontSize: 20, fontWeight: 'bold', color: '#00E5FF' },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 12,
    flexWrap: 'wrap',
  },
  filterBtn: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00E5FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  filterText: { color: '#FFF', fontSize: 14 },
  filterActive: {
    backgroundColor: '#00E5FF33',
  },
  card: {
  width: '90%',
  backgroundColor: '#1C1C1E',
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
  borderLeftWidth: 6,
  borderLeftColor: '#555', // Default, will be overridden
  shadowColor: '#000',
  shadowOpacity: 0.3,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 3 },
},
timeAlert: {
  backgroundColor: '#D32F2F33',
  paddingVertical: 2,
  paddingHorizontal: 8,
  borderRadius: 8,
  color: '#FF5252',
  fontWeight: 'bold',
  fontSize: 12,
  alignSelf: 'flex-start',
  marginTop: 4,
},
qTitle: {
  fontSize: 18,
  fontWeight: '600',
  color: '#00E5FF',
},
detail: {
  fontSize: 14,
  color: '#BDBDBD',
  marginBottom: 4,
},


  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  uploadBtn: {
    backgroundColor: '#00C853',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  uploadBtnSecondary: {
    backgroundColor: '#807e7c',
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
    alignItems: 'center',
  },
  uploadBtnSecondary1: {
    backgroundColor: '#f59c20',
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
    alignItems: 'center',
  },
  uploadTxt: { color: '#FFF', fontWeight: '600' },
  imageRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#00E5FF',
  },
});
