import GlassView from '@/components/GlassView';
import { RunwayCarousel } from '@/components/RunwayCarousel';
import { Weather, WeatherAtLocation } from '@/components/Weather';
import { AIRPORT_CITIES, AIRPORT_COORDINATES, AIRPORT_ICAO, AIRPORT_INFO } from '@/constants/airports';
import { getAirportDetails } from '@/tools/airport';
import { getWeather } from '@/tools/weather';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AirportInfoModalProps {
    visible: boolean;
    airportCode: string | null;
    onClose: () => void;
}

export default function AirportInfoModal({ visible, airportCode, onClose }: AirportInfoModalProps) {
    const [fullScreenVisible, setFullScreenVisible] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [weatherData, setWeatherData] = useState<WeatherAtLocation | null>(null);
    const [loadingWeather, setLoadingWeather] = useState(false);
    const [airportDetails, setAirportDetails] = useState<any>(null);
    const [loadingAirport, setLoadingAirport] = useState(false);

    useEffect(() => {
        if (visible && airportCode) {
            const fetchData = async () => {
                const coords = AIRPORT_COORDINATES[airportCode];
                setLoadingWeather(true);
                setLoadingAirport(true);

                try {
                    // Fetch Weather and Airport Details in parallel-ish
                    const airportPromise = (async () => {
                        try {
                            const icaoCode = AIRPORT_ICAO[airportCode] || airportCode;
                            // @ts-ignore
                            const details = await getAirportDetails.execute({ icao: icaoCode });
                            console.log('✈️ Airport Details Received:', details?.ident, 'Runways:', details?.runways?.length);
                            setAirportDetails(details);
                        } catch (e) {
                            console.error('Airport details fail:', e);
                        } finally {
                            setLoadingAirport(false);
                        }
                    })();

                    const weatherPromise = (async () => {
                        if (coords) {
                            try {
                                // @ts-ignore
                                const result = await getWeather.execute({
                                    latitude: coords.latitude,
                                    longitude: coords.longitude,
                                    city: airportCode
                                });
                                setWeatherData(result);
                            } catch (err) {
                                console.error('Failed to fetch weather:', err);
                            } finally {
                                setLoadingWeather(false);
                            }
                        } else {
                            setLoadingWeather(false);
                        }
                    })();

                    await Promise.all([airportPromise, weatherPromise]);
                } catch (err) {
                    console.error('Global fetch error:', err);
                }
            };
            fetchData();
        } else if (!visible) {
            setWeatherData(null);
            setAirportDetails(null);
        }
    }, [visible, airportCode]);

    if (!airportCode) return null;

    const info = AIRPORT_INFO[airportCode];

    const handleOpenFullScreen = (index: number) => {
        console.log('[AirportInfoModal] Opening full screen for image index:', index);
        setActiveImageIndex(index);
        setFullScreenVisible(true);
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <GlassView style={styles.modalView} tint="dark" intensity={90}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close-circle" size={32} color="#fff" />
                    </TouchableOpacity>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        <Text style={styles.airportCode}>{AIRPORT_CITIES[airportCode] || airportCode}</Text>

                        {weatherData && (
                            <View style={styles.weatherSection}>
                                <Weather weatherAtLocation={weatherData} forceDarkMode={true} />
                            </View>
                        )}

                        {airportDetails?.runways && (
                            <RunwayCarousel
                                runways={airportDetails.runways.map((r: any) => ({
                                    ...r,
                                    wind: weatherData ? {
                                        dir: weatherData.current.wind_direction_10m,
                                        kt: Math.round(weatherData.current.wind_speed_10m / 1.852) // km/h to kt
                                    } : undefined
                                }))}
                            />
                        )}

                        {info ? (
                            <>
                                <Text style={styles.description}>{info.description}</Text>

                                {info.images.length > 0 && (
                                    <>
                                        <TouchableOpacity
                                            style={styles.fullScreenTrigger}
                                            onPress={() => handleOpenFullScreen(0)}
                                        >
                                            <Ionicons name="expand-outline" size={20} color="#007AFF" />
                                            <Text style={styles.fullScreenText}>Full Screen</Text>
                                        </TouchableOpacity>

                                        <View style={styles.imageContainer}>
                                            {info.images.map((img, index) => (
                                                <TouchableOpacity
                                                    key={index}
                                                    style={styles.imageWrapper}
                                                    onPress={() => handleOpenFullScreen(index)}
                                                >
                                                    <Image
                                                        source={img}
                                                        style={styles.image}
                                                        contentFit="cover"
                                                        transition={500}
                                                    />
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </>
                                )}
                            </>
                        ) : (
                            <Text style={styles.noInfo}>No detailed information available for this airport.</Text>
                        )}
                    </ScrollView>
                </GlassView>

                {/* Full Screen Image Viewer Modal nested inside the main modal */}
                <Modal
                    visible={fullScreenVisible}
                    transparent={false}
                    animationType="fade"
                    onRequestClose={() => setFullScreenVisible(false)}
                >
                    <View style={styles.fullScreenContainer}>
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            contentOffset={{ x: activeImageIndex * SCREEN_WIDTH, y: 0 }}
                            onMomentumScrollEnd={(e) => {
                                const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                                setActiveImageIndex(index);
                            }}
                        >
                            {info?.images.map((img, index) => (
                                <View key={index} style={styles.fullScreenImageWrapper}>
                                    <Image
                                        source={img}
                                        style={styles.fullScreenImage}
                                        contentFit="contain"
                                    />
                                </View>
                            ))}
                        </ScrollView>

                        <SafeAreaView style={styles.fullScreenHeader} pointerEvents="box-none">
                            <TouchableOpacity
                                style={styles.fullScreenClose}
                                onPress={() => {
                                    console.log('[AirportInfoModal] Closing full screen');
                                    setFullScreenVisible(false);
                                }}
                            >
                                <View style={styles.closeBtnBackground}>
                                    <Ionicons name="close" size={34} color="#171717ff" />
                                </View>
                            </TouchableOpacity>
                        </SafeAreaView>

                        <View style={styles.pagination} pointerEvents="none">
                            {info?.images.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.paginationDot,
                                        activeImageIndex === index && styles.paginationDotActive
                                    ]}
                                />
                            ))}
                        </View>
                    </View>
                </Modal>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        width: SCREEN_WIDTH * 0.9,
        maxHeight: SCREEN_HEIGHT * 0.8,
        borderRadius: 30,
        padding: 24,
        overflow: 'hidden',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
    },
    scrollContent: {
        paddingTop: 10,
    },
    airportCode: {
        fontSize: 24,
        fontWeight: 'normal',
        color: '#fff',
        letterSpacing: 0.5,
        marginBottom: 16,
        textAlign: 'center',
    },
    description: {
        fontSize: 17,
        lineHeight: 24,
        color: '#ccc',
        marginBottom: 24,
        textAlign: 'center',
    },
    fullScreenTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        paddingVertical: 10,
        borderRadius: 12,
        marginBottom: 20,
        gap: 8,
    },
    fullScreenText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    },
    imageContainer: {
        gap: 16,
    },
    imageWrapper: {
        width: '100%',
        height: 220,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    noInfo: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        marginTop: 20,
        fontStyle: 'italic',
    },
    fullScreenContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    fullScreenHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    fullScreenClose: {
        padding: 16,
    },
    closeBtnBackground: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenImageWrapper: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenImage: {
        width: '100%',
        height: '100%',
    },
    pagination: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    paginationDotActive: {
        backgroundColor: '#FFF',
        width: 24,
    },
    weatherSection: {
        marginBottom: 24,
        width: '100%',
    },
    errorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
        padding: 16,
        borderRadius: 20,
        marginVertical: 10,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    errorText: {
        flex: 1,
        color: '#ccc',
        fontSize: 13,
        lineHeight: 18,
    },
});
