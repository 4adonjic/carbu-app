import { useColorScheme } from 'react-native';

const clair = {
  fond: '#FFFFFF',
  carte: '#F7F7F8',
  carteMeilleure: '#FFF4EC',
  bordure: '#EAEAEC',
  texte: '#181818',
  texteDoux: '#7A7A7E',
  orange: '#FF6B00',
  surOrange: '#FFFFFF',
  champ: '#F2F2F3',
  danger: '#DC2626',
};

const sombre = {
  fond: '#222327',
  carte: '#2C2D32',
  carteMeilleure: '#3A2C20',
  bordure: '#3A3B40',
  texte: '#FAFAFA',
  texteDoux: '#9A9AA0',
  orange: '#FF6B00',
  surOrange: '#FFFFFF',
  champ: '#2C2D32',
  danger: '#F87171',
};

export function usePalette() {
  const mode = useColorScheme();
  return mode === 'dark' ? sombre : clair;
}

// Tailles de texte communes à toute l'app
export const type = {
  titre: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3 },
  sousTitre: { fontSize: 15, fontWeight: '400' as const },
  section: { fontSize: 17, fontWeight: '600' as const },
  corps: { fontSize: 15, fontWeight: '400' as const },
  corpsGras: { fontSize: 15, fontWeight: '600' as const },
  petit: { fontSize: 13, fontWeight: '400' as const },
  montant: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.3 },
};

// Espacements communs (en px)
export const espace = { xs: 4, s: 8, m: 12, l: 20, xl: 32 };