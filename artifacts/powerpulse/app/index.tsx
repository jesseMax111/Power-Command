import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import colors from "@/constants/colors";

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.light.background }}>
        <ActivityIndicator color={colors.light.primary} size="large" />
      </View>
    );
  }

  if (isSignedIn) {
    return <Redirect href="/(home)/(tabs)/dashboard" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}
