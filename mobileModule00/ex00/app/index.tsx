import { Button, Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Ex 00</Text>
      <Button title="Click me!" onPress={() => console.log("Button pressed")} />
    </View>
  );
}
