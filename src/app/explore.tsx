import { usePalette } from '@/constants/palette';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';
import * as LegacyFS from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

const CLE_PLEINS = 'carnet_pleins';
const CLE_VEHICULES = 'carnet_vehicules';

type Vehicule = { id: string; nom: string };
type Plein = {
  id: string;
  vehiculeId: string;
  date: string;
  litres: number;
  prix: number;
  km: number;
};

const VEHICULE_DEFAUT: Vehicule = { id: 'v1', nom: 'Mon véhicule' };

const num = (t: string) => parseFloat(t.replace(',', '.')) || 0;

// Format français : virgule pour les décimales
const fmt = (n: number | null, d: number) => (n === null ? '' : n.toFixed(d).replace('.', ','));

// Transforme un nom en morceau de nom de fichier (sans accents ni espaces)
const slug = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'vehicule';

// Android : enregistre le fichier dans un dossier choisi (ex : Téléchargements)
// Renvoie true si le fichier a été enregistré, false si l'utilisateur a annulé
async function telechargerAndroid(csv: string, nom: string): Promise<boolean> {
  const SAF = LegacyFS.StorageAccessFramework;
  const dossierDepart = SAF.getUriForDirectoryInRoot('Download');
  const permission = await SAF.requestDirectoryPermissionsAsync(dossierDepart);
  if (!permission.granted) return false;

  const uri = await SAF.createFileAsync(permission.directoryUri, nom, 'text/csv');
  await LegacyFS.writeAsStringAsync(uri, csv);
  return true;
}

// Autre méthode (iPhone, ou si le téléchargement échoue) : menu de partage
async function partager(csv: string, nom: string) {
  const file = new File(Paths.cache, `${nom}.csv`);
  file.create({ overwrite: true });
  await file.write(csv);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Frais de carburant',
      UTI: 'public.comma-separated-values-text',
    });
  } else {
    Alert.alert('Export', "Le partage n'est pas disponible sur cet appareil.");
  }
}

