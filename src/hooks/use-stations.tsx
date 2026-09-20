import * as Location from 'expo-location';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export const CARBURANTS = [
  { label: 'Gazole', champ: 'gazole_prix' },
  { label: 'E10', champ: 'e10_prix' },
  { label: 'SP98', champ: 'sp98_prix' },
  { label: 'SP95', champ: 'sp95_prix' },
];

// La distance calculée est à vol d'oiseau, la route est plus longue : on multiplie par 1.3
const ROUTE_FACTOR = 1.3;

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type Carburant = { label: string; champ: string };
type Position = { lat: number; lon: number };

type StationsData = {
  carburant: Carburant;
  setCarburant: (c: Carburant) => void;
  consoTxt: string;
  setConsoTxt: (t: string) => void;
  litresTxt: string;
  setLitresTxt: (t: string) => void;
  position: Position | null;
  liste: any[];
  loading: boolean;
  message: string;
};

const StationsContext = createContext<StationsData | null>(null);

export function StationsProvider({ children }: { children: ReactNode }) {
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [carburant, setCarburant] = useState<Carburant>(CARBURANTS[0]);
  const [position, setPosition] = useState<Position | null>(null);
  const [consoTxt, setConsoTxt] = useState('6');
  const [litresTxt, setLitresTxt] = useState('40');

  // Récupérer ta position (une seule fois)
  useEffect(() => {
    async function getPosition() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setMessage('Autorise la localisation pour voir les stations près de toi.');
          setLoading(false);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({});
        setPosition({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      } catch (e) {
        console.error(e);
        setMessage('Impossible de trouver ta position.');
        setLoading(false);
      }
    }
    getPosition();
  }, []);

  // Chercher les stations (à chaque changement de carburant)
  useEffect(() => {
    if (!position) return;
    const { lat, lon } = position;

    async function load() {
      setLoading(true);
      setMessage('');
      try {
        const where = `${carburant.champ} is not null and within_distance(geom, geom'POINT(${lon} ${lat})', 30km)`;
        const url =
          'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records' +
          `?where=${encodeURIComponent(where)}&limit=100`;

        const r = await fetch(url);
        const data = await r.json();

        const list = (data.results ?? [])
          .filter((s: any) => s.geom)
          .map((s: any) => ({
            ...s,
            distance: distanceKm(lat, lon, s.geom.lat, s.geom.lon),
          }));

        setStations(list);
        if (list.length === 0) {
          setMessage('Aucune station trouvée à moins de 30 km.');
        }
      } catch (e) {
        console.error(e);
        setMessage('Erreur, réessaie dans un moment.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [position, carburant]);

  // Calculer le vrai coût de chaque station
  const conso = parseFloat(consoTxt.replace(',', '.')) || 0;
  const litres = parseFloat(litresTxt.replace(',', '.')) || 0;

  const liste = stations
    .map((s) => {
      const prix = s[carburant.champ];
      const coutPlein = litres * prix;
      const coutTrajet = s.distance * 2 * ROUTE_FACTOR * (conso / 100) * prix;
      return { ...s, prix, coutTotal: coutPlein + coutTrajet };
    })
    .sort((a, b) => a.coutTotal - b.coutTotal);

  return (
    <StationsContext.Provider
      value={{
        carburant,
        setCarburant,
        consoTxt,
        setConsoTxt,
        litresTxt,
        setLitresTxt,
        position,
        liste,
        loading,
        message,
      }}
    >
      {children}
    </StationsContext.Provider>
  );
}

export function useStations() {
  const ctx = useContext(StationsContext);
  if (!ctx) throw new Error('useStations doit être utilisé dans StationsProvider');
  return ctx;
}