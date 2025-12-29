import MapView from '@/components/NativeMapView';
import { Weather, WeatherAtLocation } from '@/components/Weather';
import { getWeather } from '@/tools/weather';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { GlassContainer, GlassView } from 'expo-glass-effect';
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

import { AIRPORT_COORDINATES } from '@/constants/airports';
import { API_URL } from '@/constants/config';
import { useFlights } from '@/context/FlightContext';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function HomeScreen() {
  const router = useRouter();
  const { flights, setFlights, setSelectedDestination } = useFlights();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [modalVisible, setModalVisible] = useState(true);
  const [weatherData, setWeatherData] = useState<WeatherAtLocation | null>(null);
  const [showWeather, setShowWeather] = useState(false);

  // Animation for modal
  const modalY = useRef(new Animated.Value(SCREEN_HEIGHT * 0.35)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        const newY = Math.max(50, Math.min(SCREEN_HEIGHT * 0.8, SCREEN_HEIGHT * 0.35 + gestureState.dy));
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
            toValue: SCREEN_HEIGHT * 0.35,
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
      <GlassContainer style={styles.topControls} spacing={10}>


      </GlassContainer>

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

            {/* Upload Card */}
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
            {!loading && flights.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No flights loaded yet</Text>
                <Text style={styles.emptySubtext}>Upload a roster to see your history</Text>
              </View>
            )}

            {/* Flight Rows */}
            {!loading &&
              flights.map((item, index) => (
                <TouchableOpacity
                  key={`${item.date}-${item.origin}-${index}`}
                  onPress={() => handleSelectDestination(item.destination || item.origin)}
                >
                  <View style={styles.flightRow}>
                    <View style={styles.flightIcon}>
                      <MaterialCommunityIcons name="airplane-takeoff" size={20} color="white" />
                    </View>
                    <View style={styles.flightText}>
                      <Text style={styles.flightCity}>{item.destination || item.origin}</Text>
                      <Text style={styles.flightDate}>{item.date || '—'}</Text>
                    </View>
                    <Ionicons name="ellipsis-horizontal" size={20} color="#C7C7CC" />
                  </View>
                </TouchableOpacity>
              ))}
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
    borderRadius: 20,
    backgroundColor: '#AF52DE', // Apple Purple
    alignItems: 'center',
    justifyContent: 'center',
  },
  flightText: {
    flex: 1,
    marginLeft: 12,
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
});
