// app/buildings/index.tsx

import { ImageBackground } from "react-native";
import { Href, router } from "expo-router";
import {
  FlatList,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

// TEMPORARY hardcoded building list (replace with Firestore later)
const buildings = [
  {
    id: "ChapultepecHall",
    name: "Chapultepec Hall",
    image: require("../../assets/buildings/ChapultepecHall.jpg"),
  },
  {
    id: "HuaxyacacHall",
    name: "Huaxyacac Hall",
    image: require("../../assets/buildings/HuaxyacacHall.jpg"),
  },
  {
    id: "ZuraHall",
    name: "Zura Hall",
    image: require("../../assets/buildings/ZuraHall.jpg"),
  },
];

const BuildingCard = ({
  name,
  image,
  onPress,
}: {
  name: string;
  image: any;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <ImageBackground
        source={image}
        style={styles.cardImage}
        imageStyle={styles.cardImageStyle}
      >
        <View style={styles.overlay}>
          <Text style={styles.cardText}>{name}</Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

export default function Buildings() {
  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: "#0D1321" }}>
      <Text style={{ fontSize: 18, marginBottom: 12, color: "#e6e6e6" }}>
        Select a building
      </Text>

      <FlatList
        data={buildings}
        keyExtractor={(b) => b.id}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <BuildingCard
            name={item.name}
            image={item.image}
            onPress={() => router.push(`/machines/${item.id}` as Href)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 4,
    marginVertical: 8,
  },
  cardImage: {
    width: "100%",
    height: 150,
    justifyContent: "center",
  },
  cardImageStyle: {
    resizeMode: "cover",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  cardText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
