import MeshBackground from '@/components/seatmaps/MeshBackground';
import Ticket from '@/components/seatmaps/Ticket';
import { useFlightContext } from '@/contexts/FlightContext';
import { AntDesign } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TICKET_HEIGHT = 250;

const Tickets = () => {
    const { top } = useSafeAreaInsets();
    const { flights, searchParams, dictionaries, loading, setSelectedFlight } = useFlightContext();

    const renderItem = ({ item }: any) => {
        const itinerary = item.itineraries[0];
        const segment = itinerary.segments[0];
        const lastSegment = itinerary.segments[itinerary.segments.length - 1];

        const departureDateObj = new Date(segment.departure.at);
        const arrivalDateObj = new Date(lastSegment.arrival.at);

        const formatTime = (date: Date) => {
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        };

        const formatDate = (date: Date) => {
            return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        };

        const duration = itinerary.duration.replace('PT', '').toLowerCase();

        const carrierCode = segment.operating?.carrierCode || segment.carrierCode;
        const flightNum = segment.operating?.number || segment.number;
        const flightNumber = `${carrierCode}${flightNum}`;
        const airlineCode = carrierCode;

        const aircraftCode = segment.aircraft?.code;
        const aircraftName = dictionaries?.aircraft?.[aircraftCode] || aircraftCode;

        const isCodeshare = segment.operating && segment.operating.carrierCode !== segment.carrierCode;

        return (
            <Ticket
                id={item.id}
                fromCode={segment.departure.iataCode}
                fromCity={searchParams?.originName || segment.departure.iataCode}
                toCode={lastSegment.arrival.iataCode}
                toCity={searchParams?.destinationName || lastSegment.arrival.iataCode}
                duration={duration}
                departureTime={formatTime(departureDateObj)}
                departureDate={formatDate(departureDateObj)}
                arrivalTime={formatTime(arrivalDateObj)}
                arrivalDate={formatDate(arrivalDateObj)}
                price={item.price.total}
                flightOffer={item}
                airlineCode={airlineCode}
                flightNumber={flightNumber}
                aircraftName={aircraftName}
                isCodeshare={isCodeshare}
                marketingCarrier={segment.carrierCode}
                marketingFlightNumber={segment.number}
                dateForApi={segment.departure.at.split('T')[0]}
                onPress={() => setSelectedFlight(item)}
            />
        );
    };

    if (loading) {
        return (
            <MeshBackground>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.loadingText}>Searching Flights...</Text>
                </View>
            </MeshBackground>
        );
    }

    if (flights.length === 0) {
        return (
            <MeshBackground>
                <View style={styles.container}>
                    <Pressable
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <AntDesign name="arrow-left" size={24} color="#fff" />
                    </Pressable>
                    <BlurView intensity={20} tint="light" style={styles.card}>
                        <Text style={styles.text}>No Flights</Text>
                        <Text style={styles.subtext}>Search for flights from the Home tab.</Text>
                    </BlurView>
                </View>
            </MeshBackground>
        );
    }

    return (
        <MeshBackground>
            <View style={{ marginTop: top, flex: 1 }}>
                <FlatList
                    data={flights}
                    snapToInterval={TICKET_HEIGHT}
                    decelerationRate={"normal"}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    bounces={false}
                    contentContainerStyle={{
                        paddingTop: 40,
                        paddingBottom: 90,
                    }}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </MeshBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 2,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        marginTop: 10,
        fontSize: 16,
    },
    card: {
        padding: 20,
        borderRadius: 20,
        overflow: 'hidden',
        alignItems: 'center',
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    text: {
        fontSize: 24,
        fontWeight: 'black',
        color: '#fff',
        marginBottom: 10,
    },
    subtext: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 60,
        left: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
});

export default Tickets;
