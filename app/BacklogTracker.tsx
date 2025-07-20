import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  Dimensions,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import CircularProgress from 'react-native-circular-progress-indicator';
import { Dropdown } from 'react-native-element-dropdown';
import Animated, { FadeInDown, FadeInUp, SlideInRight } from 'react-native-reanimated';
import syllabus from '../data/syllabus.json';

// Background task for timer
const POMODORO_TIMER_TASK = 'pomodoro-timer-task';

TaskManager.defineTask(POMODORO_TIMER_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Background task error:', error);
    return;
  }
  console.log('Background timer task running');
});

// Configure notifications with ongoing support
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const isPomodoro = notification.request.content.data?.type === 'pomodoro-timer';
    return {
      shouldShowAlert: true,
      shouldPlaySound: !isPomodoro,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

interface Task {
  id: string;
  title: string;
  description?: string;
  type: 'permanent' | 'daily' | 'weekly';
  priority: 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'medium' | 'hard';
  subject?: string;
  topic?: string;
  estimatedTime?: number;
  reminderTime?: string;
  completed: boolean;
  completedAt?: string;
  tags: string[];
  streak?: number;
  lastCompleted?: string;
  notificationId?: string;
  xpAwarded?: number;
}

interface PomodoroSession {
  id: string;
  taskId: string;
  duration: number;
  completedAt: string;
  type: 'work' | 'break';
  actualDuration?: number;
  startTime?: string;
}

interface Statistics {
  totalTasks: number;
  completedToday: number;
  completedThisWeek: number;
  productivityScore: number;
  focusTime: number;
  streakDays: number;
  averageCompletionTime: number;
}

const screenW = Dimensions.get('window').width;

const Colors = {
  background: '#000000',
  panel: '#1a1a1a',
  text: '#ffffff',
  muted: '#c4c4c4',
  accent: '#2b85c4',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  border: '#333333',
  priorityLow: '#10B981',
  priorityMedium: '#F59E0B',
  priorityHigh: '#EF4444',
  difficultyEasy: '#22C55E',
  difficultyMedium: '#F97316',
  difficultyHard: '#DC2626',
};

const BacklogTracker = () => {
  // Task Management State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pomodoroSessions, setPomodoroSessions] = useState<PomodoroSession[]>([]);
  
  // Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskType, setTaskType] = useState<'permanent' | 'daily' | 'weekly'>('permanent');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [estimatedTime, setEstimatedTime] = useState('30');
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Subject and Topic selection
  const [examParam, setExamParam] = useState('NEET');
  const [subject, setSubject] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [subjectOptions, setSubjectOptions] = useState<{label: string; value: string}[]>([]);
  const [topicOptions, setTopicOptions] = useState<{label: string; value: string}[]>([]);
  
  // Gamification State
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [xpHistory, setXpHistory] = useState<number[]>([]);
  const [dailyGoal, setDailyGoal] = useState(5);
  
  // Enhanced Pomodoro State
  const [activeFilter, setActiveFilter] = useState<'all' | 'permanent' | 'daily' | 'weekly' | 'completed'>('all');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Fixed timer state - countdown from estimated time
  const [remainingTime, setRemainingTime] = useState(0);
  const [pomodoroNotificationId, setPomodoroNotificationId] = useState<string>('');
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  
  // Fixed refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<string>(AppState.currentState);

  // Load exam parameter and subject options
  useEffect(() => {
    const loadExam = async () => {
      const value = await AsyncStorage.getItem('@selectedExam1');
      const exam = value || 'NEET';
      setExamParam(exam);
    };
    loadExam();
  }, []);

  useEffect(() => {
    if (!examParam) return;
    const selectedExam = syllabus[examParam as keyof typeof syllabus];
    if (!selectedExam || typeof selectedExam !== 'object') return;

    const getSubjectsRecursive = (obj: any, path: string[] = []) => {
      const subjects: { label: string; value: string }[] = [];
      for (const key in obj) {
        if (Array.isArray(obj[key])) {
          subjects.push({ label: [...path, key].join(' > '), value: [...path, key].join('@@') });
        } else {
          subjects.push(...getSubjectsRecursive(obj[key], [...path, key]));
        }
      }
      return subjects;
    };

    setSubjectOptions(getSubjectsRecursive(selectedExam));
  }, [examParam]);

  // Load topics when subject changes
  useEffect(() => {
    if (!subject || !examParam) {
      setTopicOptions([]);
      return;
    }

    const path = subject.split('@@');
    let ref: any = syllabus[examParam as keyof typeof syllabus];
    for (const key of path) {
      if (ref && typeof ref === 'object') ref = ref[key];
      else ref = null;
    }

    if (!ref || !Array.isArray(ref)) {
      setTopicOptions([]);
      return;
    }

    const list = ref.map((c: string) => ({
      label: `${c}`,
      value: `${c}`,
    }));

    setTopicOptions(list);
  }, [subject, examParam]);

  // App state management
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (pomodoroActive) {
        if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
          syncTimerFromBackground();
        }
        appStateRef.current = nextAppState;
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [pomodoroActive]);

  // Load data on component mount
  useEffect(() => {
    initializeApp();
  }, []);

  // Fixed timer - countdown from estimated time with single notification
  useEffect(() => {
    if (pomodoroActive && remainingTime > 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      
      timerRef.current = setInterval(() => {
        setRemainingTime(prev => {
          const newTime = prev - 1;
          
          // Update notification only every 30 seconds to prevent spam
          if (newTime % 30 === 0) {
            updatePomodoroNotification(newTime);
          }
          
          // Complete session when timer reaches 0
          if (newTime <= 0) {
            completePomodoroSession();
            return 0;
          }
          
          return newTime;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    }
  }, [pomodoroActive, remainingTime]);

  // Save data whenever state changes (debounced)
  const saveAllData = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem('productivityTasks', JSON.stringify(tasks)),
        AsyncStorage.setItem('pomodoroSessions', JSON.stringify(pomodoroSessions)),
        AsyncStorage.setItem('xp', xp.toString()),
        AsyncStorage.setItem('level', level.toString()),
        AsyncStorage.setItem('streak', streak.toString()),
        AsyncStorage.setItem('xpHistory', JSON.stringify(xpHistory)),
        AsyncStorage.setItem('dailyGoal', dailyGoal.toString()),
      ]);
      console.log('Data saved successfully');
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }, [tasks, pomodoroSessions, xp, level, streak, xpHistory, dailyGoal]);

  // Auto-save with debouncing
  useEffect(() => {
    if (!isLoading) {
      const timeoutId = setTimeout(() => {
        saveAllData();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [saveAllData, isLoading]);

  const initializeApp = async () => {
    try {
      await requestNotificationPermissions();
      await setupBackgroundTasks();
      await loadAllData();
      await resetDailyTasks();
      await resetWeeklyTasks();
      await scheduleRecurringNotifications();
      await checkForActiveSession();
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupBackgroundTasks = async () => {
    try {
      await BackgroundFetch.registerTaskAsync(POMODORO_TIMER_TASK, {
        minimumInterval: 15000,
        stopOnTerminate: false,
        startOnBoot: true,
      });
    } catch (error) {
      console.error('Failed to register background task:', error);
    }
  };

  const checkForActiveSession = async () => {
    try {
      const activeSession = await AsyncStorage.getItem('@activePomodoro');
      if (activeSession) {
        const session = JSON.parse(activeSession);
        const startTime = new Date(session.startTime);
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        
        const currentTask = tasks.find(t => t.id === session.taskId);
        const targetDuration = currentTask?.estimatedTime ? currentTask.estimatedTime * 60 : 25 * 60;
        const remaining = targetDuration - elapsed;
        
        if (remaining > 0) {
          setSessionStartTime(startTime);
          setCurrentTaskId(session.taskId);
          setPomodoroActive(true);
          setRemainingTime(remaining);
          
          updatePomodoroNotification(remaining);
        } else {
          await AsyncStorage.removeItem('@activePomodoro');
        }
      }
    } catch (error) {
      console.error('Error checking active session:', error);
    }
  };

  const syncTimerFromBackground = async () => {
    if (sessionStartTime) {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000);
      const currentTask = tasks.find(t => t.id === currentTaskId);
      const targetDuration = currentTask?.estimatedTime ? currentTask.estimatedTime * 60 : 25 * 60;
      const remaining = Math.max(0, targetDuration - elapsed);
      setRemainingTime(remaining);
    }
  };

  const requestNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please enable notifications for focus sessions');
        return;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('pomodoro-ongoing', {
          name: 'Focus Sessions',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0],
          sound: null,
          enableLights: false,
          enableVibrate: false,
          showBadge: false,
        });
        
        await Notifications.setNotificationChannelAsync('task-reminders', {
          name: 'Task Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: Colors.accent,
          sound: 'default',
        });
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
    }
  };

  // Fixed notification - single persistent notification with live timer
  const createPomodoroNotification = async (taskTitle: string, timeRemaining: number) => {
    try {
      const minutes = Math.floor(timeRemaining / 60);
      const seconds = timeRemaining % 60;
      const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `🍅 Focus Session - ${timeText}`,
          body: `${taskTitle} - Keep focusing!`,
          data: { 
            type: 'pomodoro-timer',
            taskId: currentTaskId,
            persistent: true 
          },
          sticky: true,
          priority: 'high',
          sound: null,
        },
        trigger: null,
      });

      setPomodoroNotificationId(notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error creating pomodoro notification:', error);
      return '';
    }
  };

  // Fixed notification update
  const updatePomodoroNotification = async (timeRemaining: number) => {
    if (pomodoroNotificationId) {
      await Notifications.cancelScheduledNotificationAsync(pomodoroNotificationId);
    }
    
    const currentTask = tasks.find(t => t.id === currentTaskId);
    if (currentTask) {
      await createPomodoroNotification(currentTask.title, timeRemaining);
    }
  };

  const scheduleRecurringNotifications = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🌅 Good Morning!',
          body: 'Ready to tackle your daily tasks? Your productivity journey awaits!',
          data: { type: 'daily-motivation' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: 8,
          minute: 0,
          repeats: true,
        },
      });

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🌙 Daily Review',
          body: 'How did your day go? Check your completed tasks and plan for tomorrow!',
          data: { type: 'evening-review' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: 20,
          minute: 0,
          repeats: true,
        },
      });
    } catch (error) {
      console.error('Error scheduling recurring notifications:', error);
    }
  };

  const loadAllData = async () => {
    try {
      const [tasksData, pomodoroData, xpData, levelData, streakData, xpHistoryData, goalData] =
        await Promise.all([
          AsyncStorage.getItem('productivityTasks'),
          AsyncStorage.getItem('pomodoroSessions'),
          AsyncStorage.getItem('xp'),
          AsyncStorage.getItem('level'),
          AsyncStorage.getItem('streak'),
          AsyncStorage.getItem('xpHistory'),
          AsyncStorage.getItem('dailyGoal'),
        ]);

      if (tasksData) {
        const parsedTasks = JSON.parse(tasksData);
        setTasks(parsedTasks);
      }
      if (pomodoroData) {
        const parsedPomodoro = JSON.parse(pomodoroData);
        setPomodoroSessions(parsedPomodoro);
      }
      if (xpData) setXp(parseInt(xpData) || 0);
      if (levelData) setLevel(parseInt(levelData) || 1);
      if (streakData) setStreak(parseInt(streakData) || 0);
      if (xpHistoryData) {
        const parsedHistory = JSON.parse(xpHistoryData);
        setXpHistory(Array.isArray(parsedHistory) ? parsedHistory : []);
      }
      if (goalData) setDailyGoal(parseInt(goalData) || 5);

      console.log('Data loaded successfully');
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const resetDailyTasks = async () => {
    try {
      const today = new Date().toDateString();
      const lastReset = await AsyncStorage.getItem('lastDailyReset');
      
      if (lastReset !== today) {
        setTasks(prev => prev.map(task =>
          task.type === 'daily' ? { 
            ...task, 
            completed: false, 
            completedAt: undefined,
            xpAwarded: undefined 
          } : task
        ));
        await AsyncStorage.setItem('lastDailyReset', today);
      }
    } catch (error) {
      console.error('Error resetting daily tasks:', error);
    }
  };

  const resetWeeklyTasks = async () => {
    try {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const weekKey = startOfWeek.toDateString();
      const lastWeeklyReset = await AsyncStorage.getItem('lastWeeklyReset');

      if (lastWeeklyReset !== weekKey) {
        setTasks(prev => prev.map(task =>
          task.type === 'weekly' ? { 
            ...task, 
            completed: false, 
            completedAt: undefined,
            xpAwarded: undefined 
          } : task
        ));
        await AsyncStorage.setItem('lastWeeklyReset', weekKey);
      }
    } catch (error) {
      console.error('Error resetting weekly tasks:', error);
    }
  };

  const scheduleNotification = async (task: Task): Promise<string> => {
    if (!task.reminderTime) return '';

    try {
      const reminderDate = new Date(task.reminderTime);
      
      if (reminderDate <= new Date()) {
        reminderDate.setDate(reminderDate.getDate() + 1);
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `⏰ Task Reminder: ${task.title}`,
          body: task.description || `Time to work on your ${task.type} task!`,
          data: {
            taskId: task.id,
            taskType: task.type,
            priority: task.priority
          },
          sound: 'default',
          categoryIdentifier: 'task-reminder',
        },
        trigger: {
          date: reminderDate,
          repeats: task.type !== 'permanent',
          channelId: 'task-reminders',
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return '';
    }
  };

  const addTask = async () => {
    if (!taskTitle.trim()) {
      Alert.alert('Missing Information', 'Please enter a task title');
      return;
    }

    const newTask: Task = {
      id: Date.now().toString(),
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      type: taskType,
      priority,
      difficulty,
      subject: subject || 'General',
      topic: topic || 'General',
      estimatedTime: parseInt(estimatedTime) || 30,
      reminderTime: reminderTime.toISOString(),
      completed: false,
      tags: [subject?.toLowerCase() || 'general'],
      streak: 0,
    };

    const notificationId = await scheduleNotification(newTask);
    newTask.notificationId = notificationId;

    setTasks(prev => [...prev, newTask]);

    // Clear form
    setTaskTitle('');
    setTaskDescription('');
    setSubject('');
    setTopic('');
    setEstimatedTime('30');
    setShowAddTask(false);

    Alert.alert('✅ Task Added', 'Task created successfully with reminder notification!');
  };

  // Fixed remove task function with long press
  const removeTask = (taskId: string) => {
    const taskToRemove = tasks.find(task => task.id === taskId);
    if (!taskToRemove) return;

    Alert.alert(
      'Remove Task',
      `Are you sure you want to delete "${taskToRemove.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            // Cancel notifications
            if (taskToRemove.notificationId) {
              await Notifications.cancelScheduledNotificationAsync(taskToRemove.notificationId);
            }

            // Stop active session if this task is running
            if (pomodoroActive && currentTaskId === taskId) {
              await stopPomodoro();
            }

            // Adjust XP if completed
            if (taskToRemove.completed && taskToRemove.xpAwarded) {
              loseXp(taskToRemove.xpAwarded);
            }

            // Remove task
            setTasks(prev => prev.filter(task => task.id !== taskId));

            // Remove associated sessions
            setPomodoroSessions(prev => 
              prev.filter(session => session.taskId !== taskId)
            );

            Alert.alert('✅ Task Removed', `"${taskToRemove.title}" has been deleted successfully.`);
          },
        },
      ]
    );
  };

  const toggleTask = async (id: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === id) {
        const wasCompleted = task.completed;
        const newCompleted = !task.completed;

        if (newCompleted && task.notificationId) {
          Notifications.cancelScheduledNotificationAsync(task.notificationId);
        }

        if (newCompleted && !wasCompleted) {
          const xpGain = getXpForDifficulty(task.difficulty);
          gainXp(xpGain);

          Notifications.scheduleNotificationAsync({
            content: {
              title: '🎉 Task Completed!',
              body: `Great job completing "${task.title}"! You earned ${xpGain} XP!`,
              data: { type: 'task-completion' },
            },
            trigger: null,
          });

          return {
            ...task,
            completed: true,
            completedAt: new Date().toISOString(),
            streak: (task.streak || 0) + 1,
            lastCompleted: new Date().toISOString(),
            xpAwarded: xpGain,
          };
        } else if (!newCompleted && wasCompleted) {
          if (task.xpAwarded) {
            loseXp(task.xpAwarded);
          }

          return {
            ...task,
            completed: false,
            completedAt: undefined,
            xpAwarded: undefined,
          };
        }
      }
      return task;
    }));
  };

  const getXpForDifficulty = (difficulty: string): number => {
    switch (difficulty) {
      case 'easy': return 25;
      case 'medium': return 50;
      case 'hard': return 100;
      default: return 50;
    }
  };

  const gainXp = (amount: number) => {
    setXp(prevXp => {
      let newXp = prevXp + amount;
      let levelUps = 0;
      
      while (newXp >= 1000) {
        newXp -= 1000;
        levelUps++;
      }

      if (levelUps > 0) {
        setLevel(prevLevel => {
          const newLevel = prevLevel + levelUps;
          Notifications.scheduleNotificationAsync({
            content: {
              title: '🎊 Level Up!',
              body: `Congratulations! You've reached Level ${newLevel}!`,
              data: { type: 'level-up' },
            },
            trigger: null,
          });
          return newLevel;
        });
      }

      return newXp;
    });

    const today = new Date().toDateString();
    setXpHistory(prevHistory => {
      const newHistory = [...prevHistory];
      const todayIndex = newHistory.length - 1;
      
      if (newHistory.length === 0 || todayIndex < 0) {
        return [amount];
      }
      
      newHistory[todayIndex] = (newHistory[todayIndex] || 0) + amount;
      return newHistory.slice(-7);
    });
  };

  const loseXp = (amount: number) => {
    setXp(prevXp => Math.max(0, prevXp - amount));
    
    setXpHistory(prevHistory => {
      if (prevHistory.length === 0) return prevHistory;
      
      const newHistory = [...prevHistory];
      const todayIndex = newHistory.length - 1;
      
      if (todayIndex >= 0) {
        newHistory[todayIndex] = Math.max(0, (newHistory[todayIndex] || 0) - amount);
      }
      
      return newHistory;
    });
  };

  // Enhanced Pomodoro functions
  const startPomodoro = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const startTime = new Date();
    const duration = task.estimatedTime ? task.estimatedTime * 60 : 25 * 60;
    
    setCurrentTaskId(taskId);
    setPomodoroActive(true);
    setSessionStartTime(startTime);
    setRemainingTime(duration); // Start with full duration
    
    // Store active session
    await AsyncStorage.setItem('@activePomodoro', JSON.stringify({
      taskId,
      startTime: startTime.toISOString(),
      duration,
    }));

    // Create notification
    await createPomodoroNotification(task.title, duration);

    Alert.alert(
      '🍅 Focus Session Started!',
      `Starting ${task.estimatedTime || 25}-minute focus session for "${task.title}"`
    );
  };

  // Fixed stop function - properly removes notification
  const stopPomodoro = async () => {
    // Clear notification properly
    if (pomodoroNotificationId) {
      await Notifications.cancelScheduledNotificationAsync(pomodoroNotificationId);
      await Notifications.dismissNotificationAsync(pomodoroNotificationId);
      setPomodoroNotificationId('');
    }
    
    // Clear all pomodoro-related notifications
    const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const pomodoroNotifications = allNotifications.filter(
      notif => notif.content.data?.type === 'pomodoro-timer'
    );
    
    for (const notif of pomodoroNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      await Notifications.dismissNotificationAsync(notif.identifier);
    }
    
    await AsyncStorage.removeItem('@activePomodoro');
    setPomodoroActive(false);
    setSessionStartTime(null);
    setRemainingTime(0);
    setCurrentTaskId('');
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const completePomodoroSession = async () => {
    const actualDuration = sessionStartTime 
      ? Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 1000)
      : 0;

    const session: PomodoroSession = {
      id: Date.now().toString(),
      taskId: currentTaskId,
      duration: Math.floor(actualDuration / 60),
      actualDuration,
      startTime: sessionStartTime?.toISOString(),
      completedAt: new Date().toISOString(),
      type: 'work',
    };

    setPomodoroSessions(prev => [...prev, session]);
    
    const xpGain = Math.min(100, Math.floor(actualDuration / 60) * 2);
    gainXp(xpGain);

    await stopPomodoro();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Focus Session Complete!',
        body: `Great job! You focused for ${Math.floor(actualDuration / 60)} minutes and earned ${xpGain} XP!`,
        data: { type: 'pomodoro-complete' },
      },
      trigger: null,
    });

    Alert.alert(
      '🎉 Session Complete!',
      `Excellent focus! You completed ${Math.floor(actualDuration / 60)} minutes of focused work.`
    );
  };

  const getStatistics = (): Statistics => {
    const completed = tasks.filter(task => task.completed);
    const today = new Date().toDateString();
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);

    const completedToday = completed.filter(task =>
      task.completedAt && new Date(task.completedAt).toDateString() === today
    ).length;

    const completedThisWeek = completed.filter(task =>
      task.completedAt && new Date(task.completedAt) >= thisWeek
    ).length;

    const focusTime = pomodoroSessions
      .filter(session => session.type === 'work')
      .reduce((total, session) => total + (session.actualDuration || session.duration * 60), 0);

    const totalEstimatedTime = completed.reduce((acc, task) => acc + (task.estimatedTime || 30), 0);
    const averageCompletionTime = completed.length > 0 ? totalEstimatedTime / completed.length : 0;

    const productivityScore = Math.min(100, Math.round(
      (completedToday / dailyGoal) * 100 +
      (streak * 2) +
      (level * 5) +
      (focusTime / 600)
    ));

    return {
      totalTasks: tasks.length,
      completedToday,
      completedThisWeek,
      productivityScore,
      focusTime,
      streakDays: streak,
      averageCompletionTime,
    };
  };

  const getFilteredTasks = () => {
    switch (activeFilter) {
      case 'permanent':
        return tasks.filter(task => task.type === 'permanent');
      case 'daily':
        return tasks.filter(task => task.type === 'daily');
      case 'weekly':
        return tasks.filter(task => task.type === 'weekly');
      case 'completed':
        return tasks.filter(task => task.completed);
      default:
        return tasks.filter(task => !task.completed);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return Colors.priorityHigh;
      case 'medium': return Colors.priorityMedium;
      case 'low': return Colors.priorityLow;
      default: return Colors.muted;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'hard': return Colors.difficultyHard;
      case 'medium': return Colors.difficultyMedium;
      case 'easy': return Colors.difficultyEasy;
      default: return Colors.muted;
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '●';
      case 'medium': return '●●';
      case 'hard': return '●●●';
      default: return '●';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.headerTitle}>Loading...</Text>
      </View>
    );
  }

  const statistics = getStatistics();
  const filteredTasks = getFilteredTasks();

  // Fixed pie chart data - ensure non-zero values
  const completedTasks = tasks.filter(task => task.completed).length;
  const pendingTasks = tasks.filter(task => !task.completed).length;
  
  const pieData = completedTasks === 0 && pendingTasks === 0 ? [
    {
      name: 'No Data',
      population: 1,
      color: Colors.muted,
      legendFontColor: Colors.text,
      legendFontSize: 12,
    }
  ] : [
    {
      name: 'Completed',
      population: completedTasks || 0.1,
      color: Colors.accent,
      legendFontColor: Colors.text,
      legendFontSize: 12,
    },
    {
      name: 'Pending',
      population: pendingTasks || 0.1,
      color: Colors.panel,
      legendFontColor: Colors.text,
      legendFontSize: 12,
    },
  ];

  const barData = {
    labels: ['Permanent', 'Daily', 'Weekly'],
    datasets: [{
      data: [
        Math.max(0.1, tasks.filter(task => task.type === 'permanent' && task.completed).length),
        Math.max(0.1, tasks.filter(task => task.type === 'daily' && task.completed).length),
        Math.max(0.1, tasks.filter(task => task.type === 'weekly' && task.completed).length),
      ],
    }],
  };

  const lineData = {
    labels: xpHistory.length > 0 ? xpHistory.map((_, idx) => `Day ${idx + 1}`) : ['Day 1'],
    datasets: [{
      data: xpHistory.length > 0 ? xpHistory : [0],
      color: (opacity = 1) => `rgba(43, 133, 196, ${opacity})`,
      strokeWidth: 3,
    }],
  };

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(43, 133, 196, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(196, 196, 196, ${opacity})`,
    style: { borderRadius: 12 },
    propsForLabels: { fontSize: 10, fontWeight: '500' },
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Header Section */}
        <Animated.View entering={FadeInUp} style={styles.headerSection}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Productivity Hub</Text>
            <Text style={styles.headerSubtitle}>Smart Task & Habit Manager</Text>
          </View>
          <View style={styles.levelCard}>
            <CircularProgress
              value={(xp / 1000) * 100}
              radius={30}
              duration={1000}
              progressValueColor={Colors.accent}
              maxValue={100}
              title="Level"
              titleColor={Colors.text}
              titleStyle={{ fontSize: 12, fontWeight: '600' }}
              activeStrokeColor={Colors.accent}
              inActiveStrokeColor={Colors.border}
              inActiveStrokeOpacity={0.3}
              inActiveStrokeWidth={4}
              activeStrokeWidth={6}
              showProgressValue={false}
            />
            <View style={styles.levelInfo}>
              <Text style={styles.levelText}>Level {level}</Text>
              <Text style={styles.xpText}>{xp} / 1000 XP</Text>
            </View>
          </View>
        </Animated.View>

        {/* Enhanced Pomodoro Timer with countdown */}
        {pomodoroActive && (
          <Animated.View entering={SlideInRight} style={styles.pomodoroContainer}>
            <Text style={styles.pomodoroTitle}>🍅 Focus Session Active</Text>
            <Text style={styles.pomodoroTime}>{formatTime(remainingTime)}</Text>
            <Text style={styles.pomodoroTask}>
              {tasks.find(t => t.id === currentTaskId)?.title || 'Unknown Task'}
            </Text>
            <TouchableOpacity
              style={styles.pomodoroStop}
              onPress={stopPomodoro}
            >
              <Text style={styles.pomodoroStopText}>Stop Session</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Quick Statistics */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{statistics.completedToday}</Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{statistics.streakDays}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{statistics.productivityScore}%</Text>
              <Text style={styles.statLabel}>Score</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{Math.round(statistics.focusTime / 60)}m</Text>
              <Text style={styles.statLabel}>Focus</Text>
            </View>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowAddTask(true)}
          >
            <Text style={styles.actionButtonText}>+ Add Task</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButtonSecondary}
            onPress={() => setShowAnalytics(!showAnalytics)}
          >
            <Text style={styles.actionButtonSecondaryText}>
              {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Analytics Section */}
        {showAnalytics && (
          <Animated.View entering={FadeInDown} style={styles.analyticsSection}>
            {/* Fixed Progress Overview */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Progress Overview</Text>
              {tasks.length > 0 ? (
                <PieChart
                  data={pieData}
                  width={screenW - 80}
                  height={200}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  center={[10, 10]}
                  absolute={false}
                />
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>No tasks available</Text>
                </View>
              )}
            </View>

            {/* Task Type Breakdown */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Tasks by Type</Text>
              {tasks.filter(task => task.completed).length > 0 ? (
                <BarChart
                  yAxisLabel=""
                  yAxisSuffix=""
                  data={barData}
                  width={screenW - 80}
                  height={200}
                  chartConfig={chartConfig}
                  verticalLabelRotation={0}
                />
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>Complete some tasks to see data</Text>
                </View>
              )}
            </View>

            {/* XP Trend */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>XP Progress Trend</Text>
              {xpHistory.length > 0 ? (
                <LineChart
                  data={lineData}
                  width={screenW - 80}
                  height={200}
                  chartConfig={chartConfig}
                  bezier
                />
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>Start completing tasks to track progress</Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* Enhanced Add Task Form */}
        {showAddTask && (
          <Animated.View entering={FadeInDown} style={styles.addTaskSection}>
            <Text style={styles.sectionTitle}>Add New Task</Text>
            
            <TextInput
              style={styles.textInput}
              placeholder="Task title *"
              placeholderTextColor={Colors.muted}
              value={taskTitle}
              onChangeText={setTaskTitle}
            />
            
            <TextInput
              style={[styles.textInput, styles.textAreaInput]}
              placeholder="Description (optional)"
              placeholderTextColor={Colors.muted}
              value={taskDescription}
              onChangeText={setTaskDescription}
              multiline
            />
            
            {/* Subject Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Subject Selection</Text>
              <Dropdown
                data={subjectOptions}
                labelField="label"
                valueField="value"
                placeholder="Select Subject"
                value={subject}
                onChange={(item) => {
                  setSubject(item.value);
                  setTopic('');
                }}
                style={styles.dropdown}
                placeholderStyle={styles.placeholder}
                selectedTextStyle={styles.dropdownText}
                containerStyle={styles.dropdownContainer}
                itemTextStyle={styles.dropdownItemText}
              />
            </View>

            {/* Topic Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Topic Selection</Text>
              <Dropdown
                data={topicOptions}
                labelField="label"
                valueField="value"
                placeholder="Select Topic"
                value={topic}
                onChange={(item) => setTopic(item.value)}
                disable={!subject}
                style={styles.dropdown}
                placeholderStyle={styles.placeholder}
                selectedTextStyle={styles.dropdownText}
                containerStyle={styles.dropdownContainer}
                itemTextStyle={styles.dropdownItemText}
              />
            </View>

            {/* Estimated Time */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Estimated Time (minutes)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="30"
                placeholderTextColor={Colors.muted}
                value={estimatedTime}
                onChangeText={(text) => {
                  if (/^\d*$/.test(text) && (text === '' || parseInt(text) <= 480)) {
                    setEstimatedTime(text);
                  }
                }}
                keyboardType="numeric"
              />
            </View>

            {/* Task Type Selection */}
            <View style={styles.optionsRow}>
              <View style={styles.optionGroup}>
                <Text style={styles.optionLabel}>Type</Text>
                <View style={styles.optionButtons}>
                  {(['permanent', 'daily', 'weekly'] as const).map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.optionButton,
                        { backgroundColor: taskType === type ? Colors.accent : Colors.background }
                      ]}
                      onPress={() => setTaskType(type)}
                    >
                      <Text style={styles.optionButtonText}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.optionsRow}>
              <View style={styles.optionGroup}>
                <Text style={styles.optionLabel}>Priority</Text>
                <View style={styles.optionButtons}>
                  {(['low', 'medium', 'high'] as const).map(p => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.optionButton,
                        { backgroundColor: priority === p ? getPriorityColor(p) : Colors.background }
                      ]}
                      onPress={() => setPriority(p)}
                    >
                      <Text style={[styles.optionButtonText, { color: priority === p ? Colors.background : Colors.text }]}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.optionGroup}>
                <Text style={styles.optionLabel}>Difficulty</Text>
                <View style={styles.optionButtons}>
                  {(['easy', 'medium', 'hard'] as const).map(d => (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.optionButton,
                        { backgroundColor: difficulty === d ? getDifficultyColor(d) : Colors.background }
                      ]}
                      onPress={() => setDifficulty(d)}
                    >
                      <Text style={[styles.optionButtonText, { color: difficulty === d ? Colors.background : Colors.text }]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Reminder Time */}
            <TouchableOpacity
              style={styles.timePickerButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.timePickerText}>
                🔔 Set Reminder: {reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={reminderTime}
                mode="time"
                display="default"
                onChange={(event, selectedTime) => {
                  setShowTimePicker(false);
                  if (selectedTime) setReminderTime(selectedTime);
                }}
              />
            )}

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddTask(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addButton} onPress={addTask}>
                <Text style={styles.addButtonText}>Add Task</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Filter Section */}
        <Animated.View entering={FadeInUp.delay(300)} style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(['all', 'permanent', 'daily', 'weekly', 'completed'] as const).map(filter => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  { backgroundColor: activeFilter === filter ? Colors.accent : Colors.panel }
                ]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={styles.filterButtonText}>
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Enhanced Tasks List with Long Press Remove */}
        <View style={styles.tasksSection}>
          <Text style={styles.sectionTitle}>
            {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Tasks ({filteredTasks.length})
          </Text>

          {filteredTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {activeFilter === 'all' ? 'No tasks added yet' : `No ${activeFilter} tasks`}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Add your first task to get started with productivity tracking
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredTasks}
              renderItem={({ item }) => (
                <Animated.View
                  entering={FadeInDown}
                  style={[
                    styles.taskCard,
                    { borderLeftColor: getPriorityColor(item.priority) },
                    item.completed && styles.completedCard
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => toggleTask(item.id)}
                    onLongPress={() => removeTask(item.id)}
                    style={styles.taskHeader}
                  >
                    <View style={styles.taskInfo}>
                      <View style={styles.taskTitleRow}>
                        <Text style={styles.taskTitle}>{item.title}</Text>
                        <View style={styles.taskTypeBadge}>
                          <Text style={styles.taskTypeText}>{item.type}</Text>
                        </View>
                      </View>
                      
                      {item.description && (
                        <Text style={styles.taskDescription}>{item.description}</Text>
                      )}
                      
                      <View style={styles.taskMeta}>
                        <Text style={styles.taskSubject}>📚 {item.subject || 'General'}</Text>
                        <Text style={styles.taskTopic}>📖 {item.topic || 'General'}</Text>
                        <Text style={[styles.taskDifficulty, { color: getDifficultyColor(item.difficulty) }]}>
                          {getDifficultyIcon(item.difficulty)}
                        </Text>
                        <Text style={styles.taskEstimatedTime}>⏱ {item.estimatedTime || 30}m</Text>
                        <Text style={[styles.taskPriority, { color: getPriorityColor(item.priority) }]}>
                          {item.priority.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.taskActions}>
                      <View style={[styles.statusIndicator, { backgroundColor: item.completed ? Colors.success : Colors.border }]}>
                        <Text style={styles.statusText}>{item.completed ? '✓' : '○'}</Text>
                      </View>
                      
                      {!item.completed && !pomodoroActive && (
                        <TouchableOpacity
                          style={styles.pomodoroButton}
                          onPress={() => startPomodoro(item.id)}
                        >
                          <Text style={styles.pomodoroButtonText}>🍅 Focus</Text>
                        </TouchableOpacity>
                      )}
                      
                      {pomodoroActive && currentTaskId === item.id && (
                        <View style={styles.activeSessionIndicator}>
                          <Text style={styles.activeSessionText}>🔥 Active</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                  
                  {item.completed && item.completedAt && (
                    <Text style={styles.completedAt}>
                      Completed: {new Date(item.completedAt).toLocaleDateString()}
                      {item.streak && item.streak > 1 && (
                        <Text style={styles.streakText}> • {item.streak} day streak!</Text>
                      )}
                    </Text>
                  )}
                  
                  {item.reminderTime && !item.completed && (
                    <Text style={styles.reminderTime}>
                      🔔 Reminder: {new Date(item.reminderTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}
                </Animated.View>
              )}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Productivity Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 Productivity Tips</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipText}>
              • Set realistic estimated times to improve focus session planning.{'\n'}
              • Use the Pomodoro technique for better concentration and productivity.{'\n'}
              • Complete permanent tasks daily to build strong habits.{'\n'}
              • Long press on any task to remove it permanently.{'\n'}
              • Focus sessions show countdown timer in notifications.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  headerSection: {
    backgroundColor: Colors.panel,
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.muted,
    fontWeight: '500',
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
  },
  levelInfo: {
    marginLeft: 16,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.accent,
    marginBottom: 2,
  },
  xpText: {
    fontSize: 12,
    color: Colors.muted,
    fontWeight: '500',
  },
  pomodoroContainer: {
    backgroundColor: Colors.success,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  pomodoroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  pomodoroTime: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  pomodoroTask: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
    opacity: 0.8,
  },
  pomodoroStop: {
    backgroundColor: Colors.text,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pomodoroStopText: {
    color: Colors.success,
    fontWeight: '600',
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.panel,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.muted,
    fontWeight: '500',
  },
  quickActions: {
    paddingHorizontal: 20,
    marginBottom: 16,
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.accent,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonSecondary: {
    flex: 1,
    backgroundColor: Colors.panel,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionButtonSecondaryText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  analyticsSection: {
    paddingHorizontal: 20,
  },
  chartCard: {
    backgroundColor: Colors.panel,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    color: Colors.muted,
    fontSize: 14,
    fontWeight: '500',
  },
  addTaskSection: {
    backgroundColor: Colors.panel,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.muted,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.background,
    color: Colors.text,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 14,
    fontWeight: '500',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textAreaInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  dropdown: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownContainer: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
  },
  placeholder: {
    color: Colors.muted,
    fontSize: 14,
    fontWeight: '400',
  },
  dropdownText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownItemText: {
    color: Colors.text,
    fontSize: 14,
    padding: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  optionGroup: {
    flex: 1,
    marginHorizontal: 4,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.muted,
    marginBottom: 8,
  },
  optionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionButton: {
    flex: 1,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  optionButtonText: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  timePickerButton: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timePickerText: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: '500',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    flex: 1,
    backgroundColor: Colors.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  filterSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
    alignItems: 'center',
  },
  filterButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  tasksSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: Colors.muted,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: Colors.muted,
    fontSize: 14,
    textAlign: 'center',
  },
  taskCard: {
    backgroundColor: Colors.panel,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  completedCard: {
    opacity: 0.7,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  taskTypeBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  taskTypeText: {
    color: Colors.background,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  taskDescription: {
    fontSize: 14,
    color: Colors.muted,
    marginBottom: 8,
    lineHeight: 20,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  taskSubject: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  taskTopic: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  taskDifficulty: {
    fontSize: 12,
    fontWeight: '600',
  },
  taskEstimatedTime: {
    color: Colors.warning,
    fontSize: 12,
    fontWeight: '500',
  },
  taskPriority: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  taskActions: {
    alignItems: 'center',
  },
  statusIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  pomodoroButton: {
    backgroundColor: Colors.warning,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  pomodoroButtonText: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  activeSessionIndicator: {
    backgroundColor: Colors.success,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  activeSessionText: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  completedAt: {
    color: Colors.muted,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 8,
    fontStyle: 'italic',
  },
  streakText: {
    color: Colors.success,
  },
  reminderTime: {
    color: Colors.accent,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
    fontStyle: 'italic',
  },
  tipsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  tipCard: {
    backgroundColor: Colors.panel,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
  },
  tipText: {
    color: Colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});

export default BacklogTracker;
