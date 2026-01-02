import MapView from '@/components/NativeMapView';
import { Weather, WeatherAtLocation } from '@/components/Weather';
import { getWeather } from '@/tools/weather';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { GlassView } from 'expo-glass-effect';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Keyboard,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { AIRPORT_CITIES, AIRPORT_COORDINATES, AIRPORT_UTC_OFFSETS } from '@/constants/airports';
import { API_URL } from '@/constants/config';
import { useFlights } from '@/context/FlightContext';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function HomeScreen() {
  const router = useRouter();
  const { flights, setFlights, setSelectedDestination } = useFlights();
  const displayFlights = useMemo(
    () => flights.filter((f) => f.destination !== 'DOH'),
    [flights]
  );
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [modalVisible, setModalVisible] = useState(true);
  const [weatherData, setWeatherData] = useState<WeatherAtLocation | null>(null);
  const [showWeather, setShowWeather] = useState(false);
  const [expandedFlightIndex, setExpandedFlightIndex] = useState<number | null>(null);

  // Animation for modal
  const modalY = useRef(new Animated.Value(SCREEN_HEIGHT * 0.55)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        const newY = Math.max(50, Math.min(SCREEN_HEIGHT * 0.8, SCREEN_HEIGHT * 0.55 + gestureState.dy));
        modalY.setValue(newY);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          // Swipe down - minimize
          Animated.spring(modalY, {
            toValue: SCREEN_HEIGHT * 0.7,
            useNativeDriver: false,
          }).start();
        } else if (gestureState.dy < -100) {
          // Swipe up - expand
          Animated.spring(modalY, {
            toValue: 100,
            useNativeDriver: false,
          }).start();
        } else {
          // Return to default
          Animated.spring(modalY, {
            toValue: SCREEN_HEIGHT * 0.55,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const region = useMemo(
    () => ({
      latitude: 25,
      longitude: 0,
      latitudeDelta: 150,
      longitudeDelta: 150,
    }),
    []
  );

  // Get unique destinations from flights
  const destinations = useMemo(() => {
    const allCodes = new Set<string>();
    flights.forEach((f) => {
      if (f.origin) allCodes.add(f.origin);
      if (f.destination) allCodes.add(f.destination);
    });
    return Array.from(allCodes).filter((code) => AIRPORT_COORDINATES[code]);
  }, [flights]);

  // Filter destinations based on search
  const filteredDestinations = useMemo(() => {
    if (!searchQuery.trim()) return destinations;
    const q = searchQuery.toUpperCase();
    return destinations.filter((code) => code.includes(q));
  }, [destinations, searchQuery]);

  const handleSelectDestination = (code: string) => {
    setSearchQuery(code);
    setShowSuggestions(false);
    setSelectedDestination(code);
    Keyboard.dismiss();
    router.push('/(tabs)/explore');
  };

  const handleMapPress = async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    try {
      // @ts-ignore - getWeather is a tool from AI SDK
      const result = await getWeather.execute({ latitude, longitude });
      if (result && !result.error) {
        setWeatherData(result);
        setShowWeather(true);
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      uploadFile(file);
    } catch (err) {
      console.error('Error picking document:', err);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const uploadFile = async (file: any) => {
    console.log('📄 File to upload:', {
      name: file.name,
      size: file.size,
      mimeType: file.mimeType,
      uri: file.uri?.substring(0, 50) + '...'
    });
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/pdf',
      } as any);

      console.log('🚀 Uploading to:', API_URL);

      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      // Append new flights to existing ones, avoiding duplicates
      const newFlights = data.flights;
      setFlights((prevFlights: any[]) => {
        const existingKeys = new Set(
          prevFlights.map((f: any) => `${f.date}-${f.origin}-${f.destination}`)
        );
        const uniqueNew = newFlights.filter(
          (f: any) => !existingKeys.has(`${f.date}-${f.origin}-${f.destination}`)
        );
        return [...prevFlights, ...uniqueNew];
      });

      if (data.flights.length === 0) {
        Alert.alert('Info', 'No flights found in this PDF.');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Full-screen Map */}
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        showsCompass={false}
        showsPointsOfInterest={false}
        showsTraffic={false}
        showsIndoors={false}
        showsBuildings={false}
        onPress={handleMapPress}
      />

      {/* Weather Overlay */}
      {showWeather && weatherData && (
        <View style={styles.weatherOverlay}>
          <TouchableOpacity
            style={styles.closeWeather}
            onPress={() => setShowWeather(false)}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Weather weatherAtLocation={weatherData} />
        </View>
      )}

      {/* Top Controls with Glass Effect */}
      <View style={styles.topControls}>
        <View />
        {flights.length > 0 ? (
          <GlassView style={styles.floatingAddButton}>
            <TouchableOpacity onPress={pickDocument} disabled={loading}>
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </GlassView>
        ) : null}
      </View>

      {/* Draggable Bottom Modal */}
      <Animated.View style={[styles.modalContainer, { top: modalY }]}>
        <GlassView style={styles.bottomSheet}>
          {/* Drag Handle */}
          <View {...panResponder.panHandlers} style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#8E8E93" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search Destination"
                  placeholderTextColor="#8E8E93"
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 ? (
                  <TouchableOpacity onPress={() => { setSearchQuery(''); setShowSuggestions(false); }}>
                    <Ionicons name="close-circle" size={20} color="#8E8E93" />
                  </TouchableOpacity>
                ) : (
                  <Ionicons name="mic" size={20} color="#8E8E93" />
                )}
              </View>

              {/* Suggestions Dropdown */}
              {showSuggestions && filteredDestinations.length > 0 && searchQuery.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {filteredDestinations.slice(0, 5).map((code) => (
                    <TouchableOpacity
                      key={code}
                      style={styles.suggestionRow}
                      onPress={() => handleSelectDestination(code)}
                    >
                      <View style={[styles.cardIcon, { backgroundColor: '#007AFF', width: 32, height: 32, borderRadius: 16 }]}>
                        <Ionicons name="location" size={16} color="white" />
                      </View>
                      <Text style={styles.suggestionText}>{code}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Upload Card - Only show when empty */}
            {flights.length === 0 && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={pickDocument}
                disabled={loading}
              >
                <View style={styles.uploadCard}>
                  <View style={styles.cardIcon}>
                    <Ionicons name="globe-outline" size={24} color="white" />
                  </View>
                  <View style={styles.cardText}>
                    <Text style={styles.uploadTitle}>Upload your Roster</Text>
                    <Text style={styles.uploadSubtitle}>PDF file from PeopleX</Text>
                  </View>
                  <Ionicons name="ellipsis-horizontal" size={20} color="#C7C7CC" />
                </View>
              </TouchableOpacity>
            )}

            {/* Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Recent Flights</Text>
            </View>

            {/* Loading */}
            {loading && (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
              </View>
            )}

            {/* Empty State */}
            {!loading && displayFlights.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No flights loaded yet</Text>
                <Text style={styles.emptySubtext}>Upload a roster to see your history</Text>
              </View>
            )}

            {/* Flight Rows */}
            {/* Flight Rows */}
            {!loading &&
              displayFlights.map((item, index) => {
                const isExpanded = expandedFlightIndex === index;
                const originCity = AIRPORT_CITIES[item.origin] || item.origin;
                const destCity = AIRPORT_CITIES[item.destination] || item.destination;

                // Simple Layover Calculation
                let layoverText = null;
                if (item.destination !== 'DOH') {
                  const arrivalTimeStr = item.arrival_time || '00:00';
                  const arrivalDate = new Date(`${item.date}T${arrivalTimeStr}`);

                  // If we have an offset from the parser
                  if (item.arrival_day_offset) {
                    arrivalDate.setDate(arrivalDate.getDate() + item.arrival_day_offset);
                  }

                  // Find next flight from this destination back to DOH
                  const nextFlight = flights.find((f, i) =>
                    i > index &&
                    f.origin === item.destination &&
                    f.destination === 'DOH'
                  );

                  if (nextFlight) {
                    const nextDepTimeStr = nextFlight.departure_time || '00:00';
                    const nextDepDate = new Date(`${nextFlight.date}T${nextDepTimeStr}`);
                    const diffMs = nextDepDate.getTime() - arrivalDate.getTime();
                    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                    if (diffHrs > 0) layoverText = `${diffHrs}h Layover`;
                  }
                }

                // Calculate accurate duration if times and offsets are available
                let displayBlock = item.block_hours ? `${item.block_hours.split(':')[0]}h ${item.block_hours.split(':')[1]}m` : '0h 0m';
                let bH = item.block_hours?.split(':')[0] || '0';
                let bM = item.block_hours?.split(':')[1] || '0';

                if (item.departure_time && item.arrival_time) {
                  const [dH, dM] = item.departure_time.split(':').map(Number);
                  const [aH, aM] = item.arrival_time.split(':').map(Number);

                  // Total minutes from local midnight
                  const depMinutes = dH * 60 + dM;
                  let arrMinutes = aH * 60 + aM;
                  if (item.arrival_day_offset) {
                    arrMinutes += item.arrival_day_offset * 1440;
                  }

                  const localDiffMinutes = arrMinutes - depMinutes;

                  // Adjust for timezones
                  const originOffset = AIRPORT_UTC_OFFSETS[item.origin] ?? 3; // Default to Doha
                  const destOffset = AIRPORT_UTC_OFFSETS[item.destination] ?? 3;

                  const realTotalMinutes = localDiffMinutes + (originOffset - destOffset) * 60;

                  if (realTotalMinutes > 0) {
                    const h = Math.floor(realTotalMinutes / 60);
                    const m = realTotalMinutes % 60;
                    bH = h.toString();
                    bM = m.toString().padStart(2, '0');
                    displayBlock = `${h}h ${m}m`;
                  }
                }

                return (
                  <TouchableOpacity
                    key={`${item.date}-${item.origin}-${index}`}
                    onPress={() => {
                      if (isExpanded) {
                        handleSelectDestination(item.destination || item.origin);
                      } else {
                        setExpandedFlightIndex(index);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    {!isExpanded ? (
                      <View style={styles.flightRow}>
                        <View style={styles.flightIcon}>
                          <MaterialCommunityIcons name="airplane-takeoff" size={20} color="white" />
                        </View>
                        <View style={styles.flightText}>
                          <Text style={styles.flightCity}>{destCity}</Text>
                          <Text style={styles.flightDate}>{item.date || '—'}</Text>
                        </View>
                        <Ionicons name="ellipsis-horizontal" size={20} color="#C7C7CC" />
                      </View>
                    ) : (
                      <View style={styles.expandedFlightCard}>
                        <View style={styles.cardHeader}>
                          <View style={styles.durationContainer}>
                            <Text style={styles.durationLarge}>{bH}h</Text>
                            <Text style={styles.durationSmall}>{bM} MINUTES</Text>
                          </View>

                          <View style={styles.flightHeaderMain}>
                            <View style={styles.airlineRow}>
                              <View style={styles.airlineLogoPlaceholder}>
                                <Ionicons name="airplane" size={12} color="#1c2b5e" />
                              </View>
                              <Text style={styles.flightNumberText}>QR {item.flight}</Text>
                              {layoverText && (
                                <Text style={styles.layoverText}>
                                  <Text style={styles.layoverHours}>{layoverText.split(' ')[0]} </Text>
                                  Layover
                                </Text>
                              )}
                            </View>
                            <Text style={styles.routeText}>
                              {originCity} to <Text style={{ fontWeight: 'bold' }}>{destCity}</Text>
                            </Text>

                            <View style={styles.timesRow}>
                              <View style={styles.timeBlock}>
                                <View style={[styles.timeDot, { backgroundColor: '#10b981' }]}>
                                  <Ionicons name="arrow-up" size={10} color="white" />
                                </View>
                                <Text style={styles.iataCode}>{item.origin}</Text>
                                <Text style={[styles.timeText, { color: '#10b981' }]}>
                                  {item.departure_time || '--:--'}
                                </Text>
                              </View>

                              <View style={styles.timeBlock}>
                                <View style={[styles.timeDot, { backgroundColor: '#10b981' }]}>
                                  <Ionicons name="arrow-down" size={10} color="white" />
                                </View>
                                <Text style={styles.iataCode}>{item.destination}</Text>
                                <Text style={[styles.timeText, { color: '#10b981' }]}>
                                  {item.arrival_time || '--:--'}
                                  {item.arrival_day_offset ? (
                                    <Text style={styles.dayOffset}> +{item.arrival_day_offset}</Text>
                                  ) : null}
                                </Text>
                              </View>
                            </View>

                            {/* Seat Map Button */}
                            <TouchableOpacity
                              style={styles.seatMapButton}
                              onPress={() => {
                                router.push({
                                  pathname: '/seatmap',
                                  params: {
                                    origin: item.origin,
                                    destination: item.destination,
                                    date: item.date,
                                    carrier: 'QR',
                                    flightNumber: item.flight,
                                  },
                                });
                              }}
                            >
                              <MaterialCommunityIcons name="seat-passenger" size={18} color="#007AFF" />
                              <Text style={styles.seatMapButtonText}>View Seat Map</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
          </ScrollView>
        </GlassView>
      </Animated.View>
    </View>
  );
}

// Styles definition
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topControls: {
    position: 'absolute',
    top: 60,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  floatingAddButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  weatherPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  weatherText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  capturePill: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    // Shadow for the sheet
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  bottomSheet: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: 'white', // Apple Maps uses a solid/translucent white
    overflow: 'hidden',
    paddingBottom: 40,
    minHeight: SCREEN_HEIGHT * 0.6,
  },
  handleContainer: {
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D1D1D6', // System Gray 4
  },
  sheetScroll: {
    flex: 1,
    backgroundColor: 'white',
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 50,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 44,
    gap: 8,
    backgroundColor: '#F2F2F7', // System Gray 6
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: '#000',
    fontWeight: '400',
    letterSpacing: -0.4,
  },
  suggestionsContainer: {
    marginTop: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  suggestionText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000',
  },
  // Upload Card Styling (Mimicking the image's "Upload to..." look)
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#fff',
    // It seems to be just a clean row in the image, or a card. 
    // Let's make it a subtle card to stand out slightly or just a row.
    // The visual provided has it inside a white rounded container if the bg was gray, 
    // but here the sheet is white. Let's give it a border or shadow?
    // Apple Maps "Favorites" often have their own section.
    borderWidth: 1,
    borderColor: '#F2F2F7',
    marginBottom: 24,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF', // Apple Blue
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    marginLeft: 12,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  uploadSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8E8E93',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 20, // Bold header
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 0.3,
  },
  sectionBadge: {
    display: 'none', // Remove badge to match clean Apple look
  },
  sectionBadgeText: {
    display: 'none',
  },
  loaderContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#C7C7CC',
  },
  // Flight Row Styling (Apple Maps Look)
  flightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA', // Separator
  },
  flightIcon: {
    width: 40,
    height: 40,
    borderRadius: 40,
    backgroundColor: '#AF52DE', // Apple Purple
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7F3FBF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
    elevation: 25,
  },
  flightText: {
    flex: 1,
    marginLeft: 22,
  },
  flightCity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  flightDate: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8E8E93', // Subtitle Gray
  },
  weatherOverlay: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    zIndex: 100,
  },
  closeWeather: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    padding: 5,
    zIndex: 101,
  },
  // Expanded Flight Card Styles
  expandedFlightCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
  },
  durationContainer: {
    width: 60,
    marginRight: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationLarge: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    lineHeight: 38,
  },
  durationSmall: {
    fontSize: 8,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 0.1,
  },
  flightHeaderMain: {
    flex: 1,
  },
  airlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  airlineLogoPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f1f1f1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  flightNumberText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
    flex: 1,
  },
  layoverText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  layoverHours: {
    color: '#10b981',
    fontWeight: '700',
  },
  routeText: {
    fontSize: 20,
    color: '#000',
    marginBottom: 16,
  },
  timesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  timeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iataCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8E8E93',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  dayOffset: {
    fontSize: 10,
    fontWeight: '600',
    verticalAlign: 'top',
  },
  seatMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  seatMapButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
});
