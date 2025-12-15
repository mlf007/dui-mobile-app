import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapViewComponent } from '@/components/map-view';
import { MeehanHeaderImage } from '@/components/meehan-header-image';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top, height: 70 + insets.top }]}>
        <MeehanHeaderImage />
      </View>

      <View style={styles.mapContainer}>
        <MapViewComponent />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a3a5c',
  },
  header: {
    backgroundColor: '#1a3a5c',
    width: '100%',
    zIndex: 10,
  },
  mapContainer: {
    flex: 1,
    width: '100%',
  },
});
