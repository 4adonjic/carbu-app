import { useColorScheme } from 'react-native';

const clair = {
  fond: '#FFFFFF',
  carte: '#F3F4F6',
  carteMeilleure: '#FFEEDD',
  bordure: '#E5E7EB',
  texte: '#1A1A1A',
  texteDoux: '#6B7280',
  orange: '#FF6B00',
  surOrange: '#FFFFFF',
  champ: '#F3F4F6',
  danger: '#DC2626',
};

const sombre = {
  fond: '#2B2D31',
  carte: '#383A40',
  carteMeilleure: '#4A3A2C',
  bordure: '#4B4E55',
  texte: '#FFFFFF',
  texteDoux: '#B5B8BE',
  orange: '#FF6B00',
  surOrange: '#FFFFFF',
  champ: '#383A40',
  danger: '#F87171',
};

export function usePalette() {
  const mode = useColorScheme();
  return mode === 'dark' ? sombre : clair;
}