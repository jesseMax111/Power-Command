import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { Redirect, Stack } from "expo-router";
import { useAuth } from "@clerk/expo";
import { setAuthTokenGetter, useRegisterPushToken } from "@workspace/api-client-react";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function HomeLayout() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const registerPushToken = useRegisterPushToken();
  const tokenRegistered = useRef(false);

  useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, [getToken]);

  useEffect(() => {
    if (!isSignedIn || tokenRegistered.current) return;
    if (Platform.OS === "web") return;

    async function registerForPushNotifications() {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== "granted") return;

        const tokenData = await Notifications.getExpoPushTokenAsync();
        tokenRegistered.current = true;
        registerPushToken.mutate({
          data: {
            token: tokenData.data,
            platform: Platform.OS === "ios" ? "ios" : "android",
          },
        });
      } catch {
        // Non-fatal: push notifications are optional
      }
    }

    registerForPushNotifications();
  }, [isSignedIn]);

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
