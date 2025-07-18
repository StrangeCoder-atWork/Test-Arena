import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

export const unstable_settings = {
  initialRouteName: 'correct-answers',
};

const WIDTH = Dimensions.get('window').width * 0.9;
const options = ['A', 'B', 'C', 'D'];

export default function ReviewCorrectAnswersScreen() {
  const {
    answers,
    timestamps,
    totalTime,
    exam,
    subject,
    chapter,
    firstQ,
    lastQ,
    chapterNumber,
    perQTime,
  } = useLocalSearchParams();

  const ua: string[] = JSON.parse(answers as string);
  const ts: number[] = JSON.parse(timestamps as string);
  const total = ua.length;

const [corrects, setCorrects] = useState<string[]>([]);

useEffect(() => {
  const loadSavedAnswers = async () => {
    try {
      const saved = JSON.parse(await AsyncStorage.getItem('@correctAnswers') || '[]');
      const matched = saved.slice(-total).map((item: any) => item.correctAnswer || '');
      if (matched.length === total) {
        setCorrects(matched);
      } else {
        setCorrects(Array(total).fill(''));
      }
    } catch (e) {
      console.error('Failed to load saved correct answers:', e);
      setCorrects(Array(total).fill(''));
    }
  };

  loadSavedAnswers();
}, []);

  const router = useRouter();

  const selectOption = (i: number, val: string) => {
    const copy = [...corrects];
    copy[i] = val;
    setCorrects(copy);
  };

  const handleFinish = async () => {
    const existing = JSON.parse(await AsyncStorage.getItem('@correctAnswers') || '[]');
   const data = Array(total).fill(0).map((_, i) => ({
  qIndex: i + 1,
  yourAnswer: ua[i],
  correctAnswer: corrects[i],
  timeTaken: ts[i],
  date: new Date().toISOString(),
  exam,
  subject,
  chapter,
  chapterNumber,
}));

    await AsyncStorage.setItem('@correctAnswers', JSON.stringify([...existing, ...data]));

    Alert.alert('✅ Answers Saved', 'Correct answers stored successfully.');

    router.replace({
      pathname: '/results',
      params: {
        answers: JSON.stringify(ua),
        timestamps: JSON.stringify(ts),
        corrects: JSON.stringify(corrects),
      },
    });
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.page}>
        {/* ✅ Navbar */}
        <View style={styles.navbar}>
          <Text style={styles.navTitle}>REVIEW ANSWERS</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          {ua.map((a: string, i: number) => {
            const isCorrect = corrects[i] && corrects[i] === a;
            const notAttempted = !a;

            return (
              <Animated.View
                key={i}
                entering={FadeInUp.duration(400).delay(i * 80)}
                style={[
                  styles.card,
                  notAttempted
                    ? styles.stripNeutral
                    : isCorrect
                    ? styles.stripGreen
                    : styles.stripRed,
                ]}
              >
                <Text style={styles.qLabel}>
                  Q{i + 1}{' '}
                  {notAttempted ? (
                    <Text style={{ color: '#FFC107' }}>• Not Attempted</Text>
                  ) : (
                    <>
                      • <Text style={{ color: '#FFF' }}>Your: {a}</Text>{' '}
                      {corrects[i] ? (
                        <>
                          •{' '}
                          <Text
                            style={{
                              color: '#FFF',
                              fontWeight: '600',
                            }}
                          >
                            Correct: {corrects[i]}
                          </Text>
                        </>
                      ) : null}
                    </>
                  )}
                </Text>

                <View style={styles.optionRow}>
                  {options.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.optionBtnSm,
                        corrects[i] === opt && styles.selected,
                      ]}
                      onPress={() => selectOption(i, opt)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          corrects[i] === opt && styles.selectedText,
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>
            );
          })}

          <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
            <Text style={styles.finishText}>🚀 Submit</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    elevation: 4,
  },
  navTitle: {
    fontSize: 18,
    color: '#00E5FF',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  container: {
    alignItems: 'center',
    paddingBottom: 80,
  },
  card: {
    width: WIDTH,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 18,
    marginVertical: 8,
    shadowColor: '#00E5FF44',
    shadowOpacity: 0.6,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    borderLeftWidth: 6,
  },
  stripGreen: {
    borderLeftColor: '#00C853',
  },
  stripRed: {
    borderLeftColor: '#FF3D00',
  },
  stripNeutral: {
    borderLeftColor: '#FFC107',
  },
  qLabel: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 8,
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  optionBtnSm: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    backgroundColor: '#2C2C2C',
    marginHorizontal: 4,
    flex: 1,
    alignItems: 'center',
    marginRight: 8,
  },
  optionText: {
    fontSize: 16,
    color: '#BBB',
  },
  selected: {
    backgroundColor: '#00C853',
    borderColor: '#69F0AE',
  },
  selectedText: {
    color: '#FFF',
    fontWeight: '700',
  },
  finishBtn: {
    marginTop: 30,
    backgroundColor: '#00B0FF',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 14,
  },
  finishText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
