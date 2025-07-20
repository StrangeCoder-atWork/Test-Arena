import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
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
const { width: screenWidth } = Dimensions.get('window');

// Premium psychological colors
const Colors = {
  background: '#000000',
  surface: '#0A0A0A',
  card: '#111111',
  accent: '#00E5FF',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  text: '#FFFFFF',
  textSecondary: '#B8BCC8',
  textMuted: '#6B7280',
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
  excellent: '#10B981',
  good: '#3B82F6',
  average: '#F59E0B',
  poor: '#EF4444',
};

export default function ResultsScreen() {
  const { answers, timestamps, totalTime, exam } = useLocalSearchParams();
  const router = useRouter();
  
  const ua: string[] = JSON.parse(answers as string);
  const ts: number[] = JSON.parse(timestamps as string);
  const total = parseInt(totalTime as string || '0', 10);
  const n = ua.length;
  
  const [corrects, setCorrects] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    (async () => {
      try {
        const saved = JSON.parse(
          (await AsyncStorage.getItem('@correctAnswers')) || '[]'
        );
        const latest = saved.slice(-n);
        const correct = latest.map((q: any) => q.correctAnswer || '');
        setCorrects(correct);
      } catch (error) {
        console.error('Error loading correct answers:', error);
        setCorrects([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [n]);

  // Fixed exam-based marking scheme with proper detection
  const getMarkingScheme = (examName: string) => {
    const examLower = examName?.toString().toLowerCase().trim() || '';
    
    // More precise exam detection
    if (examLower.includes('iit') || examLower.includes('jee')) {
      return { correct: 4, wrong: -1, name: 'IIT JEE' };
    }
    if (examLower.includes('neet')) {
      return { correct: 4, wrong: -1, name: 'NEET' };
    }
    if (examLower.includes('ssc')) {
      if (examLower.includes('cgl')) {
        return { correct: 1, wrong: -0.25, name: 'SSC CGL' };
      }
      if (examLower.includes('je')) {
        return { correct: 1, wrong: -0.25, name: 'SSC JE' };
      }
      return { correct: 1, wrong: -0.25, name: 'SSC' };
    }
    
    // Default fallback with better detection
    console.log('Exam detected:', examLower);
    return { correct: 1, wrong: -0.25, name: exam?.toString() || 'General' };
  };

  const marking = getMarkingScheme(exam as string);

  // Fixed statistics calculation
  const correctCount = ua.filter((a, i) => a && a.trim() !== '' && corrects[i] === a).length;
  const wrongCount = ua.filter((a, i) => a && a.trim() !== '' && corrects[i] && corrects[i] !== a).length;
  const unattemptedCount = ua.filter((a) => !a || a.trim() === '').length;
  const attempted = n - unattemptedCount;
  const accuracy = attempted > 0 ? Math.round((correctCount / attempted) * 100) : 0;
  const avgTime = attempted > 0 ? Math.round(ts.reduce((a, b) => a + b, 0) / attempted) : 0;

  // Fixed score calculation with proper handling of negative marks
  const correctMarks = correctCount * marking.correct;
  const wrongMarks = wrongCount * marking.wrong;
  const totalScore = Math.max(0, correctMarks + wrongMarks); // Ensure score doesn't go below 0
  const maxPossibleScore = n * marking.correct;
  const scorePercentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

  // Fixed animation trigger
  useEffect(() => {
    if (!isLoading && animationRef.current) {
      // Delay to ensure component is mounted
      setTimeout(() => {
        animationRef.current?.play();
      }, 500);
    }
  }, [isLoading]);

  // Save results with proper exam context
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem('@lastScore', JSON.stringify({
        exam: exam || 'General',
        examType: marking.name,
        score: totalScore,
        maxScore: maxPossibleScore,
        scorePercentage,
        correct: correctCount,
        wrong: wrongCount,
        unattempted: unattemptedCount,
        attempted,
        accuracy,
        avgTime,
        totalQuestions: n,
        markingScheme: marking,
        correctMarks,
        wrongMarks,
        date: new Date().toISOString()
      }));
    }
  }, [totalScore, isLoading]);

  const getBadgeData = () => {
    if (scorePercentage >= 90) {
      return { 
        text: '🏆 Exceptional Performance!', 
        color: Colors.gold,
        bgColor: `${Colors.gold}20`,
        description: 'Outstanding mastery of concepts'
      };
    }
    if (scorePercentage >= 75) {
      return { 
        text: '🥇 Excellent Work!', 
        color: Colors.excellent,
        bgColor: `${Colors.excellent}20`,
        description: 'Strong understanding demonstrated'
      };
    }
    if (scorePercentage >= 60) {
      return { 
        text: '🥈 Good Progress!', 
        color: Colors.good,
        bgColor: `${Colors.good}20`,
        description: 'Solid foundation building'
      };
    }
    if (scorePercentage >= 40) {
      return { 
        text: '🥉 Keep Improving!', 
        color: Colors.average,
        bgColor: `${Colors.average}20`,
        description: 'Growth mindset in action'
      };
    }
    return { 
      text: '📚 Focus & Practice!', 
      color: Colors.poor,
      bgColor: `${Colors.poor}20`,
      description: 'Every expert was once a beginner'
    };
  };

  const badgeData = getBadgeData();

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

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.loadingText}>Calculating Results...</Text>
      </View>
    );
  }

  // Fixed chart data with proper values
  const pieData = [
    {
      name: 'Correct',
      population: correctCount,
      color: Colors.excellent,
      legendFontColor: Colors.text,
      legendFontSize: 12,
    },
    {
      name: 'Wrong',
      population: wrongCount,
      color: Colors.danger,
      legendFontColor: Colors.text,
      legendFontSize: 12,
    },
    {
      name: 'Unattempted',
      population: unattemptedCount,
      color: Colors.textMuted,
      legendFontColor: Colors.text,
      legendFontSize: 12,
    },
  ].filter(item => item.population > 0); // Only show sections with data

  const barData = {
    labels: ['Correct', 'Wrong', 'Skipped'],
    datasets: [{
      data: [
        Math.max(1, correctCount),
        Math.max(1, wrongCount), 
        Math.max(1, unattemptedCount)
      ],
      colors: [
        () => Colors.excellent,
        () => Colors.danger,
        () => Colors.textMuted,
      ]
    }],
  };

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 229, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(184, 188, 200, ${opacity})`,
    style: { borderRadius: 12 },
    propsForLabels: { fontSize: 11, fontWeight: '500' },
    propsForVerticalLabels: { fontWeight: '600' },
    barPercentage: 0.7,
    withCustomBarColorFromData: true,
    fillShadowGradient: Colors.accent,
    fillShadowGradientOpacity: 0.3,
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Animated.View entering={FadeInUp} style={styles.navbar}>
          <Text style={styles.navTitle}>Test Results</Text>
        </Animated.View>

        {/* Main Score Card */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.scoreCard}>
          <LinearGradient
            colors={[Colors.card, Colors.surface]}
            style={styles.scoreCardGradient}
          >
            {/* Fixed Lottie Animation */}
            <View style={styles.animationContainer}>
              <LottieView
                ref={animationRef}
                source={require('../assets/confetti.json')}
                style={styles.lottie}
                autoPlay={false}
                loop={false}
                speed={1}
                resizeMode="contain"
              />
            </View>

            {/* Enhanced Score Display */}
            <View style={styles.scoreDisplay}>
              <Text style={styles.scoreBig}>{totalScore}</Text>
              <Text style={styles.scoreUnit}>/ {maxPossibleScore} pts</Text>
              <Text style={styles.accuracyText}>
                {correctCount}/{attempted} Correct • {accuracy}% Accuracy
              </Text>
              <Text style={styles.scoreExplain}>
                {marking.name} ({marking.correct > 0 ? '+' : ''}{marking.correct}/correct, {marking.wrong}/wrong)
              </Text>
              
              {/* Score Breakdown */}
              <View style={styles.scoreBreakdown}>
                <Text style={styles.scoreBreakdownText}>
                  Earned: +{correctMarks} | Lost: {wrongMarks} | Net: {totalScore}
                </Text>
              </View>
            </View>

            {/* Badge */}
            <View style={[styles.badge, { backgroundColor: badgeData.bgColor }]}>
              <Text style={[styles.badgeText, { color: badgeData.color }]}>
                {badgeData.text}
              </Text>
              <Text style={styles.badgeDescription}>
                {badgeData.description}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Statistics Grid */}
        <Animated.View entering={FadeInUp.delay(300)} style={styles.statsGrid}>
          <StatCard 
            title="Score %" 
            value={`${scorePercentage}%`} 
            color={scorePercentage >= 60 ? Colors.excellent : scorePercentage >= 40 ? Colors.warning : Colors.danger}
            subtitle="of max possible"
          />
          <StatCard 
            title="Accuracy" 
            value={`${accuracy}%`} 
            color={accuracy >= 75 ? Colors.excellent : accuracy >= 50 ? Colors.warning : Colors.danger}
            subtitle="of attempted"
          />
          <StatCard 
            title="Avg Time" 
            value={`${avgTime}s`} 
            color={Colors.accent}
            subtitle="per question"
          />
          <StatCard 
            title="Attempted" 
            value={`${attempted}/${n}`} 
            color={Colors.good}
            subtitle="questions"
          />
        </Animated.View>

        {/* Detailed Stats */}
        <Animated.View entering={FadeInUp.delay(400)} style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Performance Breakdown</Text>
          
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIndicator, { backgroundColor: Colors.excellent }]} />
              <Text style={styles.statLabel}>Correct Answers</Text>
              <Text style={styles.statValue}>{correctCount} (+{correctMarks})</Text>
            </View>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIndicator, { backgroundColor: Colors.danger }]} />
              <Text style={styles.statLabel}>Wrong Answers</Text>
              <Text style={styles.statValue}>{wrongCount} ({wrongMarks})</Text>
            </View>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIndicator, { backgroundColor: Colors.textMuted }]} />
              <Text style={styles.statLabel}>Unattempted</Text>
              <Text style={styles.statValue}>{unattemptedCount} (0)</Text>
            </View>
          </View>


          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIndicator, { backgroundColor: Colors.gold }]} />
              <Text style={styles.statLabel}>Net Score</Text>
              <Text style={[styles.statValue, { color: totalScore >= 0 ? Colors.excellent : Colors.danger }]}>
                {totalScore} / {maxPossibleScore}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Fixed Charts */}
        {(correctCount > 0 || wrongCount > 0 || unattemptedCount > 0) && (
          <Animated.View entering={FadeInUp.delay(500)} style={styles.chartCard}>
            <Text style={styles.chartTitle}>Response Distribution</Text>
            <PieChart
              data={pieData}
              width={screenWidth - 80}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
              hasLegend={true}
            />
          </Animated.View>
        )}

        {(correctCount > 0 || wrongCount > 0 || unattemptedCount > 0) && (
          <Animated.View entering={FadeInUp.delay(600)} style={styles.chartCard}>
            <Text style={styles.chartTitle}>Performance Analysis</Text>
            <BarChart
              yAxisLabel=""
              yAxisSuffix=""
              data={barData}
              width={screenWidth - 80}
              height={220}
              chartConfig={chartConfig}
              verticalLabelRotation={0}
              style={{ marginTop: 12, borderRadius: 12 }}
              showBarTops={true}
              showValuesOnTopOfBars={true}
            />
          </Animated.View>
        )}

        {/* Action Buttons */}
        <Animated.View entering={FadeInDown.delay(700)} style={styles.actionSection}>
          <TouchableOpacity onPress={goToCorrectEdit} style={styles.primaryButton}>
            <LinearGradient
              colors={[Colors.accent, '#0099CC']}
              style={styles.buttonGradient}
            >
              <Text style={styles.primaryButtonText}>✏️ Review & Edit Answers</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push({ pathname: '/analysis', params: { answers, timestamps } })}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>📊 Detailed Analysis</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace('/')}
            style={styles.tertiaryButton}
          >
            <Text style={styles.tertiaryButtonText}>🏠 Return Home</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function StatCard({ title, value, color, subtitle }: { 
  title: string; 
  value: string; 
  color: string; 
  subtitle: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statCardTitle}>{title}</Text>
      <Text style={[styles.statCardValue, { color }]}>{value}</Text>
      <Text style={styles.statCardSubtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background 
  },
  scrollContent: { 
    flexGrow: 1,
    paddingBottom: 40,
  },
  loadingText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  navbar: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingTop: 60,
    marginBottom: 20,
  },
  navTitle: {
    fontSize: 28,
    color: Colors.accent,
    fontWeight: '800',
    letterSpacing: 1,
  },
  scoreCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden',
  },
  scoreCardGradient: {
    padding: 32,
    alignItems: 'center',
  },
  animationContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: { 
    width: 120, 
    height: 120 
  },
  scoreDisplay: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreBig: { 
    fontSize: 56, 
    fontWeight: '900', 
    color: Colors.accent, 
    marginBottom: 4,
    letterSpacing: 1,
  },
  scoreUnit: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginBottom: 12,
    fontWeight: '600',
  },
  accuracyText: { 
    fontSize: 18, 
    color: Colors.text, 
    marginBottom: 8,
    fontWeight: '600',
  },
  scoreExplain: { 
    fontSize: 14, 
    color: Colors.textMuted, 
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  scoreBreakdown: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scoreBreakdownText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  badgeText: { 
    fontSize: 18, 
    fontWeight: '700',
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statCardTitle: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  statCardSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  detailsCard: {
    backgroundColor: Colors.card,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 20,
  },
  statRow: {
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  chartCard: {
    backgroundColor: Colors.card,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  chartTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: Colors.text, 
    marginBottom: 16,
    textAlign: 'center',
  },
  noDataText: {
    color: Colors.textMuted,
    textAlign: 'center',
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 40,
  },
  actionSection: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  primaryButton: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: Colors.card,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  tertiaryButtonText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
});
