import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';

const { width: screenWidth } = Dimensions.get('window');

// Enhanced chart config with premium gradients
const chartConfig = {
  backgroundColor: 'transparent',
  backgroundGradientFrom: 'transparent',
  backgroundGradientTo: 'transparent',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 229, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.8})`,
  style: { borderRadius: 16 },
  propsForLabels: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'System'
  },
  propsForVerticalLabels: { fontSize: 10, fontWeight: '500' },
  propsForHorizontalLabels: { fontSize: 10, fontWeight: '500' },
  propsForBackgroundLines: {
    stroke: 'rgba(255,255,255,0.1)',
    strokeWidth: 0.5,
    strokeDasharray: [2, 4]
  },
  strokeWidth: 3,
  useShadowColorFromDataset: false,
};

export default function DashboardScreen() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState('All');
  const [activeTime, setActiveTime] = useState('All time');

  const timeFilters = ['All time', 'Today', 'Yesterday', 'Last 7 days', 'Last 30 days', 'Last 3 months'];

  // Helper function to calculate days between dates
  const daysBetween = (date1, date2) => {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((date1 - date2) / oneDay));
  };

  // Calculate streak properly
  const calculateStreak = (papers) => {
    if (!papers || papers.length === 0) return 0;
    
    const sortedPapers = papers
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 30); // Last 30 days

    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Group papers by date
    const dailyData = {};
    sortedPapers.forEach(paper => {
      const paperDate = new Date(paper.date);
      paperDate.setHours(0, 0, 0, 0);
      const dateKey = paperDate.toISOString().split('T')[0];
      
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { correct: 0, total: 0 };
      }
      
      dailyData[dateKey].total += paper.answers.length;
      dailyData[dateKey].correct += paper.corrects.filter((c, i) => c === paper.answers[i]).length;
    });

    // Calculate consecutive days with practice
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateKey = checkDate.toISOString().split('T')[0];
      
      if (dailyData[dateKey] && dailyData[dateKey].total > 0) {
        currentStreak++;
      } else if (i > 0) { // Don't break on day 0 (today) if no practice yet
        break;
      }
    }

    return currentStreak;
  };

  // Load data from AsyncStorage with proper error handling
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const paperHistory = await AsyncStorage.getItem('@paperHistory');
        const correctAnswers = await AsyncStorage.getItem('@correctAnswers');
        
        console.log('Raw paperHistory:', paperHistory);
        console.log('Raw correctAnswers:', correctAnswers);
        
        const papers = paperHistory ? JSON.parse(paperHistory) : [];
        const corrects = correctAnswers ? JSON.parse(correctAnswers) : [];
        
        console.log('Parsed papers:', papers.length);
        console.log('Parsed corrects:', corrects.length);
        
        const grouped = {};
        const now = new Date();
        
        papers.forEach((paper, paperIndex) => {
          const { subject = 'Unknown', chapter = 'Unknown', answers = [], timestamps = [], date } = paper;
          
          // Calculate paper age in days
          const paperDate = new Date(date);
          const age = daysBetween(now, paperDate);
          
          // Fix: Get correct answers properly
          let paperCorrects = [];
          
          // Method 1: If corrects is an array, slice the relevant portion
          if (Array.isArray(corrects)) {
            const startIndex = Math.max(0, corrects.length - answers.length);
            paperCorrects = corrects.slice(startIndex).map(item => 
              typeof item === 'string' ? item : (item.correctAnswer || '')
            );
          } 
          // Method 2: If corrects is an object with keys
          else if (corrects && typeof corrects === 'object') {
            const paperKey = `${paper.exam}_${subject}_${chapter}`;
            paperCorrects = corrects[paperKey] || [];
          }
          
          // Ensure paperCorrects matches answers length
          while (paperCorrects.length < answers.length) {
            paperCorrects.push('');
          }
          paperCorrects = paperCorrects.slice(0, answers.length);
          
          const key = subject;
          if (!grouped[key]) grouped[key] = [];
          
          grouped[key].push({
            age,
            answers,
            corrects: paperCorrects,
            timestamps,
            chapter,
            date: paperDate
          });
        });
        
        console.log('Grouped stats:', Object.keys(grouped).map(key => ({ key, count: grouped[key].length })));
        setStats(grouped);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setStats({});
      }
      setLoading(false);
    };
    
    loadData();
  }, []);

  // Get overall stats (never change with filters)
  const getOverallStats = () => {
    if (!stats || Object.keys(stats).length === 0) {
      return {
        totalQuestions: 0,
        attemptedQuestions: 0,
        unattemptedQuestions: 0,
        streak: 0
      };
    }

    let totalQuestions = 0;
    let attemptedQuestions = 0;
    let allPapers = [];

    Object.keys(stats).forEach(subject => {
      if (!stats[subject]) return;

      stats[subject].forEach(paper => {
        allPapers.push(paper);
        totalQuestions += paper.answers.length;
        attemptedQuestions += paper.answers.filter(answer => answer !== '').length;
      });
    });

    const streak = calculateStreak(allPapers);
    const unattemptedQuestions = totalQuestions - attemptedQuestions;

    return {
      totalQuestions,
      attemptedQuestions,
      unattemptedQuestions,
      streak
    };
  };

  // Enhanced filter function with proper data handling (for charts only)
  const getFilteredStats = () => {
    if (!stats || Object.keys(stats).length === 0) {
      return {
        attempted: 0,
        correct: 0,
        incorrect: 0,
        avgTime: 0,
        chapters: {},
        daily: Array(10).fill(0)
      };
    }

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const getDateThreshold = (period) => {
      const date = new Date(now);
      switch (period) {
        case 'Today':
          date.setHours(0, 0, 0, 0);
          return date;
        case 'Yesterday':
          date.setDate(date.getDate() - 1);
          date.setHours(0, 0, 0, 0);
          return date;
        case 'Last 7 days':
          date.setDate(date.getDate() - 7);
          return date;
        case 'Last 30 days':
          date.setDate(date.getDate() - 30);
          return date;
        case 'Last 3 months':
          date.setMonth(date.getMonth() - 3);
          return date;
        default:
          return new Date(0);
      }
    };

    const threshold = getDateThreshold(activeTime);
    const endThreshold = activeTime === 'Yesterday' ? today : new Date(2099, 0, 1);

    let attempted = 0, correct = 0, totalTime = 0, timeCount = 0;
    const chapters = {};
    const daily = Array(10).fill(0);

    const filteredSubjects = activeSubject === 'All' ? Object.keys(stats) : [activeSubject];

    filteredSubjects.forEach(subject => {
      if (!stats[subject]) return;

      stats[subject].forEach(paper => {
        const paperDate = paper.date;
        
        // Check if paper falls within the selected time period
        const isInPeriod = activeTime === 'Yesterday' 
          ? paperDate >= threshold && paperDate < endThreshold
          : paperDate >= threshold && paperDate <= endThreshold;

        if (isInPeriod) {
          attempted += paper.answers.length;
          
          // Fixed accuracy calculation - count correct answers properly
          const correctCount = paper.corrects.filter((c, i) => {
            // Ensure both values exist and match
            return c && paper.answers[i] && c.toString().trim() === paper.answers[i].toString().trim();
          }).length;
          
          correct += correctCount;

          if (paper.timestamps && paper.timestamps.length > 0) {
            const avgTime = paper.timestamps.reduce((a, b) => a + b, 0) / paper.timestamps.length;
            totalTime += avgTime;
            timeCount++;
          }

          // Chapter stats
          const chapterKey = `${subject}|${paper.chapter}`;
          if (!chapters[chapterKey]) {
            chapters[chapterKey] = { total: 0, correct: 0 };
          }
          chapters[chapterKey].total += paper.answers.length;
          chapters[chapterKey].correct += correctCount;

          // Daily accuracy data for line chart
          const dayIndex = Math.min(paper.age, 9);
          const dailyAccuracy = paper.answers.length > 0 ? Math.round((correctCount / paper.answers.length) * 100) : 0;
          daily[dayIndex] = Math.max(daily[dayIndex], dailyAccuracy);
        }
      });
    });

    return {
      attempted,
      correct,
      incorrect: attempted - correct,
      avgTime: timeCount > 0 ? totalTime / timeCount : 0,
      chapters,
      daily: daily.reverse(), // Reverse to show oldest to newest
    };
  };

  const overallStats = getOverallStats();
  const filtered = getFilteredStats();

  // Enhanced pie chart data with all question types
  const pieData = [
    {
      name: 'Correct',
      population: filtered.correct,
      color: '#4CAF50',
      legendFontColor: '#FFF',
      legendFontSize: 12,
    },
    {
      name: 'Incorrect',
      population: filtered.incorrect,
      color: '#FF6B6B',
      legendFontColor: '#FFF',
      legendFontSize: 12,
    },
    
    {
      name: 'Unattempted',
      population: overallStats.unattemptedQuestions,
      color: '#FFC107',
      legendFontColor: '#FFF',
      legendFontSize: 12,
    },
  ];

  const topChapters = Object.entries(filtered.chapters as Record<string, { total: number; correct: number }>)
    .filter(([k, v]) => v.total > 0)
    .map(([k, v]) => ({
      label: k.split('|')[1]?.substring(0, 8) || 'Unknown',
      correct: Math.round((v.correct / v.total) * 100),
      wrong: 100 - Math.round((v.correct / v.total) * 100),
    }))
    .sort((a, b) => b.correct - a.correct)
    .slice(0, 5);

  const barData = {
    labels: topChapters.length > 0 ? topChapters.map(ch => ch.label) : ['No Data'],
    datasets: [
      {
        data: topChapters.length > 0 ? topChapters.map(ch => ch.correct) : [0],
        colors: topChapters.map((_, i) => (opacity = 1) => {
          const colors = ['#00E5FF', '#64FFDA', '#18FFFF', '#00BCD4', '#0097A7'];
          return colors[i % colors.length];
        }),
      }
    ],
  };

  // Enhanced line chart data with accuracy only
  const lineData = {
    labels: ['1d', '2d', '3d', '4d', '5d', '6d', '7d', '8d', '9d', '10d'],
    datasets: [
      {
        data: filtered.daily.length > 0 && filtered.daily.some(d => d > 0) 
          ? filtered.daily.slice().reverse()
          : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        color: (opacity = 1) => `rgba(0, 200, 83, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  // Motivational messages based on overall performance
  const getMotivationalMessage = () => {
    const accuracy = overallStats.attemptedQuestions > 0 ? (overallStats.attemptedQuestions / overallStats.totalQuestions) * 100 : 0;
    const streak = overallStats.streak;
    
    if (streak >= 7) return { emoji: '🔥', text: `${streak}-day streak! You're on fire!`, color: '#FF6B35' };
    if (accuracy >= 80) return { emoji: '🚀', text: 'Excellence in motion!', color: '#00E5FF' };
    if (streak >= 3) return { emoji: '⚡', text: 'Building momentum!', color: '#FFC107' };
    if (accuracy >= 60) return { emoji: '📈', text: 'Steady progress!', color: '#4CAF50' };
    return { emoji: '💪', text: 'Every step counts!', color: '#ffff' };
  };

  const motivation = getMotivationalMessage();

  if (loading) {
    return (
      <View style={[styles.page, styles.centerContent]}>
        <ActivityIndicator size="large" color="#00E5FF" />
        <Text style={styles.loadingText}>Analyzing your performance...</Text>
        <View style={styles.loadingDots}>
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Performance Dashboard</Text>
          <View style={styles.motivationCard}>
            <Text style={styles.motivationEmoji}>{motivation.emoji}</Text>
            <Text style={[styles.motivationText, { color: motivation.color }]}>
              {motivation.text}
            </Text>
          </View>
        </View>

        {/* Overall Statistics Panels (Never Change) */}
        <View style={styles.overallStatsContainer}>
          <View style={styles.overallStatCard}>
            <Text style={styles.overallStatIcon}>📚</Text>
            <Text style={styles.overallStatValue}>{overallStats.totalQuestions}</Text>
            <Text style={styles.overallStatTitle}>Total Questions</Text>
            <Text style={styles.overallStatSubtext}>All Time</Text>
          </View>
          
          <View style={styles.overallStatCard}>
            <Text style={styles.overallStatIcon}>✅</Text>
            <Text style={styles.overallStatValue}>{overallStats.attemptedQuestions}</Text>
            <Text style={styles.overallStatTitle}>Attempted</Text>
            <Text style={styles.overallStatSubtext}>Questions</Text>
          </View>
          
          <View style={styles.overallStatCard}>
            <Text style={styles.overallStatIcon}>⏳</Text>
            <Text style={styles.overallStatValue}>{overallStats.unattemptedQuestions}</Text>
            <Text style={styles.overallStatTitle}>Unattempted</Text>
            <Text style={styles.overallStatSubtext}>Questions</Text>
          </View>
          
          <View style={styles.overallStatCard}>
            <Text style={styles.overallStatIcon}>🔥</Text>
            <Text style={styles.overallStatValue}>{overallStats.streak}</Text>
            <Text style={styles.overallStatTitle}>Streak</Text>
            <Text style={styles.overallStatSubtext}>Days</Text>
          </View>
        </View>
        
        {/* Chart Filters Only (Removed Trend View) */}
        <View style={styles.chartFiltersContainer}>
          <Text style={styles.chartFiltersTitle}>📊 Chart Filters</Text>
          <Text style={styles.chartFiltersSubtitle}>These filters apply only to the charts below</Text>
          
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>📚 Subject</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
              {[{ label: 'All Subjects', key: 'All' }, ...Object.keys(stats).map(s => ({ label: s, key: s }))].map(s => (
                <TouchableOpacity
                  key={s.key}
                  onPress={() => setActiveSubject(s.key)}
                  style={[
                    styles.filterBtn,
                    activeSubject === s.key && styles.filterBtnActive
                  ]}
                >
                  <Text style={[
                    styles.filterText,
                    activeSubject === s.key && styles.filterTextActive
                  ]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>📅 Time Period</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
              {timeFilters.map(t => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setActiveTime(t)}
                  style={[
                    styles.filterBtn,
                    activeTime === t && styles.filterBtnActive
                  ]}
                >
                  <Text style={[
                    styles.filterText,
                    activeTime === t && styles.filterTextActive
                  ]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.container}>
          {/* Line Chart at Top */}
          <View style={styles.fullWidthChartContainer}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>📈 Accuracy Progress Journey</Text>
              <Text style={styles.chartDescription}>
                Your accuracy evolution over the past 10 days - track your learning curve!
              </Text>
            </View>
            
            <View style={styles.fullWidthLineChartWrapper}>
              <LineChart
                data={lineData}
                width={screenWidth - 32}
                height={180}
                chartConfig={{
                  backgroundColor: 'transparent',
                  backgroundGradientFrom: 'rgba(0, 229, 255, 0.3)',
                  backgroundGradientTo: 'rgba(0, 229, 255, 0.05)',
                  backgroundGradientFromOpacity: 0.3,
                  backgroundGradientToOpacity: 0.05,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 200, 83, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(221, 221, 221, ${opacity})`,
                  style: {
                    borderRadius: 12,
                  },
                  propsForLabels: {
                    fontSize: 11,
                    fontWeight: '600',
                  },
                  propsForVerticalLabels: {
                    fontSize: 10,
                    fontWeight: '500',
                  },
                  propsForHorizontalLabels: {
                    fontSize: 11,
                    fontWeight: '600',
                  },
                  propsForDots: {
                    r: "5",
                    strokeWidth: "2",
                    stroke: "#00E5FF",
                    fill: "#001122",
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: "3,3",
                    stroke: "rgba(255, 255, 255, 0.1)",
                    strokeWidth: 1,
                  },
                  fillShadowGradient: '#00E5FF',
                  fillShadowGradientOpacity: 0.4,
                  useShadowColorFromDataset: false,
                }}
                bezier={true}
                fromZero={true}
                segments={4}
                withInnerLines={true}
                withVerticalLines={true}
                withHorizontalLines={true}
                withShadow={true}
                withDots={true}
                style={{
                  marginVertical: 8,
                  borderRadius: 12,
                }}
              />
            </View>
            
            <View style={styles.trendInsight}>
              <Text style={styles.trendNote}>
                🎯 Consistency in accuracy builds long-term mastery - keep practicing daily!
              </Text>
            </View>
          </View>

          {/* Enhanced Pie Chart with Total and Unattempted Questions */}
          <View style={styles.chartContainer}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>🎯 Complete Question Analysis</Text>
              <Text style={styles.chartDescription}>
                Comprehensive view of all questions: correct, incorrect, total, and unattempted for {activeTime.toLowerCase()}
              </Text>
            </View>
            
            {filtered.attempted > 0 || overallStats.totalQuestions > 0 ? (
              <View style={styles.pieChartWrapper}>
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
                <View style={styles.pieChartCenter}>
                  <Text style={styles.pieCenterValue}>
                    {filtered.attempted > 0 ? Math.round((filtered.correct / filtered.attempted) * 100) : 0}%
                  </Text>
                  <Text style={styles.pieCenterLabel}>Accuracy</Text>
                </View>
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataIcon}>🎯</Text>
                <Text style={styles.noDataText}>Ready to start your journey?</Text>
                <Text style={styles.noDataSubtext}>Take your first test to see amazing insights!</Text>
              </View>
            )}
            
            {/* Question Statistics Summary */}
            <View style={styles.questionStatsGrid}>
              <View style={styles.questionStatItem}>
                <Text style={[styles.questionStatValue, { color: '#4CAF50' }]}>{filtered.correct}</Text>
                <Text style={styles.questionStatLabel}>Correct</Text>
              </View>
              <View style={styles.questionStatItem}>
                <Text style={[styles.questionStatValue, { color: '#FF6B6B' }]}>{filtered.incorrect}</Text>
                <Text style={styles.questionStatLabel}>Incorrect</Text>
              </View>
              <View style={styles.questionStatItem}>
                <Text style={[styles.questionStatValue, { color: '#00E5FF' }]}>{overallStats.totalQuestions}</Text>
                <Text style={styles.questionStatLabel}>Total</Text>
              </View>
              <View style={styles.questionStatItem}>
                <Text style={[styles.questionStatValue, { color: '#FFC107' }]}>{overallStats.unattemptedQuestions}</Text>
                <Text style={styles.questionStatLabel}>Unattempted</Text>
              </View>
            </View>
          </View>

          {/* Enhanced Chapter Performance */}
          {topChapters.length > 0 && (
            <View style={styles.chartContainer}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>📖 Chapter Mastery</Text>
                <Text style={styles.chartDescription}>
                  Your strongest chapters - these are your superpowers!
                </Text>
              </View>
              
              <BarChart
                data={barData}
                width={screenWidth - 80}
                height={240}
                yAxisLabel=""
                yAxisSuffix="%"
                chartConfig={{
                  ...chartConfig,
                  decimalPlaces: 0,
                  barPercentage: 0.7,
                }}
                fromZero={true}
                showValuesOnTopOfBars={true}
                style={styles.barChart}
              />
              
              <Text style={styles.chartNote}>
                💡 Focus on weaker chapters to level up your overall performance
              </Text>
            </View>
          )}

          {/* Enhanced Insights Section */}
          <View style={styles.insightsContainer}>
            <Text style={styles.insightsTitle}>🌟 Personal Insights</Text>
            
            <View style={styles.insightCard}>
              <Text style={styles.insightEmoji}>🚀</Text>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Overall Performance</Text>
                <Text style={styles.insightText}>
                  {overallStats.totalQuestions === 0
                    ? "Ready to embark on your learning adventure? Every expert started with their first question!"
                    : overallStats.attemptedQuestions > overallStats.totalQuestions * 0.9 
                    ? "Exceptional dedication! You've attempted most of your questions - keep this momentum!" 
                    : overallStats.attemptedQuestions > overallStats.totalQuestions * 0.75
                    ? "Strong progress! You're building solid study habits - consistency is key!"
                    : overallStats.attemptedQuestions > overallStats.totalQuestions * 0.5
                    ? "Steady approach! You're on the right track - keep pushing forward!"
                    : "Foundation building phase! Every question attempted teaches you something valuable!"}
                </Text>
              </View>
            </View>
            
            <View style={styles.insightCard}>
              <Text style={styles.insightEmoji}>📊</Text>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Accuracy Analysis</Text>
                <Text style={styles.insightText}>
                  Current accuracy rate: {filtered.attempted > 0 ? Math.round((filtered.correct / filtered.attempted) * 100) : 0}% 
                  ({filtered.correct} correct out of {filtered.attempted} attempted questions for {activeTime.toLowerCase()}). 
                  {filtered.correct / filtered.attempted >= 0.8 ? " Outstanding precision!" : 
                   filtered.correct / filtered.attempted >= 0.6 ? " Good accuracy - keep improving!" : 
                   " Focus on understanding concepts to boost accuracy."}
                </Text>
              </View>
            </View>

            {overallStats.streak > 0 && (
              <View style={styles.insightCard}>
                <Text style={styles.insightEmoji}>🔥</Text>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>Streak Power</Text>
                  <Text style={styles.insightText}>
                    {overallStats.streak >= 14
                      ? `${overallStats.streak} days strong! You've built an incredible habit - this level of consistency is what separates achievers from dreamers!`
                      : overallStats.streak >= 7
                      ? `${overallStats.streak} days in a row! You're in the habit-forming zone - neuroplasticity is working in your favor!`
                      : overallStats.streak >= 3
                      ? `${overallStats.streak} days of momentum! The hardest part is behind you - keep this energy flowing!`
                      : `Day ${overallStats.streak} of your journey! Small consistent steps lead to extraordinary destinations!`}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Updated Styles with new components
interface Styles {
  // View styles
  page: ViewStyle;
  centerContent: ViewStyle;
  scrollContainer: ViewStyle;
  heroSection: ViewStyle;
  motivationCard: ViewStyle;
  loadingDots: ViewStyle;
  dot: ViewStyle;
  dot1: ViewStyle;
  dot2: ViewStyle;
  dot3: ViewStyle;
  container: ViewStyle;
  overallStatsContainer: ViewStyle;
  overallStatCard: ViewStyle;
  chartFiltersContainer: ViewStyle;
  filterSection: ViewStyle;
  filterScrollView: ViewStyle;
  filterBtn: ViewStyle;
  filterBtnActive: ViewStyle;
  chartContainer: ViewStyle;
  fullWidthChartContainer: ViewStyle;
  chartHeader: ViewStyle;
  pieChartWrapper: ViewStyle;
  pieChartCenter: ViewStyle;
  questionStatsGrid: ViewStyle;
  questionStatItem: ViewStyle;
  noDataContainer: ViewStyle;
  barChart: ViewStyle;
  fullWidthLineChartWrapper: ViewStyle;
  trendInsight: ViewStyle;
  insightsContainer: ViewStyle;
  insightCard: ViewStyle;
  insightContent: ViewStyle;

  // Text styles
  heroTitle: TextStyle;
  motivationEmoji: TextStyle;
  motivationText: TextStyle;
  loadingText: TextStyle;
  overallStatIcon: TextStyle;
  overallStatValue: TextStyle;
  overallStatTitle: TextStyle;
  overallStatSubtext: TextStyle;
  chartFiltersTitle: TextStyle;
  chartFiltersSubtitle: TextStyle;
  filterLabel: TextStyle;
  filterText: TextStyle;
  filterTextActive: TextStyle;
  chartTitle: TextStyle;
  chartDescription: TextStyle;
  pieCenterValue: TextStyle;
  pieCenterLabel: TextStyle;
  questionStatValue: TextStyle;
  questionStatLabel: TextStyle;
  noDataIcon: TextStyle;
  noDataText: TextStyle;
  noDataSubtext: TextStyle;
  chartNote: TextStyle;
  trendNote: TextStyle;
  insightsTitle: TextStyle;
  insightEmoji: TextStyle;
  insightTitle: TextStyle;
  insightText: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  // View Styles
  page: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
  
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 120,
  },

  heroSection: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },

  motivationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 2,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },

  loadingDots: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'center',
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00E5FF',
    marginHorizontal: 4,
  },

  dot1: {
    opacity: 0.3,
  },

  dot2: {
    opacity: 0.6,
  },

  dot3: {
    opacity: 1,
  },

  container: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  overallStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 16,
  },

  overallStatCard: {
    backgroundColor: 'rgba(26, 26, 30, 0.9)',
    borderRadius: 16,
    padding: 18,
    width: '48%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    alignItems: 'center',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },

  chartFiltersContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
    backgroundColor: 'rgba(26, 26, 30, 0.6)',
    marginHorizontal: 16,
    borderRadius: 20,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  filterSection: {
    marginBottom: 16,
  },
  
  filterScrollView: {
    marginBottom: 4,
  },
  
  filterBtn: {
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  
  filterBtnActive: {
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },

  chartContainer: {
    backgroundColor: 'rgba(26, 26, 30, 0.8)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },

  fullWidthChartContainer: {
    backgroundColor: 'rgba(26, 26, 30, 0.8)',
    borderRadius: 24,
    padding: 16,
    marginBottom: 24,
    marginHorizontal: -16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },

  chartHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },

  pieChartWrapper: {
    alignItems: 'center',
    position: 'relative',
    marginBottom: 20,
  },

  pieChartCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -25 }],
    alignItems: 'center',
  },

  questionStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },

  questionStatItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
  },

  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },

  barChart: {
    borderRadius: 16,
    marginVertical: 8,
  },

  fullWidthLineChartWrapper: {
    alignItems: 'center',
    marginVertical: 10,
  },

  trendInsight: {
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },

  insightsContainer: {
    backgroundColor: 'rgba(26, 26, 30, 0.8)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
  },

  insightCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  insightContent: {
    flex: 1,
  },

  // Text Styles
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },

  motivationEmoji: {
    fontSize: 24,
    marginRight: 12,
  },

  motivationText: {
    fontSize: 16,
    fontWeight: '600',
  },

  loadingText: {
    color: '#FFF',
    fontSize: 18,
    marginTop: 20,
    textAlign: 'center',
  },

  overallStatIcon: {
    fontSize: 24,
    marginBottom: 8,
  },

  overallStatValue: {
    color: '#00E5FF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },

  overallStatTitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },

  overallStatSubtext: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    fontWeight: '500',
  },

  chartFiltersTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },

  chartFiltersSubtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },

  filterLabel: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    paddingLeft: 4,
  },
  
  filterText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontWeight: '600',
  },
  
  filterTextActive: {
    color: '#00E5FF',
    fontWeight: '700',
  },

  chartTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },

  chartDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },

  pieCenterValue: {
    color: '#00E5FF',
    fontSize: 24,
    fontWeight: '800',
  },

  pieCenterLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '600',
  },

  questionStatValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },

  questionStatLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },

  noDataIcon: {
    fontSize: 64,
    marginBottom: 16,
  },

  noDataText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },

  noDataSubtext: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    textAlign: 'center',
  },

  chartNote: {
    color: '#00E5FF',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
    fontWeight: '500',
  },

  trendNote: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },

  insightsTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },

  insightEmoji: {
    fontSize: 28,
    marginRight: 16,
  },

  insightTitle: {
    color: '#00E5FF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },

  insightText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
});
