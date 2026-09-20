import { usePalette } from '@/constants/palette';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

const CARBURANTS = [
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

// Ouvre l'itinéraire dans une app externe
function ouvrirItineraire(lat: number, lon: number, nom: string) {
  const google = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=driving`;
  const waze = `https://waze.com/ul?ll=${lat},${lon}&navigate=yes`;
  const apple = `http://maps.apple.com/?daddr=${lat},${lon}&dirflg=d`;

  const boutons: any[] = [
    { text: 'Google Maps', onPress: () => Linking.openURL(google) },
    { text: 'Waze', onPress: () => Linking.openURL(waze) },
  ];
  if (Platform.OS === 'ios') {
    boutons.push({ text: 'Plans', onPress: () => Linking.openURL(apple) });
  }
  boutons.push({ text: 'Annuler', style: 'cancel' });

  Alert.alert('Itinéraire', `Ouvrir avec quelle app ?\n${nom}`, boutons);
}

// Fabrique la page web de la carte (OpenStreetMap + Leaflet)
function makeMapHtml(
  position: { lat: number; lon: number },
  markers: { lat: number; lon: number; ville: string; prix: number; best: boolean }[]
) {
  const data = JSON.stringify({ position, markers }).replace(/</g, '\\u003c');
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { height: 100%; margin: 0; background: #ddd; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  const data = ${data};
  const map = L.map('map', { zoomControl: false });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap'
  }).addTo(map);

  const points = [[data.position.lat, data.position.lon]];

  L.circleMarker([data.position.lat, data.position.lon], {
    radius: 8, color: 'white', weight: 3, fillColor: '#3b82f6', fillOpacity: 1
  }).addTo(map).bindPopup('Toi');

  data.markers.forEach(function (m) {
    points.push([m.lat, m.lon]);
    L.circleMarker([m.lat, m.lon], {
      radius: m.best ? 11 : 7,
      color: 'white',
      weight: 2,
      fillColor: m.best ? '#FF6B00' : '#4B5563',
      fillOpacity: 1
    }).addTo(map).bindPopup(m.ville + ' : ' + m.prix + ' €/L');
  });

  map.fitBounds(points, { padding: [20, 20] });
</script>
</body>
</html>`;
}

export default function HomeScreen() {
  const c = usePalette();

  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [carburant, setCarburant] = useState(CARBURANTS[0]);
  const [position, setPosition] = useState<{ lat: number; lon: number } | null>(null);
  const [consoTxt, setConsoTxt] = useState('6');
  const [litresTxt, setLitresTxt] = useState('40');

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

  // Étape C : calculer le vrai coût de chaque station
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

  const mapHtml =
    position && liste.length > 0
      ? makeMapHtml(
          position,
          liste.slice(0, 10).map((s, i) => ({
            lat: s.geom.lat,
            lon: s.geom.lon,
            ville: s.ville,
            prix: s.prix,
            best: i === 0,
          }))
        )
      : null;

  const inputStyle = {
    backgroundColor: c.champ,
    color: c.texte,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    width: 70,
    textAlign: 'center' as const,
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.fond, paddingTop: 60 }}>
      <View style={{ flexDirection: 'row', padding: 12, gap: 8 }}>
        {CARBURANTS.map((item) => {
          const selected = item.champ === carburant.champ;
          return (
            <Pressable
              key={item.champ}
              onPress={() => setCarburant(item)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 20,
                backgroundColor: selected ? c.orange : c.carte,
              }}
            >
              <Text style={{ color: selected ? c.surOrange : c.texte, fontWeight: 'bold' }}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 }}>
        <Text style={{ color: c.texteDoux }}>Conso</Text>
        <TextInput
          style={inputStyle}
          value={consoTxt}
          onChangeText={setConsoTxt}
          keyboardType="numeric"
        />
        <Text style={{ color: c.texteDoux }}>L/100km</Text>
        <Text style={{ color: c.texteDoux, marginLeft: 12 }}>Plein</Text>
        <TextInput
          style={inputStyle}
          value={litresTxt}
          onChangeText={setLitresTxt}
          keyboardType="numeric"
        />
        <Text style={{ color: c.texteDoux }}>L</Text>
      </View>

      {mapHtml && (
        <View
          style={{
            height: 200,
            marginTop: 12,
            marginHorizontal: 12,
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          <WebView
            key={carburant.champ + consoTxt + litresTxt}
            originWhitelist={['*']}
            source={{ html: mapHtml }}
            style={{ backgroundColor: c.carte }}
          />
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={c.orange} style={{ marginTop: 40 }} />
      ) : message ? (
        <Text style={{ color: c.texte, fontSize: 16, textAlign: 'center', padding: 24 }}>
          {message}
        </Text>
      ) : (
        <FlatList
          style={{ marginTop: 12 }}
          data={liste}
          keyExtractor={(s) => String(s.id)}
          renderItem={({ item, index }) => (
            <View
              style={{
                padding: 16,
                borderBottomWidth: 1,
                borderColor: c.bordure,
                backgroundColor: index === 0 ? c.carteMeilleure : c.fond,
                borderLeftWidth: index === 0 ? 5 : 0,
                borderLeftColor: c.orange,
              }}
            >
              {index === 0 && (
                <Text style={{ color: c.orange, fontWeight: 'bold', marginBottom: 4 }}>
                  MEILLEUR CHOIX
                </Text>
              )}
              <Text style={{ fontWeight: 'bold', color: c.texte, fontSize: 18 }}>{item.ville}</Text>
              <Text style={{ color: c.texteDoux }}>{item.adresse}</Text>
              <Text style={{ color: c.texteDoux }}>{item.distance.toFixed(1)} km</Text>
              <Text style={{ color: c.texte, fontSize: 16, marginTop: 4 }}>
                {carburant.label} : {item.prix} €/L
              </Text>
              <Text style={{ color: c.orange, fontSize: 17, fontWeight: 'bold' }}>
                Coût total : {item.coutTotal.toFixed(2)} €
              </Text>
              <Pressable
                onPress={() =>
                  ouvrirItineraire(item.geom.lat, item.geom.lon, `${item.ville}, ${item.adresse}`)
                }
                style={{
                  backgroundColor: c.orange,
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: 'center',
                  marginTop: 10,
                }}
              >
                <Text style={{ color: c.surOrange, fontWeight: 'bold' }}>Itinéraire</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}