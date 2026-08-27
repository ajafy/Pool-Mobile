import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import AppBar from "./components/AppBar";
import BottomBar from "./components/BottomBar";

export default function Index() {
  const [searchText, setSearchText] = useState("");
  const [isGeolocation, setIsGeolocation] = useState(false);

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    setIsGeolocation(false);
  };

  const handleGeolocationPress = () => {
    setIsGeolocation(true);
    setSearchText("");
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AppBar
        searchText={searchText}
        onSearchChange={handleSearchChange}
        onGeolocationPress={handleGeolocationPress}
      />
      <BottomBar searchText={searchText} isGeolocation={isGeolocation} />
    </SafeAreaView>
  );
}
