import { fetchWeather, searchCities } from "@/api/weather";
import { City, Weather } from "@/types/weather";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppBar from "./components/AppBar";
import BottomBar from "./components/BottomBar";

const NOT_FOUND_MESSAGE =
  "Could not find any city with this name, please try another one";
const CONNECTION_MESSAGE =
  "Cannot reach the weather service, check your connection";

export default function Index() {
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [searchError, setSearchError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [connectionFailed, setConnectionFailed] = useState(false);
  const [locationError, setLocationError] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSearchId = useRef(0);
  const lastWeatherId = useRef(0);

  const loadWeather = async (city: City) => {
    const weatherId = lastWeatherId.current + 1;
    lastWeatherId.current = weatherId;
    setIsLoading(true);

    try {
      const result = await fetchWeather(city.latitude, city.longitude);

      if (weatherId !== lastWeatherId.current) return;

      setWeather(result);
      setSearchError("");
      setConnectionFailed(false);
      setIsLoading(false);
    } catch {
      if (weatherId !== lastWeatherId.current) return;

      setSearchError(CONNECTION_MESSAGE);
      setConnectionFailed(true);
      setIsLoading(false);
    }
  };

  const buildCityFromCoords = async (
    position: Location.LocationObjectCoords,
  ): Promise<City> => {
    let name = "My position";
    let region = "";
    let country = "";

    try {
      const places = await Location.reverseGeocodeAsync({
        latitude: position.latitude,
        longitude: position.longitude,
      });

      if (places.length > 0) {
        const place = places[0];
        name = place.city ?? place.subregion ?? name;
        region = place.region ?? "";
        country = place.country ?? "";
      }
    } catch {
    }

    return {
      id: 0,
      name,
      region,
      country,
      latitude: position.latitude,
      longitude: position.longitude,
    };
  };

  const showMyPosition = async () => {
    setSearchText("");
    setSuggestions([]);
    setSearchError("");
    setIsSearchOpen(false);
    setConnectionFailed(false);
    setWeather(null);
    setIsLoading(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setSelectedCity(null);
        setLocationError("Permission denied, please enable it from settings");
        setIsLoading(false);
        return;
      }

      setLocationError("");
      let position = await Location.getLastKnownPositionAsync();
      if (!position) position = await Location.getCurrentPositionAsync({});

      const city = await buildCityFromCoords(position.coords);

      setSelectedCity(city);
      loadWeather(city);
    } catch {
      setSelectedCity(null);
      setLocationError("Could not read the position of the phone");
      setIsLoading(false);
    }
  };

  
  useEffect(() => {
    showMyPosition();
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
      }
    };
  }, []);


  useEffect(() => {
    if (!connectionFailed || !selectedCity) {
      return;
    }

    const retryTimer = setInterval(() => {
      loadWeather(selectedCity);
    }, 5000);

    return () => clearInterval(retryTimer);
  }, [connectionFailed, selectedCity]);

  const runSearch = async (text: string) => {
    const searchId = lastSearchId.current + 1;
    lastSearchId.current = searchId;

    try {
      const cities = await searchCities(text);

      // A newer search started while we were waiting: drop this old answer.
      if (searchId !== lastSearchId.current) {
        return;
      }

      setSuggestions(cities);
      setSearchError(cities.length === 0 ? NOT_FOUND_MESSAGE : "");
    } catch {
      if (searchId !== lastSearchId.current) {
        return;
      }

      setSuggestions([]);
      setSearchError(CONNECTION_MESSAGE);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    setIsSearchOpen(true);
    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (text.trim().length < 2) {
      setSuggestions([]);
      if (!connectionFailed) setSearchError("");
      return;
    }
    searchTimer.current = setTimeout(() => {
      runSearch(text);
    }, 300);
  };

  const showCity = (city: City, replaceSearchText: boolean) => {
    setSelectedCity(city);
    setSuggestions([]);
    setSearchError("");
    setIsSearchOpen(false);
    setLocationError("");
    setConnectionFailed(false);
    setWeather(null);
    if (replaceSearchText) setSearchText(city.name);
    loadWeather(city);
  };

  const handleCitySelect = (city: City) => {
    showCity(city, true);
  };

  const handleSearchSubmit = async () => {
    const text = searchText.trim();
    if (text.length === 0) return;
    setIsSearchOpen(false);
    setIsLoading(true);
    if (searchTimer.current) clearTimeout(searchTimer.current);

    const searchId = lastSearchId.current + 1;
    lastSearchId.current = searchId;

    try {
      const cities = await searchCities(text);
      if (searchId !== lastSearchId.current) return;

      if (cities.length === 0) {
        if (searchId !== lastSearchId.current) return;
        setSearchError(CONNECTION_MESSAGE);
        setIsLoading(false);
      }
    } catch {}
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AppBar
        searchText={searchText}
        suggestions={suggestions}
        isSearchOpen={isSearchOpen}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        onCitySelect={handleCitySelect}
        onMyLocationPress={showMyPosition}
        onSearchOpen={() => setIsSearchOpen(true)}
        onSearchClose={() => setIsSearchOpen(false)}
      />
      <View style={[styles.bottom, isSearchOpen && styles.hidden]}>
        <BottomBar
          selectedCity={selectedCity}
          weather={weather}
          searchError={searchError}
          locationError={locationError}
          isLoading={isLoading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bottom: {
    flex: 1,
  },
  hidden: {
    display: "none",
  },
});
