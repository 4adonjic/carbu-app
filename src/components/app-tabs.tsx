import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { usePalette } from '@/constants/palette';

export default function AppTabs() {
  const c = usePalette();

  return (
    <NativeTabs
      backgroundColor={c.fond}
      indicatorColor={c.carteMeilleure}
      iconColor={{ default: c.texteDoux, selected: c.orange }}
      labelStyle={{ selected: { color: c.orange } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Stations</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="fuelpump.fill" md="local_gas_station" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="carte">
        <NativeTabs.Trigger.Label>Carte</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="map.fill" md="map" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Carnet</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="book.fill" md="menu_book" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="entretien">
        <NativeTabs.Trigger.Label>Entretien</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="wrench.and.screwdriver.fill" md="build" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}