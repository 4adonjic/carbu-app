import { usePalette } from '@/constants/palette';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

const CLE_PLEINS = 'carnet_pleins';
const CLE_VEHICULES = 'carnet_vehicules';
const CLE_TACHES = 'entretien_taches';

type Vehicule = { id: string; nom: string };
type Tache = {
  id: string;
  vehiculeId: string;
  nom: string;
  intervalle: number; // tous les X km
  dernierKm: number; // kilométrage de la dernière fois
};

// Des idées de rappels pour aller vite (à titre indicatif : adapte-les à ton véhicule)
const SUGGESTIONS = [
  { nom: 'Vidange', intervalle: 15000 },
  { nom: 'Pneus', intervalle: 40000 },
  { nom: 'Plaquettes', intervalle: 30000 },
  { nom: 'Filtre à air', intervalle: 30000 },
  { nom: 'Courroie', intervalle: 120000 },
];

const num = (t: string) => parseFloat(t.replace(',', '.')) || 0;

// 15000 -> "15 000"
const fmtKm = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export default function EntretienScreen() {
  const c = usePalette();

  const [vehicules, setVehicules] = useState<Vehicule[]>([{ id: 'v1', nom: 'Mon véhicule' }]);
  const [vehiculeId, setVehiculeId] = useState('v1');
  const [kmActuels, setKmActuels] = useState<Record<string, number>>({});
  const [taches, setTaches] = useState<Tache[]>([]);
  const [charge, setCharge] = useState(false);

  const [nomTxt, setNomTxt] = useState('');
  const [intervalleTxt, setIntervalleTxt] = useState('');
  const [dernierTxt, setDernierTxt] = useState('');

  // À chaque fois que tu ouvres l'onglet : relire le Carnet et les rappels
  useFocusEffect(
    useCallback(() => {
      async function charger() {
        try {
          const [p, v, t] = await Promise.all([
            AsyncStorage.getItem(CLE_PLEINS),
            AsyncStorage.getItem(CLE_VEHICULES),
            AsyncStorage.getItem(CLE_TACHES),
          ]);

          const pleins = p ? JSON.parse(p) : [];
          let vehs: Vehicule[] = [{ id: 'v1', nom: 'Mon véhicule' }];
          let actif = 'v1';
          if (v) {
            const parsed = JSON.parse(v);
            if (parsed.vehicules && parsed.vehicules.length > 0) {
              vehs = parsed.vehicules;
              actif = parsed.actifId ?? vehs[0].id;
            }
          }

          // Kilométrage actuel de chaque véhicule = le plus haut kilométrage noté
          const map: Record<string, number> = {};
          for (const x of pleins) {
            const id = x.vehiculeId ?? vehs[0].id;
            map[id] = Math.max(map[id] ?? 0, x.km);
          }

          setVehicules(vehs);
          setKmActuels(map);
          setTaches(t ? JSON.parse(t) : []);
          setVehiculeId((prev) =>
            vehs.find((x) => x.id === prev)
              ? prev
              : vehs.find((x) => x.id === actif)
              ? actif
              : vehs[0].id
          );
        } catch (e) {
          console.error(e);
        } finally {
          setCharge(true);
        }
      }
      charger();
    }, [])
  );

  // À chaque changement : sauvegarder les rappels
  useEffect(() => {
    if (charge) AsyncStorage.setItem(CLE_TACHES, JSON.stringify(taches)).catch(console.error);
  }, [taches, charge]);

  const kmActuel = kmActuels[vehiculeId] ?? null;

  function statut(t: Tache) {
    if (kmActuel === null) {
      return { reste: null as number | null, couleur: c.texteDoux, texte: 'Kilométrage inconnu' };
    }
    const reste = t.dernierKm + t.intervalle - kmActuel;
    if (reste < 0) {
      return { reste, couleur: c.danger, texte: `En retard de ${fmtKm(-reste)} km` };
    }
    if (reste <= Math.min(1500, t.intervalle * 0.15)) {
      return { reste, couleur: c.orange, texte: `Bientôt : dans ${fmtKm(reste)} km` };
    }
    return { reste, couleur: c.texte, texte: `Dans ${fmtKm(reste)} km` };
  }

  // Les plus urgents en premier
  const tachesVehicule = taches
    .filter((t) => t.vehiculeId === vehiculeId)
    .map((t) => ({ ...t, ...statut(t) }))
    .sort((a, b) => (a.reste ?? Infinity) - (b.reste ?? Infinity));

  function ajouter() {
    const nom = nomTxt.trim();
    const intervalle = num(intervalleTxt);
    if (!nom || !intervalle) {
      Alert.alert('Entretien', 'Indique un nom et un intervalle en km.');
      return;
    }
    // Si tu ne précises pas, on considère que c'est fait au kilométrage actuel
    const dernierKm = dernierTxt.trim() ? num(dernierTxt) : kmActuel ?? 0;
    const t: Tache = { id: String(Date.now()), vehiculeId, nom, intervalle, dernierKm };
    setTaches([...taches, t]);
    setNomTxt('');
    setIntervalleTxt('');
    setDernierTxt('');
  }

  function marquerFait(id: string) {
    if (kmActuel === null) {
      Alert.alert('Entretien', "Ajoute d'abord un plein dans le Carnet pour connaître le kilométrage actuel.");
      return;
    }
    setTaches(taches.map((t) => (t.id === id ? { ...t, dernierKm: kmActuel } : t)));
  }

  function supprimer(id: string) {
    setTaches(taches.filter((t) => t.id !== id));
  }

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
      <Text style={{ color: c.texte, fontSize: 26, fontWeight: 'bold', marginBottom: 12 }}>
        Entretien
      </Text>

      {vehicules.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
          style={{ flexGrow: 0, marginBottom: 12 }}
          keyboardShouldPersistTaps="handled"
        >
          {vehicules.map((v) => {
            const selected = v.id === vehiculeId;
            return (
              <Pressable
                key={v.id}
                onPress={() => setVehiculeId(v.id)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 20,
                  backgroundColor: selected ? c.orange : c.carte,
                }}
              >
                <Text style={{ color: selected ? c.surOrange : c.texte, fontWeight: 'bold' }}>
                  {v.nom}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <View
        style={{
          backgroundColor: c.carteMeilleure,
          padding: 14,
          borderRadius: 12,
          borderLeftWidth: 5,
          borderLeftColor: c.orange,
          marginBottom: 20,
        }}
      >
        <Text style={{ color: c.texteDoux }}>Kilométrage actuel</Text>
        <Text style={{ color: c.orange, fontSize: 22, fontWeight: 'bold' }}>
          {kmActuel !== null ? `${fmtKm(kmActuel)} km` : '—'}
        </Text>
        {kmActuel === null && (
          <Text style={{ color: c.texteDoux, fontSize: 12, marginTop: 4 }}>
            Il se met à jour tout seul avec les pleins de ton Carnet.
          </Text>
        )}
      </View>

      <Text style={{ color: c.texte, fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Mes rappels
      </Text>
      {tachesVehicule.length === 0 && (
        <Text style={{ color: c.texteDoux, marginBottom: 10 }}>
          Aucun rappel pour l'instant. Ajoutes-en un ci-dessous.
        </Text>
      )}
      {tachesVehicule.map((t) => {
        const utilise =
          kmActuel !== null ? Math.min(1, Math.max(0, (kmActuel - t.dernierKm) / t.intervalle)) : 0;
        return (
          <View
            key={t.id}
            style={{
              backgroundColor: c.carte,
              padding: 14,
              borderRadius: 10,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: c.bordure,
            }}
          >
            <Text style={{ color: c.texte, fontWeight: 'bold', fontSize: 16 }}>{t.nom}</Text>
            <Text style={{ color: c.texteDoux }}>
              Tous les {fmtKm(t.intervalle)} km · dernière fois à {fmtKm(t.dernierKm)} km
            </Text>
            <Text style={{ color: t.couleur, fontWeight: 'bold', marginTop: 6 }}>{t.texte}</Text>
            <View
              style={{
                height: 6,
                borderRadius: 3,
                backgroundColor: c.bordure,
                marginTop: 8,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${utilise * 100}%`,
                  height: 6,
                  backgroundColor: t.reste !== null && t.reste < 0 ? c.danger : c.orange,
                }}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
              <Pressable onPress={() => marquerFait(t.id)}>
                <Text style={{ color: c.orange, fontWeight: 'bold' }}>Fait aujourd'hui</Text>
              </Pressable>
              <Pressable onPress={() => supprimer(t.id)}>
                <Text style={{ color: c.danger }}>Supprimer</Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      <Text
        style={{ color: c.texte, fontSize: 18, fontWeight: 'bold', marginTop: 14, marginBottom: 10 }}
      >
        Ajouter un rappel
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
        style={{ flexGrow: 0, marginBottom: 12 }}
        keyboardShouldPersistTaps="handled"
      >
        {SUGGESTIONS.map((s) => (
          <Pressable
            key={s.nom}
            onPress={() => {
              setNomTxt(s.nom);
              setIntervalleTxt(String(s.intervalle));
            }}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 14,
              borderRadius: 20,
              backgroundColor: c.carte,
            }}
          >
            <Text style={{ color: c.texte }}>{s.nom}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <TextInput
        style={inputStyle}
        placeholder="Nom (ex : Vidange)"
        placeholderTextColor={c.texteDoux}
        value={nomTxt}
        onChangeText={setNomTxt}
      />
      <TextInput
        style={inputStyle}
        placeholder="Tous les combien de km ? (ex : 15000)"
        placeholderTextColor={c.texteDoux}
        keyboardType="numeric"
        value={intervalleTxt}
        onChangeText={setIntervalleTxt}
      />
      <TextInput
        style={inputStyle}
        placeholder="Fait à quel km ? (vide = maintenant)"
        placeholderTextColor={c.texteDoux}
        keyboardType="numeric"
        value={dernierTxt}
        onChangeText={setDernierTxt}
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
      <Text style={{ color: c.texteDoux, fontSize: 12 }}>
        Les intervalles proposés sont indicatifs : suis ceux du carnet d'entretien de ton véhicule.
      </Text>
    </ScrollView>
  );
}