// All the calls to the Open-Meteo APIs live here, so the screens stay simple.
//
// Rule of this file: if anything goes wrong, we throw.
// The screen catches it and shows the connection message.

// One city coming from the Geocoding API.
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
type GeocodingResult = {
  id: number;
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
};

// The API sends a number for the weather, these are the matching sentences.
const WEATHER_DESCRIPTIONS: Record<number, string> = {
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

// Turns the number given by the API into a sentence to display.
// An unknown or missing number must not break the display.
function describeWeather(code: number): string {
  return WEATHER_DESCRIPTIONS[code] ?? "Unknown weather";
}

// Calls one URL and gives back the JSON.
// Throws as soon as something is not normal, so the screen can warn the user.
async function askApi(url: string) {
  let response;

  try {
    response = await fetch(url);
  } catch {
    // The phone could not reach the server at all (no wifi, plane mode...).
    throw new Error("Cannot reach the weather service");
  }

  // The server answered, but with an error code like 400 or 500.
  if (!response.ok) {
    throw new Error(`The weather service answered ${response.status}`);
  }

  let data;

  try {
    data = await response.json();
  } catch {
    // The answer was not JSON, so we cannot use it.
    throw new Error("The weather service sent a broken answer");
  }

  // Open-Meteo puts an "error" field in the JSON when it refuses the request.
  if (data?.error) {
    throw new Error("The weather service refused the request");
  }

  return data;
}

// Geocoding API: text typed by the user -> list of matching cities.
// An empty list means "no city with this name", it is not an error.
export async function searchCities(search: string): Promise<City[]> {
  const url =
    "https://geocoding-api.open-meteo.com/v1/search" +
    `?name=${encodeURIComponent(search)}&count=5&language=en&format=json`;

  const data = await askApi(url);

  // The API does not send "results" at all when nothing matches.
  if (!Array.isArray(data.results)) {
    return [];
  }

  return data.results
    // A result without coordinates is useless for the weather call.
    .filter(
      (result: GeocodingResult) =>
        typeof result?.latitude === "number" &&
        typeof result?.longitude === "number"
    )
    .map((result: GeocodingResult) => ({
      id: result.id,
      name: result.name,
      region: result.admin1 ?? "",
      country: result.country ?? "",
      latitude: result.latitude,
      longitude: result.longitude,
    }));
}

// Weather API: coordinates -> the weather for the three tabs.
export async function fetchWeather(
  latitude: number,
  longitude: number
): Promise<Weather> {
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${latitude}&longitude=${longitude}` +
    "&current=temperature_2m,weather_code,wind_speed_10m" +
    "&hourly=temperature_2m,weather_code,wind_speed_10m" +
    "&daily=weather_code,temperature_2m_min,temperature_2m_max" +
    "&timezone=auto&forecast_days=7";

  const data = await askApi(url);

  // We read these fields just after, so we check they are really here.
  if (!data.current || !Array.isArray(data.hourly?.time)) {
    throw new Error("The weather service sent an incomplete answer");
  }

  if (!Array.isArray(data.daily?.time)) {
    throw new Error("The weather service sent an incomplete answer");
  }

  return {
    current: {
      temperature: data.current.temperature_2m,
      windSpeed: data.current.wind_speed_10m,
      description: describeWeather(data.current.weather_code),
    },

    // The API sends the hours of the 7 days, we keep only the 24 of today.
    hourly: data.hourly.time
      .slice(0, 24)
      .map((time: string, index: number) => ({
        // "2026-08-27T13:00" -> "13:00"
        time: time.slice(11, 16),
        temperature: data.hourly.temperature_2m?.[index],
        windSpeed: data.hourly.wind_speed_10m?.[index],
        description: describeWeather(data.hourly.weather_code?.[index]),
      })),

    daily: data.daily.time.map((date: string, index: number) => ({
      date,
      minTemperature: data.daily.temperature_2m_min?.[index],
      maxTemperature: data.daily.temperature_2m_max?.[index],
      description: describeWeather(data.daily.weather_code?.[index]),
    })),
  };
}
