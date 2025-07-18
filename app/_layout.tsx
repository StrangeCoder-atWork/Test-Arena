// app/_layout.tsx
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native';
import '../global';
export default function Layout() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="launch" options={{ headerShown: false }} />
      <Stack.Screen name="DashboardScreen" options={{ headerShown: false }} />
      <Stack.Screen name="reattempt-bookmark" options={{ headerShown: false }} />
      <Stack.Screen name="test-setup" options={{ headerShown: false }} />
      <Stack.Screen name="test" options={{ headerShown: false }} />
      <Stack.Screen name="results" options={{ headerShown: false }} />
      <Stack.Screen name="bookmarks" options={{ headerShown: false }} />
      <Stack.Screen name="history" options={{ headerShown: false }} />
    </Stack>
    </SafeAreaView>
  );
}
