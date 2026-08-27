import { Navigation, Search } from "lucide-react-native";
import React from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

export default function AppBar({
  onSearchChange,
  onGeolocationPress,
  searchText,
}: {
  onSearchChange: (text: string) => void;
  onGeolocationPress: () => void;
  searchText?: string;
}) {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 200;

  const handleSearchChange = (text: string) => {
    onSearchChange(text);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.searchContainer]}>
        <Search style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput]}
          placeholder={isSmallScreen ? "" : "Search location..."}
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={handleSearchChange}
        />
      </View>
      <TouchableOpacity
        style={styles.locationButton}
        onPress={onGeolocationPress}
      >
        <Navigation size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff",
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
    width: "80%",
  },
  locationButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
});
