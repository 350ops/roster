import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

const frontierHtml = `<!doctype html>
<html>
<head>
    <meta charset="utf-8"/>
    <meta name="robots" content="noindex">
    <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
    <title>Seat map</title>
    <meta name="viewport" content="width=device-width, minimum-scale=1, minimal-ui">
    <link rel="stylesheet" href="./styles/themes.css"/>
    <link rel="stylesheet" href="./seatmap-min.css"/>
    <style id="scrollbar_style"></style>
    <style>
        .E46-15121983 {
            background-image: url('data:image/svg+xml;utf8,
            <svg version="1.1" baseProfile="full" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 110 112" width="110" height="112" xml:space="preserve">
            <g class="seat" transform="scale(1.3)">
                <path fill="rgb(184, 184, 184)" d="M3,33.2h2.2c1.8,0,3,1.4,3,2.9v43.4c0,1.8-1.4,2.9-3,2.9H3c-1.8,0-3-1.4-3-2.9V36.1C0,34.5,1.4,33.2,3,33.2z"/>
                <path fill="rgb(184, 184, 184)" d="M79.9,33.2h2.2c1.8,0,3,1.4,3,2.9v43.4c0,1.8-1.4,2.9-3,2.9h-2.2c-1.8,0-3-1.4-3-2.9V36.1 C76.7,34.5,78.1,33.2,79.9,33.2z"/>
                <path fill="rgb(230, 190, 63)" stroke="rgb(237, 237, 237)" stroke-width="1" d="M76.3,18.5C76.1,8,57.9,6,42,6C28.3,6,9,8,8.6,18.3c-0.1,2-0.2,12.9-0.2,16.4v34c0,4.5,3.7,8.2,8.4,8.2h51.4 c4.7,0,8.5-3.7,8.5-8.3V34.9C76.7,31.4,76.3,19.9,76.3,18.5z"/>
                <path fill="rgb(230, 190, 63)" stroke="rgb(237, 237, 237)" stroke-width="1" d="M72.5,84H11.8c-2.4,0-4.4-2-4.4-4.3v-5.1c0-2.3,2-4.3,4.4-4.3H12c10.4,1.4,20.6,2.2,31.2,2.2 s18.8-0.8,29.2-2.2h1.2c2.4,0,3.4,2,3.4,4.3v5.1C76.9,82,74.9,84,72.5,84z"/>
                <path fill="rgb(255, 255, 255)" d="M25.2,70.7h34.6c1.8,0,3.2,1.4,3.2,3.1V76c0,1.8-1.4,3.1-3.2,3.1H25.2c-1.8,0-3.2-1.4-3.2-3.1v-2.2 C22.2,72.1,23.6,70.7,25.2,70.7z"/>
            </g>
        </svg>
        ');}.E46-4223417 {  background-image: url('data:image/svg+xml;utf8,
        <svg version="1.1" baseProfile="full" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 110 112" width="110" height="112" xml:space="preserve">
            <g class="seat" transform="scale(1.3)">
                <path fill="rgb(184, 184, 184)" d="M3,33.2h2.2c1.8,0,3,1.4,3,2.9v43.4c0,1.8-1.4,2.9-3,2.9H3c-1.8,0-3-1.4-3-2.9V36.1C0,34.5,1.4,33.2,3,33.2z"/>
                <path fill="rgb(184, 184, 184)" d="M79.9,33.2h2.2c1.8,0,3,1.4,3,2.9v43.4c0,1.8-1.4,2.9-3,2.9h-2.2c-1.8,0-3-1.4-3-2.9V36.1 C76.7,34.5,78.1,33.2,79.9,33.2z"/>
                <path fill="rgb(64, 113, 185)" stroke="rgb(237, 237, 237)" stroke-width="1" d="M76.3,18.5C76.1,8,57.9,6,42,6C28.3,6,9,8,8.6,18.3c-0.1,2-0.2,12.9-0.2,16.4v34c0,4.5,3.7,8.2,8.4,8.2h51.4 c4.7,0,8.5-3.7,8.5-8.3V34.9C76.7,31.4,76.3,19.9,76.3,18.5z"/>
                <path fill="rgb(64, 113, 185)" stroke="rgb(237, 237, 237)" stroke-width="1" d="M72.5,84H11.8c-2.4,0-4.4-2-4.4-4.3v-5.1c0-2.3,2-4.3,4.4-4.3H12c10.4,1.4,20.6,2.2,31.2,2.2 s18.8-0.8,29.2-2.2h1.2c2.4,0,3.4,2,3.4,4.3v5.1C76.9,82,74.9,84,72.5,84z"/>
                <path fill="rgb(255, 255, 255)" d="M25.2,70.7h34.6c1.8,0,3.2,1.4,3.2,3.1V76c0,1.8-1.4,3.1-3.2,3.1H25.2c-1.8,0-3.2-1.4-3.2-3.1v-2.2 C22.2,72.1,23.6,70.7,25.2,70.7z"/>
            </g>
        </svg>
        ');}.E3-4223417 {  background-image: url('data:image/svg+xml;utf8,
        <svg version="1.1" baseProfile="full" viewBox="0 -3 110 100" width="110" height="100" xmlns="http://www.w3.org/2000/svg">
            <g class="seat" transform="scale(2)">
                <rect fill="rgb(185,186,186)" y="4.3" width="5.36" height="32.29" rx="1.97" ry="1.97"/>
                <rect fill="rgb(185,186,186)" x="49.02" y="4.3" width="5.36" height="32.29" rx="1.97" ry="1.97"/>
                <path fill="rgb(64, 113, 185)" stroke="rgb(237, 237, 237)" stroke-width="1" d="M44.94,1.07C40.15.71,33.1,0,26.87,0,21.37,0,13.66.47,9.35.93A4.41,4.41,0,0,0,5.41,5.31V33H49V5.47A4.41,4.41,0,0,0,44.94,1.07Z"/>
                <path fill="rgb(64, 113, 185)" stroke="rgb(237, 237, 237)" stroke-width="1" d="M47.56,37.58h-40a2.85,2.85,0,0,1-2.85-2.85V31.43a2.85,2.85,0,0,1,2.85-2.85h.11A139.86,139.86,0,0,0,27.56,30a150.41,150.41,0,0,0,19.9-1.38h.1a2.85,2.85,0,0,1,2.85,2.85v3.31A2.85,2.85,0,0,1,47.56,37.58Z"/>
                <rect fill="rgb(235, 235, 235)" x="19.25" y="28.88" width="15.92" height="5.47" rx="2.02" ry="2.02"/>
            </g>
        </svg>
        ');}.E3-12935989 {  background-image: url('data:image/svg+xml;utf8,
        <svg version="1.1" baseProfile="full" viewBox="0 -3 110 100" width="110" height="100" xmlns="http://www.w3.org/2000/svg">
            <g class="seat" transform="scale(2)">
                <rect fill="rgb(185,186,186)" y="4.3" width="5.36" height="32.29" rx="1.97" ry="1.97"/>
                <rect fill="rgb(185,186,186)" x="49.02" y="4.3" width="5.36" height="32.29" rx="1.97" ry="1.97"/>
                <path fill="rgb(198, 99, 54)" stroke="rgb(237, 237, 237)" stroke-width="1" d="M44.94,1.07C40.15.71,33.1,0,26.87,0,21.37,0,13.66.47,9.35.93A4.41,4.41,0,0,0,5.41,5.31V33H49V5.47A4.41,4.41,0,0,0,44.94,1.07Z"/>
                <path fill="rgb(198, 99, 54)" stroke="rgb(237, 237, 237)" stroke-width="1" d="M47.56,37.58h-40a2.85,2.85,0,0,1-2.85-2.85V31.43a2.85,2.85,0,0,1,2.85-2.85h.11A139.86,139.86,0,0,0,27.56,30a150.41,150.41,0,0,0,19.9-1.38h.1a2.85,2.85,0,0,1,2.85,2.85v3.31A2.85,2.85,0,0,1,47.56,37.58Z"/>
                <rect fill="rgb(235, 235, 235)" x="19.25" y="28.88" width="15.92" height="5.47" rx="2.02" ry="2.02"/>
            </g>
        </svg>
        ');}.E46-9353287 {  background-image: url('data:image/svg+xml;utf8,
        <svg version="1.1" baseProfile="full" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 110 112" width="110" height="112" xml:space="preserve">
            <g class="seat" transform="scale(1.3)">
                <path fill="rgb(184, 184, 184)" d="M3,33.2h2.2c1.8,0,3,1.4,3,2.9v43.4c0,1.8-1.4,2.9-3,2.9H3c-1.8,0-3-1.4-3-2.9V36.1C0,34.5,1.4,33.2,3,33.2z"/>
                <path fill="rgb(184, 184, 184)" d="M79.9,33.2h2.2c1.8,0,3,1.4,3,2.9v43.4c0,1.8-1.4,2.9-3,2.9h-2.2c-1.8,0-3-1.4-3-2.9V36.1 C76.7,34.5,78.1,33.2,79.9,33.2z"/>
                <path fill="rgb(143, 185, 71)" stroke="rgb(237, 237, 237)" stroke-width="1" d="M76.3,18.5C76.1,8,57.9,6,42,6C28.3,6,9,8,8.6,18.3c-0.1,2-0.2,12.9-0.2,16.4v34c0,4.5,3.7,8.2,8.4,8.2h51.4 c4.7,0,8.5-3.7,8.5-8.3V34.9C76.7,31.4,76.3,19.9,76.3,18.5z"/>
                <path fill="rgb(143, 185, 71)" stroke="rgb(237, 237, 237)" stroke-width="1" d="M72.5,84H11.8c-2.4,0-4.4-2-4.4-4.3v-5.1c0-2.3,2-4.3,4.4-4.3H12c10.4,1.4,20.6,2.2,31.2,2.2 s18.8-0.8,29.2-2.2h1.2c2.4,0,3.4,2,3.4,4.3v5.1C76.9,82,74.9,84,72.5,84z"/>
                <path fill="rgb(255, 255, 255)" d="M25.2,70.7h34.6c1.8,0,3.2,1.4,3.2,3.1V76c0,1.8-1.4,3.1-3.2,3.1H25.2c-1.8,0-3.2-1.4-3.2-3.1v-2.2 C22.2,72.1,23.6,70.7,25.2,70.7z"/>
            </g>
        </svg>
        ');}.E46-3650383 {  background-image: url('data:image/svg+xml;utf8,
        <svg version="1.1" baseProfile="full" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 110 112" width="110" height="112" xml:space="preserve">
            <g class="seat" transform="scale(1.3)">
                <path fill="rgb(184, 184, 184)" d="M3,33.2h2.2c1.8,0,3,1.4,3,2.9v43.4c0,1.8-1.4,2.9-3,2.9H3c-1.8,0-3-1.4-3-2.9V36.1C0,34.5,1.4,33.2,3,33.2z"/>
                <path fill="rgb(184, 184, 184)" d="M79.9,33.2h2.2c1.8,0,3,1.4,3,2.9v43.4c0,1.8-1.4,2.9-3,2.9h-2.2c-1.8,0-3-1.4-3-2.9V36.1 C76.7,34.5,78.1,33.2,79.9,33.2z"/>
                <path fill="rgb(55, 179, 79)" stroke="rgb(237, 237, 237)" stroke-width="1" d="M76.3,18.5C76.1,8,57.9,6,42,6C28.3,6,9,8,8.6,18.3c-0.1,2-0.2,12.9-0.2,16.4v34c0,4.5,3.7,8.2,8.4,8.2h51.4 c4.7,0,8.5-3.7,8.5-8.3V34.9C76.7,31.4,76.3,19.9,76.3,18.5z"/>
                <path fill="rgb(55, 179, 79)" stroke="rgb(237, 237, 237)" stroke-width="1" d="M72.5,84H11.8c-2.4,0-4.4-2-4.4-4.3v-5.1c0-2.3,2-4.3,4.4-4.3H12c10.4,1.4,20.6,2.2,31.2,2.2 s18.8-0.8,29.2-2.2h1.2c2.4,0,3.4,2,3.4,4.3v5.1C76.9,82,74.9,84,72.5,84z"/>
                <path fill="rgb(255, 255, 255)" d="M25.2,70.7h34.6c1.8,0,3.2,1.4,3.2,3.1V76c0,1.8-1.4,3.1-3.2,3.1H25.2c-1.8,0-3.2-1.4-3.2-3.1v-2.2 C22.2,72.1,23.6,70.7,25.2,70.7z"/>
            </g>
        </svg>
        ');}.E3-7768720 {  background-image: url('data:image/svg+xml;utf8,
        <svg version="1.1" baseProfile="full" viewBox="0 -3 110 100" width="110" height="100" xmlns="http://www.w3.org/2000/svg">
            <g class="seat" transform="scale(2)">
                <rect fill="rgb(185,186,186)" y="4.3" width="5.36" height="32.29" rx="1.97" ry="1.97"/>
                <rect fill="rgb(185,186,186)" x="49.02" y="4.3" width="5.36" height="32.29" rx="1.97" ry="1.97"/>
                <path fill="rgb(119, 138, 145)" stroke="rgb(237, 237, 237)" stroke-width="1" d="M44.94,1.07C40.15.71,33.1,0,26.87,0,21.37,0,13.66.47,9.35.93A4.41,4.41,0,0,0,5.41,5.31V33H49V5.47A4.41,4.41,0,0,0,44.94,1.07Z"/>
                <path fill="rgb(119, 138, 145)" stroke="rgb(237, 237, 237)" stroke-width="1" d="M47.56,37.58h-40a2.85,2.85,0,0,1-2.85-2.85V31.43a2.85,2.85,0,0,1,2.85-2.85h.11A139.86,139.86,0,0,0,27.56,30a150.41,150.41,0,0,0,19.9-1.38h.1a2.85,2.85,0,0,1,2.85,2.85v3.31A2.85,2.85,0,0,1,47.56,37.58Z"/>
                <rect fill="rgb(235, 235, 235)" x="19.25" y="28.88" width="15.92" height="5.47" rx="2.02" ry="2.02"/>
            </g>
        </svg>
        ');}.E3-15121983 {  background-image: url('data:image/svg+xml;utf8,
        <svg version="1.1" baseProfile="full" viewBox="0 -3 110 100" width="110" height="100" xmlns="http://www.w3.org/2000/svg">
            <g class="seat" transform="scale(2)">
                <rect fill="rgb(185,186,186)" y="4.3" width="5.36" height="32.29" rx="1.97" ry="1.97"/>
                <rect fill="rgb(185,186,186)" x="49.02" y="4.3" width="5.36" height="32.29" rx="1.97" ry="1.97"/>
                <path fill="rgb(230, 190, 63)" stroke="rgb(237, 237, 237)" stroke-width="1" d="M44.94,1.07C40.15.71,33.1,0,26.87,0,21.37,0,13.66.47,9.35.93A4.41,4.41,0,0,0,5.41,5.31V33H49V5.47A4.41,4.41,0,0,0,44.94,1.07Z"/>
                <path fill="rgb(230, 190, 63)" stroke="rgb(237, 237, 237)" stroke-width="1" d="M47.56,37.58h-40a2.85,2.85,0,0,1-2.85-2.85V31.43a2.85,2.85,0,0,1,2.85-2.85h.11A139.86,139.86,0,0,0,27.56,30a150.41,150.41,0,0,0,19.9-1.38h.1a2.85,2.85,0,0,1,2.85,2.85v3.31A2.85,2.85,0,0,1,47.56,37.58Z"/>
                <rect fill="rgb(235, 235, 235)" x="19.25" y="28.88" width="15.92" height="5.47" rx="2.02" ry="2.02"/>
            </g>
        </svg>
        ');}.E3-12074034 {  background-image: url('data:image/svg+xml;utf8,
        <svg version="1.1" baseProfile="full" viewBox="0 -3 110 100" width="110" height="100" xmlns="http://www.w3.org/2000/svg">
            <g class="seat" transform="scale(2)">
                <rect fill="rgb(185,186,186)" y="4.3" width="5.36" height="32.29" rx="1.97" ry="1.97"/>
                <rect fill="rgb(185,186,186)" x="49.02" y="4.3" width="5.36" height="32.29" rx="1.97" ry="1.97"/>
                <path fill="rgb(184, 60, 50)" stroke="rgb(237, 237, 237)" stroke-width="1" d="M44.94,1.07C40.15.71,33.1,0,26.87,0,21.37,0,13.66.47,9.35.93A4.41,4.41,0,0,0,5.41,5.31V33H49V5.47A4.41,4.41,0,0,0,44.94,1.07Z"/>
                <path fill="rgb(184, 60, 50)" stroke="rgb(237, 237, 237)" stroke-width="1" d="M47.56,37.58h-40a2.85,2.85,0,0,1-2.85-2.85V31.43a2.85,2.85,0,0,1,2.85-2.85h.11A139.86,139.86,0,0,0,27.56,30a150.41,150.41,0,0,0,19.9-1.38h.1a2.85,2.85,0,0,1,2.85,2.85v3.31A2.85,2.85,0,0,1,47.56,37.58Z"/>
                <rect fill="rgb(235, 235, 235)" x="19.25" y="28.88" width="15.92" height="5.47" rx="2.02" ry="2.02"/>
            </g>
        </svg>
        ');}.E3-12670516 {  background-image: url('data:image/svg+xml;utf8,
        <svg version="1.1" baseProfile="full" viewBox="0 -3 110 100" width="110" height="100" xmlns="http://www.w3.org/2000/svg">
            <g class="seat" transform="scale(2)">
                <rect fill="rgb(185,186,186)" y="4.3" width="5.36" height="32.29" rx="1.97" ry="1.97"/>
                <rect fill="rgb(185,186,186)" x="49.02" y="4.3" width="5.36" height="32.29" rx="1.97" ry="1.97"/>
                <path fill="rgb(193, 86, 53)" stroke="rgb(237, 237, 237)" stroke-width="1" d="M44.94,1.07C40.15.71,33.1,0,26.87,0,21.37,0,13.66.47,9.35.93A4.41,4.41,0,0,0,5.41,5.31V33H49V5.47A4.41,4.41,0,0,0,44.94,1.07Z"/>
                <path fill="rgb(193, 86, 53)" stroke="rgb(237, 237, 237)" stroke-width="1" d="M47.56,37.58h-40a2.85,2.85,0,0,1-2.85-2.85V31.43a2.85,2.85,0,0,1,2.85-2.85h.11A139.86,139.86,0,0,0,27.56,30a150.41,150.41,0,0,0,19.9-1.38h.1a2.85,2.85,0,0,1,2.85,2.85v3.31A2.85,2.85,0,0,1,47.56,37.58Z"/>
                <rect fill="rgb(235, 235, 235)" x="19.25" y="28.88" width="15.92" height="5.47" rx="2.02" ry="2.02"/>
            </g>
        </svg>
        ');}
    </style>
    <script async src='https://www.googletagmanager.com/gtag/js?id=G-1SQ44QYD58'></script>
    <script id="ga-script">
    window.dataLayer = window.dataLayer || [];
    function gtag() {
        dataLayer.push(arguments);
    }
    gtag('js', new Date());
    gtag('config', 'G-1SQ44QYD58');
    </script>
</head>
<body class="pointer">
    <!-- BODY_PLACEHOLDER -->
</body>
</html>`;

const FrontierSeatMap = () => {
    return (
        <View style={styles.container}>
            <WebView
                originWhitelist={['*']}
                source={{ html: frontierHtml }}
                style={styles.webview}
                scalesPageToFit={true}
                scrollEnabled={true}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: width,
        height: height * 0.8,
        backgroundColor: 'transparent',
    },
    webview: {
        flex: 1,
        backgroundColor: 'transparent',
    },
});

export default FrontierSeatMap;
