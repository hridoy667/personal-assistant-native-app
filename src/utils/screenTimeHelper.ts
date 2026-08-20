import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { ScreenTimeApiService, BatchSyncScreenTimeDto, AppUsageDto } from '../services/screenTime.service';

/**
 * Safely resolves the native module.
 * Returns null immediately if running inside Expo Go or on non-Android platforms.
 */
const getNativeUsageStats = () => {
  // Prevent resolution inside Expo Go to avoid native module crash
  const isExpoGo = Constants.appOwnership === 'expo';
  if (Platform.OS !== 'android' || isExpoGo) {
    return null;
  }

  try {
    return require('@antardev/react-native-usage-stats').default;
  } catch (error) {
    console.warn('ReactNativeUsageStats native module is unavailable.');
    return null;
  }
};

export const isUsageStatsAvailable = (): boolean => {
  const UsageStats = getNativeUsageStats();
  return UsageStats != null;
};

export const checkAndRequestUsagePermission = async (): Promise<boolean> => {
  const UsageStats = getNativeUsageStats();
  if (!UsageStats) {
    console.warn('UsageStats native module is unavailable in Expo Go.');
    return false;
  }

  try {
    const isGranted = UsageStats.isPermissionGranted();
    if (!isGranted) {
      UsageStats.requestPermission();
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error checking usage permission:', error);
    return false;
  }
};

export const syncDeviceScreenTime = async (): Promise<boolean> => {
  const UsageStats = getNativeUsageStats();
  if (!UsageStats) {
    console.warn('UsageStats native module is unavailable. Skipping screen time sync.');
    return false;
  }

  try {
    const hasPermission = UsageStats.isPermissionGranted();
    if (!hasPermission) return false;

    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const statsList = await UsageStats.queryUsageStats({
      startTime: startOfDay.getTime(),
      endTime: now,
      interval: 0,
    });

    if (!statsList || !Array.isArray(statsList)) return false;

    let totalMins = 0;
    const appUsages: AppUsageDto[] = [];

    statsList.forEach((usage: any) => {
      const timeInMins = Math.round((usage?.totalTimeInForeground || 0) / (1000 * 60));

      if (timeInMins > 0 && usage.packageName) {
        totalMins += timeInMins;
        appUsages.push({
          packageName: usage.packageName,
          appName: usage.packageName.split('.').pop() || usage.packageName,
          category: 'NEUTRAL',
          timeSpentMins: timeInMins,
        });
      }
    });

    const payload: BatchSyncScreenTimeDto = {
      date: startOfDay.toISOString().split('T')[0],
      totalScreenTimeMins: totalMins,
      deviceOs: 'ANDROID',
      appUsages,
    };

    await ScreenTimeApiService.syncScreenTime(payload);
    return true;
  } catch (error) {
    console.error('Failed to capture or sync screen time:', error);
    return false;
  }
};