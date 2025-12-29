// Native-only - this file is used on iOS/Android
import { MAP_DARK_STYLE } from '@/constants/mapStyle';
import React from 'react';
import MapView, { MapViewProps, Marker, Polyline } from 'react-native-maps';

const CustomMapView = React.forwardRef<MapView, MapViewProps>((props, ref) => {
    return (
        <MapView
            {...props}
            ref={ref}
            userInterfaceStyle="dark"
            customMapStyle={MAP_DARK_STYLE}
        />
    );
});

export { Marker, Polyline };
export default CustomMapView;
export { CustomMapView as MapView };
