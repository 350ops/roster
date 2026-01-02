import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    StyleProp,
    ViewStyle,
    TextStyle,
    Image,
    TextInput,
    Pressable,
    Keyboard
} from 'react-native';
import GlassView from './GlassView';
import { searchAirports } from '../../utils/amadeus';
import { useDebounce } from '../../utils/useDebounce';

interface Airport {
    iataCode: string;
    name: string;
    address: {
        cityName: string;
        countryName: string;
    };
}

interface AirportAutocompleteProps {
    placeholder?: string;
    onSelect: (airport: Airport) => void;
    containerStyle?: StyleProp<ViewStyle>;
    inputStyle?: StyleProp<TextStyle>;
    icon?: any;
    selectedAirport?: Airport | null;
}

const AirportAutocomplete: React.FC<AirportAutocompleteProps> = ({
    placeholder,
    onSelect,
    containerStyle,
    inputStyle,
    icon,
    selectedAirport
}) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Airport[]>([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [isSelection, setIsSelection] = useState(false);
    const debouncedQuery = useDebounce(query, 500);
    const inputRef = useRef<TextInput>(null);

    // Update query when selectedAirport prop changes
    useEffect(() => {
        if (selectedAirport) {
            setQuery(`${selectedAirport.address.cityName} (${selectedAirport.iataCode})`);
            setIsSelection(true);
        } else {
            setQuery('');
            setIsSelection(false);
        }
    }, [selectedAirport]);

    useEffect(() => {
        if (debouncedQuery.length > 2 && !isSelection) {
            search(debouncedQuery);
        } else {
            setResults([]);
            setShowResults(false);
        }
    }, [debouncedQuery, isSelection]);

    const search = async (text: string) => {
        setLoading(true);
        const data = await searchAirports(text);
        setResults(data);
        setLoading(false);
        setShowResults(true);
    };

    const handleSelect = (item: Airport) => {
        setIsSelection(true);
        setQuery(`${item.address.cityName} (${item.iataCode})`);
        setShowResults(false);
        Keyboard.dismiss();
        onSelect(item);
    };

    return (
        <View style={styles.container}>
            <GlassView intensity={30} tint="light" style={[styles.inputContainer, containerStyle]}>
                <Pressable style={styles.inputPressable} onPress={() => inputRef.current?.focus()}>
                    {icon && <Image source={icon} style={styles.icon} />}
                    <TextInput
                        ref={inputRef}
                        placeholder={placeholder}
                        placeholderTextColor="rgba(227, 227, 227, 0.79)"
                        style={[styles.inputText, inputStyle]}
                        value={query}
                        onChangeText={(text) => {
                            setQuery(text);
                            setIsSelection(false);
                        }}
                        onFocus={() => {
                            if (isSelection) {
                                setQuery('');
                                setIsSelection(false);
                            }
                            if (results.length > 0) setShowResults(true);
                        }}
                    />
                    {loading && <ActivityIndicator size="small" color="#82828274" />}
                </Pressable>
            </GlassView>

            {showResults && results.length > 0 && (
                <GlassView intensity={80} tint="dark" style={styles.resultsContainer}>
                    {results.map((item, index) => (
                        <TouchableOpacity
                            key={`${item.iataCode}-${index}`}
                            style={styles.resultItem}
                            onPress={() => handleSelect(item)}
                        >
                            <View style={styles.resultTextContainer}>
                                <Text style={styles.cityCode}>{item.iataCode}</Text>
                                <View>
                                    <Text style={styles.cityName}>{item.address.cityName}</Text>
                                    <Text style={styles.airportName}>{item.name}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </GlassView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    inputContainer: {
        backgroundColor: 'rgba(195, 195, 195, 0.15)',
        borderRadius: 15,
        borderWidth: 1.4,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        overflow: 'hidden',
    },
    inputPressable: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        gap: 12,
    },
    icon: {
        tintColor: '#ffffff5c',
        width: 28,
        height: 20,
        resizeMode: 'contain',
    },
    inputText: {
        flex: 1,
        color: '#ffffffff',
        fontWeight: '400',
        fontSize: 12,
    },
    resultsContainer: {
        backgroundColor: 'rgba(30, 30, 30, 0.36)',
        borderRadius: 16,
        marginTop: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        maxHeight: 250,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    resultItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    resultTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    cityCode: {
        fontWeight: 'bold',
        fontSize: 18,
        color: '#FFFFFF',
        width: 50,
    },
    cityName: {
        fontWeight: '400',
        fontSize: 15,
        color: '#FFFFFF',
        marginBottom: 2,
    },
    airportName: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.6)',
        textTransform: 'uppercase',
    },
});

export default AirportAutocomplete;
