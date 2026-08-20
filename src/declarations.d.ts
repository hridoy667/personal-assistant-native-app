declare module 'react-native-usage-stats-manager' {
  export interface UsageStat {
    packageName: string;
    totalTimeInForeground: number;
    firstTimeStamp: number;
    lastTimeStamp: number;
    lastTimeUsed: number;
  }

  const UsageStats: {
    checkForPermission(): Promise<boolean>;
    showUsageAccessSettings(): void;
    queryUsageStats(
      startTime: number,
      endTime: number
    ): Promise<Record<string, UsageStat>>;
  };

  export default UsageStats;
}