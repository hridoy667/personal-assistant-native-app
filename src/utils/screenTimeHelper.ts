import { Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  ScreenTimeApiService,
  BatchSyncScreenTimeDto,
  AppUsageDto,
} from '../services/screenTime.service';


const formatPackageToAppName = (packageName: string): string => {
  if (!packageName) return 'Unknown App';

  // Common Android package overrides
  const KNOWN_PACKAGES: Record<string, string> = {
    'com.facebook.katana': 'Facebook',
    'com.katana': 'Katana',
    'com.joinblocks': 'Join Blocks',
    'host.exp.exponent': 'Expo Go',
    'com.google.android.youtube': 'YouTube',
    'com.instagram.android': 'Instagram',
    'com.whatsapp': 'WhatsApp',
  };

  if (KNOWN_PACKAGES[packageName]) {
    return KNOWN_PACKAGES[packageName];
  }

  const lastSegment = packageName.split('.').pop() || packageName;
  return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
};

/**
 * Safely resolves the native module.
 * Returns null immediately if running inside Expo Go or on non-Android platforms.
 */
const getNativeUsageStats = () => {
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

export const syncDeviceScreenTime = async (
  dayStartTimestamp?: number,
): Promise<boolean> => {
  const UsageStats = getNativeUsageStats();
  if (!UsageStats) {
    console.warn('UsageStats native module is unavailable. Skipping screen time sync.');
    return false;
  }

  try {
    const hasPermission = UsageStats.isPermissionGranted();
    if (!hasPermission) return false;

    const now = Date.now();

    // Default to midnight today if no custom logical dayStartTimestamp is provided
    const defaultStartOfDay = new Date();
    defaultStartOfDay.setHours(0, 0, 0, 0);

    const startTime = dayStartTimestamp || defaultStartOfDay.getTime();

    const statsList = await UsageStats.queryUsageStats({
      startTime,
      endTime: now,
      interval: 0,
    });

    if (!statsList || !Array.isArray(statsList)) return false;

    let totalMins = 0;
    // Map to group app usages by appName and sum up timeSpentMins
    const appUsageMap = new Map<string, AppUsageDto>();

    statsList.forEach((usage: any) => {
      const timeInMins = Math.round(
        (usage?.totalTimeInForeground || 0) / (1000 * 60),
      );

      if (timeInMins > 0 && usage.packageName) {
        totalMins += timeInMins;

        // Resolve display label: Native appName/label -> Formatted package fallback
        const resolvedAppName =
          usage.appName ||
          usage.label ||
          formatPackageToAppName(usage.packageName);

        const existing = appUsageMap.get(resolvedAppName);

        if (existing) {
          existing.timeSpentMins += timeInMins;
        } else {
          appUsageMap.set(resolvedAppName, {
            packageName: usage.packageName,
            appName: resolvedAppName,
            category: 'NEUTRAL',
            timeSpentMins: timeInMins,
          });
        }
      }
    });

    // Convert map values back into an array
    const appUsages = Array.from(appUsageMap.values());

    const payload: BatchSyncScreenTimeDto = {
      date: new Date(startTime).toISOString().split('T')[0],
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