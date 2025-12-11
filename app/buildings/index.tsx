// app/buildings/index.tsx

// In expo-router, files defined as "index" serve as the default screen for their directory.

// Import necessary components and functions
import { ImageBackground } from "react-native";
import { Href, router } from "expo-router";
import {
  FlatList,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
} from "react-native";


/*
    CODE BELOW WILL BE REPLACED WITH FIREBASE AUTHENTICATION
*/


// Define a list of buildings for the user to chose from
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
/*
    CODE ABOVE WILL BE REPLACED WITH FIREBASE AUTHENTICATION
*/  

// Define the Buildings component
export default function Buildings() {

    // Render the list of buildings as buttons
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
        <View 
            style={{ flex: 1, padding: 16, }}
        >
            <Text
                style={{ fontSize: 18, marginBottom: 12, }}
            >
                Select a building
            </Text>
            <FlatList
                // List all of the buildings
                data={buildings}
                keyExtractor={(b) => b.id}
                ItemSeparatorComponent={() => <View style={{ height: 8, }} />}
                renderItem={({ item }) => (
                    <Button
                        title={item.name}
                        // Redirect the user to the machines screen for the selected building
                        onPress={() =>
                            router.push(`/machines/${item.id}` as Href)
                        }
                    />
                )}
            />
          )}
        />
      </View>
    );
}


const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: "hidden",     // so image and overlay follow the rounded corners
    elevation: 4,           // shadow on Android
    marginVertical: 8,
  },
  cardImage: {
    width: "100%",
    height: 150,            // height of the card
    justifyContent: "center",
  },
  cardImageStyle: {
    resizeMode: "cover",    // image covers the whole area
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)", // dark overlay
    justifyContent: "center",
    alignItems: "center",
  },
  cardText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
