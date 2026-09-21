import {
  TabList,
  TabListProps,
  Tabs,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePalette } from '@/constants/palette';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="stations" href="/" asChild>
            <TabButton icone="⛽">Stations</TabButton>
          </TabTrigger>
          <TabTrigger name="carte" href="/carte" asChild>
            <TabButton icone="🗺️">Carte</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton icone="📖">Carnet</TabButton>
          </TabTrigger>
          <TabTrigger name="entretien" href="/entretien" asChild>
            <TabButton icone="🔧">Entretien</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({
  children,
  isFocused,
  icone,
  ...props
}: TabTriggerSlotProps & { icone: string }) {
  const c = usePalette();

  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.onglet,
        { borderTopColor: isFocused ? c.orange : 'transparent' },
        pressed && styles.pressed,
      ]}>
      <Text style={styles.icone}>{icone}</Text>
      <Text
        style={{
          color: isFocused ? c.orange : c.texteDoux,
          fontWeight: isFocused ? 'bold' : 'normal',
          fontSize: 12,
        }}>
        {children}
      </Text>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const c = usePalette();

  return (
    <View
      {...props}
      style={[styles.barre, { backgroundColor: c.fond, borderTopColor: c.bordure }]}>
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  barre: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  onglet: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 3,
    gap: 2,
  },
  icone: {
    fontSize: 20,
  },
  pressed: {
    opacity: 0.7,
  },
});