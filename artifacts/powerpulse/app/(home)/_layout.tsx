import { useEffect } from "react";
import { Redirect, Stack } from "expo-router";
import { useAuth } from "@clerk/expo";
import { setAuthTokenGetter } from "@workspace/api-client-react";

export default function HomeLayout() {
  const { isSignedIn, isLoaded, getToken } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, [getToken]);

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="report/outage" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="report/restoration" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="report/transformer" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="saved-locations" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="report-detail" options={{ presentation: "modal", headerShown: false }} />
    </Stack>
  );
}
