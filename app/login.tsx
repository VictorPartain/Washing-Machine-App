import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../src/firebase";

const inputStyle = {
  borderWidth: 1,
  borderColor: "#374151",
  backgroundColor: "#1F2937",
  color: "#FFF",
  padding: 14,
  borderRadius: 10,
  marginBottom: 14,
  fontSize: 16,
} as const;

const ADMIN_EMAIL = "admin@sdsu.edu";
const ADMIN_PASSWORD = "adminpassword";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  const onLogin = async () => {
    const e = email.trim().toLowerCase();

    // Email validation
    if (!e.endsWith("@sdsu.edu") && e !== ADMIN_EMAIL) {
      return Alert.alert("Invalid Email", "Please use your @sdsu.edu email.");
    }

    // Admin login password gate BEFORE Firebase
    if (e === ADMIN_EMAIL && pw !== ADMIN_PASSWORD) {
      return Alert.alert("Invalid Admin Password", "Incorrect password for admin account.");
    }

    setBusy(true);

    try {
      // Firebase authentication
      await signInWithEmailAndPassword(auth, e, pw);

      // After login, expo-router redirect is handled by _layout.tsx
      router.replace("/buildings");
    } catch (err: any) {
      Alert.alert("Login Failed", err?.message ?? "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#111827",
        padding: 24,
      }}
    >
      <Image
        source={require("../assets/images/splash-icon.png")}
        style={{
          width: 140,
          height: 140,
          marginBottom: 30,
          resizeMode: "contain",
        }}
      />

      <Text
        style={{
          fontSize: 26,
          fontWeight: "700",
          color: "#FFF",
          marginBottom: 20,
        }}
      >
        Sign In
      </Text>

      <View style={{ width: "100%" }}>
        <TextInput
          placeholder="Email"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={inputStyle}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#9CA3AF"
          value={pw}
          onChangeText={setPw}
          secureTextEntry
          autoCapitalize="none"
          style={inputStyle}
        />
      </View>

      <TouchableOpacity
        onPress={onLogin}
        disabled={busy}
        style={{
          backgroundColor: busy ? "#6366F1aa" : "#4F46E5",
          paddingVertical: 12,
          borderRadius: 10,
          alignItems: "center",
          width: "100%",
          marginTop: 8,
        }}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#FFF", fontWeight: "600", fontSize: 18 }}>
            Login
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.replace("/register")}
        style={{
          paddingVertical: 12,
          alignItems: "center",
          width: "100%",
        }}
      >
        <Text style={{ color: "#9CA3AF" }}>
          Don't have an account? Register
        </Text>
      </TouchableOpacity>
    </View>
  );
}
