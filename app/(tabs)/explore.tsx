import AirportInfoModal from '@/components/AirportInfoModal';
import { MapView, Marker, Polyline } from '@/components/NativeMapView';
import { AIRPORT_CITIES, AIRPORT_COORDINATES } from '@/constants/airports';
import { useFlights } from '@/context/FlightContext';
import { GlassView } from 'expo-glass-effect';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

export default function ExploreScreen() {
  const { flights, selectedDestination, setSelectedDestination } = useFlights();
  const mapRef = useRef<any>(null);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoAirportCode, setInfoAirportCode] = useState<string | null>(null);

  // Store fetched coordinates for airports not in static list
  const [dynamicCoords, setDynamicCoords] = useState<Record<string, { latitude: number; longitude: number }>>({});

  // Helper to get coordinates from either static list or dynamic fetch
  const getCoords = (code: string) => {
    return AIRPORT_COORDINATES[code] || dynamicCoords[code];
  };

  const zoomFromDelta = (latDelta: number, lonDelta: number) => {
    const latZoom = Math.log2(360 / latDelta);
    const lonZoom = Math.log2(360 / lonDelta);
    return Math.max(2, Math.min(16, Math.min(latZoom, lonZoom)));
  };

  // Fetch missing coordinates
  useEffect(() => {
    const fetchMissing = async () => {
      const missingCodes = new Set<string>();

      flights.forEach(f => {
        if (!AIRPORT_COORDINATES[f.origin] && !dynamicCoords[f.origin]) missingCodes.add(f.origin);
        if (!AIRPORT_COORDINATES[f.destination] && !dynamicCoords[f.destination]) missingCodes.add(f.destination);
      });

      if (missingCodes.size === 0) return;

      console.log('🔍 Finding coordinates for:', Array.from(missingCodes));

      for (const code of missingCodes) {
        // @ts-ignore
        const coords = await import('@/tools/airlabs').then(m => m.getAirportCoordinates(code));
        if (coords) {
          setDynamicCoords(prev => ({ ...prev, [code]: coords }));
        }
      }
    };

    fetchMissing();
  }, [flights]); // Run when flights change

  // Animate to selected destination when it changes
  const focusOnSelection = useCallback(() => {
    if (!selectedDestination || !mapRef.current) return;

    // Find a representative flight that involves the selected airport
    const flight = flights.find(
      (f) => f.origin === selectedDestination || f.destination === selectedDestination
    );

    const originCoords = flight ? getCoords(flight.origin) : undefined;
    const destCoords = flight ? getCoords(flight.destination) : undefined;

    if (originCoords && destCoords) {
      const center = {
        latitude: (originCoords.latitude + destCoords.latitude) / 2,
        longitude: (originCoords.longitude + destCoords.longitude) / 2,
      };
      const latDelta = Math.max(Math.abs(originCoords.latitude - destCoords.latitude) * 1.6, 0.2);
      const lonDelta = Math.max(Math.abs(originCoords.longitude - destCoords.longitude) * 1.6, 0.2);
      const targetZoom = zoomFromDelta(latDelta, lonDelta);

      // Phase 1: ease out to frame full path with light pitch
      mapRef.current.animateCamera(
        {
          center,
          zoom: targetZoom,
          pitch: 24,
        },
        { duration: 2000 }
      );

      // Phase 2: then zoom in toward destination and tilt down for more path depth
      setTimeout(() => {
        mapRef.current?.animateCamera(
          {
            center: destCoords,
            zoom: Math.min(targetZoom + 2.5, 17),
            pitch: 55,
          },
          { duration: 1800 }
        );
      }, 1400);
    } else {
      const coords = getCoords(selectedDestination);
      if (coords) {
        mapRef.current.animateToRegion(
          {
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 30,
            longitudeDelta: 30,
          },
          3000
        );
      }
    }
  }, [selectedDestination, flights, getCoords, dynamicCoords]);

  useEffect(() => {
    focusOnSelection();
  }, [focusOnSelection]);

  // Clear selection when leaving
  useEffect(() => {
    return () => {
      setSelectedDestination(null);
    };
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 25,
          longitude: 0,
          latitudeDelta: 150,
          longitudeDelta: 150,
        }}
        mapType="standard"
      >
        {flights.map((flight, index) => {
          const originCoords = getCoords(flight.origin);
          const destCoords = getCoords(flight.destination);

          // Only render if we have BOTH coordinates
          if (!originCoords || !destCoords) {
            return null;
          }

          return (
            <View key={`${flight.date}-${index}`}>
              <Polyline
                coordinates={[originCoords, destCoords]}
                strokeColor="#007AFF"
                strokeWidth={2}
                geodesic={true}
              />
              <Marker
                coordinate={originCoords}
                pinColor="blue"
                onPress={() => {
                  setInfoAirportCode(flight.origin);
                  setInfoModalVisible(true);
                }}
              />
              <Marker
                coordinate={destCoords}
                pinColor="blue"
                onPress={() => {
                  setInfoAirportCode(flight.destination);
                  setInfoModalVisible(true);
                }}
              />
            </View>
          );
        })}
      </MapView>

      {/* Selected Destination Info */}
      {selectedDestination && (
        <GlassView style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            {AIRPORT_CITIES[selectedDestination] || selectedDestination}
          </Text>
          <Text style={styles.infoSubtitle}>
            {(() => {
              const count = flights.filter(f => f.destination === selectedDestination || f.origin === selectedDestination).length;
              return `${count} ${count === 1 ? 'Flight' : 'Flights'}`;
            })()}
          </Text>
        </GlassView>
      )}

      {flights.length === 0 && (
        <GlassView style={styles.overlay}>
          <Text style={styles.overlayText}>No flights to display.</Text>
          <Text style={styles.overlaySubtext}>Upload a PDF in the Home tab.</Text>
        </GlassView>
      )}

      <AirportInfoModal
        visible={infoModalVisible}
        airportCode={infoAirportCode}
        onClose={() => setInfoModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  infoCard: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 18,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111',
  },
  infoSubtitle: {
    fontSize: 20,
    color: '#444',
    marginTop: 6,
  },
  overlay: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  overlayText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  overlaySubtext: {
    fontSize: 15,
    color: '#666',
  },
});
