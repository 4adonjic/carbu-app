import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';

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

  useEffect(() => {
    async function load() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setMessage('Autorise la localisation pour voir les stations près de toi.');
          return;
        }

        const pos = await Location.getCurrentPositionAsync({});
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        const where = `gazole_prix is not null and within_distance(geom, geom'POINT(${lon} ${lat})', 30km)`;
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
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  if (message) {
    return (
      <View style={{ flex: 1, backgroundColor: '#111', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: 'white', fontSize: 16, textAlign: 'center' }}>{message}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={{ marginTop: 60, backgroundColor: '#111' }}
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
          <Text style={{ color: '#4ade80', fontSize: 16 }}>Gazole : {item.gazole_prix} €/L</Text>
        </View>
      )}
    />
  );
}