import { espace, type, usePalette } from '@/constants/palette';
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
    paddingHorizontal: 8,
    width: 52,
    textAlign: 'center' as const,
    ...type.corpsGras,
  };

  const pastille = (selected: boolean) => ({
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: selected ? c.orange : c.carte,
  });

  return (
    <View style={{ flex: 1, backgroundColor: c.fond }}>
      {/* En-tête */}
      <View
        style={{
          paddingTop: 56,
          paddingHorizontal: espace.l,
          paddingBottom: espace.m,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ color: c.texte, ...type.titre }}>Stations</Text>
          <Pressable
            onPress={actualiser}
            hitSlop={10}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: c.carte,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 15, color: c.texte }}>{loading ? '···' : '↻'}</Text>
          </Pressable>
        </View>
      </View>

      {/* Carburant */}
      <View
        style={{
          flexDirection: 'row',
          gap: espace.s,
          paddingHorizontal: espace.l,
          marginBottom: espace.m,
        }}
      >
        {CARBURANTS.map((item) => {
          const selected = item.champ === carburant.champ;
          return (
            <Pressable key={item.champ} onPress={() => setCarburant(item)} style={pastille(selected)}>
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

      {/* Réglages : conso, plein, rayon */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          flexWrap: 'wrap',
          paddingHorizontal: espace.l,
          gap: espace.s,
          marginBottom: espace.m,
        }}
      >
        <TextInput style={inputStyle} value={consoTxt} onChangeText={setConsoTxt} keyboardType="numeric" />
        <Text style={{ color: c.texteDoux, ...type.petit }}>L/100km</Text>

        <View style={{ width: 1, height: 16, backgroundColor: c.bordure, marginHorizontal: espace.xs }} />

        <TextInput style={inputStyle} value={litresTxt} onChangeText={setLitresTxt} keyboardType="numeric" />
        <Text style={{ color: c.texteDoux, ...type.petit }}>L de plein</Text>

        <View style={{ width: 1, height: 16, backgroundColor: c.bordure, marginHorizontal: espace.xs }} />

        {RAYONS.map((r) => {
          const selected = r === rayon;
          return (
            <Pressable key={r} onPress={() => setRayon(r)}>
              <Text
                style={{
                  color: selected ? c.orange : c.texteDoux,
                  ...type.petit,
                  fontWeight: selected ? '700' : '500',
                }}
              >
                {r} km
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator color={c.orange} style={{ marginTop: espace.xl }} />
      ) : message ? (
        <Text
          style={{
            color: c.texteDoux,
            ...type.corps,
            textAlign: 'center',
            padding: espace.l,
          }}
        >
          {message}
        </Text>
      ) : (
        <FlatList
          data={liste}
          keyExtractor={(s) => String(s.id)}
          contentContainerStyle={{ paddingHorizontal: espace.l, paddingBottom: espace.xl }}
          ItemSeparatorComponent={() => <View style={{ height: espace.s }} />}
          renderItem={({ item, index }) => (
            <View
              style={{
                padding: espace.m,
                borderRadius: 14,
                backgroundColor: c.carte,
                borderLeftWidth: index === 0 ? 3 : 0,
                borderLeftColor: c.orange,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <View style={{ flex: 1, paddingRight: espace.s }}>
                  {index === 0 && (
                    <Text
                      style={{
                        color: c.orange,
                        ...type.petit,
                        fontWeight: '700',
                        marginBottom: 2,
                      }}
                    >
                      MEILLEUR CHOIX
                    </Text>
                  )}
                  <Text style={{ color: c.texte, ...type.section }}>{item.ville}</Text>
                  <Text style={{ color: c.texteDoux, ...type.petit, marginTop: 1 }}>
                    {item.adresse} · {item.distance.toFixed(1)} km
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: c.texte, ...type.montant }}>{item.prix} €</Text>
                  <Text style={{ color: c.texteDoux, ...type.petit }}>/L</Text>
                </View>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: espace.m,
                }}
              >
                <Text style={{ color: c.texteDoux, ...type.petit }}>
                  Coût total : <Text style={{ color: c.texte, fontWeight: '700' }}>{item.coutTotal.toFixed(2)} €</Text>
                </Text>
                <Pressable
                  onPress={() =>
                    ouvrirItineraire(item.geom.lat, item.geom.lon, `${item.ville}, ${item.adresse}`)
                  }
                  style={{
                    backgroundColor: c.orange,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 10,
                  }}
                >
                  <Text style={{ color: c.surOrange, ...type.petit, fontWeight: '700' }}>
                    Itinéraire
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}