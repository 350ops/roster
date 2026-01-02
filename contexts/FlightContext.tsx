import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FlightSearchParams {
    origin: string;
    destination: string;
    date: string;
    nonStop: boolean;
    travelClass: string;
    originName?: string;
    destinationName?: string;
    originCoordinates?: { latitude: number; longitude: number };
    destinationCoordinates?: { latitude: number; longitude: number };
}

interface FlightContextType {
    flights: any[];
    setFlights: (flights: any[]) => void;
    searchParams: FlightSearchParams | null;
    setSearchParams: (params: FlightSearchParams | null) => void;
    selectedFlight: any | null;
    setSelectedFlight: (flight: any | null) => void;
    dictionaries: any | null;
    setDictionaries: (dictionaries: any | null) => void;
    loading: boolean;
    setLoading: (loading: boolean) => void;
}

const FlightContext = createContext<FlightContextType | undefined>(undefined);

export const FlightProvider = ({ children }: { children: ReactNode }) => {
    const [flights, setFlights] = useState<any[]>([]);
    const [searchParams, setSearchParams] = useState<FlightSearchParams | null>(null);
    const [selectedFlight, setSelectedFlight] = useState<any | null>(null);
    const [dictionaries, setDictionaries] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);

    return (
        <FlightContext.Provider
            value={{
                flights,
                setFlights,
                searchParams,
                setSearchParams,
                selectedFlight,
                setSelectedFlight,
                dictionaries,
                setDictionaries,
                loading,
                setLoading,
            }}
        >
            {children}
        </FlightContext.Provider>
    );
};

export const useFlightContext = () => {
    const context = useContext(FlightContext);
    if (context === undefined) {
        throw new Error('useFlightContext must be used within a FlightProvider');
    }
    return context;
};
