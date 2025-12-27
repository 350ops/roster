import React, { createContext, useState, useContext } from 'react';

type Flight = {
    date: string;
    origin: string;
    destination: string;
    block_hours: string;
};

type FlightContextType = {
    flights: Flight[];
    setFlights: React.Dispatch<React.SetStateAction<Flight[]>>;
    selectedDestination: string | null;
    setSelectedDestination: (destination: string | null) => void;
};

const FlightContext = createContext<FlightContextType | undefined>(undefined);

export function FlightProvider({ children }: { children: React.ReactNode }) {
    const [flights, setFlights] = useState<Flight[]>([]);
    const [selectedDestination, setSelectedDestination] = useState<string | null>(null);

    return (
        <FlightContext.Provider value={{ flights, setFlights, selectedDestination, setSelectedDestination }}>
            {children}
        </FlightContext.Provider>
    );
}

export function useFlights() {
    const context = useContext(FlightContext);
    if (context === undefined) {
        throw new Error('useFlights must be used within a FlightProvider');
    }
    return context;
}
