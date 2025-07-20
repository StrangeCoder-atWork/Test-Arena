import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import Animated, { FadeInUp } from 'react-native-reanimated';
import syllabus from '../data/syllabus.json';

export default function TestSetup() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [examParam, setExamParam] = useState(null);
  const [subject, setSubject] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [chapterNumber, setChapterNumber] = useState(null);
  const [startQ, setStartQ] = useState('');
  const [endQ, setEndQ] = useState('');
  const [duration, setDuration] = useState('600');
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [questionType, setQuestionType] = useState([]);
  const [integerAnswer, setIntegerAnswer] = useState([]);
  const [chapterOptions, setChapterOptions] = useState([]);
  const [chapterNumberOptions, setChapterNumberOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const examName = (typeof params.exam === 'string' ? params.exam : '').toUpperCase();
  const isIITJEE = examName.includes('IIT JEE');

  // Timing map
  const perQTimeMap: Record<string, number> = {
    NEET: 144,
    IIT_JEE: 144,
    SSC_JE: 36,
    SSC_CGL: 36,
  };

  // Map human-readable exam names to timing keys
  const examToTimingKey: Record<string, string> = {
    'NEET': 'NEET',
    'IIT JEE': 'IIT_JEE',
    'SSC JE': 'SSC_JE',
    'SSC CGL': 'SSC_CGL',
  };

  useEffect(() => {
    const loadExam = async () => {
      const value = await AsyncStorage.getItem('@selectedExam1');
      const exam = value || 'NEET';
      console.log('Selected Exam:', exam);
      setExamParam(exam);
      setLoading(false);
    };
    loadExam();
  }, []);

  useEffect(() => {
    if (!examParam) return;
    const selectedExam = syllabus[examParam as keyof typeof syllabus];
    if (!selectedExam || typeof selectedExam !== 'object') return;

    const getSubjectsRecursive = (obj: any, path: string[] = []) => {
      const subjects: { label: string; value: string }[] = [];
      for (const key in obj) {
        if (Array.isArray(obj[key])) {
          subjects.push({ label: [...path, key].join(' > '), value: [...path, key].join('@@') });
        } else {
          subjects.push(...getSubjectsRecursive(obj[key], [...path, key]));
        }
      }
      return subjects;
    };

    setSubjectOptions(getSubjectsRecursive(selectedExam));
  }, [examParam]);

  useEffect(() => {
    if (!subject || !examParam) return;
    const path = subject.split('@@');
    let ref: any = syllabus[examParam as keyof typeof syllabus];
    for (const key of path) {
      if (ref && typeof ref === 'object') ref = ref[key];
      else ref = null;
    }

    if (!ref || !Array.isArray(ref)) return;

    const list = ref.map((c: string, idx: number) => ({
      label: ` ${c}`,
      value: `${c}`,
    }));

    const numberList = ref.map((_: string, idx: number) => ({
      label: `Chapter ${idx + 1}`,
      value: `${idx + 1}`,
    }));

    setChapterOptions(list);
    setChapterNumberOptions(numberList);
  }, [subject]);

  useEffect(() => {
    const start = parseInt(startQ || '0');
    const end = parseInt(endQ || '0');
    const totalQuestions = end - start + 1;
    const key = examToTimingKey[examParam || 'NEET'];
    const perQ = perQTimeMap[key] || 60;

    if (isNaN(totalQuestions) || totalQuestions <= 0) {
      setDuration('0');
    } else {
      setDuration(String(totalQuestions * perQ));
    }
  }, [startQ, endQ, examParam]);

  const handleStart = () => {
    if (!subject || !chapter || !chapterNumber) {
      alert('Please select subject, chapter and chapter number');
      return;
    }

    const start = parseInt(startQ || '1');
    const end = parseInt(endQ || '1');

    if (isNaN(start) || isNaN(end) || start <= 0 || end <= 0 || end < start) {
      alert('Please enter a valid question range (Start <= End)');
      return;
    }

    const total = end - start + 1;
    const perQTime = (parseInt(duration) / total).toFixed(0);

    router.navigate({
      pathname: '/test',
      params: {
        exam: examParam,
        subject,
        chapter,
        chapterNumber,
        startQ,
        endQ,
        perQTime,
        duration,
        lastQ: endQ,
        totalTime: duration,
        firstQ: startQ,
      },
    });
  };

  function readableTime(seconds: number) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const parts = [];
    if (hrs > 0) parts.push(`${hrs} hr${hrs > 1 ? 's' : ''}`);
    if (mins > 0) parts.push(`${mins} min${mins > 1 ? 's' : ''}`);
    if (secs > 0) parts.push(`${secs} sec${secs > 1 ? 's' : ''}`);
    return parts.length > 0 ? parts.join(' ') : '0 sec';
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View entering={FadeInUp.delay(200)} style={styles.loadingCard}>
          <View style={styles.loadingIndicator} />
          <Text style={styles.loadingText}>Initializing Test Setup</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp.delay(100)} style={styles.headerSection}>
            <Text style={styles.title}>Test Configuration</Text>
            <View style={styles.titleUnderline} />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(200)} style={styles.card}>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Subject Selection</Text>
              <Dropdown
                data={subjectOptions}
                labelField="label"
                valueField="value"
                placeholder="Select Subject"
                value={subject}
                onChange={(item) => {
                  setSubject(item.value);
                  setChapter(null);
                  setChapterNumber(null);
                }}
                style={styles.dropdown}
                placeholderStyle={styles.placeholder}
                selectedTextStyle={styles.dropdownText}
                containerStyle={styles.dropdownContainer}
                itemTextStyle={styles.dropdownItemText}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Chapter Details</Text>
              <View style={styles.doubleInputRow}>
                <View style={styles.inputContainer}>
                  <Dropdown
                    data={chapterOptions}
                    labelField="label"
                    valueField="value"
                    placeholder="Select Chapter"
                    value={chapter}
                    onChange={(item) => setChapter(item.value)}
                    disable={!subject}
                    style={[styles.dropdown, styles.halfWidth]}
                    placeholderStyle={styles.placeholder}
                    selectedTextStyle={styles.dropdownText}
                    containerStyle={styles.dropdownContainer}
                    itemTextStyle={styles.dropdownItemText}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Dropdown
                    data={chapterNumberOptions}
                    labelField="label"
                    valueField="value"
                    placeholder="Chapter No."
                    value={chapterNumber}
                    onChange={(item) => setChapterNumber(item.value)}
                    disable={!subject}
                    style={[styles.dropdown, styles.halfWidth]}
                    placeholderStyle={styles.placeholder}
                    selectedTextStyle={styles.dropdownText}
                    containerStyle={styles.dropdownContainer}
                    itemTextStyle={styles.dropdownItemText}
                  />
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Question Range</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Start</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="1"
                    placeholderTextColor="#4A5568"
                    value={startQ}
                    onChangeText={(text) => {
                      if (/^\d*$/.test(text) && (text === '' || parseInt(text) <= 1000)) {
                        setStartQ(text);
                      }
                    }}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputSeparator}>
                  <Text style={styles.separatorText}>to</Text>
                </View>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>End</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="50"
                    placeholderTextColor="#4A5568"
                    value={endQ}
                    onChangeText={(text) => {
                      if (/^\d*$/.test(text) && (text === '' || parseInt(text) <= 1000)) {
                        setEndQ(text);
                      }
                    }}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {isIITJEE && (
              <Animated.View entering={FadeInUp.delay(300)} style={styles.section}>
                <Text style={styles.sectionLabel}>Question Type</Text>
                <Picker
                  selectedValue={questionType}
                  onValueChange={(val) => setQuestionType(val)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Type" value="" />
                  <Picker.Item label="Multiple Choice" value="mcq" />
                  <Picker.Item label="Integer Answer" value="integer" />
                </Picker>

                {questionType.toString() === 'integer' && (
                  <View style={styles.integerInputContainer}>
                    <Text style={styles.inputLabel}>Expected Answer</Text>
                    <TextInput
                      style={styles.inputField}
                      placeholder="Enter integer answer"
                      placeholderTextColor="#4A5568"
                      onChangeText={(text) => setIntegerAnswer([parseInt(text)])}
                      keyboardType="numeric"
                    />
                  </View>
                )}
              </Animated.View>
            )}

            <Animated.View entering={FadeInUp.delay(400)} style={styles.timeSection}>
              <View style={styles.timeDisplay}>
                <Text style={styles.timeLabel}>Estimated Duration</Text>
                <Text style={styles.timeValue}>{readableTime(parseInt(duration))}</Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(500)}>
              <TouchableOpacity style={styles.startButton} onPress={handleStart}>
                <LinearGradient
                  colors={['#0066FF', '#0052D6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.startText}>Initialize Test</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  loadingIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#0066FF',
    borderTopColor: 'transparent',
    marginBottom: 16,
  },
  loadingText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '500',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  titleUnderline: {
    width: 60,
    height: 3,
    backgroundColor: '#0066FF',
    marginTop: 8,
    borderRadius: 2,
  },
  card: {
    backgroundColor: '#0A0A0A',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  dropdown: {
    backgroundColor: '#111111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D3748',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  halfWidth: {
    flex: 1,
  },
  dropdownContainer: {
    backgroundColor: '#111111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D3748',
    marginTop: 4,
  },
  placeholder: {
    color: '#4A5568',
    fontSize: 15,
    fontWeight: '400',
  },
  dropdownText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '500',
  },
  dropdownItemText: {
    color: '#E2E8F0',
    fontSize: 15,
    padding: 12,
  },
  doubleInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputContainer: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#A0AEC0',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  inputField: {
    backgroundColor: '#111111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D3748',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '500',
  },
  inputSeparator: {
    paddingBottom: 14,
    alignItems: 'center',
  },
  separatorText: {
    color: '#4A5568',
    fontSize: 14,
    fontWeight: '500',
  },
  picker: {
    backgroundColor: '#111111',
    color: '#E2E8F0',
    borderRadius: 12,
  },
  integerInputContainer: {
    marginTop: 12,
  },
  timeSection: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2D3748',
    marginBottom: 24,
  },
  timeDisplay: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#A0AEC0',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  timeValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2b85c4',
    letterSpacing: 0.5,
  },
  startButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#2b85c4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  startText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
