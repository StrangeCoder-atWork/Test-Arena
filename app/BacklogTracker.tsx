import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import CircularProgress from 'react-native-circular-progress-indicator';
import { LineChart } from 'react-native-gifted-charts';

interface Topic {
  id: string;
  subject: string;
  title: string;
  done: boolean;
  completedAt?: string;
}

const screenW = Dimensions.get('window').width;

const BacklogTracker = () => {
  const [data, setData] = useState<Topic[]>([]);
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [xpHistory, setXpHistory] = useState<number[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    saveData();
  }, [data, xp, level, streak, xpHistory]);

  const loadData = async () => {
    const stored = await AsyncStorage.getItem('backlogData');
    const xpStored = await AsyncStorage.getItem('xp');
    const levelStored = await AsyncStorage.getItem('level');
    const streakStored = await AsyncStorage.getItem('streak');
    const xpHistoryStored = await AsyncStorage.getItem('xpHistory');
    if (stored) setData(JSON.parse(stored));
    if (xpStored) setXp(parseInt(xpStored));
    if (levelStored) setLevel(parseInt(levelStored));
    if (streakStored) setStreak(parseInt(streakStored));
    if (xpHistoryStored) setXpHistory(JSON.parse(xpHistoryStored));
  };

  const saveData = async () => {
    await AsyncStorage.setItem('backlogData', JSON.stringify(data));
    await AsyncStorage.setItem('xp', xp.toString());
    await AsyncStorage.setItem('level', level.toString());
    await AsyncStorage.setItem('streak', streak.toString());
    await AsyncStorage.setItem('xpHistory', JSON.stringify(xpHistory));
  };

  const addTopic = () => {
    if (!subject || !title) return;
    setData([...data, { id: Date.now().toString(), subject, title, done: false }]);
    setSubject('');
    setTitle('');
  };

  const resetAll = () => {
    Alert.alert('Reset All', 'Are you sure you want to clear all backlog data?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          setData([]);
          setXp(0);
          setLevel(1);
          setStreak(0);
          setXpHistory([]);
          await AsyncStorage.clear();
        },
      },
    ]);
  };

  const toggleDone = (id: string) => {
    const newData = data.map(item => {
      if (item.id === id) {
        const wasDone = item.done;
        const newDoneStatus = !item.done;
        const updatedItem = {
          ...item,
          done: newDoneStatus,
          completedAt: newDoneStatus ? new Date().toLocaleString() : undefined,
        };
        if (newDoneStatus && !wasDone) gainXp(50);
        else if (!newDoneStatus && wasDone) loseXp(50);
        return updatedItem;
      }
      return item;
    });
    setData(newData);
  };

  const gainXp = (amount: number) => {
    let newXp = xp + amount;
    let newLevel = level;
    while (newXp >= 700) {
      newXp -= 700;
      newLevel++;
    }
    setXp(newXp);
    setLevel(newLevel);
    const today = new Date().toDateString();
    if (xpHistory.length === 0 || new Date().toDateString() !== new Date(Date.now()).toDateString()) {
      setStreak(streak + 1);
      setXpHistory([...xpHistory.slice(-6), amount]);
    } else {
      const updated = [...xpHistory];
      updated[updated.length - 1] += amount;
      setXpHistory(updated);
    }
  };

  const loseXp = (amount: number) => {
    let newXp = xp - amount;
    let newLevel = level;
    while (newXp < 0 && newLevel > 1) {
      newXp += 700;
      newLevel--;
    }
    if (newXp < 0) newXp = 0;
    setXp(newXp);
    setLevel(newLevel);
  };

  const pickRandomTopic = () => {
    const remaining = data.filter(d => !d.done);
    if (remaining.length === 0) return Alert.alert('🎉 All topics complete!', 'No remaining backlog left.');
    const chosen = remaining[Math.floor(Math.random() * remaining.length)];
    Alert.alert('Today’s Battle ⚔️', `${chosen.subject}: ${chosen.title}`);
  };

  const completed = data.filter(i => i.done).length;
  const progress = data.length === 0 ? 0 : completed / data.length;
  const lineData = xpHistory.map((val, idx) => ({ value: val, label: `D${idx + 1}` }));

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <Text style={styles.header}>🎯 Backlog Mastery</Text>

      <View style={styles.circularBox}>
        <CircularProgress
          value={progress * 100}
          radius={80}
          duration={1200}
          activeStrokeColor="#00E5FF"
          activeStrokeSecondaryColor="#00C853"
          inActiveStrokeColor="#2e2e2e"
          inActiveStrokeOpacity={0.3}
          title="Progress"
          titleColor="#AAA"
          progressValueColor="#FFF"
        />
        <Text style={styles.levelText}>Level {level} — {xp} XP</Text>
      </View>

      <View style={styles.streakBox}><Text style={styles.streakText}>🔥 Streak: {streak} Days</Text></View>

      <Text style={styles.graphTitle}>📊 XP History (Past {xpHistory.length} Days)</Text>
      <LineChart
        data={lineData}
        width={screenW - 40}
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

      <View style={styles.inputContainer}>
        <TextInput
          value={subject}
          onChangeText={setSubject}
          placeholder="Subject (Physics, Math, Chem)"
          placeholderTextColor="#AAA"
          style={styles.input}
        />
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Topic Title"
          placeholderTextColor="#AAA"
          style={styles.input}
        />
        <TouchableOpacity onPress={addTopic} style={styles.addButton}>
          <Text style={styles.addText}>➕ Add Topic</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => toggleDone(item.id)} style={[styles.card, item.done && styles.cardDone]}>
            <Text style={styles.cardTitle}>{item.subject}</Text>
            <Text style={styles.cardSubtitle}>{item.title}</Text>
            <Text style={styles.cardStatus}>{item.done ? `✅ Done on ${item.completedAt}` : '🔄 Pending'}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <View style={styles.footerRow}>
        <TouchableOpacity onPress={pickRandomTopic} style={styles.footerBtnBlue}>
          <Text style={styles.footerText}>⚔️ Today’s Battle</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={resetAll} style={styles.footerBtnRed}>
          <Text style={styles.footerText}>Reset All</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#0C0C0D' },
  container: { alignItems: 'center', padding: 20 },
  header: { fontSize: 28, color: '#00E5FF', fontWeight: '700', marginBottom: 16 },
  circularBox: { marginBottom: 24, alignItems: 'center' },
  levelText: { marginTop: 12, color: '#90ee90', fontSize: 16, fontWeight: '600' },
  inputContainer: { width: '100%', marginBottom: 20 },
  input: {
    backgroundColor: '#1E1E22',
    color: '#FFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#00C853',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  card: {
    width: screenW - 40,
    backgroundColor: '#1A1A1F',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardDone: { backgroundColor: '#2E7D32' },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#00E5FF', marginBottom: 4 },
  cardSubtitle: { color: '#EEE', fontSize: 16, marginBottom: 4 },
  cardStatus: { color: '#AAA', fontSize: 12 },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: screenW - 40,
    marginTop: 20,
  },
  footerBtnBlue: {
    flex: 1,
    backgroundColor: '#1E88E5',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  footerBtnRed: {
    flex: 1,
    backgroundColor: '#D32F2F',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  footerText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  streakBox: { marginTop: 8, marginBottom: 12 },
  streakText: { color: '#FFD700', fontSize: 16, fontWeight: '600' },
  graphTitle: {
    fontSize: 18,
    color: '#DDD',
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
});

export default BacklogTracker;
