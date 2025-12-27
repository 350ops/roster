import {
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Keyboard,
  Modal,
  Dimensions,
  PanResponder,
  Animated,
} from 'react-native';
import MapView from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useMemo, useState, useRef } from 'react';
import { GlassView, GlassContainer } from 'expo-glass-effect';
import { useRouter } from 'expo-router';

import { useFlights } from '@/context/FlightContext';
import { AIRPORT_COORDINATES } from '@/constants/airports';
import { API_URL } from '@/constants/config';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function HomeScreen() {
  const router = useRouter();
  const { flights, setFlights, setSelectedDestination } = useFlights();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [modalVisible, setModalVisible] = useState(true);

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
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/pdf',
      } as any);

      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
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
      />

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
              <GlassView style={styles.searchBar} glassEffectStyle="clear">
                <Ionicons name="search" size={20} color="#d1d1d6ff" />
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
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => { setSearchQuery(''); setShowSuggestions(false); }}>
                    <Ionicons name="close-circle" size={20} color="#8E8E93" />
                  </TouchableOpacity>
                )}
              </GlassView>

              {/* Suggestions Dropdown */}
              {showSuggestions && filteredDestinations.length > 0 && searchQuery.length > 0 && (
                <GlassView style={styles.suggestionsContainer}>
                  {filteredDestinations.slice(0, 5).map((code) => (
                    <TouchableOpacity
                      key={code}
                      style={styles.suggestionRow}
                      onPress={() => handleSelectDestination(code)}
                    >
                      <Ionicons name="location-outline" size={18} color="#007AFF" />
                      <Text style={styles.suggestionText}>{code}</Text>
                    </TouchableOpacity>
                  ))}
                </GlassView>
              )}
            </View>

            {/* Upload Card */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={pickDocument}
              disabled={loading}
            >
              <GlassView style={styles.uploadCard} isInteractive>
                <View style={styles.cardIcon}>
                  <Ionicons name="globe-outline" size={26} color="#007AFF" />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.uploadTitle}>Upload your Roster</Text>
                  <Text style={styles.uploadSubtitle}>PDF file from PeopleX</Text>
                </View>
                <Ionicons name="ellipsis-horizontal" size={22} color="#111" />
              </GlassView>
            </TouchableOpacity>

            {/* Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Recent</Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>Flights</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#111" />
            </View>

            {/* Loading */}
            {loading && (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
              </View>
            )}

            {/* Empty State */}
            {!loading && flights.length === 0 && (
              <GlassView style={styles.emptyCard}>
                <Text style={styles.emptyText}>No flights loaded yet.</Text>
                <Text style={styles.emptySubtext}>Upload a PDF to get started</Text>
              </GlassView>
            )}

            {/* Flight Rows */}
            {!loading &&
              flights.map((item, index) => (
                <TouchableOpacity
                  key={`${item.date}-${item.origin}-${index}`}
                  onPress={() => handleSelectDestination(item.destination || item.origin)}
                >
                  <GlassView style={styles.flightRow} isInteractive>
                    <View style={styles.flightIcon}>
                      <MaterialCommunityIcons name="airplane-takeoff" size={22} color="#FF7A00" />
                    </View>
                    <View style={styles.flightText}>
                      <Text style={styles.flightCity}>{item.destination || item.origin}</Text>
                      <Text style={styles.flightDate}>{item.date || '—'}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#111" />
                  </GlassView>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </GlassView>
      </Animated.View>
    </View>
  );
}

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
  },
  bottomSheet: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 100,
    minHeight: SCREEN_HEIGHT * 0.6,
  },
  handleContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  handle: {
    width: 60,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
  },
  sheetScroll: {
    flex: 1,
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 14,
  },
  searchContainer: {
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 1)',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000000ff',
    fontWeight: '500',
  },
  suggestionsContainer: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.83)',
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000ff',
  },
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 1)',
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 1,
  },
  uploadSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#666',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  sectionBadge: {
    backgroundColor: '#FF9500',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sectionBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.2,
  },
  loaderContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyCard: {
    borderRadius: 16,
    padding: 20,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#3C3C43',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 15,
    fontWeight: '400',
    color: '#8E8E93',
  },
  flightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  flightIcon: {
    width: 36, 
    borderRadius: 18,
    backgroundColor: 'rgba(255, 122, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flightText: {
    flex: 1,
  },
  flightCity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  flightDate: {
    fontSize: 12,
    fontWeight: '400',
    color: '#666',
    marginTop: 1,
  },
});
