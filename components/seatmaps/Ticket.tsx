import { getOperatingFlight } from "@/utils/amadeus";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Line } from "react-native-svg";
import GlassView from './GlassView';

interface TicketProps {
  toCode: string;
  toCity: string;
  fromCode: string;
  fromCity: string;
  duration: string;
  departureTime: string;
  arrivalTime: string;
  departureDate: string;
  arrivalDate: string;
  price: number;
  id: number;
  flightOffer: any;
  airlineCode?: string;
  flightNumber?: string;
  aircraftName?: string;
  isCodeshare?: boolean;
  marketingCarrier?: string;
  marketingFlightNumber?: string;
  dateForApi?: string;
  onPress?: () => void;
}

// Function to get airline logo using static requires (required for React Native bundler)
// MUST be at module scope for Metro bundler to properly analyze require() calls
const getAirlineLogo = (code: string) => {
  switch (code) {
    case 'QR': return require('../../assets/Logos/QatarAirways.png');
    case 'AA': return require('../../assets/Logos/AmericanAirlines.png');
    case 'BA': return require('../../assets/Logos/BritishAirways.png');
    case 'LH': return require('../../assets/Logos/Lufthansa.png');
    case 'AF': return require('../../assets/Logos/AirFrance.png');
    case 'KL': return require('../../assets/Logos/KLM.png');
    case 'EK': return require('../../assets/Logos/Emirates(airline).png');
    case 'QF': return require('../../assets/Logos/Qantas.png');
    case 'UA': return require('../../assets/Logos/UnitedAirlines.png');
    case 'DL': return require('../../assets/Logos/DeltaAirLines.png');
    case 'IB': return require('../../assets/Logos/Iberia(airline).png');
    case 'AY': return require('../../assets/Logos/Finnair.png');
    case 'SQ': return require('../../assets/Logos/SingaporeAirlines.png');
    case 'CX': return require('../../assets/Logos/CathayPacific.png');
    case 'AC': return require('../../assets/Logos/AirCanada.png');
    case 'NH': return require('../../assets/Logos/AllNipponAirways.png');
    case 'JL': return require('../../assets/Logos/JapanAirlines.png');
    case 'KE': return require('../../assets/Logos/KoreanAir.png');
    case 'TK': return require('../../assets/Logos/TurkishAirlines.png');
    case 'EY': return require('../../assets/Logos/EtihadAirways(EY).png');
    case 'SV': return require('../../assets/Logos/SaudiArabian(SV).png');
    case 'CA': return require('../../assets/Logos/AirChina.png');
    case 'MU': return require('../../assets/Logos/ChinaEasternAirlines.png');
    case 'CZ': return require('../../assets/Logos/ChinaSouthernAirlines.png');
    case 'AZ': return require('../../assets/Logos/Alitalia.png');
    case 'FR': return require('../../assets/Logos/Ryanair.png');
    case 'U2': return require('../../assets/Logos/EasyJet.png');
    case 'WN': return require('../../assets/Logos/SouthwestAirlines.png');
    case 'AS': return require('../../assets/Logos/AlaskaAirlines.png');
    case 'B6': return require('../../assets/Logos/JetBlue.png');
    case 'NK': return require('../../assets/Logos/SpiritAirlines.png');
    case 'G4': return require('../../assets/Logos/AllegiantAir.png');
    case 'F9': return require('../../assets/Logos/Frontier(F9).png');
    case 'SN': return require('../../assets/Logos/BrusselsAirlines.png');
    case 'LX': return require('../../assets/Logos/SwissInternationalAirLines.png');
    case 'TP': return require('../../assets/Logos/TAPAirPortugal.png');
    case 'SK': return require('../../assets/Logos/ScandinavianAirlines.png');
    case 'VS': return require('../../assets/Logos/VirginAmerica.png');
    case 'AV': return require('../../assets/Logos/Avianca.png');
    case 'CM': return require('../../assets/Logos/CopaAirlines.png');
    case 'ET': return require('../../assets/Logos/EthiopianAirlines.png');
    case 'MS': return require('../../assets/Logos/EgyptAir.png');
    case 'RJ': return require('../../assets/Logos/RoyalJordanian.png');
    case 'AT': return require('../../assets/Logos/RoyalAirMaroc.png');
    case 'BI': return require('../../assets/Logos/RoyalBruneiAirlines.png');
    case 'GA': return require('../../assets/Logos/GarudaIndonesia.png');
    case 'TG': return require('../../assets/Logos/ThaiAirways.png');
    case 'VN': return require('../../assets/Logos/VietnamAirlines.png');
    case 'PR': return require('../../assets/Logos/PhilippineAirlines.png');
    case 'OZ': return require('../../assets/Logos/AsianaAirlines.png');
    case 'NZ': return require('../../assets/Logos/AirNewZealand.png');
    case 'SA': return require('../../assets/Logos/SouthAfricanAirways.png');
    case 'KQ': return require('../../assets/Logos/KenyaAirways.png');
    case 'WY': return require('../../assets/Logos/OmanAir.png');
    case 'KU': return require('../../assets/Logos/KuwaitAirways.png');
    case 'ME': return require('../../assets/Logos/MiddleEastAirlines.png');
    case 'AH': return require('../../assets/Logos/AirAlgérie.png');
    case 'UL': return require('../../assets/Logos/SriLankanAirlines.png');
    case 'BG': return require('../../assets/Logos/BimanBangladeshAirlines.png');
    case 'AI': return require('../../assets/Logos/AirIndia.png');
    case 'IX': return require('../../assets/Logos/AirIndiaExpress.png');
    case '6E': return require('../../assets/Logos/IndiGo.png');
    case 'SG': return require('../../assets/Logos/SpiceJet(SG).png');
    case 'WS': return require('../../assets/Logos/WestJet.png');
    case 'TS': return require('../../assets/Logos/AirTransat(TS).png');
    case 'PD': return require('../../assets/Logos/PorterAirlines.png');
    case 'Y4': return require('../../assets/Logos/Volaris.png');
    case 'AM': return require('../../assets/Logos/Aeroméxico.png');
    case 'AR': return require('../../assets/Logos/AerolíneasArgentinas.png');
    case 'LA': return require('../../assets/Logos/LATAMChile.png');
    case 'JJ': return require('../../assets/Logos/LATAMBrasil.png');
    case 'G3': return require('../../assets/Logos/GolTransportesAéreos.png');
    case 'AD': return require('../../assets/Logos/AzulBrazilianAirlines.png');
    default: return null;
  }
};


