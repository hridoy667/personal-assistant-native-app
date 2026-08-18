import { apiClient } from '@/lib/client';
import { WeatherResponse } from '../types/weather';
import { getCachedLocation } from '@/lib/locationCache'; // path to helper above

export const fetchDashboardWeather = async (): Promise<WeatherResponse> => {
  try {
    // Attempt 1: Fetch dashboard weather using backend cache / profile district
    return await apiClient<WeatherResponse>('/dashboard/weather');
  } catch (error: any) {
    const isLocationRequired =
      error?.requiresLocationAccess ||
      error?.message?.toLowerCase().includes('location') ||
      error?.message?.toLowerCase().includes('district');

    if (isLocationRequired) {
      // Pull cached location (or ask GPS if >8 hrs old)
      const { latitude, longitude } = await getCachedLocation();

      // Attempt 2: Re-fetch with latitude and longitude
      return await apiClient<WeatherResponse>(
        `/dashboard/weather?lat=${latitude}&lon=${longitude}`
      );
    }

    throw error;
  }
};