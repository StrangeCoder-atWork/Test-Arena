// Your imports remain the same
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BackHandler, InteractionManager } from 'react-native';
import QuestionCard from './QuestionCard'; // adjust path if needed

import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import PagerView from 'react-native-pager-view';

// Add these imports at the top

export default function TestScreen() {
  const pagerRef = React.useRef<PagerView>(null);
  const router = useRouter();
  const params = useLocalSearchParams();
const [showSubmitPanel, setShowSubmitPanel] = useState(false);

  const examParam = params.exam as string;
  const subjectParam = params.subject as string;
  const chapterParam = params.chapter as string;
  const chapterNumberStr = params.chapterNumber as string;
  const firstQ = parseInt(params.firstQ as string || '1', 10);
  const lastQ = parseInt(params.lastQ as string || '1', 10);
  const perQLimit = Math.max(1, parseInt(params.perQTime as string || '60', 10));
  const totalTime = Math.max(0, parseInt(params.totalTime as string || '600', 10));
  const chapterNum = parseInt(chapterNumberStr || '1', 10);
  const totalQ = Math.max(1, lastQ - firstQ + 1);

  const [questions, setQuestions] = useState(
    Array.from({ length: totalQ }, (_, i) => {
      const qNum = firstQ + i;
      return {
        id: `${chapterNum}.${qNum}`,
        text: `Question ${chapterNum}.${qNum}`,
        options: ['A', 'B', 'C', 'D'],
      };
    })
  );
const selectingRef = useRef(false);

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState(Array(totalQ).fill(''));
  const [times, setTimes] = useState(Array(totalQ).fill(0));
  const [totalLeft, setTotalLeft] = useState(totalTime);
  const [perTime, setPerTime] = useState(0);
const perTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
const [submitForced, setSubmitForced] = useState(false);

const attemptedCount = answers.filter(Boolean).length;
const totalCount = questions.length;
const unattemptedCount = totalCount - attemptedCount;

  const [gridVisible, setGridVisible] = useState(false);
useEffect(() => {
  const backHandler = BackHandler.addEventListener(
    'hardwareBackPress',
    () => {
      if (submitForced) {
        // ⛔ Block back — but don't show alert again here
        return true;
      }
      return false;
    }
  );

  return () => backHandler.remove();
}, [submitForced]);

  useEffect(() => {
    const t = setInterval(() => {
      setTotalLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
  if (perTimerRef.current) clearInterval(perTimerRef.current);

  const starting = times[current] || 0;
  setPerTime(starting);

  perTimerRef.current = setInterval(() => {

    setPerTime((prev) => {
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

  const select = (opt: string) => {
  const a = [...answers];

  if (a[current] === opt) {
    // ✅ If already selected, unmark it
    a[current] = '';
  } else {
    // ✅ Otherwise, mark it
    a[current] = opt;
  }

  const t = [...times];
  t[current] = perTime;

  setAnswers(a);
  setTimes(t);
};


const testSessionId = Date.now().toString();

 const navigateQ = (delta: number) => {
  let next = current + delta;
  if (next < 0) next = 0;
  if (next >= questions.length) next = questions.length - 1;

  pagerRef.current?.setPage(next); // ✅ This line is essential!
  setCurrent(next);
  setGridVisible(false);
};

useEffect(() => {
  if (totalLeft === 0) {
    setSubmitForced(true); // 🔴 Forcefully opened due to timeout
    setShowSubmitPanel(true);
  }
}, [totalLeft]);

const handleGridOpen = () => setGridVisible(true);

  const handleSubmit = async () => {
  const attempted = answers.filter((a) => a).length;

  const history = JSON.parse(
    (await AsyncStorage.getItem('@paperHistory')) || '[]'
  );
  history.push({
    answers,
    timestamps: times,
    totalTime: totalLeft,
    exam: examParam,
    subject: subjectParam,
    chapter: chapterParam,
    date: new Date().toISOString(),
  });
  InteractionManager.runAfterInteractions(async () => {
  await AsyncStorage.setItem('@paperHistory', JSON.stringify(history));
  router.replace({
    pathname: '/correct-answers',
    params: {
      answers: JSON.stringify(answers),
      timestamps: JSON.stringify(times),
      totalTime: totalLeft,
      exam: examParam,
      subject: subjectParam,
      chapter: chapterParam,
      firstQ: firstQ.toString(),
      lastQ: lastQ.toString(),
      chapterNumber: chapterNum.toString(),
      perQTime: perQLimit.toString(),
      date: new Date().toISOString(),
    },
  });
});


};


  const addQuestion = () => {
    const lastId = questions[questions.length - 1].id;
    const lastQNumber = parseFloat(lastId.split('.')[1]);
    const newId = `${chapterNum}.${lastQNumber + 1}`;
    const newQ = {
      id: newId,
      text: `Question ${newId}`,
      options: ['A', 'B', 'C', 'D'],
    };
    setQuestions([...questions, newQ]);
    setAnswers([...answers, '']);
    setTimes([...times, 0]);
    setTotalLeft((prev) => prev + perQLimit);
  };
useEffect(() => {
  if (totalLeft === 0) {
    setSubmitForced(true); // 🔒 Time-based
    setShowSubmitPanel(true); // 👁️ Show submit panel
  }
}, [totalLeft]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Keeps inputs visible when the keyboard is open (iOS & Android) */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* MAIN SCROLLER */}
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          bounces
        >
    <View style={styles.container}>
      <View style={styles.navbar}>
    {/* Left side - Title */}
    <Text style={styles.navTitle}>TEST ARENA</Text>

    {/* Right side - Buttons */}
    <View style={styles.sideRight}>
      <TouchableOpacity onPress={() => {
  setSubmitForced(false); // 🟢 User opened it manually
  setShowSubmitPanel(true);
}}
 style={styles.submitTopBtn}>
  <Text style={styles.submitTopTxt}>SUBMIT</Text>
</TouchableOpacity>

      <TouchableOpacity onPress={handleGridOpen} style={{margin:10}}>
        <Ionicons name="grid" size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
</View>
<View style={styles.timerBelow}>
    <Text style={styles.timer}>⏳ {formatTime(totalLeft)}</Text>
  </View>

     <View style={{ flex: 1 }}>
  <PagerView
  overScrollMode="never"
  offscreenPageLimit={1}
  style={{ flex: 1 }}
  initialPage={0}
  onPageSelected={(e) => setCurrent(e.nativeEvent.position)}
  ref={pagerRef}
>
  {questions.map((q, index) => (
    <View key={q.id} style={{ flex: 1 }}>
      {/* ✅ Timer and Buttons ABOVE the ScrollView */}
      

      {/* ✅ Scrollable question + options */}
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'flex-start',
          paddingHorizontal: 20,
          paddingVertical: 20,
        }}
      >
        <QuestionCard
          q={q}
          index={index}
          current={current}
          answers={answers}
          perTime={perTime}
          perQLimit={perQLimit}
          select={select}
          navigateQ={navigateQ}
          styles={styles}
        />
      </ScrollView>
    </View>
  ))}
</PagerView>



</View>



      <Modal visible={gridVisible} animationType="fade" transparent>
  <TouchableWithoutFeedback onPress={() => setGridVisible(false)}>
    <View style={styles.gridOverlay}>
      <TouchableWithoutFeedback onPress={() => {}}>
        <View style={styles.gridCard}>
          <Text style={styles.gridTitle}>📋 Question Grid</Text>

          <ScrollView contentContainerStyle={styles.grid}>
            {questions.map((q, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.gridItem,
                  answers[i] ? styles.gridAttempted : styles.gridUnattempted,
                  i === current && styles.gridCurrent,
                ]}
                onPress={() => {
                  setCurrent(i);
pagerRef.current?.setPage(i); // ✅ This makes it jump
setGridVisible(false);

                }}
              >
                <Text style={styles.gridTxt}>{q.id}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity onPress={addQuestion} style={styles.addQBtn}>
            <Text style={styles.addQTxt}>➕ Add Question</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setGridVisible(false)}
            style={styles.closeGridBtn}
          >
            <Text style={styles.closeGridTxt}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </View>
  </TouchableWithoutFeedback>
</Modal>
<Modal visible={showSubmitPanel} transparent animationType="fade">
  <TouchableWithoutFeedback
  onPress={() => {
    if (!submitForced) {
      setShowSubmitPanel(false);
    }
  }}
>

    <View style={styles.blurOverlay}>
      <TouchableWithoutFeedback onPress={() => {}}>
        <View style={styles.submitCard}>
          <Text style={styles.submitTitle}>📝 Test Summary</Text>

          <View style={styles.submitStats}>
            <Text style={styles.statText}>✅ Attempted: {attemptedCount}</Text>
            <Text style={styles.statText}>❌ Unattempted: {unattemptedCount}</Text>
            <Text style={styles.statText}>📋 Total: {totalCount}</Text>
          </View>

          <View style={styles.submitBtnRow}>
            <TouchableOpacity
  onPress={() => {
    if (!submitForced) setShowSubmitPanel(false);
  }}
  style={[styles.cancelBtn, submitForced && { opacity: 0.4 }]}
  disabled={submitForced}
>
  <Text style={styles.cancelText}>Back</Text>
</TouchableOpacity>

            <TouchableOpacity onPress={handleSubmit} style={styles.finalSubmitBtn}>
              <Text style={styles.finalSubmitText}>Submit</Text>
            </TouchableOpacity>

          </View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  </TouchableWithoutFeedback>
</Modal>

    </View>
    </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const { height, width } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    paddingTop: 30,
  },
  blurOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.7)',
  justifyContent: 'flex-end',
},

submitCard: {
  backgroundColor: '#121212',
  padding: 24,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  shadowColor: '#00E676',
  shadowOpacity: 0.3,
  shadowOffset: { width: 0, height: -3 },
  shadowRadius: 10,
  elevation: 12,
},

submitTitle: {
  color: '#29B6F6',
  fontSize: 20,
  fontWeight: 'bold',
  marginBottom: 16,
  textAlign: 'center',
},

submitStats: {
  marginBottom: 20,
},

statText: {
  color: '#FAFAFA',
  fontSize: 16,
  marginBottom: 4,
  textAlign: 'center',
},

submitBtnRow: {
  flexDirection: 'row',
  justifyContent: 'space-around',
},

finalSubmitBtn: {
  backgroundColor: '#00E676',
  paddingVertical: 12,
  paddingHorizontal: 24,
  borderRadius: 10,
},

finalSubmitText: {
  color: '#000',
  fontSize: 16,
  fontWeight: 'bold',
},

cancelBtn: {
  backgroundColor: '#5c5c5c',
  paddingVertical: 12,
  paddingHorizontal: 24,
  borderRadius: 10,
},

cancelText: {
  color: '#FFF',
  fontSize: 16,
  fontWeight: 'bold',
},

  navbar: {
  paddingHorizontal: 20,
  paddingTop: 5,
  paddingBottom: 5,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#0E0E0E',
  borderBottomWidth: 1,
  borderColor: '#1F1F1F',
  shadowColor: '#29B6F6',
  shadowOpacity: 0.2,
  shadowOffset: { width: 0, height: 4 },
  shadowRadius: 6,
  elevation: 8,
},

navTitle: {
  fontSize: 22,
  fontWeight: 'bold',
  color: '#29B6F6',
},

sideRight: {
  flexDirection: 'row',
  alignItems: 'center',
},

timerBelow: {
  paddingLeft: 20,
  paddingTop: 10,
  alignItems: 'flex-start',
},

timer: {
  color: '#ffffff',
  fontSize: 14,
  fontWeight: '600',
},

  qArea: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 24,
  },
  qTitle: {
    fontSize: 21,
    color: '#FFFFFF',
    marginTop:-16,
    marginBottom: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  optionBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#2C2C2C',
    backgroundColor: '#171717',
    shadowColor: '#29B6F6',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  optionTxt: {
    color: '#CCCCCC',
    fontSize: 16,
  },


optionSelected: {
  backgroundColor: '#29B6F6',
  borderColor: '#00E5FF',
  shadowColor: '#00E5FF',
  shadowOpacity: 0.5,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
},

optionSelectedTxt: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 17,
},
  perTime: {
    fontSize: 14,
    color: '#B0BEC5',
    textAlign: 'center',
    marginTop: 18,
  },
  perTimeExceeded: {
    color: '#FF5252',
    fontWeight: '700',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  navBtn: {
    backgroundColor: '#1B1B1B',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  navText: {
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#43A047',
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 12,
    shadowColor: '#00E676',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  submitTopBtn: {
    backgroundColor: '#00C853',
    paddingVertical: 2,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  submitTopTxt: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  // GRID VIEW
  gridOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  gridCard: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: height * 0.65,
    elevation: 12,
  },
  gridTitle: {
    fontSize: 20,
    color: '#FAFAFA',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 11,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  safeArea: { flex: 1, backgroundColor: '#0A0A0B' },
  flex:      { flex: 1 },
  /* Ensures the ScrollView is scrollable even when content is shorter than screen */
  scrollContainer: { flexGrow: 1, paddingBottom: 40 },
  /* Optional wrapper for additional padding / alignment */
  content: { paddingHorizontal: 24, paddingTop: 60 },
  gridItem: {
    width: 50,
    height: 50,
    margin: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#2E2E2E',
  },
  gridAttempted: {
    backgroundColor: '#00E676',
  },
  gridUnattempted: {
    backgroundColor: '#9E9E9E',
  },
  gridCurrent: {
    borderColor: '#00B0FF',
    borderWidth: 2,
  },
  gridTxt: {
    color: '#FFF',
    fontWeight: '700',
  },
  addQBtn: {
    marginTop: 20,
    backgroundColor: '#1976D2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignSelf: 'center',
  },
  addQTxt: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  closeGridBtn: {
    marginTop: 14,
    alignSelf: 'center',
  },
  closeGridTxt: {
    color: '#FF4081',
    fontSize: 15,
    fontWeight: '600',
  },
});
