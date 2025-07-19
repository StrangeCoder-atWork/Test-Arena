// Updated DashboardScreen with working accuracy, chapter bars, and subject/time filters.
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import CircularProgress from 'react-native-circular-progress-indicator';
import {
  BarChart,
  LineChart
} from 'react-native-gifted-charts';
import { useAppTheme } from '../hooks/useAppTheme';

const screenW = Dimensions.get('window').width;
const timeFilters = ['All Time', 'Last 3 Days', 'Last Week', 'Last Month'];
const trendFilters = ['Daily', 'Weekly'];

function daysBetween(d1, d2) {
  return Math.floor((d1 - d2) / (1000 * 3600 * 24));
}

export default function DashboardScreen() {
  const { colors } = useAppTheme();
  const [stats, setStats] = useState({});
  const [activeSubject, setActiveSubject] = useState('All');
  const [activeTime, setActiveTime] = useState('All Time');
  const [trendView, setTrendView] = useState('Daily');

  useEffect(() => {
    AsyncStorage.getItem('@paperHistory').then(raw => {
      const papers = raw ? JSON.parse(raw) : [];
      const grouped = {};
      const now = new Date();

      papers.forEach(p => {
        const { subject = 'Unknown', chapter = 'Unknown', answers = [], corrects = [], timestamps = [], date } = p;
        const key = `${subject}|${chapter}`;
        const paperDate = new Date(date);
        const age = daysBetween(now, paperDate);

        if (!grouped[subject]) grouped[subject] = [];
        grouped[subject].push({ age, answers, corrects, timestamps, chapter });
      });

      setStats(grouped);
    });
  }, []);

  const getFilteredStats = () => {
    const maxAge =
      activeTime === 'All Time' ? 9999 :
      activeTime === 'Last 3 Days' ? 3 :
      activeTime === 'Last Week' ? 7 :
      activeTime === 'Last Month' ? 30 : 9999;

    const filteredSubjects = activeSubject === 'All' ? Object.keys(stats) : [activeSubject];

    let attempted = 0, correct = 0, totalTime = 0;
    const chapters = {};
    const daily = Array(10).fill(0);

    filteredSubjects.forEach(subject => {
      stats[subject]?.forEach((paper, idx) => {
        if (paper.age > maxAge) return;

        const chKey = `${subject}|${paper.chapter}`;
        if (!chapters[chKey]) chapters[chKey] = { correct: 0, total: 0 };

        paper.answers.forEach((a, i) => {
          if (a) {
            attempted++;
            totalTime += paper.timestamps[i] || 0;
            chapters[chKey].total++;
            if (a === paper.corrects[i]) {
              correct++;
              chapters[chKey].correct++;
            }
          }
        });

        if (daily.length > idx) {
          daily[idx] += paper.answers.filter(a => a).length;
        }
      });
    });

    return { attempted, correct, avgTime: attempted ? Math.floor(totalTime / attempted) : 0, chapters, daily };
  };

  const filtered = getFilteredStats();
  const accuracy = filtered.attempted ? Math.round((filtered.correct / filtered.attempted) * 100) : 0;

  const topChapters = Object.entries(filtered.chapters as Record<string, { correct: number; total: number }>)
  .map(([k, v]) => ({
    label: k.split('|')[1],
    correct: Math.round((v.correct / v.total) * 100),
    wrong: 100 - Math.round((v.correct / v.total) * 100),
  }))
  .slice(0, 5);


  const barData = topChapters.map(s => ({
    stacks: [
      { value: s.correct, color: '#00E5FF' },
      { value: s.wrong, color: '#FF5252' },
    ],
    label: s.label,
  }));

  const lineData = (() => {
    if (trendView === 'Daily') {
      return filtered.daily.map((val, idx) => ({ value: val, label: `D${idx + 1}` }));
    } else {
      const bins = [];
      for (let i = 0; i < filtered.daily.length; i += 7) {
        const sum = filtered.daily.slice(i, i + 7).reduce((a, b) => a + b, 0);
        bins.push({ value: sum, label: `W${bins.length + 1}` });
      }
      return bins;
    }
  })();

  return (
    <ScrollView style={[styles.page, { backgroundColor: colors.background }]}>
      <Text style={styles.header}>📈 Performance Overview</Text>

      <View style={styles.filterRow}>
        {[{ label: 'All Subjects', key: 'All' }, ...Object.keys(stats).map(s => ({ label: s, key: s }))].map(s => (
          <TouchableOpacity key={s.key} onPress={() => setActiveSubject(s.key)} style={styles.filterBtn}>
            <Text style={styles.filterText}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.filterRow}>
        {timeFilters.map(t => (
          <TouchableOpacity key={t} onPress={() => setActiveTime(t)} style={styles.filterBtn}>
            <Text style={styles.filterText}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.filterRow}>
        {trendFilters.map(t => (
          <TouchableOpacity key={t} onPress={() => setTrendView(t)} style={styles.filterBtn}>
            <Text style={styles.filterText}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.subHeader}>Subject: {activeSubject}</Text>

      <CircularProgress
        value={accuracy}
        radius={80}
        duration={1500}
        progressValueColor={colors.text}
        activeStrokeColor={colors.progressPrimary}
        activeStrokeSecondaryColor={colors.progressSecondary}
        inActiveStrokeColor={colors.chartGrid}
        titleColor={colors.subtitle}
      />

      <Text style={styles.chartTitle}>Attempts ({trendView})</Text>
      {lineData.length > 0 && (
        <LineChart
          data={lineData}
          width={screenW - 32}
          height={180}
          areaChart
          color={colors.chartLine}
          thickness={2}
          startFillColor={colors.chartFill}
          endFillColor="#00000000"
          noOfSections={4}
          showVerticalLines
          xAxisLabelTextStyle={{ color: '#DDD' }}
          yAxisTextStyle={{ color: '#888' }}
          isAnimated
        />
      )}

      <Text style={[styles.chartTitle, { marginTop: 24 }]}>Top Chapter Accuracy</Text>
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

      <View style={styles.cards}>
        <Text style={styles.card}>🧠 Attempted: {filtered.attempted}</Text>
        <Text style={styles.card}>✅ Correct: {filtered.correct}</Text>
        <Text style={styles.card}>⏱ Avg Time/Q: {filtered.avgTime}s</Text>
      </View>

      <View style={styles.tipBox}>
        <Text style={styles.tipHeader}>💡 Tip</Text>
        <Text style={styles.tipText}>
          {accuracy < 75
            ? 'Focus on weaker chapters and maintain a timer while practicing.'
            : 'Awesome! Maintain this momentum and reduce your solving time.'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#0C0C0D' },
  container: { alignItems: 'center', padding: 16, paddingBottom: 100 },
  header: { fontSize: 28, color: '#00E5FF', fontWeight: '700', marginBottom: 12 },
  subHeader: { fontSize: 16, color: '#AAA', marginBottom: 16 },
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
  filterRow: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 8, marginTop: 4,
  },
  filterBtn: {
    borderColor: '#00E5FF', borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, margin: 4,
  },
  filterText: { color: '#FFF', fontSize: 13 },
});
