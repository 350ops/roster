import MeshBackground from '@/components/seatmaps/MeshBackground';
import SeatMap from "@/components/seatmaps/SeatMap";
import { getSeatmap } from "@/utils/amadeus";
import { getSeatCharacteristicDescription } from "@/utils/seatCharacteristics";
import { AntDesign } from "@expo/vector-icons";
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const TicketDetail = () => {
    const router = useRouter();
    const { id, flightOffer, aircraftName } = useLocalSearchParams<{
        id: string;
        flightOffer: string;
        aircraftName: string;
    }>();

    const [seatmapData, setSeatmapData] = useState<any>(null);
    const [dictionaries, setDictionaries] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
    const [travelClass, setTravelClass] = useState<string>("");

    const [toastData, setToastData] = useState<any>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = (data: any) => {
        if (toastTimeout.current) {
            clearTimeout(toastTimeout.current);
        }

        setToastData(data);

        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();

        toastTimeout.current = setTimeout(() => {
            hideToast();
        }, 4000);
    };

    const hideToast = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setToastData(null);
        });
    };

    const parsedOffer = flightOffer ? JSON.parse(flightOffer) : null;

    useEffect(() => {
        const fetchSeatmap = async () => {
            if (!flightOffer) {
                setError("No flight offer data available");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const parsedOffer = JSON.parse(flightOffer);

                // If travelClass is set and different from the original booking, re-search
                const originalCabin = parsedOffer?.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin;

                if (travelClass && travelClass !== originalCabin) {
                    console.log(`Re-searching flight with cabin class: ${travelClass}`);

                    // Extract flight details for re-search
                    const segment = parsedOffer.itineraries[0].segments[0];
                    const origin = segment.departure.iataCode;
                    const destination = segment.arrival.iataCode;
                    const departureDate = segment.departure.at.split('T')[0];
                    const carrierCode = segment.carrierCode;
                    const flightNumber = segment.number;
                    const operatingCarrier = segment.operating?.carrierCode || carrierCode;

                    console.log(`Searching for ${carrierCode}${flightNumber}: ${origin} -> ${destination} on ${departureDate} in ${travelClass}`);
                    console.log(`Operating carrier: ${operatingCarrier}`);

                    // Re-search flights with the new cabin class
                    const { searchFlightOffers } = await import('@/utils/amadeus');
                    const searchResponse = await searchFlightOffers(
                        origin,
                        destination,
                        departureDate,
                        1,
                        true,  // Always search for non-stop flights
                        travelClass
                    );

                    if (searchResponse && searchResponse.data && searchResponse.data.length > 0) {
                        console.log(`Found ${searchResponse.data.length} flights in ${travelClass} class`);

                        // Log all available flights for debugging
                        searchResponse.data.forEach((offer: any, index: number) => {
                            const seg = offer.itineraries[0].segments[0];
                            const opCarrier = seg.operating?.carrierCode || seg.carrierCode;
                            console.log(`  Flight ${index + 1}: ${seg.carrierCode}${seg.number} (Operating: ${opCarrier}${seg.number})`);
                        });

                        let matchingFlight = null;

                        // Strategy 1: Match by carrier and flight number (exact match)
                        matchingFlight = searchResponse.data.find((offer: any) => {
                            const seg = offer.itineraries[0].segments[0];
                            const matches = seg.carrierCode === carrierCode && seg.number === flightNumber;
                            if (matches) console.log(`✓ Strategy 1: Found exact match ${seg.carrierCode}${seg.number}`);
                            return matches;
                        });

                        // Strategy 2: Match by operating carrier and flight number
                        if (!matchingFlight) {
                            matchingFlight = searchResponse.data.find((offer: any) => {
                                const seg = offer.itineraries[0].segments[0];
                                const opCarrier = seg.operating?.carrierCode || seg.carrierCode;
                                const matches = opCarrier === operatingCarrier && seg.number === flightNumber;
                                if (matches) console.log(`✓ Strategy 2: Found operating carrier match ${opCarrier}${seg.number}`);
                                return matches;
                            });
                        }

                        if (matchingFlight) {
                            const seg = matchingFlight.itineraries[0].segments[0];
                            console.log(`✓ Using flight: ${seg.carrierCode}${seg.number} in ${travelClass} class`);
                            const response = await getSeatmap(matchingFlight);

                            if (response && response.data && response.data.length > 0) {
                                setSeatmapData(response.data[0]);
                                setDictionaries(response.dictionaries);
                                setError(null);
                            } else {
                                setError(`No seatmap available for ${travelClass} class`);
                            }
                        } else {
                            console.log(`✗ Flight ${carrierCode}${flightNumber} not found in ${travelClass} class`);
                            setError(`Flight ${carrierCode}${flightNumber} is not available in ${travelClass} class`);
                        }
                    } else {
                        setError(`No flights found for ${travelClass} class`);
                    }
                } else {
                    // Original cabin or no travelClass set - use original offer
                    const response = await getSeatmap(parsedOffer);

                    if (response && response.data && response.data.length > 0) {
                        setSeatmapData(response.data[0]);
                        setDictionaries(response.dictionaries);
                    } else {
                        setError("No seatmap available for this flight");
                    }
                }
            } catch (err) {
                console.error("Error fetching seatmap:", err);
                setError("Failed to load seatmap");
            } finally {
                setLoading(false);
            }
        };

        fetchSeatmap();
    }, [flightOffer, travelClass]);

    // Initialize travelClass from flight offer
    useEffect(() => {
        if (parsedOffer && !travelClass) {
            const initialCabin = parsedOffer?.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || "ECONOMY";
            setTravelClass(initialCabin);
        }
    }, [parsedOffer]);

    const cabin = parsedOffer?.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || "";
    const price = parsedOffer?.price?.total || "0";
    const currency = parsedOffer?.price?.currency || "USD";

    const handleSeatSelect = (seatNumber: string) => {
        setSelectedSeat(prev => prev === seatNumber ? null : seatNumber);
    };

    return (
        <MeshBackground>
            <StatusBar style="light" />
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable
                        onPress={() => router.back()}
                        style={{
                            backgroundColor: "transparent",
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            justifyContent: "center",
                            alignItems: "center",
                            marginLeft: -2,
                            marginTop: -2
                        }}
                    >
                        <AntDesign name="arrow-left" size={22} color="#fff" />
                    </Pressable>
                    <View>
                        <Text style={styles.title}>Seat Map</Text>
                        {travelClass ? <Text style={styles.subtitle}>{travelClass.replace(/_/g, " ")} CLASS</Text> : null}
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                {loading && (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#007AFF" />
                        <Text style={styles.loadingText}>Loading seat map...</Text>
                    </View>
                )}

                {error && (
                    <View style={styles.centerContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {!loading && !error && seatmapData && (
                    <>
                        {/* Class Selector */}
                        <View style={{ marginBottom: 10, marginTop: 5, paddingHorizontal: 16 }}>
                            <BlurView intensity={20} tint="light" style={styles.classSelectorContainer}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.classSelectorContent}>
                                    {['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'].map((item) => {
                                        const isSelected = travelClass === item;
                                        return (
                                            <TouchableOpacity
                                                key={item}
                                                onPress={() => setTravelClass(item)}
                                                style={[
                                                    styles.classItem,
                                                    isSelected && styles.classItemSelected
                                                ]}
                                            >
                                                <Text style={[
                                                    styles.classItemText,
                                                    isSelected && styles.classItemTextSelected
                                                ]}>
                                                    {item.replace('_', ' ')}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </BlurView>
                        </View>

                        {/* Legend */}
                        <BlurView
                            intensity={60}
                            tint="light"
                            style={styles.legend}
                        >
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: "#FFFFFF" }]} />
                                <Text style={styles.legendText}>Available</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: "#007AFF" }]} />
                                <Text style={styles.legendText}>Selected</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: "#505050" }]} />
                                <Text style={styles.legendText}>Occupied</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: "#62156b96" }]} />
                                <Text style={styles.legendText}>Blocked</Text>
                            </View>
                        </BlurView>

                        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                            <SeatMap
                                seatmapData={seatmapData}
                                dictionaries={dictionaries}
                                aircraftCode={JSON.parse(flightOffer).itineraries[0].segments[0].aircraft.code}
                                aircraftName={aircraftName}
                                selectedSeat={selectedSeat}
                                onSeatSelect={handleSeatSelect}
                                onSeatInfo={showToast}
                            />
                        </ScrollView>
                    </>
                )}
            </SafeAreaView>

            {/* Toast Notification */}
            {toastData && (
                <Animated.View
                    style={[
                        styles.toastContainer,
                        { opacity: fadeAnim }
                    ]}
                    pointerEvents="none"
                >
                    <BlurView intensity={90} tint="dark" style={styles.toastContent}>
                        <View style={styles.toastHeader}>
                            <View style={styles.toastTitleRow}>
                                <Text style={styles.toastSeatNumber}>Seat {toastData.number}</Text>
                                <View style={[
                                    styles.statusDot,
                                    { backgroundColor: toastData.status === 'AVAILABLE' ? '#ffffffff' : (toastData.status === 'OCCUPIED' ? '#505050' : '#707070') }
                                ]} />
                                <Text style={styles.toastStatus}>
                                    {toastData.status === 'AVAILABLE' ? 'Available' : (toastData.status === 'OCCUPIED' ? 'Occupied' : 'Blocked')}
                                </Text>
                            </View>
                        </View>

                        {toastData.characteristics && toastData.characteristics.length > 0 && (
                            <View style={styles.toastCharacteristics}>
                                {toastData.characteristics.map((char: string, index: number) => {
                                    const description = getSeatCharacteristicDescription(char);
                                    if (!description) return null;
                                    return (
                                        <Text key={index} style={styles.toastCharText}>• {description}</Text>
                                    );
                                })}
                            </View>
                        )}
                    </BlurView>
                </Animated.View>
            )}

            {/* Bottom Bar */}
            <BlurView
                intensity={100}
                tint="dark"
                style={styles.bottomBar}
            >
                <View style={styles.seatInfoContainer}>
                    <Text style={styles.selectedLabel}>Selected Seat</Text>
                    <Text style={styles.seatNumber}>{selectedSeat || "--"}</Text>
                </View>
                {/* Price removed as requested */}
            </BlurView>
        </MeshBackground>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButtonContainer: {
        borderRadius: 20,
        overflow: 'hidden',
        marginLeft: -2,
        marginTop: -2,
    },
    backButton: {
        backgroundColor: "transparent",
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontSize: 18,
        fontWeight: "black",
        textAlign: "center",
        color: "#fff",
    },
    subtitle: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: "center",
        marginTop: 2,
        fontWeight: "500",
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.7)',
    },
    errorText: {
        fontSize: 16,
        color: "#ff4444",
        textAlign: "center",
        paddingHorizontal: 20,
    },
    legend: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginHorizontal: 12,
        marginTop: 10,
        marginBottom: 10,
        backgroundColor: 'rgba(128, 128, 128, 0.3)',
        borderRadius: 24,
        borderWidth: 1.4,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        overflow: 'hidden',
        flexWrap: 'wrap',
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 4,
    },
    legendText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '500',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 20,
    },
    bottomBar: {
        backgroundColor: 'rgba(128, 128, 128, 0.3)',
        paddingHorizontal: 24,
        paddingVertical: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderTopWidth: 1.4,
        borderTopColor: 'rgba(255, 255, 255, 0.3)',
        overflow: 'hidden',
    },
    seatInfoContainer: {
        flex: 1,
    },
    selectedLabel: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 12,
        marginBottom: 4,
    },
    seatNumber: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "black",
    },
    priceContainer: {
        alignItems: "flex-end",
    },
    priceText: {
        fontSize: 20,
        fontWeight: "700",
        color: "#fff",
    },
    toastContainer: {
        position: "absolute",
        bottom: 120, // Position above the bottom bar
        left: 20,
        right: 20,
        alignItems: "center",
        zIndex: 100,
    },
    toastContent: {
        backgroundColor: 'rgba(30, 30, 30, 0.8)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        overflow: 'hidden',
        width: '100%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    toastHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    toastTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    toastSeatNumber: {
        fontSize: 18,
        fontWeight: 'black',
        color: '#FFFFFF',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    toastStatus: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    toastCharacteristics: {
        marginTop: 8,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    toastCharText: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.8)',
        marginLeft: 6,
    },
    classSelectorContainer: {
        backgroundColor: 'rgba(201, 201, 201, 0.12)',
        borderRadius: 100,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.17)',
        overflow: 'hidden',
        padding: 6,
        marginHorizontal: 0,
    },
    classSelectorContent: {
        flexDirection: 'row',
        gap: 8,
        paddingRight: 20,
    },
    classItem: {
        height: 44,
        paddingHorizontal: 20,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    classItemSelected: {
        backgroundColor: 'rgba(234, 234, 234, 0.15)',
    },
    classItemText: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.6)',
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    classItemTextSelected: {
        color: '#FFFFFF',
    },
});

export default TicketDetail;
