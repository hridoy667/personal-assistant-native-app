import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show a loading spinner while reading stored tokens from Secure Store
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  // Redirect to the tabs index route inside the app layout group
  if (isAuthenticated) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  // If user is NOT logged in, send them to the Login screen
  return <Redirect href="/(auth)/login" />;
}