import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { fetchDashboardWeather } from '../services/weatherApi';
import { WeatherResponse } from '../types/weather';

export const WeatherCard: React.FC = () => {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadWeather = async () => {
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
    loadWeather();
  }, []);

  // Determine dynamic time-of-day greeting
  const getGreeting = (name?: string) => {
    const hour = new Date().getHours();
    const displayName = name ? ` ${name}` : '';
    if (hour < 12) return `Good Morning${displayName}`;
    if (hour < 18) return `Good Afternoon${displayName}`;
    return `Good Evening${displayName}`;
  };

  if (loading) {
    return (
      <View style={[styles.card, styles.center]}>
        <ActivityIndicator size="small" color="#2563eb" />
        <Text style={styles.loadingText}>Loading weather updates...</Text>
      </View>
    );
  }

  if (errorMsg || !weather) {
    return (
      <View style={[styles.card, styles.center]}>
        <Text style={styles.errorText}>{errorMsg || 'Unable to retrieve weather.'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadWeather}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { condition, thermalComfort, mentalAndHealthMetrics, location, userName, alertsAndAdvisories } = weather;

  return (
    <View style={styles.card}>
      {/* Dynamic Time Greeting */}
      <Text style={styles.greeting}>{getGreeting(userName)}</Text>
      <Text style={styles.locationText}>📍 {location}</Text>

      {/* Main Condition Overview */}
      <View style={styles.mainRow}>
        <View>
          <Text style={styles.tempText}>{Math.round(thermalComfort.temperature)}°C</Text>
          <Text style={styles.feelsLikeText}>
            Feels like {Math.round(thermalComfort.feelsLike)}°C • {condition.summary}
          </Text>
        </View>

        {condition.icon && (
          <Image
            source={{ uri: `https://openweathermap.org/img/wn/${condition.icon}@2x.png` }}
            style={styles.weatherIcon}
          />
        )}
      </View>

      {/* Severe Weather Alert Banner */}
      {alertsAndAdvisories.hasActiveAlerts && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertTitle}>
            ⚠️ {alertsAndAdvisories.alerts[0].event}
          </Text>
          <Text style={styles.alertDesc} numberOfLines={2}>
            {alertsAndAdvisories.alerts[0].description}
          </Text>
        </View>
      )}

      {/* Mental & Health Summary Metrics */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Humidity</Text>
          <Text style={styles.metricValue}>{thermalComfort.humidity}%</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Air Quality</Text>
          <Text style={styles.metricValue}>
            {mentalAndHealthMetrics.airQualityIndex ? `AQI ${mentalAndHealthMetrics.airQualityIndex}` : 'N/A'}
          </Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>UV Index</Text>
          <Text style={styles.metricValue}>
            {mentalAndHealthMetrics.uvIndex !== null ? mentalAndHealthMetrics.uvIndex : 'N/A'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 140,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    textTransform: 'capitalize',
  },
  locationText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 12,
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tempText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0f172a',
  },
  feelsLikeText: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  weatherIcon: {
    width: 64,
    height: 64,
  },
  alertBanner: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991b1b',
  },
  alertDesc: {
    fontSize: 12,
    color: '#7f1d1d',
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#e2e8f0',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#64748b',
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#2563eb',
    borderRadius: 6,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});