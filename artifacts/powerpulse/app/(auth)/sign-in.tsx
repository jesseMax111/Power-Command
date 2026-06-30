import React, { useState, useCallback, useEffect } from "react";
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
import { useSignIn, useSSO } from "@clerk/expo";
import { Link, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import colors from "@/constants/colors";

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (Platform.OS === "android") {
      WebBrowser.warmUpAsync();
      return () => { WebBrowser.coolDownAsync(); };
    }
  }, []);

  const handleSignIn = async () => {
    if (!isLoaded || !email || !password) return;
    setLoading(true);
    setError("");
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(home)/(tabs)/dashboard");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Sign in failed");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = useCallback(async () => {
    try {
      const { createdSessionId, setActive: setActiveSession } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri(),
      });
      if (createdSessionId) {
        await setActiveSession!({ session: createdSessionId });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(home)/(tabs)/dashboard");
      }
    } catch (err: any) {
      setError("Google sign in failed");
    }
  }, [startSSOFlow, router]);

  const c = colors.light;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo / Brand */}
        <View style={styles.brandRow}>
          <View style={[styles.logoCircle, { backgroundColor: c.primary }]}>
            <Ionicons name="flash" size={28} color={c.background} />
          </View>
        </View>
        <Text style={[styles.title, { color: c.foreground }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: c.mutedForeground }]}>Sign in to PowerPulse</Text>

        {/* Google SSO */}
        <Pressable
          style={({ pressed }) => [styles.googleBtn, { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.8 : 1 }]}
          onPress={handleGoogleSignIn}
        >
          <Ionicons name="logo-google" size={20} color={c.foreground} />
          <Text style={[styles.googleBtnText, { color: c.foreground }]}>Continue with Google</Text>
        </Pressable>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <Text style={[styles.dividerText, { color: c.mutedForeground }]}>or</Text>
          <View style={[styles.divider, { backgroundColor: c.border }]} />
        </View>

        {/* Email */}
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

        {/* Password */}
        <Text style={[styles.label, { color: c.mutedForeground }]}>Password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, styles.passwordInput, { backgroundColor: c.card, borderColor: c.border, color: c.foreground }]}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
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
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={c.background} />
          ) : (
            <Text style={[styles.primaryBtnText, { color: c.background }]}>Sign In</Text>
          )}
        </Pressable>

        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: c.mutedForeground }]}>Don't have an account? </Text>
          <Link href="/(auth)/sign-up">
            <Text style={[styles.footerLink, { color: c.primary }]}>Sign up</Text>
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
  googleBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderWidth: 1, borderRadius: 12, paddingVertical: 14, marginBottom: 20 },
  googleBtnText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  dividerRow: { flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 12 },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 13, fontFamily: "Inter_400Regular" },
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
});
