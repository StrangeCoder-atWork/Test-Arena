import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import CircularProgress from 'react-native-circular-progress-indicator';
import {
    BarChart,
    LineChart
} from 'react-native-gifted-charts';
const screenW = Dimensions.get('window').width;

export default function DashboardScreen() {
  const [stats, setStats] = useState({
    attempted: 0,
    correct: 0,
    avgTime: 0,
    subjectStats: {} as Record<string, { correct: number; total: number }>,
    dailyCounts: [] as number[],
  });

  useEffect(() => {
    AsyncStorage.getItem('@paperHistory').then(raw => {
      const papers = raw ? JSON.parse(raw) : [];
      const last = papers.slice(-10);
      const sub: Record<string, { correct: number; total: number }> = {};
      let attempted = 0, correct = 0, totalTime = 0;
      const daily: number[] = [];

      last.forEach((p: any) => {
        const { answers = [], corrects = [], timestamps = [], subject, chapter } = p;
        const key = `${subject}|${chapter}`;
        if (!sub[key]) sub[key] = { correct: 0, total: 0 };

        answers.forEach((a: any, i: number) => {
          attempted++;
          totalTime += timestamps[i] || 0;
          sub[key].total++;
          if (a && a === corrects[i]) {
            correct++;
            sub[key].correct++;
          }
        });

        daily.push(answers.filter((a: any) => a !== null && a !== undefined).length);
      });

      setStats({
        attempted,
        correct,
        avgTime: attempted ? Math.floor(totalTime / attempted) : 0,
        subjectStats: sub,
        dailyCounts: daily,
      });
    });
  }, []);

  const accuracy = stats.attempted ? Math.round((stats.correct / stats.attempted) * 100) : 0;

  const pieData = [
    { value: accuracy, color: '#00E5FF' },
    { value: 100 - accuracy, color: '#2e2e2e' },
  ];

  const topSubjects = Object.entries(stats.subjectStats)
    .map(([k, v]) => ({
      label: k.split('|')[1].trim(),
      correct: Math.round((v.correct / v.total) * 100),
      wrong: 100 - Math.round((v.correct / v.total) * 100),
    }))
    .slice(0, 5);

  const barData = topSubjects.map(s => ({
    stacks: [
      { value: s.correct, color: '#00E5FF' },
      { value: s.wrong, color: '#FF5252' },
    ],
    label: s.label,
  }));

  const lineData = stats.dailyCounts.map((val, idx) => ({
    value: val,
    label: `T${idx + 1}`,
  }));

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <Text style={styles.header}>Progress Dashboard</Text>

      {/* 🎯 Accuracy Ring */}
      <CircularProgress
  value={accuracy}
  radius={80}
  duration={1500}
  progressValueColor="#FFF"
  activeStrokeColor="#00E5FF"
  activeStrokeSecondaryColor="#00C853"
  inActiveStrokeColor="#2e2e2e"
  inActiveStrokeOpacity={0.5}
  title="Accuracy"
  titleColor="#AAA"
/>
      <Text style={styles.pieLabel}>Accuracy</Text>

      {/* 📊 Attempts Line */}
      <Text style={styles.chartTitle}>Attempts (Last {lineData.length})</Text>
      {lineData.length > 0 && (
        <LineChart
          data={lineData}
          width={screenW - 32}
          height={180}
          areaChart
          color="#00C853"
          thickness={2}
          startFillColor="#00E5FF"
          endFillColor="#00000000"
          noOfSections={4}
          showVerticalLines
          xAxisLabelTextStyle={{ color: '#DDD' }}
          yAxisTextStyle={{ color: '#888' }}
          isAnimated
        />
      )}

      {/* 🧩 Chapter Performance */}
      <Text style={[styles.chartTitle, { marginTop: 24 }]}>Top 5 Chapters Performance</Text>
      {barData.length > 0 && (
        <BarChart
          barWidth={26}
          noOfSections={4}
          barBorderRadius={6}
          frontColor="#00E5FF"
          data={barData}
          width={screenW - 32}
          height={200}
          stackData={barData}
          xAxisLabelTextStyle={{ color: '#DDD' }}
          yAxisTextStyle={{ color: '#888' }}
        />
      )}

      {/* 📌 Stats Overview */}
      <View style={styles.cards}>
        <Text style={styles.card}>🧠 Attempted: {stats.attempted}</Text>
        <Text style={styles.card}>✅ Correct: {stats.correct}</Text>
        <Text style={styles.card}>⏱ Avg Time/Q: {stats.avgTime}s</Text>
      </View>

      {/* 💡 Tip Box */}
      <View style={styles.tipBox}>
        <Text style={styles.tipHeader}>💡 Tip</Text>
        <Text style={styles.tipText}>
          {accuracy < 75
            ? 'Practice chapters with accuracy below 70% and use a timer to improve speed.'
            : 'Great job! Maintain accuracy above 85% and reduce your time per question.'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#0C0C0D' },
  container: { alignItems: 'center', padding: 16, paddingBottom: 100 },
  header: { fontSize: 28, color: '#00E5FF', fontWeight: '700', marginBottom: 24 },
  pieCenter: { fontSize: 32, fontWeight: '700', color: '#FFF' },
  pieLabel: { marginTop: 8, fontSize: 16, color: '#AAA' },
  chartTitle: { alignSelf: 'flex-start', color: '#DDD', fontSize: 18, marginTop: 16 },
  cards: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  card: {
    backgroundColor: '#1E1E22',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    textAlign: 'center',
    color: '#FFF',
    fontSize: 16,
  },
  tipBox: {
    marginTop: 32,
    backgroundColor: '#1A1A1F',
    padding: 16,
    borderRadius: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#00E5FF',
    width: '95%',
  },
  tipHeader: { color: '#00E5FF', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  tipText: { color: '#DDD', fontSize: 14 },
});
