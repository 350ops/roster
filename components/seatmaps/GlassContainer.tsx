import React from 'react';
import { StyleSheet } from 'react-native';
import GlassView, { GlassViewProps } from './GlassView';

export interface GlassContainerProps extends GlassViewProps {
    /**
     * Spacing between children (gap).
     */
    spacing?: number;
}

export default function GlassContainer({ children, style, spacing, ...props }: GlassContainerProps) {
    return (
        <GlassView style={[styles.container, spacing !== undefined && { gap: spacing }, style]} {...props}>
            {children}
        </GlassView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        // Default to column layout, but let style override
    },
});
