import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';

const CARBURANTS = [
  { label: 'Gazole', champ: 'gazole_prix' },
  { label: 'E10', champ: 'e10_prix' },
  { label: 'SP98', champ: 'sp98_prix' },
  { label: 'SP95', champ: 'sp95_prix' },
];

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

export default function HomeScreen() {
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [carburant, setCarburant] = useState(CARBURANTS[0]);
  const [position, setPosition] = useState<{ lat: number; lon: number } | null>(null);

  // Étape A : récupérer ta position (une seule fois)
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

  // Étape B : chercher les stations (à chaque changement de carburant)
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
          }))
          .sort((a: any, b: any) => a.distance - b.distance);

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

  return (
    <View style={{ flex: 1, backgroundColor: '#111', paddingTop: 60 }}>
      <View style={{ flexDirection: 'row', padding: 12, gap: 8 }}>
        {CARBURANTS.map((c) => {
          const selected = c.champ === carburant.champ;
          return (
            <Pressable
              key={c.champ}
              onPress={() => setCarburant(c)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 20,
                backgroundColor: selected ? '#4ade80' : '#333',
              }}
            >
              <Text style={{ color: selected ? '#111' : 'white', fontWeight: 'bold' }}>
                {c.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : message ? (
        <Text style={{ color: 'white', fontSize: 16, textAlign: 'center', padding: 24 }}>
          {message}
        </Text>
      ) : (
        <FlatList
          data={stations}
          keyExtractor={(s) => String(s.id)}
          renderItem={({ item, index }) => (
            <View
              style={{
                padding: 16,
                borderBottomWidth: 1,
                borderColor: '#444',
                backgroundColor: index === 0 ? '#1f2937' : '#111',
              }}
            >
              {index === 0 && (
                <Text style={{ color: '#facc15', fontWeight: 'bold', marginBottom: 4 }}>
                  LA PLUS PROCHE
                </Text>
              )}
              <Text style={{ fontWeight: 'bold', color: 'white', fontSize: 18 }}>{item.ville}</Text>
              <Text style={{ color: '#ccc' }}>{item.adresse}</Text>
              <Text style={{ color: '#93c5fd' }}>{item.distance.toFixed(1)} km</Text>
              <Text style={{ color: '#4ade80', fontSize: 16 }}>
                {carburant.label} : {item[carburant.champ]} €/L
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}