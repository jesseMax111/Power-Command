import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useSignUp } from "@clerk/expo";
import { Link, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import colors from "@/constants/colors";

export default function SignUpScreen() {
  const { signUp, isLoaded } = useSignUp();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");

  const handleSignUp = async () => {
    if (!isLoaded || !name || !email || !password) return;
    setLoading(true);
    setError("");
    try {
      const { error } = await signUp.password({
        emailAddress: email,
        password,
        firstName: name.split(" ")[0],
        lastName: name.split(" ").slice(1).join(" ") || undefined,
      });
      if (error) {
        setError(error.message || "Sign up failed");
        return;
      }
      await signUp.verifications.sendEmailCode();
      setPendingVerification(true);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Sign up failed");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!isLoaded || !code) return;
    setLoading(true);
    setError("");
    try {
      await signUp.verifications.verifyEmailCode({ code });
      if (signUp.status === "complete") {
        await signUp.finalize({
          navigate: ({ session, decorateUrl }) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace("/(home)/(tabs)/dashboard");
          },
        });
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Verification failed");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const c = colors.light;

  if (pendingVerification) {
    return (
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
          <View style={styles.brandRow}>
            <View style={[styles.logoCircle, { backgroundColor: c.primary }]}>
              <Ionicons name="mail" size={28} color={c.background} />
            </View>
          </View>
          <Text style={[styles.title, { color: c.foreground }]}>Check your email</Text>
          <Text style={[styles.subtitle, { color: c.mutedForeground }]}>We sent a verification code to {email}</Text>

          <Text style={[styles.label, { color: c.mutedForeground }]}>Verification Code</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.card, borderColor: c.border, color: c.foreground }]}
            value={code}
            onChangeText={setCode}
            placeholder="Enter 6-digit code"
            placeholderTextColor={c.mutedForeground}
            keyboardType="number-pad"
            textAlign="center"
          />
          {error ? <Text style={[styles.error, { color: c.destructive }]}>{error}</Text> : null}
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, { backgroundColor: c.primary, opacity: pressed || loading ? 0.85 : 1 }]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color={c.background} /> : <Text style={[styles.primaryBtnText, { color: c.background }]}>Verify Email</Text>}
          </Pressable>
          <Pressable onPress={() => signUp.verifications.sendEmailCode()} style={styles.resendBtn}>
            <Text style={[styles.footerLink, { color: c.primary }]}>Resend code</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.brandRow}>
          <View style={[styles.logoCircle, { backgroundColor: c.primary }]}>
            <Ionicons name="flash" size={28} color={c.background} />
          </View>
        </View>
        <Text style={[styles.title, { color: c.foreground }]}>Create account</Text>
        <Text style={[styles.subtitle, { color: c.mutedForeground }]}>Join the PowerPulse community</Text>

        <Text style={[styles.label, { color: c.mutedForeground }]}>Full Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.card, borderColor: c.border, color: c.foreground }]}
          value={name}
          onChangeText={setName}
          placeholder="Jane Doe"
          placeholderTextColor={c.mutedForeground}
          autoCapitalize="words"
        />

        <Text style={[styles.label, { color: c.mutedForeground }]}>Email</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.card, borderColor: c.border, color: c.foreground }]}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={c.mutedForeground}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={[styles.label, { color: c.mutedForeground }]}>Password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, styles.passwordInput, { backgroundColor: c.card, borderColor: c.border, color: c.foreground }]}
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            placeholderTextColor={c.mutedForeground}
            secureTextEntry={!showPassword}
          />
          <Pressable style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
            <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color={c.mutedForeground} />
          </Pressable>
        </View>

        {error ? <Text style={[styles.error, { color: c.destructive }]}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, { backgroundColor: c.primary, opacity: pressed || loading ? 0.85 : 1 }]}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color={c.background} /> : <Text style={[styles.primaryBtnText, { color: c.background }]}>Create Account</Text>}
        </Pressable>

        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: c.mutedForeground }]}>Already have an account? </Text>
          <Link href="/(auth)/sign-in">
            <Text style={[styles.footerLink, { color: c.primary }]}>Sign in</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 24 },
  brandRow: { alignItems: "center", marginBottom: 24 },
  logoCircle: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 6 },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 32 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontFamily: "Inter_400Regular", marginBottom: 14 },
  passwordRow: { position: "relative", marginBottom: 14 },
  passwordInput: { marginBottom: 0, paddingRight: 46 },
  eyeBtn: { position: "absolute", right: 14, top: 13 },
  error: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 12, textAlign: "center" },
  primaryBtn: { borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 4, marginBottom: 20 },
  primaryBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  footerRow: { flexDirection: "row", justifyContent: "center", flexWrap: "wrap" },
  footerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  footerLink: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  resendBtn: { alignItems: "center", marginTop: 8 },
});
