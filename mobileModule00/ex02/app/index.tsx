import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';

export default function Calculator() {
  const [display, setDisplay] = useState("0");
  const [result, setResult] = useState("0");

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
      <View style={styles.card}>
        {/* Display */}
        <View style={styles.display}>
          <Text style={styles.displayText}>{display}</Text>
          <Text style={styles.displayText}>{result}</Text>
        </View>

        {/* Buttons Grid */}
        <View style={styles.buttonGrid}>
          {renderButton("C", () => logValue("C"), styles.grayButton)}
          {renderButton("AC", () => logValue("AC"), styles.grayButton)}
          {renderButton("00", () => logValue("00"), styles.grayButton)}

          {renderButton("÷", () => logValue("÷"), styles.orangeButton)}

          {["7", "8", "9"].map(n => renderButton(n, () => logValue(n)))}
          {renderButton("×", () => logValue("×"), styles.orangeButton)}

          {["4", "5", "6"].map(n => renderButton(n, () => logValue(n)))}
          {renderButton("-", () => logValue("-"), styles.orangeButton)}

          {["1", "2", "3"].map(n => renderButton(n, () => logValue(n)))}
          {renderButton("+", () => logValue("+"), styles.orangeButton)}

          {renderButton("0", () => logValue("0"), [styles.doubleButton])}
          {renderButton(".", () => logValue("."))}
          {renderButton("=", () => logValue("="), styles.orangeButton)}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 6,
  },
  display: {
    backgroundColor: '#0f172a',
    padding: 20,
    borderRadius: 10,
    marginBottom: 16,
    minHeight: 80,
    justifyContent: 'center',
  },
  displayText: {
    color: '#fff',
    fontSize: 36,
    textAlign: 'right',
    fontFamily: 'monospace',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  button: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 24,
    fontWeight: '600',
  },
  grayButton: {
    backgroundColor: '#cbd5e1',
  },
  orangeButton: {
    backgroundColor: '#f97316',
  },
  doubleButton: {
    width: '47%',
  },
});
