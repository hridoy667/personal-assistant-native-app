import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchDashboardWeather } from '../../services/weatherApi';
import { WeatherResponse } from '../../types/weather';

export const WeatherCard: React.FC = () => {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadWeather = async (forceRefresh = false) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchDashboardWeather();
      setWeather(data);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load weather update.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeather(false);
  }, []);

  const getGreeting = (name?: string) => {
    const hour = new Date().getHours();
    const displayName = name ? ` ${name}` : '';

    if (hour >= 5 && hour < 12) return `Good Morning${displayName}`;
    if (hour >= 12 && hour < 16) return `Good Midday${displayName}`;
    if (hour >= 16 && hour < 18) return `Good Afternoon${displayName}`;
    if (hour >= 18 && hour < 21) return `Good Evening${displayName}`;
    return `Good Night${displayName}`;
  };

  if (loading) {
    return (
      <View style={[styles.card, styles.center]}>
        <ActivityIndicator size="small" color="#3b82f6" />
      </View>
    );
  }

  if (errorMsg || !weather) {
    return (
      <View style={[styles.card, styles.center]}>
        <Text style={styles.errorText}>
          {errorMsg || 'Unable to retrieve weather.'}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => loadWeather(true)}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { condition, thermalComfort, location, userName, alertsAndAdvisories } =
    weather;

  const userAvatarUri = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    userName || 'User'
  )}&background=3b82f6&color=fff&bold=true`;

  return (
    <View style={styles.card}>
      <View style={styles.mainContainer}>
        {/* Left Section: Avatar + Text Details */}
        <View style={styles.leftSection}>
          <Image source={{ uri: userAvatarUri }} style={styles.avatar} />
          
          <View style={styles.detailsContainer}>
            <Text style={styles.greeting} numberOfLines={1}>
              {getGreeting(userName)}
            </Text>
            
            <Text style={styles.feelsLikeText} numberOfLines={1}>
              Feels Like {Math.round(thermalComfort.feelsLike)}°C • {condition.summary}
            </Text>
            
            <Text style={styles.locationText} numberOfLines={1}>
              📍 {location}
            </Text>
          </View>
        </View>

        {/* Right Section: Icon stacked above Temperature */}
        <View style={styles.rightSection}>
          {condition.icon && (
            <Image
              source={{
                uri: `https://openweathermap.org/img/wn/${condition.icon}@2x.png`,
              }}
              style={styles.weatherIcon}
            />
          )}
          <Text style={styles.tempText}>
            {Math.round(thermalComfort.temperature)}°C
          </Text>
        </View>
      </View>

      {/* Alert Banner */}
      {alertsAndAdvisories?.hasActiveAlerts && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertTitle} numberOfLines={1}>
            ⚠️ {alertsAndAdvisories.alerts[0].event}:{' '}
            {alertsAndAdvisories.alerts[0].description}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 80,
  },
  mainContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  feelsLikeText: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 13,
    color: '#64748b',
  },
  rightSection: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  weatherIcon: {
    width: 36,
    height: 36,
    marginBottom: -4,
  },
  tempText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  alertBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  alertTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fca5a5',
  },
  errorText: {
    fontSize: 12,
    color: '#f87171',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  retryText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
  },
});