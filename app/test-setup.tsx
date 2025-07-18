import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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

  const [examParam, setExamParam] = useState<string | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [chapter, setChapter] = useState<string | null>(null);
  const [chapterNumber, setChapterNumber] = useState<string | null>(null);
  const [startQ, setStartQ] = useState<string>('');
  const [endQ, setEndQ] = useState<string>('');
  const [duration, setDuration] = useState<string>('600');
  const [subjectOptions, setSubjectOptions] = useState<any[]>([]);
  const [chapterOptions, setChapterOptions] = useState<any[]>([]);
  const [chapterNumberOptions, setChapterNumberOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Timing map
  const perQTimeMap: Record<string, number> = {
    NEET: 60,
    IIT_JEE: 60,
    SSC_JE: 38,
    SSC_CGL: 38,
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
    const exam = value || 'NEET'; // fallback

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
      <View style={styles.container}>
        <Text style={{ color: '#888' }}>Loading exam...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.card}>
        <Text style={styles.title}>Test Setup</Text>

        <Dropdown
          data={subjectOptions}
          labelField="label"
          valueField="value"
          placeholder="Select Section"
          value={subject}
          onChange={item => {
            setSubject(item.value);
            setChapter(null);
            setChapterNumber(null);
          }}
          style={styles.dropdown}
          placeholderStyle={styles.placeholder}
          selectedTextStyle={styles.dropdownText}
        />

        <Dropdown
          data={chapterOptions}
          labelField="label"
          valueField="value"
          placeholder="Select Chapter"
          value={chapter}
          onChange={item => setChapter(item.value)}
          disable={!subject}
          style={styles.dropdown}
          placeholderStyle={styles.placeholder}
          selectedTextStyle={styles.dropdownText}
        />

        <Dropdown
          data={chapterNumberOptions}
          labelField="label"
          valueField="value"
          placeholder="Select Chapter Number"
          value={chapterNumber}
          onChange={item => setChapterNumber(item.value)}
          disable={!subject}
          style={styles.dropdown}
          placeholderStyle={styles.placeholder}
          selectedTextStyle={styles.dropdownText}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.inputHalf}
            placeholder="Start Q.No."
            keyboardType="numeric"
            placeholderTextColor="#888"
            value={startQ}
            onChangeText={(text) => {
              if (/^\d*$/.test(text) && (text === '' || parseInt(text) <= 1000)) {
                setStartQ(text);
              }
            }}
          />

          <TextInput
            style={styles.inputHalf}
            placeholder="Last Q.No."
            keyboardType="numeric"
            placeholderTextColor="#888"
            value={endQ}
            onChangeText={(text) => {
              if (/^\d*$/.test(text) && (text === '' || parseInt(text) <= 1000)) {
                setEndQ(text);
              }
            }}
          />
        </View>

        <Text style={styles.infoText}>Estimated Time: {readableTime(parseInt(duration))}</Text>

        <TouchableOpacity style={styles.startButton} onPress={handleStart}>
          <Text style={styles.startText}>🚀 Start Test</Text>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '92%',
    backgroundColor: '#1C1C1E',
    borderRadius: 18,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#00E5FF',
    textAlign: 'center',
    marginBottom: 20,
  },
  dropdown: {
    borderBottomWidth: 1,
    borderColor: '#444',
    marginBottom: 20,
  },
  placeholder: {
    color: '#777',
    fontSize: 15,
  },
  dropdownText: {
    color: '#DDD',
    fontSize: 16,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  inputHalf: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 12,
    color: '#EEE',
    fontSize: 15,
    backgroundColor: '#222',
  },
  infoText: {
    textAlign: 'center',
    color: '#00C853',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: '#00B0FF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  startText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