const Ticket = ({
  toCode,
  toCity,
  fromCode,
  fromCity,
  duration,
  departureDate,
  departureTime,
  arrivalDate,
  arrivalTime,
  id,
  flightOffer,
  airlineCode = 'QR',
  flightNumber,
  aircraftName,
  isCodeshare,
  marketingCarrier,
  marketingFlightNumber,
  dateForApi,
  onPress,
}: TicketProps) => {
  const [displayFlightNumber, setDisplayFlightNumber] = useState(flightNumber);

  useEffect(() => {
    setDisplayFlightNumber(flightNumber);
  }, [flightNumber]);

  useEffect(() => {
    const fetchOperating = async () => {
      if (isCodeshare && marketingCarrier && marketingFlightNumber && dateForApi) {
        const opFlight = await getOperatingFlight(marketingCarrier, marketingFlightNumber, dateForApi);
        if (opFlight) {
          setDisplayFlightNumber(`${opFlight.carrierCode}${opFlight.flightNumber}`);
        }
      }
    };
    fetchOperating();
  }, [isCodeshare, marketingCarrier, marketingFlightNumber, dateForApi]);


  // Map airline codes to names
  const airlineNames: Record<string, string> = {
    'QR': 'Qatar Airways',
    'AA': 'American Airlines',
    'BA': 'British Airways',
    'LH': 'Lufthansa',
    'AF': 'Air France',
    'KL': 'KLM',
    'EK': 'Emirates',
    'QF': 'Qantas',
    'UA': 'United Airlines',
    'DL': 'Delta Air Lines',
    'IB': 'Iberia',
    'AY': 'Finnair',
    'SQ': 'Singapore Airlines',
    'CX': 'Cathay Pacific',
    'AC': 'Air Canada',
    'NH': 'All Nippon Airways',
    'JL': 'Japan Airlines',
    'KE': 'Korean Air',
    'TK': 'Turkish Airlines',
    'EY': 'Etihad Airways',
    'SV': 'Saudi Airlines',
    'CA': 'Air China',
    'MU': 'China Eastern',
    'CZ': 'China Southern',
    'AZ': 'Alitalia',
    'FR': 'Ryanair',
    'U2': 'EasyJet',
    'WN': 'Southwest',
    'AS': 'Alaska Airlines',
    'B6': 'JetBlue',
    'NK': 'Spirit Airlines',
    'G4': 'Allegiant Air',
    'F9': 'Frontier Airlines',
    'OS': 'Austrian Airlines',
    'SN': 'Brussels Airlines',
    'LX': 'Swiss',
    'TP': 'TAP Portugal',
    'SK': 'SAS',
    'VS': 'Virgin Atlantic',
  };

  const airlineName = airlineNames[airlineCode] || `Airline ${airlineCode}`;
  const airlineLogo = getAirlineLogo(airlineCode); // Returns null if not found

  console.log(`Ticket - airlineCode: ${airlineCode}, has logo: ${!!airlineLogo}`);

  return (
    <GlassView
      intensity={90}
      tint="dark"
      style={styles.ticketContainer}
    >
      <Pressable
        style={{ padding: 16, paddingBottom: 8 }}
        onPress={() => {
          if (onPress) {
            onPress();
          }
          router.push({
            pathname: `/(tabs)/search/flight/${id}` as any,
            params: {
              flightOffer: JSON.stringify(flightOffer),
              aircraftName: aircraftName
            }
          });
        }}
      >

        {/* Top Section with Locations */}
        <View style={[styles.row, { marginBottom: 8 }]}>

          <View style={styles.locationContainer}>
            <Text style={styles.code}>{fromCode}</Text>
            <Line
              x1="0"
              y1="0"
              x2="0"
              y2="0"
              stroke="rgba(255, 131, 193, 1)"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          </View>

          {/* Airplane Icon */}
          <View style={styles.iconContainer}>
            <Svg height="1" width="120" style={styles.dottedLine}>
              <Line
                x1="0"
                y1="0"
                x2="120"
                y2="0"
                stroke="rgba(255, 155, 225, 1)"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
            </Svg>
            <Ionicons name="airplane" size={24} color="#fff5feff" />
            <Text style={styles.duration}>{duration} hours</Text>
            {aircraftName && (
              <Text style={styles.aircraftName}>{aircraftName}</Text>
            )}
          </View>

          <View style={styles.locationContainer}>
            <Text style={styles.code}>{toCode}</Text>
          </View>
        </View>

        {/* Bottom Section with Time, Date, and Airline */}
        <View style={[styles.row, { marginBottom: 8 }]}>
          <View>
            <Text style={styles.time}>{departureTime}</Text>
            <Text style={styles.date}>{departureDate}</Text>
          </View>
          <View>
            <Text style={[styles.time, { textAlign: "right" }]}>
              {arrivalTime}
            </Text>
            <Text style={styles.date}>{arrivalDate}</Text>
          </View>
        </View>

        <Svg height="1" width="100%">
          <Line
            x1="0"
            y1="0"
            x2="100%"
            y2="0"
            stroke="rgba(131, 141, 255, 1)"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        </Svg>

        {/* Airline and Price */}
        <View style={[styles.row, { marginTop: 8 }]}>
          <View style={styles.airlineContainer}>
            {airlineLogo && (
              <Image
                source={airlineLogo}
                style={styles.airlineLogo}
              />
            )}
            <Text style={styles.airlineName}>{airlineName}</Text>
          </View>
          {displayFlightNumber && (
            <Text style={styles.flightNumber}>{displayFlightNumber}</Text>
          )}

        </View>
      </Pressable>
    </GlassView>
  );
};

const styles = StyleSheet.create({
  ticketContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    marginVertical: 5,
    marginHorizontal: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#ff00fbff',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationContainer: {
    // alignItems: "center",
  },
  code: {
    fontSize: 24,
    fontWeight: "400",
    color: '#ffffff',
  },
  city: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginVertical: 10,
  },
  iconContainer: {
    alignItems: "center",
    // top: -16
  },
  dottedLine: {
    position: "absolute",
    top: 12,
    width: 120,
    height: 1,
  },
  duration: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  time: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
    color: '#ffffff',
  },
  date: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  airlineContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  airlineLogo: {
    marginLeft: -5,
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  airlineName: {
    fontSize: 16,
    marginLeft: 8,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  price: {
    fontSize: 18,
    fontWeight: "500",
    color: "#ffffff",
  },


  punchHoleRight: {
    position: "absolute",
    right: 0,
    top: "72%",
    transform: [{ translateX: 16 }], // Shift half the circle width
    backgroundColor: "#272727",
    borderRadius: 24,
  },
  flightNumber: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  aircraftName: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    textAlign: "center",
    maxWidth: 120,
  },
});

export default Ticket;
