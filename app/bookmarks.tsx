import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Bookmark {
  exam?: string;
  subject?: string;
  chapter?: string;
  questionIndex: number;
  yourAnswer: string;
  correctAnswer: string;
  timeTaken: number;
  date: string;
  questionImage?: string;
  solutionImage?: string;
}

export default function BookmarksScreen() {
  const [subjectFilter, setSubjectFilter] = useState<string>('All');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [bms, setBms] = useState<Bookmark[]>([]);
const [filtered, setFiltered] = useState<Bookmark[]>([]);
  const [filter, setFilter] = useState<'all' | 'correct' | 'wrong'>('all');
  const router = useRouter();

  useEffect(() => {
  AsyncStorage.getItem('@bookmarks').then(v => {
    if (v) {
      const parsed = JSON.parse(v) as Bookmark[];
      const reversed = parsed.reverse();
      setBms(reversed);
      setFiltered(reversed);

      // 🔍 Collect only subjects that exist in the data
      const uniqueSubjects = Array.from(
        new Set(reversed.map(item => item.subject?.trim() || 'Unknown'))
      );

      setSubjects(['All', ...uniqueSubjects]);
    }
  });
}, []);

  const applyFilter = (type: 'all' | 'correct' | 'wrong') => {
    setFilter(type);
    if (type === 'correct') {
      setFiltered(bms.filter(q => q.yourAnswer === q.correctAnswer));
    } else if (type === 'wrong') {
      setFiltered(bms.filter(q => q.yourAnswer && q.yourAnswer !== q.correctAnswer));
    } else {
      setFiltered(bms);
    }
  };

  return (
    <View style={styles.container}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <Text style={styles.navTitle}>🔖 Bookmarks</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#29B6F6" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
  {subjects.map((subj, index) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.filterBtn,
        subjectFilter === subj && styles.activeFilterBtn,
      ]}
      onPress={() => {
        setSubjectFilter(subj);
        if (subj === 'All') {
          setFiltered(bms);
        } else {
          setFiltered(bms.filter(q => (q.subject?.trim() || 'Unknown') === subj));
        }
      }}
    >
      <Text style={styles.filterText}>{subj}</Text>
    </TouchableOpacity>
  ))}
</View>


      <ScrollView contentContainerStyle={styles.scroll}>
        {filtered.length === 0 && (
          <Text style={styles.noBookmarks}>No bookmarks found.</Text>
        )}

        {filtered.map((item, index) => (
          <View key={index} style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.qIndex}>Q{item.questionIndex + 1}</Text>
              <Text style={styles.subChap}>
                {item.subject || 'Unknown'} • {item.chapter || 'Unknown'}
              </Text>
            </View>

            <Text style={styles.infoText}>
              Your Answer: <Text style={styles.red}>{item.yourAnswer || '-'}</Text>
            </Text>
            <Text style={styles.infoText}>
              Correct Answer: <Text style={styles.green}>{item.correctAnswer || '-'}</Text>
            </Text>
            <Text style={styles.time}>
              🕒 {item.timeTaken}s • {new Date(item.date).toLocaleDateString()}
            </Text>

            {item.questionImage && (
              <Image source={{ uri: item.questionImage }} style={styles.image} />
            )}
            {item.solutionImage && (
              <Image source={{ uri: item.solutionImage }} style={styles.image} />
            )}

            {/* Action Button */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.reattemptBtn}
                onPress={() =>
                  router.push({
                    pathname: '/reattempt-bookmark',
                    params: {
                      indexes: JSON.stringify(
                        filtered.map((_, i) => bms.indexOf(filtered[i]))
                      ),
                    },
                  })
                }
              >
                <Text style={styles.reattemptText}>🔁 Reattempt</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
    paddingTop: 35,
  },
  filterRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'center',
  paddingVertical: 10,
  backgroundColor: '#121212',
},
filterBtn: {
  backgroundColor: '#222',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 6,
  margin: 4,
},
activeFilterBtn: {
  backgroundColor: '#29B6F6',
},
filterText: {
  color: '#fff',
  fontSize: 13,
},

  navbar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#121212',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#222',
  },
  navTitle: {
    fontSize: 22,
    color: '#29B6F6',
    fontWeight: 'bold',
  },
  scroll: {
    padding: 16,
    paddingBottom: 50,
  },
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#29B6F6',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  qIndex: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subChap: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  infoText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginVertical: 2,
  },
  red: {
    color: '#FF8A80',
  },
  green: {
    color: '#A5D6A7',
  },
  time: {
    color: '#999',
    fontSize: 12,
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    resizeMode: 'contain',
    marginVertical: 10,
    borderColor: '#29B6F6',
    borderWidth: 1,
  },
  actionRow: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems:"flex-end",
    marginTop: 8,
  },
  reattemptBtn: {
    backgroundColor: '#00C853',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    
  },
  reattemptText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  noBookmarks: {
    textAlign: 'center',
    color: '#888',
    marginTop: 40,
    fontSize: 16,
  },
});
