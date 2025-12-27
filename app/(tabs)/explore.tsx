import { StyleSheet, View, Dimensions, Text } from 'react-native';
import { MapView, Polyline, Marker } from '@/components/NativeMapView';
import { GlassView } from 'expo-glass-effect';
import { useFlights } from '@/context/FlightContext';
import { AIRPORT_COORDINATES } from '@/constants/airports';
import { useEffect, useRef } from 'react';

export default function ExploreScreen() {
  const { flights, selectedDestination, setSelectedDestination } = useFlights();
  const mapRef = useRef<any>(null);

  // Animate to selected destination when it changes
  useEffect(() => {
    if (selectedDestination && mapRef.current) {
      const coords = AIRPORT_COORDINATES[selectedDestination];
      if (coords) {
        mapRef.current.animateToRegion({
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 30,
          longitudeDelta: 30,
        }, 1000);
      }
    }
  }, [selectedDestination]);

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
          const originCoords = AIRPORT_COORDINATES[flight.origin];
          const destCoords = AIRPORT_COORDINATES[flight.destination];

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
                title={flight.origin}
                pinColor="blue"
              />
              <Marker
                coordinate={destCoords}
                title={flight.destination}
                pinColor="blue"
              />
            </View>
          );
        })}
      </MapView>

      {/* Selected Destination Info */}
      {selectedDestination && (
        <GlassView style={styles.infoCard}>
          <Text style={styles.infoTitle}>{selectedDestination}</Text>
          <Text style={styles.infoSubtitle}>
            {flights.filter(f => f.destination === selectedDestination || f.origin === selectedDestination).length} flight(s)
          </Text>
        </GlassView>
      )}

      {flights.length === 0 && (
        <GlassView style={styles.overlay}>
          <Text style={styles.overlayText}>No flights to display.</Text>
          <Text style={styles.overlaySubtext}>Upload a PDF in the Home tab.</Text>
        </GlassView>
      )}
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
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
  },
  infoSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
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
