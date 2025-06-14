import { Button, Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { useState } from "react";

export default function Index() {
  const [isHello, setIsHello] = useState(false);
  const handlePress = () => {
    setIsHello(prev => !prev);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{isHello ? "Hello World!" : "A Simple Text"}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>Click me</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#B6B09F",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: "#f5f5f5",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
