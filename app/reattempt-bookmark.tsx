import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ImageViewing from 'react-native-image-viewing';
import PagerView from 'react-native-pager-view';

export default function ReattemptBookmark() {
  const pagerRef = useRef<PagerView>(null);
  const { indexes, startIndex } = useLocalSearchParams();
  const pageStart = Number(startIndex) || 0;
const [currentIndex, setCurrentIndex] = useState(Number(startIndex) || 0)


  const selectedIndexes = indexes
    ? typeof indexes === 'string'
      ? JSON.parse(indexes)
      : Array.isArray(indexes)
      ? indexes
      : [indexes]
    : [];

  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [times, setTimes] = useState<number[]>([]);
  const [perTime, setPerTime] = useState(0);
  const perTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Zoom image state
  const [isQuestionImageVisible, setQuestionImageVisible] = useState(false);
  const [isSolutionImageVisible, setSolutionImageVisible] = useState(false);
  const [zoomImageUri, setZoomImageUri] = useState('');

  useEffect(() => {
    const load = async () => {
      const data = await AsyncStorage.getItem('@bookmarks');
      if (data) {
        const all = JSON.parse(data);
        const selected = selectedIndexes.map((i: number) => all[i]);
        setBookmarks(selected);
        setAnswers(Array(selected.length).fill(''));
        setTimes(Array(selected.length).fill(0));
      }
    };
    load();
  }, []);
useEffect(() => {
  if (bookmarks.length && pagerRef.current) {
    pagerRef.current.setPageWithoutAnimation?.(pageStart);
  }
}, [bookmarks]);
  useEffect(() => {
    if (perTimerRef.current) clearInterval(perTimerRef.current);
    const start = times[current] || 0;
    setPerTime(start);
    perTimerRef.current = setInterval(() => {
      setPerTime(prev => {
        const updated = [...times];
        updated[current] = prev + 1;
        setTimes(updated);
        return prev + 1;
      });
    }, 1000);
    return () => {
      if (perTimerRef.current) clearInterval(perTimerRef.current);
    };
  }, [current]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };
if (!bookmarks.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.navbar}>
        <Text style={styles.navTitle}>🔁 Reattempt</Text>
        <Text style={styles.timer}>Q{current + 1} • ⏱ {formatTime(perTime)}</Text>
      </View>

      <PagerView
        style={{ flex: 1 }}
        initialPage={currentIndex}

        onPageSelected={e => setCurrent(e.nativeEvent.position)}
        ref={pagerRef}
      >
        {bookmarks.map((q, index) => {
          const answered = !!answers[index];
          return (
            <View key={index} style={styles.qArea}>
              <Text style={styles.qTitle}>Q{index + 1}</Text>

              {q.questionImage ? (
                <TouchableOpacity
                  onPress={() => {
                    setZoomImageUri(q.questionImage);
                    setQuestionImageVisible(true);
                  }}
                >
                  <Image source={{ uri: q.questionImage }} style={styles.qImage} resizeMode="contain" />
                </TouchableOpacity>
              ) : (
                <Text style={{ color: '#999', marginBottom: 12 }}>No question image</Text>
              )}

              {q.options ? (
                Object.entries(q.options).map(([key, value]) => {
                  const isSelected = answers[index] === key;
                  const isCorrect = key === q.correctAnswer;
                  const isWrong = isSelected && !isCorrect;

                  return (
                    <TouchableOpacity
                      key={key}
                      disabled={answered}
                      style={[
                        styles.optionBtn,
                        isSelected && styles.optionSelected,
                        isCorrect && answered && styles.optionCorrect,
                        isWrong && answered && styles.optionWrong,
                      ]}
                      onPress={() => {
                        const a = [...answers];
                        a[index] = key;
                        setAnswers(a);
                      }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isCorrect && answered && { color: '#00E676' },
                          isWrong && { color: '#FF5252' },
                          isSelected && { fontWeight: 'bold' },
                        ]}
                      >
                        {`${key}. ${value}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={{ color: '#888' }}>Options not found.</Text>
              )}

              {/* Solution image only after answering */}
              {answered && q.solutionImage && (
                <TouchableOpacity
                  onPress={() => {
                    setZoomImageUri(q.solutionImage);
                    setSolutionImageVisible(true);
                  }}
                >
                  <Image source={{ uri: q.solutionImage }} style={styles.solutionImage} resizeMode="contain" />
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </PagerView>

      {/* Fullscreen Zoom Modal */}
     {zoomImageUri !== '' && (
  <ImageViewing
    images={[{ uri: zoomImageUri }]}
    imageIndex={0}
    visible={true}
    onRequestClose={() => {
      setZoomImageUri('');
      setQuestionImageVisible(false);
      setSolutionImageVisible(false);
    }}
    backgroundColor="#000"
    swipeToCloseEnabled
    doubleTapToZoomEnabled
  />
)}

    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  navbar: {
    paddingTop: 40,
    paddingBottom: 10,
    paddingHorizontal: 20,
    backgroundColor: '#121212',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navTitle: { fontSize: 22, fontWeight: 'bold', color: '#29B6F6' },
  timer: { color: '#999', fontSize: 14 },
  qArea: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  qTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  qImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#29B6F6',
  },
  optionBtn: {
    backgroundColor: '#1C1C1E',
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  optionSelected: {
    backgroundColor: '#00BCD4',
    borderColor: '#00E5FF',
  },
  optionCorrect: {
    backgroundColor: '#00C853',
  },
  optionWrong: {
    backgroundColor: '#FF5252',
  },
  optionText: {
    color: '#EEE',
    fontSize: 15,
  },
  solutionImage: {
    width: '100%',
    height: 180,
    marginTop: 16,
    borderRadius: 8,
    borderColor: '#00E676',
    borderWidth: 1,
  },
});
