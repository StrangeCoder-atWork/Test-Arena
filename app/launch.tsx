import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Image, ImageSourcePropType, Modal,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
const logo: ImageSourcePropType = require('../assets/app_logo.png');

const examOptions = [
  { key: 'NEET', label: 'NEET', color: '#ffffff' },
  { key: 'IIT JEE', label: 'IIT JEE', color: '#ffffff' },
  { key: 'SSC JE', label: 'SSC JE', color: '#ffffff' },
  { key: 'SSC CGL', label: 'SSC CGL', color: '#ffffff' },
];

export default function ExamSelectScreen() {
  const [modalVisible, setModalVisible] = useState(true);
  const router = useRouter();

  useEffect(() => {
    AsyncStorage.getItem('@selectedExam1').then((v) => {
      // if (!v) setModalVisible(true);
    //   // else router.replace('/'); // 🧠 redirect to Home directly
    // 
    });
  }, []);

  const selectExam = async (key: string) => {
    await AsyncStorage.setItem('@selectedExam1', key);
    // setModalVisible(false);
    router.replace('/'); // 🔁 Take user to home page after selecting exam
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalBackground}>
          <View style={styles.modalCard}>
            <Text style={styles.appTitle}> Welcome To</Text>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
            <Text style={styles.mainTitle}>Test Arena</Text>
            <Text style={styles.subtitle}>Choose Your Exam to Proceed</Text>

            <View style={styles.buttonGrid}>
              {examOptions.map(({ key, label, color }) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => selectExam(key)}
                  style={[styles.examButton, { borderColor: color }]}
                  activeOpacity={0.9}
                >
                  
                  <Text style={[styles.examText, { color }]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E0E',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    padding: 28,
  },
  modalCard: {
    backgroundColor: '#1A1F2B',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    elevation: 12,
    borderWidth: 1.8,
    borderColor: '#00B0FF', // ✨ dark sky blue border
    shadowColor: '#00B0FF',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  appTitle: {
    fontSize: 18,
    color: '#ffffff', // App name in sky blue
    marginBottom: 4,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  logo: {
  width: 100,
  height: 100,
  marginBottom: 0,
  marginTop: 16,
},
  mainTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#ffffff', // White main text
    marginBottom: 16,
    letterSpacing: 1.2,
  },
  subtitle: {
    fontSize: 15,
    color: '#CCCCCC', // Softer white
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonGrid: {
    width: '100%',
    marginTop: 10,
  },
    examButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 14,
    marginVertical: 10,
    backgroundColor: '#121212',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  examText: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
    letterSpacing: 1.1,
  },
});
