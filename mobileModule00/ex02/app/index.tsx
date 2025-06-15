import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';

export default function Calculator() {
  const [display, setDisplay] = useState("0");
  const [result, setResult] = useState("0");
  const scrollViewRef = React.useRef<ScrollView>(null);


  const logValue = (value: string) => {
   console.log("Button pressed :" + value);
  };


  const renderButton = (label: string, onPress: (value: string) => void, style = {}) => (
    <TouchableOpacity style={[styles.button, style]} onPress={() => onPress(label)}>
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollViewContent}>

      <View style={styles.card}>
        {/* Display */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.displayContainer}
          contentContainerStyle={styles.displayContent}
          showsVerticalScrollIndicator={true}
          onContentSizeChange={() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }}
        >
          <View style={styles.display}>
            <Text style={[styles.displayText, styles.expressionText]}>{display}</Text>
            <Text style={[styles.displayText, styles.resultText]}>{result}</Text>
          </View>
        </ScrollView>

          {/* Buttons Grid */}
          <View style={styles.buttonGrid}>
            {renderButton("C", () => logValue("C"), styles.grayButton)}
            {renderButton("AC", () => logValue("AC"), styles.grayButton)}
            {renderButton("00", () => logValue("00"), styles.grayButton)}

            {renderButton(
              "÷",
              () => logValue("/"),
              styles.orangeButton
            )}

            {["7", "8", "9"].map((n) => (
              <React.Fragment key={`btn-${n}`}>
                {renderButton(n, () => logValue(n))}
              </React.Fragment>
            ))}
            {renderButton(
              "×",
              () => logValue("*"),
              styles.orangeButton
            )}

            {["4", "5", "6"].map((n) => (
              <React.Fragment key={`btn-${n}`}>
                {renderButton(n, () => logValue(n))}
              </React.Fragment>
            ))}
            {renderButton(
              "-",
              () => logValue("-"),
              styles.orangeButton
            )}

            {["1", "2", "3"].map((n) => (
              <React.Fragment key={`btn-${n}`}>
                {renderButton(n, () => logValue(n))}
              </React.Fragment>
            ))}
            {renderButton(
              "+",
              () => logValue("+"),
              styles.orangeButton
            )}

            {renderButton("0", () => logValue("0"), [styles.doubleButton])}
            {renderButton(".", () => logValue("."))}
            {renderButton("=", () => logValue("="), styles.orangeButton)}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e2e8f0",
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    minHeight: '100%',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  displayContainer: {
    height: 150,
    marginBottom: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
  },
  displayContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  display: {
    justifyContent: 'flex-end',
  },
  expressionText: {
    fontSize: 20,
    color: "#64748b",
    marginBottom: 8,
    textAlign: "right",
  },
  resultText: {
    fontSize: 32,
    color: "#0f172a",
    textAlign: "right",
  },
  displayText: {
    fontFamily: "monospace",
  },
  buttonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 8,
  },
  button: {
    width: "23%",
    aspectRatio: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    fontSize: 18,
    color: "#0f172a",
    fontWeight: "500",
  },
  grayButton: {
    backgroundColor: "#cbd5e1",
  },
  orangeButton: {
    backgroundColor: "#fb923c",
  },
  doubleButton: {
    width: "48.5%",
  },
});
