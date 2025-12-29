import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useRef } from "react";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export type Runway = {
    id?: string;
    ident: string;
    length_ft?: string;
    width_ft?: string;
    surface?: string;
    le_ident?: string;
    he_ident?: string;
    le_heading_degT?: string;
    he_heading_degT?: string;
    le_ils?: { freq: number; course: number };
    he_ils?: { freq: number; course: number };
    wind?: { dir?: number; kt?: number };
};

interface RunwayCarouselProps {
    title?: string;
    subtitle?: string;
    runways: Runway[];
}

// Slightly smaller cards so they fit comfortably inside the glass modal
const CARD_WIDTH = SCREEN_WIDTH * 0.78;
const CARD_MARGIN = 10;

export function RunwayCarousel({
    title = "Runways",
    subtitle = "Drag to scroll",
    runways = [],
}: RunwayCarouselProps) {
    const scrollViewRef = useRef<ScrollView>(null);

    const formatM = (ft?: string) => {
        if (!ft) return "—";
        const meters = Math.round(parseFloat(ft) * 0.3048);
        return `${meters.toLocaleString()} m`;
    };

    const formatDeg = (deg?: string) => {
        if (!deg) return "—";
        return `${Math.round(parseFloat(deg))}°`;
    };

    return (
        <View style={styles.container}>
            {/* Glass Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.subtitle}>{subtitle}</Text>
                </View>
                <View style={styles.controls}>
                    <TouchableOpacity
                        style={styles.controlButton}
                        onPress={() => scrollViewRef.current?.scrollTo({ x: 0, animated: true })}
                    >
                        <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.controlButton}
                        onPress={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                    >
                        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_WIDTH + CARD_MARGIN}
                decelerationRate="fast"
                contentContainerStyle={styles.scrollContent}
            >
                {runways.map((runway, index) => (
                    <View key={runway.id || index} style={styles.cardContainer}>
                        <View
                            style={[
                                styles.card,
                                { backgroundColor: "rgba(255,255,255,0.08)" }
                            ]}
                        >
                            {/* Card Header */}
                            <View style={styles.cardHeader}>
                                <View>
                                    <Text style={styles.cardLabel}>Runway</Text>
                                    <Text style={styles.cardIdent}>{runway.ident}</Text>
                                </View>
                                <View style={styles.surfacePill}>
                                    <View style={styles.surfaceDot} />
                                    <Text style={styles.surfaceText}>{runway.surface || "Surface —"}</Text>
                                </View>
                            </View>

                            {/* Strip Visualization */}
                            <View style={styles.strip}>
                                <View style={styles.stripHeader}>
                                    <Text style={styles.stripText}>{formatDeg(runway.le_heading_degT)}</Text>
                                    <Text style={styles.stripDots}>•••••••••••••••••••••</Text>
                                    <Text style={styles.stripText}>{formatDeg(runway.he_heading_degT)}</Text>
                                </View>
                                <View style={styles.stripFooter}>
                                    <Text style={styles.stripDetail}>
                                        {formatM(runway.length_ft)} × {formatM(runway.width_ft)}
                                    </Text>
                                    {runway.wind && (
                                        <View style={styles.windInfo}>
                                            <MaterialCommunityIcons name="weather-windy" size={14} color="rgba(255,255,255,0.7)" />
                                            <Text style={styles.windText}>
                                                {runway.wind.dir ?? "—"}° / {runway.wind.kt ?? "—"} kt
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* Stats Grid */}
                            <View style={styles.grid}>
                                <GlassStat label="ILS (LE)" value={runway.le_ils ? `${runway.le_ils.freq} MHz` : "—"} />
                                <GlassStat label="ILS (HE)" value={runway.he_ils ? `${runway.he_ils.freq} MHz` : "—"} />
                                <GlassStat label="LE Ident" value={runway.le_ident || "—"} />
                                <GlassStat label="HE Ident" value={runway.he_ident || "—"} />
                            </View>
                        </View>
                    </View>
                ))}

                {runways.length === 0 && (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyText}>No runway data available.</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

function GlassStat({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.statBox}>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={styles.statValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        maxWidth: "100%",
        marginVertical: 2,
        alignSelf: "stretch",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 12,
        marginBottom: 10,
    },
    title: {
        fontSize: 16,
        fontWeight: "700",
        color: "#fff",
    },
    subtitle: {
        fontSize: 11,
        color: "rgba(255,255,255,0.6)",
    },
    controls: {
        flexDirection: "row",
        gap: 6,
    },
    controlButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.1)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    scrollContent: {
        paddingHorizontal: 12,
        paddingBottom: 4,
    },
    cardContainer: {
        width: CARD_WIDTH,
        marginRight: CARD_MARGIN,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 6,
    },
    card: {
        borderRadius: 20,
        padding: 6,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
        overflow: "hidden",
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 2,
    },
    cardLabel: {
        fontSize: 9,
        color: "rgba(255,255,255,0.5)",
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },
    cardIdent: {
        fontSize: 20,
        fontWeight: "800",
        color: "#fff",
        marginTop: 2,
    },
    surfacePill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.1)",
        paddingHorizontal: 8,
        paddingVertical: -20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        gap: 6,
    },
    surfaceDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#10b981",
    },
    surfaceText: {
        fontSize: 10,
        fontWeight: "600",
        color: "rgba(255,255,255,0.8)",
    },
    strip: {
        backgroundColor: "rgba(0,0,0,0.3)",
        borderRadius: 14,
        padding: 10,
        marginBottom: 2,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.05)",
    },
    stripHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    stripText: {
        fontSize: 10,
        fontWeight: "700",
        color: "rgba(255,255,255,0.8)",
    },
    stripDots: {
        color: "rgba(255,255,255,0.2)",
        fontSize: 9,
        letterSpacing: 1.6,
    },
    stripFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 6,
    },
    stripDetail: {
        fontSize: 10,
        color: "rgba(255,255,255,0.55)",
    },
    windInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    windText: {
        fontSize: 10,
        fontWeight: "600",
        color: "rgba(255,255,255,0.7)",
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    statBox: {
        width: (CARD_WIDTH - 32 - 8) / 2,
        backgroundColor: "rgba(255,255,255,0.06)",
        padding: 9,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    statLabel: {
        fontSize: 8.5,
        color: "rgba(255,255,255,0.45)",
        textTransform: "uppercase",
        fontWeight: "600",
    },
    statValue: {
        fontSize: 12,
        fontWeight: "600",
        color: "#fff",
        marginTop: 2,
    },
    emptyCard: {
        width: SCREEN_WIDTH - 32,
        height: 150,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        borderStyle: "dashed",
    },
    emptyText: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 14,
    },
});
