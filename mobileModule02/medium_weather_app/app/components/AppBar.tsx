import { City } from "@/types/weather";
import { MapPin, Navigation, Search } from "lucide-react-native";
import { useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

export default function AppBar({
  onSearchChange,
  onSearchSubmit,
  onCitySelect,
  onMyLocationPress,
  onSearchOpen,
  onSearchClose,
  searchText,
  suggestions,
  isSearchOpen,
}: {
  onSearchChange: (text: string) => void;
  onSearchSubmit: () => void;
  onCitySelect: (city: City) => void;
  onMyLocationPress: () => void;
  onSearchOpen: () => void;
  onSearchClose: () => void;
  searchText?: string;
  suggestions: City[];
  isSearchOpen: boolean;
}) {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 200;
  const inputRef = useRef<TextInput>(null);

  const closeAndRun = (action: () => void) => {
    inputRef.current?.blur();
    action();
  };

  return (
    <View style={[styles.container, isSearchOpen && styles.containerOpen]}>
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <TouchableOpacity onPress={() => closeAndRun(onSearchSubmit)}>
            <Search style={styles.searchIcon} />
          </TouchableOpacity>
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder={isSmallScreen ? "" : "Search location..."}
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={onSearchChange}
            onSubmitEditing={() => closeAndRun(onSearchSubmit)}
            onFocus={onSearchOpen}
            onBlur={onSearchClose}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={() => closeAndRun(onMyLocationPress)}
        >
          <Navigation size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {isSearchOpen && (
        <ScrollView
          style={styles.suggestionList}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.suggestion}
            onPress={() => closeAndRun(onMyLocationPress)}
          >
            <Navigation size={18} color="#007AFF" />
            <View style={styles.suggestionTexts}>
              <Text style={styles.suggestionName}>My location</Text>
              <Text style={styles.suggestionPlace}>
                Use the position of the phone
              </Text>
            </View>
          </TouchableOpacity>

          {suggestions.map((city) => (
            <TouchableOpacity
              key={city.id}
              style={styles.suggestion}
              onPress={() => closeAndRun(() => onCitySelect(city))}
            >
              <MapPin size={18} color="#666" />
              <View style={styles.suggestionTexts}>
                <Text style={styles.suggestionName}>{city.name}</Text>
                <Text style={styles.suggestionPlace}>
                  {city.region
                    ? `${city.region}, ${city.country}`
                    : city.country}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  containerOpen: {
    flex: 1,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    color: "#666",
    width: 20,
    height: 20,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  locationButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  suggestionList: {
    flex: 1,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  suggestionTexts: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  suggestionPlace: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
});
