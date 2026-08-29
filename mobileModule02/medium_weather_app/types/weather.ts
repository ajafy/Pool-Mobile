export type City = {
  id: number;
  name: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
};

// The weather right now.
export type CurrentWeather = {
  temperature: number;
  windSpeed: number;
  description: string;
};

// The weather at one hour of today.
export type HourlyWeather = {
  time: string;
  temperature: number;
  windSpeed: number;
  description: string;
};

// The weather of one day of the week.
export type DailyWeather = {
  date: string;
  minTemperature: number;
  maxTemperature: number;
  description: string;
};

// Everything the three tabs need, from one single call.
export type Weather = {
  current: CurrentWeather;
  hourly: HourlyWeather[];
  daily: DailyWeather[];
};

// Shape of one result inside the Geocoding API answer.
export type GeocodingResult = {
  id: number;
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
};

// The API sends a number for the weather, these are the matching sentences.
export const WEATHER_DESCRIPTIONS: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow fall",
  73: "Moderate snow fall",
  75: "Heavy snow fall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};
