import { MeshGradientView } from 'expo-mesh-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function MeshBackground({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <View style={styles.container}>
            <MeshGradientView
                style={StyleSheet.absoluteFill}
                columns={3}
                rows={3}
                colors={[
                    // top row
                    '#00b3fff4',   // soft off-white
                    '#6397ffff',   // cool mint
                    '#00b3fff4',

                    // middle row
                    '#6397ffff',   // soft off-white
                    '#00b3fff4',   // cool mint
                    '#6397ffff', // soft off-white

                    // bottom row
                    '#262626f4',   // soft off-white
                    '#282828ff',   // cool mint
                    '#000000f4',
                ]}
                points={[
                    [0, 0], [0.5, 0], [1, 0],
                    [0, 0.5], [0.5, 0.5], [1, 0.5],
                    [0, 1], [0.5, 1], [1, 1],
                ]}
            />
            {children}
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#00b3fff4', // Fallback
    },
});
