import * as Location from 'expo-location';
import { apiClient } from '@/lib/client';
import { WeatherResponse } from '../types/weather';

export const fetchDashboardWeather = async (): Promise<WeatherResponse> => {
  try {
    // Attempt 1: Default fetch (uses profile district or backend cache)
    return await apiClient<WeatherResponse>('/dashboard/weather');
  } catch (error: any) {
    // Check if the error indicates location access is required by backend
    const isLocationRequired =
      error?.requiresLocationAccess ||
      error?.message?.toLowerCase().includes('location') ||
      error?.message?.toLowerCase().includes('district');

    if (isLocationRequired) {
      // Request device foreground location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const { latitude, longitude } = location.coords;

        // Attempt 2: Re-fetch providing GPS coordinates
        return await apiClient<WeatherResponse>(
          `/dashboard/weather?lat=${latitude}&lon=${longitude}`
        );
      } else {
        throw new Error('Location permission denied by user.');
      }
    }

    throw error;
  }
};