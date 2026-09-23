import { espace, type, usePalette } from '@/constants/palette';
import { CARBURANTS, useStations } from '@/hooks/use-stations';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

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

type Marqueur = {
  lat: number;
  lon: number;
  ville: string;
  adresse: string;
  prix: number;
  best: boolean;
};

// Fabrique la page web de la carte (OpenStreetMap + Leaflet)
function makeMapHtml(position: { lat: number; lon: number }, markers: Marqueur[]) {
  const data = JSON.stringify({ position, markers }).replace(/</g, '\\u003c');
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { height: 100%; margin: 0; background: #ddd; }
  .prix {
    background: #4B5563; color: white; font: bold 13px sans-serif;
    padding: 4px 8px; border-radius: 12px; border: 2px solid white;
    text-align: center; white-space: nowrap; box-shadow: 0 1px 4px rgba(0,0,0,0.4);
  }
  .prix.best { background: #FF6B00; font-size: 15px; }
  .go {
    margin-top: 8px; background: #FF6B00; color: white; border: 0;
    padding: 8px 14px; border-radius: 8px; font-weight: bold; font-size: 14px;
  }
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
    radius: 9, color: 'white', weight: 3, fillColor: '#3b82f6', fillOpacity: 1
  }).addTo(map);

  function go(i) {
    const m = data.markers[i];
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ lat: m.lat, lon: m.lon, nom: m.ville + ', ' + m.adresse })
    );
  }

  data.markers.forEach(function (m, i) {
    points.push([m.lat, m.lon]);
    const icone = L.divIcon({
      className: '',
      html: '<div class="prix ' + (m.best ? 'best' : '') + '">' + Number(m.prix).toFixed(3) + '</div>',
      iconSize: [64, 28],
      iconAnchor: [32, 14]
    });
    const marqueur = L.marker([m.lat, m.lon], { icon: icone, zIndexOffset: m.best ? 1000 : 0 }).addTo(map);
    const popup = document.createElement('div');
    popup.innerHTML =
      '<b>' + m.ville + '</b><br>' + m.adresse + '<br>' + Number(m.prix).toFixed(3) + ' €/L<br>';
    const bouton = document.createElement('button');
    bouton.className = 'go';
    bouton.textContent = 'Itinéraire';
    bouton.onclick = function () { go(i); };
    popup.appendChild(bouton);
    marqueur.bindPopup(popup);
  });

  map.fitBounds(points, { padding: [40, 40] });
</script>
</body>
</html>`;
}

export default function CarteScreen() {
  const c = usePalette();
  const { carburant, setCarburant, consoTxt, litresTxt, position, liste, loading, message } =
    useStations();

  const mapHtml =
    position && liste.length > 0
      ? makeMapHtml(
          position,
          liste.slice(0, 20).map((s, i) => ({
            lat: s.geom.lat,
            lon: s.geom.lon,
            ville: s.ville,
            adresse: s.adresse,
            prix: s.prix,
            best: i === 0,
          }))
        )
      : null;

  return (
    <View style={{ flex: 1, backgroundColor: c.fond }}>
      <View style={{ paddingTop: 56, paddingHorizontal: espace.l, paddingBottom: espace.m }}>
        <Text style={{ color: c.texte, ...type.titre, marginBottom: espace.m }}>Carte</Text>
        <View style={{ flexDirection: 'row', gap: espace.s }}>
          {CARBURANTS.map((item) => {
            const selected = item.champ === carburant.champ;
            return (
              <Pressable
                key={item.champ}
                onPress={() => setCarburant(item)}
                style={{
                  paddingVertical: 7,
                  paddingHorizontal: 14,
                  borderRadius: 18,
                  backgroundColor: selected ? c.orange : c.carte,
                }}
              >
                <Text
                  style={{
                    color: selected ? c.surOrange : c.texte,
                    ...type.petit,
                    fontWeight: selected ? '700' : '500',
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={c.orange} style={{ marginTop: espace.xl }} />
      ) : message || !mapHtml ? (
        <Text style={{ color: c.texteDoux, ...type.corps, textAlign: 'center', padding: espace.l }}>
          {message || 'Aucune station à afficher.'}
        </Text>
      ) : (
        <WebView
          key={carburant.champ + consoTxt + litresTxt}
          originWhitelist={['*']}
          source={{ html: mapHtml }}
          style={{ flex: 1, backgroundColor: c.carte }}
          onMessage={(e) => {
            try {
              const m = JSON.parse(e.nativeEvent.data);
              ouvrirItineraire(m.lat, m.lon, m.nom);
            } catch (err) {
              console.error(err);
            }
          }}
        />
      )}
    </View>
  );
}