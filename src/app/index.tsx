import { usePalette } from '@/constants/palette';
import { CARBURANTS, RAYONS, useStations } from '@/hooks/use-stations';
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

export default function HomeScreen() {
  const c = usePalette();
  const {
    carburant,
    setCarburant,
    consoTxt,
    setConsoTxt,
    litresTxt,
    setLitresTxt,
    rayon,
    setRayon,
    liste,
    loading,
    message,
    actualiser,
  } = useStations();

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
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
        }}
      >
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', flex: 1 }}>
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
        <Pressable
          onPress={actualiser}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: c.carte,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 8,
          }}
        >
          <Text style={{ fontSize: 18 }}>{loading ? '…' : '↻'}</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8, marginTop: 10 }}>
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

      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8, marginTop: 10 }}>
        <Text style={{ color: c.texteDoux }}>Rayon</Text>
        {RAYONS.map((r) => {
          const selected = r === rayon;
          return (
            <Pressable
              key={r}
              onPress={() => setRayon(r)}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 16,
                backgroundColor: selected ? c.orange : c.carte,
              }}
            >
              <Text style={{ color: selected ? c.surOrange : c.texte, fontWeight: 'bold' }}>
                {r} km
              </Text>
            </Pressable>
          );
        })}
      </View>

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