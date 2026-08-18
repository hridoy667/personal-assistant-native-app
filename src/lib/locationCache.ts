import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const LOCATION_CACHE_KEY = 'user_cached_location';
const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

interface CachedLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

/**
 * Retrieves cached GPS coordinates if valid (< 8 hours old),
 * otherwise requests fresh coordinates from the device.
 */
export const getCachedLocation = async (): Promise<{ latitude: number; longitude: number }> => {
  try {
    // 1. Check AsyncStorage for cached location
    const stored = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
    if (stored) {
      const parsed: CachedLocation = JSON.parse(stored);
      const isExpired = Date.now() - parsed.timestamp > EIGHT_HOURS_MS;

      if (!isExpired) {
        return { latitude: parsed.latitude, longitude: parsed.longitude };
      }
    }
  } catch (err) {
    // If reading storage fails, fall through to fresh GPS fetch
    console.warn('Failed to read cached location:', err);
  }

  // 2. Request permission & fresh GPS coordinates
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied by user.');
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const coords = {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };

  // 3. Save new location with current timestamp to AsyncStorage
  try {
    await AsyncStorage.setItem(
      LOCATION_CACHE_KEY,
      JSON.stringify({ ...coords, timestamp: Date.now() })
    );
  } catch (err) {
    console.warn('Failed to save location cache:', err);
  }

  return coords;
};