export default function CarnetScreen() {
  const c = usePalette();

  const [vehicules, setVehicules] = useState<Vehicule[]>([VEHICULE_DEFAUT]);
  const [actifId, setActifId] = useState<string>(VEHICULE_DEFAUT.id);
  const [pleins, setPleins] = useState<Plein[]>([]);
  const [litresTxt, setLitresTxt] = useState('');
  const [prixTxt, setPrixTxt] = useState('');
  const [kmTxt, setKmTxt] = useState('');
  const [ajoutVehicule, setAjoutVehicule] = useState(false);
  const [nomVehiculeTxt, setNomVehiculeTxt] = useState('');
  const [charge, setCharge] = useState(false);

  // Au démarrage : relire les véhicules et les pleins sauvegardés
  useEffect(() => {
    async function charger() {
      try {
        const [p, v] = await Promise.all([
          AsyncStorage.getItem(CLE_PLEINS),
          AsyncStorage.getItem(CLE_VEHICULES),
        ]);

        let vehs: Vehicule[] = [VEHICULE_DEFAUT];
        let actif = VEHICULE_DEFAUT.id;
        if (v) {
          const parsed = JSON.parse(v);
          if (parsed.vehicules && parsed.vehicules.length > 0) {
            vehs = parsed.vehicules;
            actif = parsed.actifId ?? vehs[0].id;
          }
        }
        if (!vehs.find((x) => x.id === actif)) actif = vehs[0].id;

        // Les anciens pleins (sans véhicule) vont dans le premier véhicule
        const anciens = p ? JSON.parse(p) : [];
        setPleins(anciens.map((x: any) => ({ ...x, vehiculeId: x.vehiculeId ?? vehs[0].id })));
        setVehicules(vehs);
        setActifId(actif);
      } catch (e) {
        console.error(e);
      } finally {
        setCharge(true);
      }
    }
    charger();
  }, []);

  // À chaque changement : sauvegarder
  useEffect(() => {
    if (charge) AsyncStorage.setItem(CLE_PLEINS, JSON.stringify(pleins)).catch(console.error);
  }, [pleins, charge]);

  useEffect(() => {
    if (charge) {
      AsyncStorage.setItem(CLE_VEHICULES, JSON.stringify({ vehicules, actifId })).catch(
        console.error
      );
    }
  }, [vehicules, actifId, charge]);

  const actif = vehicules.find((v) => v.id === actifId) ?? vehicules[0];
  const pleinsVehicule = pleins.filter((p) => p.vehiculeId === actif.id);

  function ajouterVehicule() {
    const nom = nomVehiculeTxt.trim();
    if (!nom) return;
    const v: Vehicule = { id: 'v' + Date.now(), nom };
    setVehicules([...vehicules, v]);
    setActifId(v.id);
    setNomVehiculeTxt('');
    setAjoutVehicule(false);
  }

  function supprimerVehicule() {
    if (vehicules.length <= 1) return;
    Alert.alert(
      'Supprimer ce véhicule ?',
      `"${actif.nom}" et tous ses pleins seront supprimés.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            const reste = vehicules.filter((v) => v.id !== actif.id);
            setPleins(pleins.filter((p) => p.vehiculeId !== actif.id));
            setVehicules(reste);
            setActifId(reste[0].id);
          },
        },
      ]
    );
  }

  function ajouter() {
    const litres = num(litresTxt);
    const prix = num(prixTxt);
    const km = num(kmTxt);
    if (!litres || !prix || !km) return;
    const p: Plein = {
      id: String(Date.now()),
      vehiculeId: actif.id,
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

  // Calculs (pour le véhicule sélectionné) : on compare chaque plein au précédent
  const tries = [...pleinsVehicule].sort((a, b) => a.km - b.km);
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
  const budgetMois = pleinsVehicule
    .filter((p) => {
      const d = new Date(p.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, p) => s + p.prix, 0);

  const avecCout = details.filter((d) => d.coutKm !== null);
  const totalPrix = avecCout.reduce((s, d) => s + d.prix, 0);
  const totalKm = avecCout.reduce((s, d) => s + d.kmParcourus, 0);
  const coutKmMoyen = totalKm > 0 ? totalPrix / totalKm : null;

  // Export : crée un fichier .csv (séparateur ;) pour le véhicule sélectionné
  async function exporter() {
    if (details.length === 0) {
      Alert.alert('Export', `Aucun plein à exporter pour "${actif.nom}".`);
      return;
    }
    const entete = 'Date;Kilométrage;Litres;Prix total (€);Km parcourus;Conso (L/100km);Coût (€/km)';
    const lignes = [...details].reverse().map((d) =>
      [
        new Date(d.date).toLocaleDateString('fr-FR'),
        fmt(d.km, 0),
        fmt(d.litres, 2),
        fmt(d.prix, 2),
        d.kmParcourus > 0 ? fmt(d.kmParcourus, 0) : '',
        fmt(d.conso, 1),
        fmt(d.coutKm, 3),
      ].join(';')
    );
    const total = `Total;;${fmt(
      pleinsVehicule.reduce((s, p) => s + p.litres, 0),
      2
    )};${fmt(
      pleinsVehicule.reduce((s, p) => s + p.prix, 0),
      2
    )};;;`;

    // Le caractère \uFEFF au début permet à Excel d'afficher correctement les accents
    const csv = '\uFEFF' + [entete, ...lignes, total].join('\n');
    const nom = `frais-carburant-${slug(actif.nom)}-${new Date().toISOString().slice(0, 10)}`;

    try {
      if (Platform.OS === 'android') {
        try {
          const ok = await telechargerAndroid(csv, nom);
          if (ok) Alert.alert('Export', 'Fichier enregistré dans le dossier choisi.');
          return;
        } catch (e) {
          console.error(e);
          // Si le téléchargement échoue, on passe par le menu de partage
        }
      }
      await partager(csv, nom);
    } catch (e) {
      console.error(e);
      Alert.alert('Export', 'Impossible de créer le fichier.');
    }
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
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <Text style={{ color: c.texte, fontSize: 26, fontWeight: 'bold' }}>Carnet de pleins</Text>
        <Pressable
          onPress={exporter}
          style={{
            borderWidth: 2,
            borderColor: c.orange,
            paddingVertical: 6,
            paddingHorizontal: 14,
            borderRadius: 20,
          }}
        >
          <Text style={{ color: c.orange, fontWeight: 'bold' }}>Exporter</Text>
        </Pressable>
      </View>

      {/* Choix du véhicule */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
        style={{ flexGrow: 0, marginBottom: 12 }}
        keyboardShouldPersistTaps="handled"
      >
        {vehicules.map((v) => {
          const selected = v.id === actif.id;
          return (
            <Pressable
              key={v.id}
              onPress={() => setActifId(v.id)}
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
        <Pressable
          onPress={() => setAjoutVehicule(!ajoutVehicule)}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 20,
            borderWidth: 2,
            borderColor: c.orange,
          }}
        >
          <Text style={{ color: c.orange, fontWeight: 'bold' }}>+</Text>
        </Pressable>
      </ScrollView>

      {ajoutVehicule && (
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          <TextInput
            style={[inputStyle, { flex: 1, marginBottom: 0 }]}
            placeholder="Nom du véhicule (ex : Utilitaire)"
            placeholderTextColor={c.texteDoux}
            value={nomVehiculeTxt}
            onChangeText={setNomVehiculeTxt}
            autoFocus
          />
          <Pressable
            onPress={ajouterVehicule}
            style={{
              backgroundColor: c.orange,
              paddingHorizontal: 18,
              borderRadius: 8,
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: c.surOrange, fontWeight: 'bold' }}>OK</Text>
          </Pressable>
        </View>
      )}

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

      {vehicules.length > 1 && (
        <Pressable onPress={supprimerVehicule} style={{ marginTop: 16, alignItems: 'center' }}>
          <Text style={{ color: c.danger }}>Supprimer le véhicule « {actif.nom} »</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}