import { usePalette } from '@/constants/palette';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

const CLE = 'carnet_pleins';

type Plein = { id: string; date: string; litres: number; prix: number; km: number };

const num = (t: string) => parseFloat(t.replace(',', '.')) || 0;

export default function CarnetScreen() {
  const c = usePalette();

  const [pleins, setPleins] = useState<Plein[]>([]);
  const [litresTxt, setLitresTxt] = useState('');
  const [prixTxt, setPrixTxt] = useState('');
  const [kmTxt, setKmTxt] = useState('');
  const [charge, setCharge] = useState(false);

  // Au démarrage : relire les pleins sauvegardés
  useEffect(() => {
    AsyncStorage.getItem(CLE)
      .then((v) => {
        if (v) setPleins(JSON.parse(v));
      })
      .catch(console.error)
      .finally(() => setCharge(true));
  }, []);

  // À chaque changement : sauvegarder
  useEffect(() => {
    if (charge) AsyncStorage.setItem(CLE, JSON.stringify(pleins)).catch(console.error);
  }, [pleins, charge]);

  function ajouter() {
    const litres = num(litresTxt);
    const prix = num(prixTxt);
    const km = num(kmTxt);
    if (!litres || !prix || !km) return;
    const p: Plein = {
      id: String(Date.now()),
      date: new Date().toISOString(),
      litres,
      prix,
      km,
    };
    setPleins([...pleins, p]);
    setLitresTxt('');
    setPrixTxt('');
    setKmTxt('');
  }

  function supprimer(id: string) {
    setPleins(pleins.filter((p) => p.id !== id));
  }

  // Calculs : on compare chaque plein au précédent (classé par kilométrage)
  const tries = [...pleins].sort((a, b) => a.km - b.km);
  const details = tries
    .map((p, i) => {
      const prev = tries[i - 1];
      const kmParcourus = prev ? p.km - prev.km : 0;
      return {
        ...p,
        kmParcourus,
        coutKm: kmParcourus > 0 ? p.prix / kmParcourus : null,
        conso: kmParcourus > 0 ? (p.litres / kmParcourus) * 100 : null,
      };
    })
    .reverse();

  const now = new Date();
  const budgetMois = pleins
    .filter((p) => {
      const d = new Date(p.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, p) => s + p.prix, 0);

  const avecCout = details.filter((d) => d.coutKm !== null);
  const totalPrix = avecCout.reduce((s, d) => s + d.prix, 0);
  const totalKm = avecCout.reduce((s, d) => s + d.kmParcourus, 0);
  const coutKmMoyen = totalKm > 0 ? totalPrix / totalKm : null;

  const inputStyle = {
    backgroundColor: c.champ,
    color: c.texte,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    fontSize: 16,
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.fond }}
      contentContainerStyle={{ padding: 16, paddingTop: 70, paddingBottom: 120 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={{ color: c.texte, fontSize: 26, fontWeight: 'bold', marginBottom: 16 }}>
        Carnet de pleins
      </Text>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: c.carteMeilleure,
            padding: 14,
            borderRadius: 12,
            borderLeftWidth: 5,
            borderLeftColor: c.orange,
          }}
        >
          <Text style={{ color: c.texteDoux }}>Budget ce mois</Text>
          <Text style={{ color: c.orange, fontSize: 22, fontWeight: 'bold' }}>
            {budgetMois.toFixed(2)} €
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: c.carteMeilleure,
            padding: 14,
            borderRadius: 12,
            borderLeftWidth: 5,
            borderLeftColor: c.orange,
          }}
        >
          <Text style={{ color: c.texteDoux }}>Coût au km</Text>
          <Text style={{ color: c.orange, fontSize: 22, fontWeight: 'bold' }}>
            {coutKmMoyen !== null ? coutKmMoyen.toFixed(3) + ' €' : '—'}
          </Text>
        </View>
      </View>

      <Text style={{ color: c.texte, fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Ajouter un plein
      </Text>
      <TextInput
        style={inputStyle}
        placeholder="Litres mis (ex : 42.5)"
        placeholderTextColor={c.texteDoux}
        keyboardType="numeric"
        value={litresTxt}
        onChangeText={setLitresTxt}
      />
      <TextInput
        style={inputStyle}
        placeholder="Prix payé en € (ex : 98.20)"
        placeholderTextColor={c.texteDoux}
        keyboardType="numeric"
        value={prixTxt}
        onChangeText={setPrixTxt}
      />
      <TextInput
        style={inputStyle}
        placeholder="Kilométrage au compteur (ex : 84500)"
        placeholderTextColor={c.texteDoux}
        keyboardType="numeric"
        value={kmTxt}
        onChangeText={setKmTxt}
      />
      <Pressable
        onPress={ajouter}
        style={{
          backgroundColor: c.orange,
          padding: 14,
          borderRadius: 10,
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <Text style={{ color: c.surOrange, fontWeight: 'bold', fontSize: 16 }}>Ajouter</Text>
      </Pressable>
      <Text style={{ color: c.texteDoux, fontSize: 12, marginBottom: 24 }}>
        Pour un calcul juste, fais le plein complet à chaque fois. Il faut au moins 2 pleins pour
        voir le coût au km.
      </Text>

      <Text style={{ color: c.texte, fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Historique
      </Text>
      {details.length === 0 && (
        <Text style={{ color: c.texteDoux }}>Aucun plein pour l'instant.</Text>
      )}
      {details.map((d) => (
        <View
          key={d.id}
          style={{
            backgroundColor: c.carte,
            padding: 14,
            borderRadius: 10,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: c.bordure,
          }}
        >
          <Text style={{ color: c.texte, fontWeight: 'bold' }}>
            {new Date(d.date).toLocaleDateString('fr-FR')} · {d.km} km
          </Text>
          <Text style={{ color: c.texteDoux }}>
            {d.litres} L · {d.prix.toFixed(2)} €
          </Text>
          {d.coutKm !== null && d.conso !== null && (
            <Text style={{ color: c.orange, fontWeight: 'bold' }}>
              {d.kmParcourus} km parcourus · {d.conso.toFixed(1)} L/100km ·{' '}
              {d.coutKm.toFixed(3)} €/km
            </Text>
          )}
          <Pressable onPress={() => supprimer(d.id)} style={{ marginTop: 8 }}>
            <Text style={{ color: c.danger }}>Supprimer</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}