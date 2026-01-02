import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs
      blurEffect="systemMaterial"
      iconColor={{ default: '#8E8E93', selected: '#007AFF' }}
    >
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search">
        <Icon sf={{ default: 'magnifyingglass', selected: 'magnifyingglass.circle.fill' }} />
        <Label>Search</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore">
        <Icon sf={{ default: 'map', selected: 'map.fill' }} />
        <Label>Explore</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
