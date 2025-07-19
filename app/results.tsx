// results.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const WIDTH = Dimensions.get('window').width * 0.92;

export default function ResultsScreen() {
  const { answers, timestamps, totalTime } = useLocalSearchParams();
  const router = useRouter();

  const ua: string[] = JSON.parse(answers as string);
  const ts: number[] = JSON.parse(timestamps as string);
  const total = parseInt(totalTime as string || '0', 10);
  const n = ua.length;

  const [corrects, setCorrects] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const saved = JSON.parse(
        (await AsyncStorage.getItem('@correctAnswers')) || '[]'
      );
      const latest = saved.slice(-n);
      const correct = latest.map((q: any) => q.correctAnswer || '');
      setCorrects(correct);
    })();
  }, []);

  const correctCount = ua.filter((a, i) => a && corrects[i] === a).length;
  const wrongCount = ua.filter((a, i) => a && corrects[i] && corrects[i] !== a).length;
  const unattemptedCount = ua.filter((a) => !a).length;
  const attempted = n - unattemptedCount;
  const accuracy = attempted > 0 ? Math.round((correctCount / attempted) * 100) : 0;
  const avgTime = attempted > 0 ? Math.round(ts.reduce((a, b) => a + b, 0) / attempted) : 0;

  const animationRef = useRef<LottieView>(null);
  useEffect(() => {
    animationRef.current?.play();
  }, []);

  const { exam } = useLocalSearchParams();

  const getMarkingScheme = (exam: string) => {
    switch (exam.toLowerCase()) {
      case 'iit jee':
        return { correct: 4, wrong: -1 };
      case 'neet':
        return { correct: 4, wrong: -1 };
      case 'ssc cgl':
      case 'ssc je':
        return { correct: 1, wrong: -0.25 };
      default:
        return { correct: 1, wrong: -0.25 };
    }
  };

  const marking = getMarkingScheme(exam as string || '');
  const totalScore = (correctCount * marking.correct) + (wrongCount * marking.wrong);


  useEffect(() => {
    AsyncStorage.setItem('@lastScore', JSON.stringify({
      exam,
      score: totalScore,
      correct: correctCount,
      wrong: wrongCount,
      unattempted: unattemptedCount,
      accuracy,
      date: new Date().toISOString()
    }));
  }, [totalScore]);

  const getBadge = () => {
    if (accuracy >= 90) return '🏆 Excellent!';
    if (accuracy >= 70) return '💪 Good Job';
    if (accuracy >= 50) return '📈 Keep Improving';
    return '📚 Needs Practice';
  };

  const goToCorrectEdit = () => {
    router.replace({
      pathname: '/correct-answers',
      params: {
        answers: JSON.stringify(ua),
        timestamps: JSON.stringify(ts),
        totalTime: total.toString(),
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.navbar}>
        <Text style={styles.navTitle}>Test Summary</Text>
        <View style={{ width: 24 }} />
      </View>

      <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
        <LottieView
          ref={animationRef}
          source={require('../assets/confetti.json')}
          style={styles.lottie}
          autoPlay
          loop={false}
        />
        <Text style={styles.scoreBig}>{totalScore} pts</Text>
        <Text style={styles.accuracyText}>{correctCount}/{attempted} Correct • {accuracy}% Accuracy</Text>
        <Text style={styles.scoreExplain}>({marking.correct}/correct, {marking.wrong}/wrong)</Text>
        <Text style={styles.badge}>{getBadge()}</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.statsCard}>
        <StatRow label="⏱ Avg Time / Attempt" value={`${avgTime}s`} />
        <StatRow label="🔵 Attempted" value={attempted} />
        <StatRow label="✅ Correct" value={correctCount} />
        <StatRow label="❌ Wrong" value={wrongCount} />
        <StatRow label="⛔ Unattempted" value={unattemptedCount} />
      </Animated.View>

      <Card title="Performance Overview">
        <PieChart
          data={[
            { name: 'Correct', population: correctCount, color: '#00C853', legendFontColor: '#DDD', legendFontSize: 14 },
            { name: 'Wrong', population: wrongCount, color: '#D32F2F', legendFontColor: '#DDD', legendFontSize: 14 },
            { name: 'Unattempted', population: unattemptedCount, color: '#FBC02D', legendFontColor: '#DDD', legendFontSize: 14 },
          ]}
          width={WIDTH}
          height={180}
          chartConfig={{ color: () => '#FFF' }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </Card>

      <Card title="Answer Distribution">
        <BarChart
          yAxisLabel=""
          yAxisSuffix=""
          data={{
            labels: ['Correct', 'Wrong', 'Unattempted'],
            datasets: [{ data: [correctCount, wrongCount, unattemptedCount] }],
          }}
          width={WIDTH}
          height={240}
          fromZero
          showValuesOnTopOfBars
          withInnerLines={false}
          chartConfig={{
            backgroundGradientFrom: '#1E1E1E',
            backgroundGradientTo: '#1E1E1E',
            fillShadowGradient: '#4FC3F7',
            fillShadowGradientOpacity: 1,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(79, 195, 247, ${opacity})`,
            labelColor: () => '#FFF',
            propsForBackgroundLines: { strokeWidth: 0 },
            propsForLabels: { fontSize: 13 },
            propsForVerticalLabels: { fontWeight: '600' },
            barPercentage: 0.6,
          }}
          style={{ marginTop: 12, borderRadius: 12 }}
        />
      </Card>

      <TouchableOpacity style={styles.analyseBtn1} onPress={goToCorrectEdit}>
        <Text style={styles.analyseText}>✏️ Modify Correct Answers</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.analyseBtn}
        onPress={() => router.push({ pathname: '/analysis', params: { answers, timestamps } })}
      >
        <Text style={styles.analyseText}>📊 Test Analysis</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.finishBtn}
        onPress={() => router.replace('/')}
      >
        <Text style={styles.finishText}>🏠 Go Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatRow({ label, value }: { label: string, value: string | number }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function Card({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 20, alignItems: 'center', backgroundColor: '#0E0E0E' },
  header: { alignItems: 'center', marginBottom: 20 },
  scoreBig: { fontSize: 48, fontWeight: '800', color: '#4FC3F7', marginBottom: 4 },
  accuracyText: { fontSize: 18, color: '#81D4FA', marginBottom: 4 },
  scoreExplain: { fontSize: 14, color: '#BBB', marginBottom: 4 },
  badge: { fontSize: 16, color: '#A5D6A7', fontWeight: '600' },
  lottie: { width: 160, height: 160 },
  statsCard: {
    width: WIDTH,
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 16,
    elevation: 4,
    marginBottom: 20,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  label: { fontSize: 16, color: '#BBB' },
  value: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  chartCard: {
    width: WIDTH,
    backgroundColor: '#121212',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  chartTitle: { fontSize: 18, fontWeight: '600', color: '#FFF', marginBottom: 10 },
  analyseBtn: {
    backgroundColor: '#43A047',
    paddingVertical: 14,
    borderRadius: 12,
    width: WIDTH * 0.8,
    alignItems: 'center',
    marginBottom: 10,
  },
  analyseBtn1: {
    backgroundColor: '#BBB',
    paddingVertical: 14,
    borderRadius: 12,
    width: WIDTH * 0.8,
    alignItems: 'center',
    marginBottom: 10,
  },
  analyseText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  finishBtn: {
    backgroundColor: '#00E5FF',
    paddingVertical: 14,
    borderRadius: 12,
    width: WIDTH * 0.8,
    alignItems: 'center',
  },
  finishText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
