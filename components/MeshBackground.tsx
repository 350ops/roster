import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MeshGradientView } from 'expo-mesh-gradient';

export default function MeshBackground({ children }: { children: React.ReactNode }) {
    return (
        <View style={styles.container}>
            <MeshGradientView
                style={StyleSheet.absoluteFill}
                columns={3}
                rows={3}
                colors={[
                    'rgba(0, 255, 251, 0.36)', 'rgb(20, 40, 35)', 'rgb(40, 100, 85)',
                    'rgba(255, 191, 0, 0.62)', 'rgb(30, 60, 50)', 'rgb(35, 80, 70)',
                    'rgba(216, 62, 255, 0.52)', 'rgb(25, 50, 42)', 'rgb(40, 100, 85)'
                ]}
                points={[
                    [0, 0], [0.5, 0], [1, 0],
                    [0, 0.5], [0.5, 0.5], [1, 0.5],
                    [0, 1], [0.5, 1], [1, 1]
                ]}
            />
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000', // Fallback
    },
});
