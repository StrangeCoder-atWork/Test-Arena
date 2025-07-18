import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function HistoryScreen() {
  const [papers, setPapers] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const loadPapers = async () => {
      const data = await AsyncStorage.getItem('@paperHistory');
      console.log('History found:', data ? JSON.parse(data) : null);
      if (data) setPapers(JSON.parse(data).reverse());
    };
    loadPapers();
  }, []);


  const goToReview = (paper: any) => {
    router.push({
      pathname: '/results',
      params: {
        answers: JSON.stringify(paper.answers),
        timestamps: JSON.stringify(paper.timestamps),
        totalTime: paper.totalTime,
        exam: paper.exam,
        subject: paper.subject,
        chapter: paper.chapter,
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>📘 Your Test History</Text>

      {papers.length === 0 && (
        <Text style={{ color: '#888', marginTop: 30 }}>No tests taken yet.</Text>
      )}

      {papers.map((paper, idx) => (
        <Animated.View key={idx} entering={FadeInUp.delay(idx * 60)} style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.subject}>{paper.exam} – {paper.subject}</Text>
            <Text style={styles.date}>{new Date(paper.date).toLocaleString()}</Text>
          </View>
          <Text style={styles.chapter}>📚 {paper.chapter}</Text>

          <View style={styles.rowBetween}>
            <Text style={styles.qCount}>🧮 Qs: {paper.answers.length}</Text>
            <TouchableOpacity
              style={styles.reviewBtn}
              onPress={() => goToReview(paper)}
            >
              <MaterialIcons name="search" size={18} color="#FFF" />
              <Text style={styles.reviewText}> Review</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
    paddingHorizontal: 16,
    backgroundColor: '#0E0E0E',
    alignItems: 'center',
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: '#00E5FF',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 16,
    elevation: 5,
    shadowColor: '#00E5FF',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4FC3F7',
  },
  date: {
    fontSize: 12,
    color: '#AAA',
  },
  chapter: {
    color: '#A5D6A7',
    marginBottom: 8,
    fontSize: 14,
  },
  qCount: {
    color: '#FFD54F',
    fontWeight: '600',
  },
  reviewBtn: {
    backgroundColor: '#00C853',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reviewText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
