import { Calendar, Cloud, Sun } from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

type Tab = "Currently" | "Today" | "Weekly";

const TABS: { name: Tab; icon: React.ReactNode }[] = [
  { name: "Currently", icon: <Sun size={24} color="#007AFF" /> },
  { name: "Today", icon: <Cloud size={24} color="#007AFF" /> },
  { name: "Weekly", icon: <Calendar size={24} color="#007AFF" /> },
];

export default function BottomBar({
  searchText,
  isGeolocation,
}: {
  searchText: string;
  isGeolocation: boolean;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("Currently");
  const scrollStartX = useRef(0);
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 200;

  const handleSwipe = (event: GestureResponderEvent) => {
    const currentIndex = TABS.findIndex((tab) => tab.name === activeTab);
    const moveX = event.nativeEvent.pageX;

    if (scrollStartX.current - moveX > 50) {
      if (currentIndex < TABS.length - 1) {
        setActiveTab(TABS[currentIndex + 1].name);
      }
    } else if (moveX - scrollStartX.current > 50) {
      if (currentIndex > 0) {
        setActiveTab(TABS[currentIndex - 1].name);
      }
    }
  };

  return (
    <>
      <View
        style={styles.content}
        onStartShouldSetResponder={() => true}
        onResponderGrant={(event) => {
          scrollStartX.current = event.nativeEvent.pageX;
        }}
        onResponderRelease={handleSwipe}
      >
        <View style={styles.contentContainer}>
          <Text style={styles.contentTitle}>
            {isGeolocation
              ? `${activeTab} - Geolocation`
              : searchText
                ? `${activeTab} - ${searchText}`
                : `${activeTab}`}
          </Text>
        </View>
      </View>
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.name}
            style={[
              styles.tabButton,
              activeTab === tab.name && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab(tab.name)}
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
    justifyContent: "center",
    alignItems: "center",
  },
  contentTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
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
