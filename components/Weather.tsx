import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { format, isWithinInterval } from "date-fns";
import React from "react";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export type WeatherAtLocation = {
    latitude: number;
    longitude: number;
    generationtime_ms: number;
    utc_offset_seconds: number;
    timezone: string;
    timezone_abbreviation: string;
    elevation: number;
    cityName?: string;
    current_units: {
        time: string;
        interval: string;
        temperature_2m: string;
        wind_speed_10m: string;
        wind_direction_10m: string;
    };
    current: {
        time: string;
        interval: number;
        temperature_2m: number;
        wind_speed_10m: number;
        wind_direction_10m: number;
    };
    hourly_units: {
        time: string;
        temperature_2m: string;
        wind_speed_10m: string;
        wind_direction_10m: string;
    };
    hourly: {
        time: string[];
        temperature_2m: number[];
        wind_speed_10m: number[];
        wind_direction_10m: number[];
    };
    daily_units: {
        time: string;
        sunrise: string;
        sunset: string;
    };
    daily: {
        time: string[];
        sunrise: string[];
        sunset: string[];
    };
};

const SAMPLE: WeatherAtLocation = {
    latitude: 37.763_283,
    longitude: -122.412_86,
    generationtime_ms: 0.027_894_973_754_882_812,
    utc_offset_seconds: 0,
    timezone: "GMT",
    timezone_abbreviation: "GMT",
    elevation: 18,
    current_units: {
        time: "iso8601",
        interval: "seconds",
        temperature_2m: "°C",
        wind_speed_10m: "km/h",
        wind_direction_10m: "°",
    },
    current: {
        time: "2024-10-07T19:30",
        interval: 900,
        temperature_2m: 29.3,
        wind_speed_10m: 12.5,
        wind_direction_10m: 210,
    },
    hourly_units: {
        time: "iso8601",
        temperature_2m: "°C",
        wind_speed_10m: "km/h",
        wind_direction_10m: "°",
    },
    hourly: {
        time: ["2024-10-07T19:30"],
        temperature_2m: [29.3],
        wind_speed_10m: [12.5],
        wind_direction_10m: [210],
    },
    daily_units: {
        time: "iso8601",
        sunrise: "iso8601",
        sunset: "iso8601",
    },
    daily: {
        time: ["2024-10-07"],
        sunrise: ["2024-10-07T07:15"],
        sunset: ["2024-10-07T19:00"],
    },
};

function n(num: number): number {
    return Math.ceil(num);
}

