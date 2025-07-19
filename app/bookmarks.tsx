// Updated bookmark.tsx with premium, clean, professional logic
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
    AsyncStorage.getItem('@bookmarks').then((v) => {
      if (v) {
        const parsed = JSON.parse(v) as Bookmark[];
        const reversed = parsed.reverse();

        setBms(reversed);
        reapplyFilters(reversed);

        const uniqueSubjects = Array.from(
          new Set(
            reversed.map(
              (item) => item.subject?.trim().toLowerCase() || 'unknown'
            )
          )
        ).map((s) => s.charAt(0).toUpperCase() + s.slice(1));

        setSubjects(['All', ...uniqueSubjects]);
      }
    });
  }, []);

  const reapplyFilters = (
    updatedBms = bms,
    type = filter,
    subject = subjectFilter
  ) => {
    let result = [...updatedBms];

    if (type === 'correct') {
      result = result.filter((q) => q.yourAnswer === q.correctAnswer);
    } else if (type === 'wrong') {
      result = result.filter(
        (q) => q.yourAnswer && q.yourAnswer !== q.correctAnswer
      );
    }

    if (subject !== 'All') {
      result = result.filter(
        (q) =>
          (q.subject?.trim().toLowerCase() || 'unknown') ===
          subject.toLowerCase()
      );
    }

    setFiltered(result);
  };

  return (
    <View style={styles.container}>
      <View style={styles.navbar}>
        <Text style={styles.navTitle}>🔖 Bookmarks</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#29B6F6" />
        </TouchableOpacity>
      </View>

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
              reapplyFilters(bms, filter, subj);
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

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.reattemptBtn, { backgroundColor: '#FF5252' }]}
                onPress={async () => {
                  const updated = bms.filter((q) => q !== item);
                  await AsyncStorage.setItem(
                    '@bookmarks',
                    JSON.stringify(updated)
                  );
                  setBms(updated);
                  reapplyFilters(updated);

                  const uniqueSubjects = Array.from(
                    new Set(
                      updated.map(
                        (q) => q.subject?.trim().toLowerCase() || 'unknown'
                      )
                    )
                  ).map((s) => s.charAt(0).toUpperCase() + s.slice(1));
                  setSubjects(['All', ...uniqueSubjects]);

                  if (
                    subjectFilter !== 'All' &&
                    !updated.find(
                      (q) =>
                        (q.subject?.trim().toLowerCase() || 'unknown') ===
                        subjectFilter.toLowerCase()
                    )
                  ) {
                    setSubjectFilter('All');
                  }
                }}
              >
                <Text style={styles.reattemptText}>🗑 Remove</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reattemptBtn}
                onPress={() => {
                  const filteredIndexes = filtered.map((q) => bms.indexOf(q));
                  router.push({
                    pathname: '/reattempt-bookmark',
                    params: {
                      indexes: JSON.stringify(filteredIndexes),
                      startIndex: filteredIndexes.indexOf(bms.indexOf(item)),
                    },
                  });
                }}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
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
