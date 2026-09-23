import { usePalette } from '@/constants/palette';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

const AVANTAGES = [
  { icone: '📄', titre: 'Export illimité', texte: 'Exporte tes frais en CSV autant de fois que tu veux, pour chaque véhicule.' },
  { icone: '🚗', titre: 'Véhicules illimités', texte: 'Voiture, utilitaire, scooter : un carnet séparé pour chacun.' },
  { icone: '🔧', titre: 'Rappels illimités', texte: "Autant de rappels d'entretien que tu veux, sur tous tes véhicules." },
  { icone: '🔔', titre: 'Alertes de prix', texte: 'Une notification dès que le carburant passe sous ton seuil près de toi. (bientôt)' },
];

export default function ProScreen() {
  const c = usePalette();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.fond }}
      contentContainerStyle={{ padding: 20, paddingTop: 70, paddingBottom: 60 }}
    >
      <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
        <Text style={{ color: c.orange, fontWeight: 'bold', fontSize: 16 }}>‹ Retour</Text>
      </Pressable>

      <Text style={{ fontSize: 40, textAlign: 'center' }}>⛽</Text>
      <Text
        style={{
          color: c.texte,
          fontSize: 26,
          fontWeight: 'bold',
          textAlign: 'center',
          marginTop: 8,
        }}
      >
        Le Bon Plein Pro
      </Text>
      <Text
        style={{
          color: c.texteDoux,
          fontSize: 15,
          textAlign: 'center',
          marginTop: 6,
          marginBottom: 28,
          paddingHorizontal: 10,
        }}
      >
        Pensé pour les livreurs, VTC et gros rouleurs qui veulent suivre leurs frais au kilomètre
        près.
      </Text>

      {AVANTAGES.map((a) => (
        <View
          key={a.titre}
          style={{
            flexDirection: 'row',
            gap: 14,
            backgroundColor: c.carte,
            borderRadius: 14,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: c.bordure,
          }}
        >
          <Text style={{ fontSize: 26 }}>{a.icone}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.texte, fontWeight: 'bold', fontSize: 16 }}>{a.titre}</Text>
            <Text style={{ color: c.texteDoux, marginTop: 2 }}>{a.texte}</Text>
          </View>
        </View>
      ))}

      <View
        style={{
          backgroundColor: c.carteMeilleure,
          borderRadius: 16,
          padding: 20,
          marginTop: 16,
          alignItems: 'center',
          borderLeftWidth: 5,
          borderLeftColor: c.orange,
        }}
      >
        <Text style={{ color: c.texteDoux }}>Abonnement mensuel</Text>
        <Text style={{ color: c.orange, fontSize: 32, fontWeight: 'bold', marginTop: 4 }}>
          2,99 €<Text style={{ fontSize: 16, fontWeight: 'normal' }}> / mois</Text>
        </Text>
        <Text style={{ color: c.texteDoux, fontSize: 12, marginTop: 4 }}>
          Sans engagement, annulable à tout moment
        </Text>
      </View>

      <Pressable
        style={{
          backgroundColor: c.orange,
          borderRadius: 12,
          paddingVertical: 16,
          alignItems: 'center',
          marginTop: 20,
        }}
      >
        <Text style={{ color: c.surOrange, fontWeight: 'bold', fontSize: 17 }}>
          Passer en Pro
        </Text>
      </Pressable>
      <Text style={{ color: c.texteDoux, fontSize: 11, textAlign: 'center', marginTop: 10 }}>
        Le paiement n'est pas encore activé, ceci est un aperçu.
      </Text>
    </ScrollView>
  );
}