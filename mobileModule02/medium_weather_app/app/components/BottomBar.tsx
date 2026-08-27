import { City, Weather } from "@/api/weather";
import { Calendar, Cloud, Sun } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  GestureResponderEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

type Tab = "Current" | "Today" | "Weekly";

const TABS: { name: Tab; icon: React.ReactNode }[] = [
  { name: "Current", icon: <Sun size={24} color="#007AFF" /> },
  { name: "Today", icon: <Cloud size={24} color="#007AFF" /> },
  { name: "Weekly", icon: <Calendar size={24} color="#007AFF" /> },
];

export default function BottomBar({
  selectedCity,
  weather,
  searchError,
  locationError,
  isLoading,
}: {
  selectedCity: City | null;
  weather: Weather | null;
  searchError: string;
  locationError: string;
  isLoading: boolean;
}) {
  // The app always starts on the first tab.
  const [activeTab, setActiveTab] = useState<Tab>("Current");
  // 1 when we move to the right tab, -1 to the left one.
  // It tells the animation from which side the content must arrive.
  const [direction, setDirection] = useState(1);
  const touchStartX = useRef(0);
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 200;

  // Goes from 0 (start of the animation) to 1 (content in place).
  const progress = useRef(new Animated.Value(1)).current;

  // Every time the tab changes, play the animation again from the start.
  useEffect(() => {
    progress.setValue(0);

    Animated.timing(progress, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [activeTab, progress]);

  // The content arrives from the left or from the right, then stops.
  const slide = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [direction * 40, 0],
  });

  // The only place where the tab changes, so the animation is always right.
  const goToTab = (index: number) => {
    const currentIndex = TABS.findIndex((tab) => tab.name === activeTab);

    // Outside of the list, or already on this tab: nothing to do.
    if (index < 0 || index >= TABS.length || index === currentIndex) {
      return;
    }

    setDirection(index > currentIndex ? 1 : -1);
    setActiveTab(TABS[index].name);
  };

  const handleSwipe = (event: GestureResponderEvent) => {
    const currentIndex = TABS.findIndex((tab) => tab.name === activeTab);
    const moveX = event.nativeEvent.pageX;

    if (touchStartX.current - moveX > 50) {
      goToTab(currentIndex + 1);
    } else if (moveX - touchStartX.current > 50) {
      goToTab(currentIndex - 1);
    }
  };

  // City name, region and country, one on each line.
  // The three tabs all start with this.
  const renderLocation = (city: City) => (
    <>
      <Text style={styles.infoText}>{city.name}</Text>
      {city.region !== "" && (
        <Text style={styles.infoText}>{city.region}</Text>
      )}
      <Text style={styles.infoText}>{city.country}</Text>
    </>
  );

  const renderCurrent = (city: City, data: Weather) => (
    <>
      {renderLocation(city)}
      <Text style={styles.infoText}>{data.current.temperature}°C</Text>
      <Text style={styles.infoText}>{data.current.description}</Text>
      <Text style={styles.infoText}>{data.current.windSpeed} km/h</Text>
    </>
  );

  const renderToday = (city: City, data: Weather) => (
    <>
      {renderLocation(city)}
      <ScrollView style={styles.list}>
        {data.hourly.map((hour) => (
          <View key={hour.time} style={styles.row}>
            <Text style={styles.rowCell}>{hour.time}</Text>
            <Text style={styles.rowCell}>{hour.temperature}°C</Text>
            <Text style={styles.rowDescription}>{hour.description}</Text>
            <Text style={styles.rowCell}>{hour.windSpeed} km/h</Text>
          </View>
        ))}
      </ScrollView>
    </>
  );

  const renderWeekly = (city: City, data: Weather) => (
    <>
      {renderLocation(city)}
      <ScrollView style={styles.list}>
        {data.daily.map((day) => (
          <View key={day.date} style={styles.row}>
            <Text style={styles.rowCell}>{day.date}</Text>
            <Text style={styles.rowCell}>{day.minTemperature}°C</Text>
            <Text style={styles.rowCell}>{day.maxTemperature}°C</Text>
            <Text style={styles.rowDescription}>{day.description}</Text>
          </View>
        ))}
      </ScrollView>
    </>
  );

  // The spinner, used every time we are waiting for something.
  const renderLoader = () => (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );

  // Shows one thing at a time, the first case that is true wins.
  const renderInfo = () => {
    if (searchError) {
      return <Text style={styles.errorText}>{searchError}</Text>;
    }

    if (locationError) {
      return <Text style={styles.errorText}>{locationError}</Text>;
    }

    // Waiting for the position of the phone, or for the weather.
    if (isLoading) {
      return renderLoader();
    }

    // No city yet, and nothing is loading: there is nothing to show.
    if (!selectedCity) {
      return null;
    }

    // The city is chosen but the answer of the API is not there yet.
    if (!weather) {
      return renderLoader();
    }

    if (activeTab === "Current") {
      return renderCurrent(selectedCity, weather);
    }

    if (activeTab === "Today") {
      return renderToday(selectedCity, weather);
    }

    return renderWeekly(selectedCity, weather);
  };

  return (
    <>
      <View
        style={styles.content}
        onTouchStart={(event) => {
          touchStartX.current = event.nativeEvent.pageX;
        }}
        onTouchEnd={handleSwipe}
      >
        <Animated.View
          style={[
            styles.contentContainer,
            { opacity: progress, transform: [{ translateX: slide }] },
          ]}
        >
          {renderInfo()}
        </Animated.View>
      </View>
      <View style={styles.tabBar}>
        {TABS.map((tab, index) => (
          <TouchableOpacity
            key={tab.name}
            style={[
              styles.tabButton,
              activeTab === tab.name && styles.tabButtonActive,
            ]}
            onPress={() => goToTab(index)}
          >
            <View
              style={[
                styles.iconWrapper,
                activeTab === tab.name && styles.iconWrapperActive,
              ]}
            >
              {tab.icon}
            </View>
            {!isSmallScreen && (
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.name && styles.tabTextActive,
                ]}
              >
                {tab.name}
              </Text>
            )}
            {activeTab === tab.name && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
  },
  infoText: {
    marginTop: 4,
    fontSize: 18,
    color: "#333",
    textAlign: "center",
  },
  // Takes all the free height so the spinner sits in the middle.
  loader: {
    flex: 1,
    justifyContent: "center",
  },
  list: {
    alignSelf: "stretch",
    marginTop: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  rowCell: {
    flex: 2,
    fontSize: 14,
    color: "#333",
  },
  rowDescription: {
    flex: 3,
    fontSize: 14,
    color: "#333",
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "red",
    textAlign: "center",
  },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    backgroundColor: "#fff",
    paddingBottom: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: {
    borderBottomWidth: 3,
    borderBottomColor: "#007AFF",
  },
  iconWrapper: {
    marginBottom: 4,
  },
  iconWrapperActive: {
    opacity: 1,
  },
  tabText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#007AFF",
    fontWeight: "600",
  },
  tabIndicator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#007AFF",
    marginTop: 6,
  },
});
