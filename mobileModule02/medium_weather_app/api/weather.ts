import {
  City,
  GeocodingResult,
  Weather,
  WEATHER_DESCRIPTIONS,
} from "@/types/weather";

function describeWeather(code: number): string {
  return WEATHER_DESCRIPTIONS[code] ?? "Unknown weather";
}

async function askApi(url: string) {
  let response;

  try {
    response = await fetch(url);

    if (!response.ok)
      throw new Error(`The weather service answered ${response.status}`);

    let data = await response.json();
    // Open-Meteo puts an "error" field in the JSON when it refuses the request.
    if (data?.error) throw new Error("The weather service refused the request");
    return data;
  } catch {
    throw new Error("The weather service sent a broken answer");
  }
}

export async function searchCities(search: string): Promise<City[]> {
  const url =
    "https://geocoding-api.open-meteo.com/v1/search" +
    `?name=${encodeURIComponent(search)}&count=5&language=en&format=json`;

  const data = await askApi(url);
  if (!Array.isArray(data.results)) return [];

  return data.results
    .filter(
      (result: GeocodingResult) =>
        typeof result?.latitude === "number" &&
        typeof result?.longitude === "number",
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

export async function fetchWeather(
  latitude: number,
  longitude: number,
): Promise<Weather> {
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${latitude}&longitude=${longitude}` +
    "&current=temperature_2m,weather_code,wind_speed_10m" +
    "&hourly=temperature_2m,weather_code,wind_speed_10m" +
    "&daily=weather_code,temperature_2m_min,temperature_2m_max" +
    "&timezone=auto";

  const data = await askApi(url);

  if (
    !data.current ||
    !Array.isArray(data.hourly?.time) ||
    !Array.isArray(data.daily?.time)
  ) {
    throw new Error("The weather service sent an incomplete answer");
  }

  return {
    current: {
      temperature: data.current.temperature_2m,
      windSpeed: data.current.wind_speed_10m,
      description: describeWeather(data.current.weather_code),
    },
    hourly: data.hourly.time
      .slice(0, 24)
      .map((time: string, index: number) => ({
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
