import { espace, type, usePalette } from '@/constants/palette';
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
      contentContainerStyle={{ padding: espace.l, paddingTop: 56, paddingBottom: espace.xl }}
    >
      <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginBottom: espace.l }}>
        <Text style={{ color: c.texteDoux, ...type.corps }}>‹ Retour</Text>
      </Pressable>

      <Text style={{ fontSize: 34, textAlign: 'center' }}>⛽</Text>
      <Text
        style={{
          color: c.texte,
          ...type.titre,
          fontSize: 24,
          textAlign: 'center',
          marginTop: espace.s,
        }}
      >
        Le Bon Plein Pro
      </Text>
      <Text
        style={{
          color: c.texteDoux,
          ...type.corps,
          textAlign: 'center',
          marginTop: espace.xs,
          marginBottom: espace.xl,
          paddingHorizontal: espace.m,
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
            gap: espace.m,
            backgroundColor: c.carte,
            borderRadius: 14,
            padding: espace.m,
            marginBottom: espace.s,
          }}
        >
          <Text style={{ fontSize: 22 }}>{a.icone}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.texte, ...type.corpsGras }}>{a.titre}</Text>
            <Text style={{ color: c.texteDoux, ...type.petit, marginTop: 2 }}>{a.texte}</Text>
          </View>
        </View>
      ))}

      <View
        style={{
          backgroundColor: c.carte,
          borderRadius: 16,
          padding: espace.l,
          marginTop: espace.m,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: c.texteDoux, ...type.petit }}>Abonnement mensuel</Text>
        <Text style={{ color: c.texte, fontSize: 32, fontWeight: '700', marginTop: 4 }}>
          2,99 €<Text style={{ fontSize: 15, fontWeight: '400', color: c.texteDoux }}> / mois</Text>
        </Text>
        <Text style={{ color: c.texteDoux, ...type.petit, marginTop: 4 }}>
          Sans engagement, annulable à tout moment
        </Text>
      </View>

      <Pressable
        style={{
          backgroundColor: c.orange,
          borderRadius: 12,
          paddingVertical: 16,
          alignItems: 'center',
          marginTop: espace.l,
        }}
      >
        <Text style={{ color: c.surOrange, fontWeight: '700', fontSize: 16 }}>Passer en Pro</Text>
      </Pressable>
      <Text style={{ color: c.texteDoux, ...type.petit, textAlign: 'center', marginTop: espace.s }}>
        Le paiement n'est pas encore activé, ceci est un aperçu.
      </Text>
    </ScrollView>
  );
}