export interface PrayerTimes {
  imsak?: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export interface PrayerDateTimes {
  imsak?: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export interface IslamicInfo {
  prayer_names?: Record<string, string>;
  note?: string;
}

export interface CurrentPrayerStatus {
  current_prayer: string;
  next_prayer: string | null;
  time_until_next: string | null;
  minutes_until_next: number | null;
}

export interface PrayerTimeData {
  date: string;
  timezone: string;
  location: {
    latitude: number;
    longitude: number;
  };
  calculation_method: string;
  madhab: string;
  high_latitude_rule: string;
  prayer_times: PrayerTimes;
  prayer_datetimes: PrayerDateTimes;
  islamic_info?: IslamicInfo;
  current_status?: CurrentPrayerStatus;
}

export interface PrayerTimeResponse {
  success: boolean;
  message?: string;
  data?: PrayerTimeData;
  cached?: boolean;
}