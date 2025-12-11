// app/register.tsx

import { router } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
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

function getPasswordStrength(pw: string): { label: string; color: string } {
  if (!pw) return { label: "", color: "#9CA3AF" };

  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 2) return { label: "Weak password", color: "#EF4444" };
  if (score <= 4) return { label: "Medium strength password", color: "#F59E0B" };
  return { label: "Strong password", color: "#10B981" };
}

export default function Register() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  const strength = getPasswordStrength(pw);

  const onRegister = async () => {
    const e = email.trim().toLowerCase();

    if (!e.endsWith("@sdsu.edu"))
      return Alert.alert("Invalid Email", "Please use your @sdsu.edu address.");

    if (pw.length < 6)
      return Alert.alert("Weak password", "Password must be at least 6 characters.");

    if (pw !== pw2)
      return Alert.alert("Password mismatch", "Your passwords do not match.");

    setBusy(true);

    try {
      await createUserWithEmailAndPassword(auth, e, pw);
      Alert.alert("Success", "Account created successfully!");
      router.replace("/buildings");
    } catch (err: any) {
      Alert.alert("Registration failed", err?.message ?? "Please try again.");
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
        Create Account
      </Text>

      <View style={{ width: "100%" }}>
        <TextInput
          placeholder="Enter your SDSU student email"
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

        {strength.label !== "" && (
          <Text style={{ color: strength.color, marginBottom: 8 }}>
            {strength.label}
          </Text>
        )}

        <TextInput
          placeholder="Confirm password"
          placeholderTextColor="#9CA3AF"
          value={pw2}
          onChangeText={setPw2}
          secureTextEntry
          autoCapitalize="none"
          style={inputStyle}
        />

        <Image
          source={require("../assets/images/Finallogo.png")}
          style={{
            width: 140,
            height: 140,
            marginBottom: 20,
            resizeMode: "contain",
            alignSelf: "center",
          }}
        />
      </View>

      <TouchableOpacity
        onPress={onRegister}
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
            Create Account
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.replace("/login")}
        style={{
          paddingVertical: 12,
          alignItems: "center",
          width: "100%",
        }}
      >
        <Text style={{ color: "#9CA3AF" }}>
          Already have an account? Sign in
        </Text>
      </TouchableOpacity>
    </View>
  );
}
