import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import {evaluate} from "mathjs";

export default function CalculatorApp() {
  const [display, setDisplay] = useState("0");
  const [result, setResult] = useState("0");
  const scrollViewRef = React.useRef<ScrollView>(null);
 

  const handlePress = (value: string) => {
    setDisplay(prev => {
      if (prev === "0" && !"+-*/".includes(value)) {
        return value;
      }
      const displayValue = value === "*" ? "×" : value === "/" ? "÷" : value;
      
      // Check if last character is an operator
      const lastChar = prev[prev.length - 1];
      if ("+-×÷".includes(lastChar) && "+-*/".includes(value)) {
        return prev.slice(0, -1) + displayValue;
      }

      // Handle decimal points
      if (value === ".") {
        // Split by operators to get the current number
        const numbers = prev.split(/[+\-×÷]/);
        const currentNumber = numbers[numbers.length - 1];
        // If current number already has a decimal point, don't add another
        if (currentNumber.includes(".")) {
          return prev;
        }
      }
      return prev + displayValue;
    });
  };

  const handleCalculate = () => {
    try {
      const expression = display.replace(/×/g, '*').replace(/÷/g, '/');
      const evalResult = evaluate(expression);
      if (evalResult === Infinity || evalResult === -Infinity || isNaN(evalResult)) {
        setResult("Invalid Expression");
      } else setResult(evalResult.toString());
    } catch (err) {
      setResult("Invalid Expression");
    }
  };

  const clearAll = () => {
    setDisplay("0");
    setResult("0");
  };

  const deleteLastChar = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };


  const renderButton = (
    label: string,
    onPress: (value: string) => void,
    style = {}
  ) => (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={() => onPress(label)}
    >
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
            {renderButton("C", deleteLastChar, styles.grayButton)}
            {renderButton("AC", clearAll, styles.grayButton)}
            {renderButton("00", () => handlePress("00"), styles.grayButton)}

            {renderButton(
              "÷",
              () => handlePress("/"),
              styles.orangeButton
            )}

            {["7", "8", "9"].map((n) => (
              <React.Fragment key={`btn-${n}`}>
                {renderButton(n, () => handlePress(n))}
              </React.Fragment>
            ))}
            {renderButton(
              "×",
              () => handlePress("*"),
              styles.orangeButton
            )}

            {["4", "5", "6"].map((n) => (
              <React.Fragment key={`btn-${n}`}>
                {renderButton(n, () => handlePress(n))}
              </React.Fragment>
            ))}
            {renderButton(
              "-",
              () => handlePress("-"),
              styles.orangeButton
            )}

            {["1", "2", "3"].map((n) => (
              <React.Fragment key={`btn-${n}`}>
                {renderButton(n, () => handlePress(n))}
              </React.Fragment>
            ))}
            {renderButton(
              "+",
              () => handlePress("+"),
              styles.orangeButton
            )}

            {renderButton("0", () => handlePress("0"), [styles.doubleButton])}
            {renderButton(".", () => handlePress("."))}
            {renderButton("=", handleCalculate, styles.orangeButton)}
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
    maxWidth: 660,
    minWidth: 360,
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
    height: 60,
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