export function Weather({
    weatherAtLocation = SAMPLE,
    forceDarkMode = false,
}: {
    weatherAtLocation?: WeatherAtLocation;
    forceDarkMode?: boolean;
}) {
    const currentHigh = Math.max(
        ...weatherAtLocation.hourly.temperature_2m.slice(0, 24)
    );
    const currentLow = Math.min(
        ...weatherAtLocation.hourly.temperature_2m.slice(0, 24)
    );

    const isDay = isWithinInterval(new Date(weatherAtLocation.current.time), {
        start: new Date(weatherAtLocation.daily.sunrise[0]),
        end: new Date(weatherAtLocation.daily.sunset[0]),
    });

    const hoursToShow = 6;
    const currentTimeIndex = weatherAtLocation.hourly.time.findIndex(
        (time) => new Date(time) >= new Date(weatherAtLocation.current.time)
    );

    const displayTimes = weatherAtLocation.hourly.time.slice(
        currentTimeIndex,
        currentTimeIndex + hoursToShow
    );
    const displayTemperatures = weatherAtLocation.hourly.temperature_2m.slice(
        currentTimeIndex,
        currentTimeIndex + hoursToShow
    );

    const location =
        weatherAtLocation.cityName ||
        `${weatherAtLocation.latitude?.toFixed(1)}°, ${weatherAtLocation.longitude?.toFixed(1)}°`;

    const bgColors: [string, string, ...string[]] = (forceDarkMode || !isDay)
        ? ["#0091ffff", "#00599eff", "#0f172a"]
        : ["#38bdf8", "#3b82f6", "#2563eb"];

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: bgColors[1] }
            ]}
        >
            <View style={styles.overlay} />

            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.locationText}>{location}</Text>
                    <Text style={styles.timeText}>
                        {format(new Date(weatherAtLocation.current.time), "MMM d, h:mm a")}
                    </Text>
                </View>

                <View style={styles.mainInfo}>
                    <View style={styles.currentWeather}>
                        <Ionicons
                            name={isDay && !forceDarkMode ? "sunny" : "moon"}
                            size={48}
                            color={(isDay && !forceDarkMode) ? "#fef08a" : "#bfdbfe"}
                        />
                        <View>
                            <Text style={styles.tempText}>
                                {n(weatherAtLocation.current.temperature_2m)}
                                <Text style={styles.unitText}>
                                    {weatherAtLocation.current_units.temperature_2m}
                                </Text>
                            </Text>
                        </View>
                    </View>

                    <View style={styles.weatherDetails}>
                        <View style={styles.windContainer}>
                            <MaterialCommunityIcons
                                name="weather-windy"
                                size={20}
                                color="rgba(255,255,255,0.8)"
                            />
                            <Text style={styles.detailText}>
                                {n(weatherAtLocation.current.wind_speed_10m)} {weatherAtLocation.current_units.wind_speed_10m}
                            </Text>
                        </View>
                        <View style={styles.highLow}>
                            <Text style={styles.highLowText}>H: {n(currentHigh)}°</Text>
                            <Text style={[styles.highLowText, styles.lowText]}>L: {n(currentLow)}°</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.forecastContainer}>
                    <Text style={styles.sectionTitle}>Hourly Forecast</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.forecastScroll}>
                            {displayTimes.map((time, index) => {
                                const hourTime = new Date(time);
                                const isCurrentHour =
                                    hourTime.getHours() === new Date().getHours();

                                return (
                                    <View
                                        key={time}
                                        style={[
                                            styles.forecastItem,
                                            isCurrentHour && styles.forecastItemActive,
                                        ]}
                                    >
                                        <Text style={styles.forecastHour}>
                                            {index === 0 ? "Now" : format(hourTime, "ha")}
                                        </Text>
                                        <Ionicons
                                            name="cloud"
                                            size={16}
                                            color={(isDay && !forceDarkMode) ? "#fef08a" : "#bfdbfe"}
                                        />
                                        <Text style={styles.forecastTemp}>
                                            {n(displayTemperatures[index])}°
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </ScrollView>
                </View>

                <View style={styles.footer}>
                    <View style={styles.footerItem}>
                        <Ionicons name="sunny-outline" size={14} color="rgba(255,255,255,0.6)" />
                        <Text style={styles.footerText}>
                            {format(new Date(weatherAtLocation.daily.sunrise[0]), "h:mm a")}
                        </Text>
                    </View>
                    <View style={styles.footerItem}>
                        <Ionicons name="moon-outline" size={14} color="rgba(255,255,255,0.6)" />
                        <Text style={styles.footerText}>
                            {format(new Date(weatherAtLocation.daily.sunset[0]), "h:mm a")}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        borderRadius: 20,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    content: {
        padding: 16,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    locationText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#fff",
    },
    timeText: {
        fontSize: 12,
        color: "rgba(255, 255, 255, 0.6)",
    },
    mainInfo: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginBottom: 20,
    },
    currentWeather: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    tempText: {
        fontSize: 52,
        fontWeight: "200",
        color: "#fff",
        lineHeight: 60,
    },
    unitText: {
        fontSize: 20,
        color: "rgba(255, 255, 255, 0.8)",
        fontWeight: "300",
    },
    weatherDetails: {
        alignItems: "flex-end",
        gap: 4,
    },
    windContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "rgba(255,255,255,0.15)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 4,
    },
    detailText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#fff",
    },
    highLow: {
        alignItems: "flex-end",
    },
    highLowText: {
        fontSize: 13,
        fontWeight: "500",
        color: "rgba(255, 255, 255, 0.9)",
    },
    lowText: {
        color: "rgba(255, 255, 255, 0.7)",
    },
    forecastContainer: {
        backgroundColor: "rgba(255, 255, 255, 0.12)",
        borderRadius: 18,
        padding: 14,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "rgba(255, 255, 255, 0.9)",
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    forecastScroll: {
        flexDirection: "row",
        gap: 12,
    },
    forecastItem: {
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 12,
        minWidth: 55,
        gap: 6,
    },
    forecastItemActive: {
        backgroundColor: "rgba(255, 255, 255, 0.25)",
    },
    forecastHour: {
        fontSize: 12,
        fontWeight: "600",
        color: "rgba(255, 255, 255, 0.8)",
    },
    forecastTemp: {
        fontSize: 14,
        fontWeight: "700",
        color: "#fff",
    },
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 8,
        paddingHorizontal: 4,
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    footerText: {
        fontSize: 12,
        fontWeight: '500',
        color: "rgba(255, 255, 255, 0.6)",
    },
});
