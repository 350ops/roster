import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from "react-native";
import React from "react";
import Svg, { Path, Rect } from "react-native-svg";
import GlassView from './GlassView';
import { Ionicons } from "@expo/vector-icons";

// Import the fuselage images
const fuselageImage = require("../assets/images/fuselage.png");
const upperDeckImage = require("../assets/images/upperdeck.png");

interface SeatMapProps {
    seatmapData: any;
    dictionaries?: any;
    aircraftCode?: string;
    aircraftName?: string;
    selectedSeat: string | null;
    onSeatSelect: (seatNumber: string) => void;
    onSeatInfo: (info: any) => void;
}

const { width } = Dimensions.get("window");

const SeatMap: React.FC<SeatMapProps> = ({ seatmapData, dictionaries, aircraftCode, aircraftName, selectedSeat, onSeatSelect, onSeatInfo }) => {
    if (!seatmapData || !seatmapData.decks) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>No seat map data available</Text>
            </View>
        );
    }

    const getSeatStyle = (seat: any) => {
        const status = seat.travelerPricing?.[0]?.seatAvailabilityStatus;
        const isSelected = selectedSeat === seat.number;

        if (isSelected) {
            return {
                backgroundColor: "#007AFF", // Bright Blue for selection
                borderColor: "#007AFF",
                textColor: "#FFFFFF"
            };
        }

        switch (status) {
            case "AVAILABLE":
                return {
                    backgroundColor: "#ffffff7f", // White
                    borderColor: "#E0E0E0",
                    textColor: "#333333"
                };
            case "OCCUPIED":
                return {
                    backgroundColor: "#0126ad6c", // Dark Gray
                    borderColor: "#777777ff",
                    textColor: "#AAAAAA"
                };
            case "BLOCKED":
                return {
                    backgroundColor: "#2b282a89", // Medium Gray
                    borderColor: "#959595ff",
                    textColor: "#ffffffc2"
                };
            default:
                return {
                    backgroundColor: "#707070",
                    borderColor: "#606060",
                    textColor: "#AAAAAA"
                };
        }
    };

    const handleSeatPress = (seat: any) => {
        const status = seat.travelerPricing?.[0]?.seatAvailabilityStatus;
        if (status === "AVAILABLE") {
            onSeatSelect(seat.number);
        }

        // Show seat info toast
        const characteristics = seat.characteristicsCodes || [];
        onSeatInfo({
            number: seat.number,
            status: status || "UNKNOWN",
            characteristics: characteristics
        });
    };

    const renderDeck = (deck: any, deckIndex: number) => {
        const seats = deck.seats || [];

        // If the deck has no seats, do not render it
        if (seats.length === 0) {
            return null;
        }

        // Group seats by row (using X coordinate as row number)
        const seatsByRow: { [key: string]: any[] } = {};
        seats.forEach((seat: any) => {
            const row = seat.coordinates.x;
            if (!seatsByRow[row]) {
                seatsByRow[row] = [];
            }
            seatsByRow[row].push(seat);
        });

        const sortedRows = Object.keys(seatsByRow).sort((a, b) => parseInt(a) - parseInt(b));

        // Calculate global min and max columns across ALL rows for proper alignment
        let globalMinCol = Infinity;
        let globalMaxCol = -Infinity;

        sortedRows.forEach(row => {
            const rowSeats = seatsByRow[row];
            if (rowSeats.length > 0) {
                const minCol = Math.min(...rowSeats.map((s: any) => s.coordinates.y));
                const maxCol = Math.max(...rowSeats.map((s: any) => s.coordinates.y));
                if (minCol < globalMinCol) globalMinCol = minCol;
                if (maxCol > globalMaxCol) globalMaxCol = maxCol;
            }
        });

        const maxCols = globalMaxCol - globalMinCol + 1;

        // Calculate dynamic seat size
        const fuselageMargin = 16;
        const gridPadding = 10;
        const containerPadding = (fuselageMargin * 2) + (gridPadding * 2);
        const gapSize = maxCols > 8 ? 4 : (maxCols > 6 ? 6 : 10);
        const availableWidth = width - containerPadding;

        // Calculate optimal seat size
        const calculatedSeatSize = (availableWidth - ((maxCols - 1) * gapSize)) / maxCols;

        // Constrain seat size
        const seatSize = Math.min(Math.max(calculatedSeatSize, 20), 50);
        const fontSize = Math.max(8, seatSize / 2.8);

        // Get deck label based on deck index for multi-deck aircraft
        const getDeckLabel = () => {
            // Only show labels if there are multiple decks
            if (seatmapData.decks.length === 1) return null;

            // For A380 and other multi-deck aircraft:
            // Deck 0 (first deck) = Upper Deck
            // Deck 1 (second deck) = Main Deck
            if (deckIndex === 0) return "LOWER DECK";
            if (deckIndex === 1) return "UPPER DECK";

            // Fallback for aircraft with more than 2 decks
            return `Deck ${deckIndex + 1}`;
        };

        const deckLabel = getDeckLabel();

        // Determine background image based on deck index
        // Deck 1 is typically the upper deck on A380
        const bgImage = deckIndex === 1 ? upperDeckImage : fuselageImage;

        return (
            <View key={deckIndex} style={styles.deckContainer}>
                {deckLabel && (
                    <View style={styles.deckLabelContainer}>
                        <GlassView style={styles.deckLabel} intensity={40} borderRadius={24}>
                            <Text style={styles.deckLabelText}>{deckLabel}</Text>
                        </GlassView>
                    </View>
                )}

                <View style={styles.cabinContainer}>
                    {/* Fuselage background */}
                    <Image
                        source={bgImage}
                        style={styles.cabinGraphic}
                        resizeMode="stretch"
                    />

                    <View style={styles.contentContainer}>
                        {deckIndex === 0 && (
                            <View style={styles.header}>
                                <Ionicons name="airplane" size={24} color="rgba(255,255,255,0.6)" />
                                <Text style={styles.aircraftText}>
                                    {aircraftName || (aircraftCode && dictionaries?.aircraft?.[aircraftCode]) || aircraftCode}
                                </Text>
                            </View>
                        )}

                        {/* Seat Grid */}
                        <View style={styles.seatGrid}>
                            {sortedRows.map((row) => {
                                const rowSeats = seatsByRow[row].sort((a: any, b: any) =>
                                    a.coordinates.y - b.coordinates.y
                                );

                                // Find the minimum column in this row
                                const rowMinCol = Math.min(...rowSeats.map((s: any) => s.coordinates.y));

                                // Calculate leading space needed to align with global minimum
                                const leadingGap = rowMinCol - globalMinCol;

                                // Calculate trailing space to make all rows the same width
                                const rowMaxCol = Math.max(...rowSeats.map((s: any) => s.coordinates.y));
                                const trailingGap = globalMaxCol - rowMaxCol;

                                const leadingWidth = leadingGap > 0 ? (leadingGap * seatSize) + ((leadingGap - 1) * gapSize) : 0;
                                const trailingWidth = trailingGap > 0 ? (trailingGap * seatSize) + ((trailingGap - 1) * gapSize) : 0;

                                return (
                                    <View key={row} style={[styles.row, { gap: gapSize }]}>
                                        {/* Add leading space to align rows */}
                                        {leadingWidth > 0 && <View style={{ width: leadingWidth, height: seatSize }} />}

                                        {rowSeats.map((seat: any, index: number) => {
                                            // Check for aisle
                                            const prevSeat = rowSeats[index - 1];
                                            const hasAisle = prevSeat && (seat.coordinates.y - prevSeat.coordinates.y > 1);

                                            // Calculate aisle width
                                            const count = hasAisle ? (seat.coordinates.y - prevSeat.coordinates.y - 1) : 0;
                                            const aisleWidth = count > 0 ? (count * seatSize) + ((count - 1) * gapSize) : 0;

                                            const style = getSeatStyle(seat);
                                            const isAvailable = seat.travelerPricing?.[0]?.seatAvailabilityStatus === "AVAILABLE";

                                            return (
                                                <React.Fragment key={seat.number}>
                                                    {hasAisle && <View style={{ width: aisleWidth, height: seatSize }} />}
                                                    <TouchableOpacity
                                                        style={[
                                                            styles.seat,
                                                            {
                                                                width: seatSize,
                                                                height: seatSize,
                                                                backgroundColor: style.backgroundColor,
                                                                borderColor: style.borderColor,
                                                                borderRadius: 8,
                                                                borderWidth: 1,
                                                            },
                                                            selectedSeat === seat.number && styles.selectedSeatShadow
                                                        ]}
                                                        onPress={() => handleSeatPress(seat)}
                                                        activeOpacity={0.7}
                                                    >
                                                        <Text style={[styles.seatText, { fontSize, color: style.textColor }]}>
                                                            {seat.number}
                                                        </Text>
                                                    </TouchableOpacity>
                                                </React.Fragment>
                                            );
                                        })}

                                        {/* Add trailing space to make all rows same width */}
                                        {trailingWidth > 0 && <View style={{ width: trailingWidth, height: seatSize }} />}
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {seatmapData.decks.map((deck: any, index: number) => renderDeck(deck, index))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        paddingBottom: 20,
        backgroundColor: "transparent",
        minHeight: "100%",
        paddingTop: 0,
    },
    deckContainer: {
        width: "100%",
        marginBottom: 0,
        alignItems: "center",
    },
    deckLabelContainer: {
        alignItems: "center",
        marginBottom: 16,
    },
    deckLabel: {
        backgroundColor: 'rgba(100, 150, 255, 0.3)',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        overflow: 'hidden',
    },
    deckLabelText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: "800",
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    cabinContainer: {
        width: width * 0.95, // Slightly wider to accommodate seats better
        alignItems: "center",
        alignSelf: "center",
        paddingVertical: 20, // Add padding to extend background beyond seats
        marginBottom: 0,
    },
    cabinGraphic: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        borderRadius: 30,
        overflow: "hidden",
    },
    svgPosition: {
        position: "absolute",
        top: 0,
        left: 0,
    },
    contentContainer: {
        zIndex: 1,
        paddingTop: 50,
        paddingBottom: 30,
        width: "100%",
        alignItems: "center",
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 16,
        paddingVertical: 30,
    },
    aircraftText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 14,
        fontWeight: "600",
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    seatGrid: {
        width: "100%",
        alignItems: "center",
    },
    row: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        marginBottom: 14,
    },
    seat: {
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
    },
    selectedSeatShadow: {
        shadowColor: "#007AFF",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 6,
    },
    seatText: {
        fontWeight: "bold",
    },
    errorText: {
        textAlign: "center",
        marginTop: 20,
        color: "#999",
    },
});

export default SeatMap;
