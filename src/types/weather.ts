export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Condition {
  id: number;
  main: string;
  summary: string;
  icon: string;
  isDaylight: boolean;
}

export interface ThermalComfort {
  temperature: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
}

export interface Pollutants {
  pm2_5: number | null;
  pm10: number | null;
}

export interface MentalAndHealthMetrics {
  pressure: number;
  visibility: number;
  cloudCover: number;
  uvIndex: number | null;
  airQualityIndex: number | null; // 1 = Good, 5 = Very Poor
  pollutants: Pollutants;
}

export interface ProductivityAndWorkouts {
  windSpeed: number;
  windGusts: number | null;
  precipitationAmount: number;
  sunrise: number;
  sunset: number;
}

export interface WeatherAlert {
  senderName: string;
  event: string;
  start: number;
  end: number;
  description: string;
  tags: string[];
}

export interface AlertsAndAdvisories {
  hasActiveAlerts: boolean;
  alerts: WeatherAlert[];
}

export interface WeatherResponse {
  success: boolean;
  location: string;
  coordinates: Coordinates;
  condition: Condition;
  thermalComfort: ThermalComfort;
  mentalAndHealthMetrics: MentalAndHealthMetrics;
  productivityAndWorkouts: ProductivityAndWorkouts;
  alertsAndAdvisories: AlertsAndAdvisories;
  userName?: string;
  cached: boolean;
}

export interface LocationAccessErrorResponse {
  success: false;
  requiresLocationAccess: boolean;
  message: string;
}