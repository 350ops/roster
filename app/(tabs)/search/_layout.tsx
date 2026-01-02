import { FlightProvider } from "@/contexts/FlightContext";
import { Stack } from "expo-router";

export default function SearchLayout() {
    return (
        <FlightProvider>
            <Stack
                screenOptions={{
                    contentStyle: { backgroundColor: "transparent" },
                    headerTransparent: true,
                    headerShown: false,
                }}
            >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="tickets" options={{ headerShown: false }} />
                <Stack.Screen name="flight/[id]" options={{ headerShown: false }} />
            </Stack>
        </FlightProvider>
    );
}
