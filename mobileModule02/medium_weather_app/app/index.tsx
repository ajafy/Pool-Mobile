import { City, fetchWeather, searchCities, Weather } from "@/api/weather";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppBar from "./components/AppBar";
import BottomBar from "./components/BottomBar";

// The two messages asked by the subject, written once so they never change.
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
  // True while we are waiting for the position or for the weather.
  const [isLoading, setIsLoading] = useState(false);
  // True while the search list is open and covers the screen.
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // True while the weather call keeps failing, so we keep trying alone.
  const [connectionFailed, setConnectionFailed] = useState(false);
  const [locationError, setLocationError] = useState("");

  // Keeps the timer used to wait a little before calling the API.
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Every call gets a number, we only keep the answer of the last one.
  const lastSearchId = useRef(0);
  const lastWeatherId = useRef(0);

  // Loads the weather of one city and shows it.
  const loadWeather = async (city: City) => {
    const weatherId = lastWeatherId.current + 1;
    lastWeatherId.current = weatherId;
    setIsLoading(true);

    try {
      const result = await fetchWeather(city.latitude, city.longitude);

      // Another city was chosen while we were waiting: drop this old answer.
      // We keep the loader on, the newer call is still working.
      if (weatherId !== lastWeatherId.current) {
        return;
      }

      setWeather(result);
      setSearchError("");
      setConnectionFailed(false);
      setIsLoading(false);
    } catch {
      if (weatherId !== lastWeatherId.current) {
        return;
      }

      setSearchError(CONNECTION_MESSAGE);
      setConnectionFailed(true);
      setIsLoading(false);
    }
  };

  // Coordinates of the phone -> a City, so we can show it like a search.
  // The phone itself gives the name of the place (reverse geocoding).
  const buildCityFromCoords = async (
    position: Location.LocationObjectCoords
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
        // In the middle of nowhere the city can be empty, so we try the area.
        name = place.city ?? place.subregion ?? name;
        region = place.region ?? "";
        country = place.country ?? "";
      }
    } catch {
      // The phone could not name the place, we keep the default name.
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

  // Shows the weather of the position of the phone, exactly like a search.
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

      // Asking the GPS can be slow, so we first take the position it
      // already remembers, and we only wait for a new one if there is none.
      let position = await Location.getLastKnownPositionAsync();

      if (!position) {
        position = await Location.getCurrentPositionAsync({});
      }

      const city = await buildCityFromCoords(position.coords);

      setSelectedCity(city);
      // loadWeather keeps the loader on until the weather is there.
      loadWeather(city);
    } catch {
      // The GPS can also refuse to answer: turned off, no signal...
      setSelectedCity(null);
      setLocationError("Could not read the position of the phone");
      setIsLoading(false);
    }
  };

  // When the app starts, show the weather of the position of the phone.
  // The empty [] is wanted: this must happen only once.
  useEffect(() => {
    showMyPosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Forget the waiting timer if the screen disappears.
  useEffect(() => {
    return () => {
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
      }
    };
  }, []);

  // While the API cannot be reached, try again every 5 seconds by ourselves.
  // So the message stays on the screen until the connection comes back.
  useEffect(() => {
    if (!connectionFailed || !selectedCity) {
      return;
    }

    const retryTimer = setInterval(() => {
      loadWeather(selectedCity);
    }, 5000);

    return () => clearInterval(retryTimer);
  }, [connectionFailed, selectedCity]);

  // Looks for the cities and shows the right message if there is none.
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

  // Called on every letter typed in the search bar.
  const handleSearchChange = (text: string) => {
    setSearchText(text);

    // The user is typing a new name, so the list must be visible.
    setIsSearchOpen(true);

    // Cancel the search that was waiting, the text changed again.
    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }

    // Too short to be a city name, so no suggestion at all.
    if (text.trim().length < 2) {
      setSuggestions([]);

      // But a message about the chosen city must stay on the screen.
      if (!connectionFailed) {
        setSearchError("");
      }
      return;
    }

    // Wait 300ms so we do not call the API on every single letter.
    searchTimer.current = setTimeout(() => {
      runSearch(text);
    }, 300);
  };

  // Shows the weather of one city.
  // replaceSearchText is false when the user typed his own text: in that
  // case the search bar must keep exactly what he wrote.
  const showCity = (city: City, replaceSearchText: boolean) => {
    setSelectedCity(city);
    setSuggestions([]);
    setSearchError("");
    setIsSearchOpen(false);
    setLocationError("");
    setConnectionFailed(false);
    setWeather(null);

    if (replaceSearchText) {
      setSearchText(city.name);
    }

    loadWeather(city);
  };

  // Called when the user taps one city in the suggestion list.
  // He chose this city, so its name replaces the text of the bar.
  const handleCitySelect = (city: City) => {
    showCity(city, true);
  };

  // Called when the user presses the search key without choosing a city.
  const handleSearchSubmit = async () => {
    const text = searchText.trim();

    if (text.length === 0) {
      return;
    }

    // The user asked for the search, so the list can close.
    setIsSearchOpen(false);
    setIsLoading(true);

    // Stop the search that was waiting, we search right now instead.
    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }

    const searchId = lastSearchId.current + 1;
    lastSearchId.current = searchId;

    try {
      const cities = await searchCities(text);

      if (searchId !== lastSearchId.current) {
        return;
      }

      if (cities.length === 0) {
        setSelectedCity(null);
        setWeather(null);
        setSuggestions([]);
        setConnectionFailed(false);
        setSearchError(NOT_FOUND_MESSAGE);
        setIsLoading(false);
        return;
      }

      // The user searched his own text, so the bar keeps that text.
      // We only use the best match to know where to ask the weather.
      showCity(cities[0], false);
    } catch {
      if (searchId !== lastSearchId.current) {
        return;
      }

      setSearchError(CONNECTION_MESSAGE);
      setIsLoading(false);
    }
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
      {/* "display: none" hides the tabs but keeps them alive, so the tab
          chosen by the user is still the same after a search. */}
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
