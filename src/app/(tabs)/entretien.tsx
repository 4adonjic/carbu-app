import { espace, type, usePalette } from '@/constants/palette';
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
  intervalle: number;
  dernierKm: number;
};

const SUGGESTIONS = [
  { nom: 'Vidange', intervalle: 15000 },
  { nom: 'Pneus', intervalle: 40000 },
  { nom: 'Plaquettes', intervalle: 30000 },
  { nom: 'Filtre à air', intervalle: 30000 },
  { nom: 'Courroie', intervalle: 120000 },
];

const num = (t: string) => parseFloat(t.replace(',', '.')) || 0;
const fmtKm = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export default function EntretienScreen() {
  const c = usePalette();

  const [vehicules, setVehicules] = useState<Vehicule[]>([{ id: 'v1', nom: 'Mon véhicule' }]);
  const [vehiculeId, setVehiculeId] = useState('v1');
  const [kmActuels, setKmActuels] = useState<Record<string, number>>({});
  const [taches, setTaches] = useState<Tache[]>([]);
  const [charge, setCharge] = useState(false);
  const [ouvrirAjout, setOuvrirAjout] = useState(false);

  const [nomTxt, setNomTxt] = useState('');
  const [intervalleTxt, setIntervalleTxt] = useState('');
  const [dernierTxt, setDernierTxt] = useState('');

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

          const map: Record<string, number> = {};
          for (const x of pleins) {
            const id = x.vehiculeId ?? vehs[0].id;
            map[id] = Math.max(map[id] ?? 0, x.km);
          }

          setVehicules(vehs);
          setKmActuels(map);
          setTaches(t ? JSON.parse(t) : []);
          setVehiculeId((prev) =>
            vehs.find((x) => x.id === prev) ? prev : vehs.find((x) => x.id === actif) ? actif : vehs[0].id
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
    const dernierKm = dernierTxt.trim() ? num(dernierTxt) : kmActuel ?? 0;
    const t: Tache = { id: String(Date.now()), vehiculeId, nom, intervalle, dernierKm };
    setTaches([...taches, t]);
    setNomTxt('');
    setIntervalleTxt('');
    setDernierTxt('');
    setOuvrirAjout(false);
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
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: espace.m,
    marginBottom: espace.s,
    ...type.corps,
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.fond }}
      contentContainerStyle={{ paddingHorizontal: espace.l, paddingTop: 56, paddingBottom: espace.xl }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={{ color: c.texte, ...type.titre, marginBottom: espace.m }}>Entretien</Text>

      {vehicules.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: espace.s }}
          style={{ flexGrow: 0, marginBottom: espace.m }}
          keyboardShouldPersistTaps="handled"
        >
          {vehicules.map((v) => {
            const selected = v.id === vehiculeId;
            return (
              <Pressable
                key={v.id}
                onPress={() => setVehiculeId(v.id)}
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
                  {v.nom}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <View
        style={{
          backgroundColor: c.carte,
          padding: espace.m,
          borderRadius: 14,
          marginBottom: espace.l,
        }}
      >
        <Text style={{ color: c.texteDoux, ...type.petit }}>Kilométrage actuel</Text>
        <Text style={{ color: c.texte, ...type.montant, marginTop: 2 }}>
          {kmActuel !== null ? `${fmtKm(kmActuel)} km` : '—'}
        </Text>
        {kmActuel === null && (
          <Text style={{ color: c.texteDoux, ...type.petit, marginTop: 4 }}>
            Il se met à jour tout seul avec les pleins de ton Carnet.
          </Text>
        )}
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: espace.s,
        }}
      >
        <Text style={{ color: c.texte, ...type.section }}>Mes rappels</Text>
        <Pressable onPress={() => setOuvrirAjout(!ouvrirAjout)} hitSlop={8}>
          <Text style={{ color: c.orange, ...type.petit, fontWeight: '700' }}>
            {ouvrirAjout ? 'Fermer' : '+ Ajouter'}
          </Text>
        </Pressable>
      </View>

      {tachesVehicule.length === 0 && !ouvrirAjout && (
        <Text style={{ color: c.texteDoux, ...type.corps, marginBottom: espace.m }}>
          Aucun rappel pour l'instant.
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
              padding: espace.m,
              borderRadius: 14,
              marginBottom: espace.s,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={{ color: c.texte, ...type.corpsGras }}>{t.nom}</Text>
                <Text style={{ color: c.texteDoux, ...type.petit, marginTop: 1 }}>
                  Tous les {fmtKm(t.intervalle)} km
                </Text>
              </View>
              <Text style={{ color: t.couleur, ...type.petit, fontWeight: '700' }}>{t.texte}</Text>
            </View>
            <View
              style={{
                height: 5,
                borderRadius: 3,
                backgroundColor: c.bordure,
                marginTop: espace.s,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${utilise * 100}%`,
                  height: 5,
                  backgroundColor: t.reste !== null && t.reste < 0 ? c.danger : c.orange,
                }}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: espace.l, marginTop: espace.s }}>
              <Pressable onPress={() => marquerFait(t.id)} hitSlop={6}>
                <Text style={{ color: c.orange, ...type.petit, fontWeight: '700' }}>
                  Fait aujourd'hui
                </Text>
              </Pressable>
              <Pressable onPress={() => supprimer(t.id)} hitSlop={6}>
                <Text style={{ color: c.danger, ...type.petit }}>Supprimer</Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      {ouvrirAjout && (
        <View
          style={{
            backgroundColor: c.carte,
            borderRadius: 14,
            padding: espace.m,
            marginTop: espace.s,
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: espace.s }}
            style={{ flexGrow: 0, marginBottom: espace.m }}
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
                  paddingHorizontal: 12,
                  borderRadius: 16,
                  backgroundColor: c.champ,
                }}
              >
                <Text style={{ color: c.texte, ...type.petit }}>{s.nom}</Text>
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
            placeholder="Tous les combien de km ?"
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
              paddingVertical: 14,
              borderRadius: 10,
              alignItems: 'center',
              marginTop: espace.xs,
            }}
          >
            <Text style={{ color: c.surOrange, fontWeight: '700', ...type.corps }}>Ajouter</Text>
          </Pressable>
          <Text style={{ color: c.texteDoux, ...type.petit, marginTop: espace.s }}>
            Les intervalles proposés sont indicatifs : suis ceux de ton carnet d'entretien.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}