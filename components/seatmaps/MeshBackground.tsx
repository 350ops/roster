import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function MeshBackground({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <View style={styles.container}>
            {children}
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#00b3fff4', // Fallback color matching the original design
    },
});
